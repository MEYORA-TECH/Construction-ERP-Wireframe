import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { allEntities, getEntity, listFields, registerPathFor, statusFieldOf, type Resolved } from '@/config/registry';
import type { EntityDef, Row } from '@/config/types';
import { DataTable } from '@/components/DataTable';
import { FieldValue, TextArea } from '@/components/fields';
import { Menu, Modal } from '@/components/overlays';
import { Button, CodeChip, EmptyState, Icon, KpiCard, MetaStrip, ProgressBar, SectionCard, StatusBadge, Tabs } from '@/components/ui';
import { ApprovalStepper, Timeline } from '@/components/widgets';
import { cn } from '@/lib/cn';
import { formatDate, formatINRCompact } from '@/lib/format';
import { recordActivity, recordApprovals, recordDocuments, recordHistory } from '@/mock/extras';
import { useData, useRows } from '@/mock/store';
import { toast } from '@/mock/toast';
import { toneOf } from '@/theme/status';
import { formMode, RecordModal } from './RecordForm';

type TabId = 'overview' | 'details' | 'financial' | 'progress' | 'related' | 'documents' | 'activities' | 'approvals' | 'history';

function relatedOf(entity: EntityDef, row: Row, rows: Record<string, Row[]>) {
  const out: { entity: EntityDef; field: string; rows: Row[] }[] = [];
  for (const e of allEntities()) {
    for (const f of e.fields) {
      if (f.type === 'ref' && f.ref === entity.id) {
        const list = (rows[e.id] ?? []).filter((r) => r[f.key] === row.id);
        if (list.length) out.push({ entity: e, field: f.label, rows: list });
      }
    }
  }
  return out.slice(0, 8);
}

export function RecordDetail({ r, entityId }: { r: Resolved; entityId: string }) {
  const entity = getEntity(entityId);
  const rows = useRows(entityId);
  const allRows = useData((s) => s.rows);
  const audit = useData((s) => s.audit);
  const update = useData((s) => s.update);
  const remove = useData((s) => s.remove);
  const navigate = useNavigate();
  const row = rows.find((x) => x.id === r.recordId);
  const [tab, setTab] = useState<TabId>('overview');
  const [edit, setEdit] = useState(false);
  const [decision, setDecision] = useState<'Approve' | 'Reject' | 'Return' | null>(null);
  const [comment, setComment] = useState('');
  const [notes, setNotes] = useState<{ text: string; at: string }[]>([]);

  const related = useMemo(() => (row ? relatedOf(entity, row, allRows) : []), [entity, row, allRows]);

  if (!row) {
    return (
      <SectionCard plain>
        <EmptyState title={`${entity.label} ${r.recordId} not found`} text="It may have been archived in this demo session." action={<Button onClick={() => navigate(r.base)}>Back to register</Button>} />
      </SectionCard>
    );
  }

  const st = statusFieldOf(entity);
  const status = st ? row[st.key] : undefined;
  const title = String(row[entity.titleField] ?? row.id);
  const summary = listFields(entity).filter((f) => f.key !== entity.titleField && f.type !== 'status').slice(0, 4);
  const moneyFields = entity.fields.filter((f) => f.type === 'currency');
  const pctFields = entity.fields.filter((f) => f.type === 'percent');
  const docs = recordDocuments(entity, row);
  const activity = recordActivity(entity, row);
  const approvals = recordApprovals(entity, row);
  const history = recordHistory(entity, row);
  const myAudit = audit.filter((a) => a.entity === entity.id && a.recordId === row.id);
  const pending = ['yellow', 'blue', 'gray'].includes(toneOf(status));

  const tabs: { value: TabId; label: string; count?: number }[] = [
    { value: 'overview', label: 'Overview' },
    { value: 'details', label: 'Details' },
    ...(moneyFields.length >= 2 || entity.tabs?.includes('Financial') ? [{ value: 'financial' as const, label: 'Financial' }] : []),
    ...(pctFields.length || entity.tabs?.includes('Progress') ? [{ value: 'progress' as const, label: 'Progress' }] : []),
    ...(related.length ? [{ value: 'related' as const, label: 'Related Records', count: related.reduce((a, b) => a + b.rows.length, 0) }] : []),
    { value: 'documents', label: 'Documents', count: docs.length },
    { value: 'activities', label: 'Activities', count: activity.length + notes.length },
    { value: 'approvals', label: 'Approvals' },
    { value: 'history', label: 'History' },
  ];

  const sections = entity.sections?.length
    ? entity.sections.map((s) => ({ ...s, fields: entity.fields.filter((f) => f.section === s.id) })).filter((s) => s.fields.length)
    : [{ id: 'all', title: `${entity.label} Information`, icon: 'ti-list-details', fields: entity.fields }];
  const unsectioned = entity.sections?.length ? entity.fields.filter((f) => !entity.sections!.some((s) => s.id === f.section)) : [];

  const decide = () => {
    if (!decision || !st) return;
    const target =
      decision === 'Approve'
        ? st.options?.find((o) => /approv|certif|accept|verified|completed|closed/i.test(o)) ?? 'Approved'
        : decision === 'Reject'
          ? st.options?.find((o) => /reject|lost|fail|cancel/i.test(o)) ?? 'Rejected'
          : st.options?.find((o) => /draft|review|return|revis/i.test(o)) ?? 'Under Review';
    update(entity.id, row.id, { [st.key]: target }, decision === 'Approve' ? 'Approved' : decision === 'Reject' ? 'Rejected' : 'Returned');
    toast.success(`${entity.label} ${decision === 'Return' ? 'returned' : decision.toLowerCase() + 'd'}`, `${row.id} → ${target}${comment ? ` · “${comment}”` : ''}`);
    setDecision(null);
    setComment('');
  };

  return (
    <div className="flex flex-col gap-3.5">
      {/* header */}
      <div className="hair flex flex-wrap items-center gap-3 rounded-md border-line bg-bg px-4 py-3">
        <Button variant="ghost" icon="ti-arrow-left" size="sm" onClick={() => navigate(r.base)} aria-label="Back to register" />
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <CodeChip>{row.id}</CodeChip>
            <h1 className="truncate text-[17px] font-semibold text-ink">{title}</h1>
            {status !== undefined && <StatusBadge value={status} />}
          </div>
          <div className="mt-0.5 text-xs text-ink-3">
            {entity.label} · {r.app.name} › {r.menu?.label}
            {r.child ? ` › ${r.child.label}` : ''}
          </div>
        </div>
        <div className="ml-auto flex flex-wrap items-center gap-2">
          {pending && st && (
            <>
              <Button variant="primary" icon="ti-check" onClick={() => setDecision('Approve')}>
                Approve
              </Button>
              <Button variant="danger" icon="ti-x" onClick={() => setDecision('Reject')}>
                Reject
              </Button>
            </>
          )}
          <Button icon="ti-edit" onClick={() => (formMode(entity) === 'modal' ? setEdit(true) : navigate(`${r.base}/${row.id}/edit`))}>
            Edit
          </Button>
          {st?.options && (
            <Menu
              label="Change status"
              trigger={<Button icon="ti-circle-dot" iconRight="ti-chevron-down">Status</Button>}
              items={st.options.map((o) => ({
                label: o,
                checked: o === status,
                onSelect: () => {
                  update(entity.id, row.id, { [st.key]: o }, 'Status changed');
                  toast.success('Status updated', `${row.id} → ${o}`);
                },
              }))}
            />
          )}
          <Menu
            trigger={<Button icon="ti-dots" aria-label="More actions" />}
            items={[
              { label: 'Print', icon: 'ti-printer', onSelect: () => toast.info('Sent to printer', `${entity.label} ${row.id}`) },
              { label: 'Export PDF', icon: 'ti-file-type-pdf', onSelect: () => toast.success('PDF generated', `${row.id}.pdf`) },
              { label: 'Return for revision', icon: 'ti-arrow-back-up', onSelect: () => setDecision('Return') },
              { separator: true, label: '' },
              {
                label: 'Archive',
                icon: 'ti-archive',
                danger: true,
                onSelect: () => {
                  remove(entity.id, [row.id]);
                  toast.success(`${entity.label} archived`, row.id);
                  navigate(r.base);
                },
              },
            ]}
          />
        </div>
      </div>

      {summary.length > 0 && <MetaStrip items={summary.map((f) => ({ label: f.label, value: <FieldValue field={f} value={row[f.key]} /> }))} />}

      <div className="hair rounded-md border-line bg-bg">
        <Tabs className="px-2" value={tab} onChange={setTab} tabs={tabs} />
        <div className="p-4">
          {tab === 'overview' && (
            <div className="grid grid-cols-1 gap-3.5 xl:grid-cols-[1fr_340px]">
              <div className="flex flex-col gap-3.5">
                {[...sections, ...(unsectioned.length ? [{ id: '_o', title: 'Other Details', icon: 'ti-list', fields: unsectioned }] : [])].map((s) => (
                  <SectionCard key={s.id} title={s.title} icon={s.icon}>
                    <div className="grid grid-cols-1 gap-x-4 gap-y-3 md:grid-cols-2 xl:grid-cols-3">
                      {s.fields.map((f) => (
                        <div key={f.key} className={cn(f.type === 'textarea' && 'md:col-span-2 xl:col-span-3')}>
                          <div className="field-label mb-0.5">{f.label}</div>
                          <div className="text-sm text-ink">
                            <FieldValue field={f} value={f.key === 'code' ? row.id : row[f.key]} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </SectionCard>
                ))}
              </div>
              <div className="flex flex-col gap-3.5">
                <SectionCard title="Approval Status" icon="ti-route" plain>
                  <ApprovalStepper stages={approvals.stages} current={approvals.current} rejected={approvals.rejected} />
                </SectionCard>
                <SectionCard title="Recent Activity" icon="ti-activity" plain actions={<Button variant="link" className="h-auto text-xs" onClick={() => setTab('activities')}>View all</Button>}>
                  <Timeline items={activity.slice(0, 4)} dense />
                </SectionCard>
                {related.length > 0 && (
                  <SectionCard title="Related Records" icon="ti-link" plain>
                    <ul className="flex flex-col gap-1.5">
                      {related.map((g) => (
                        <li key={`${g.entity.id}-${g.field}`} className="flex items-center justify-between text-sm">
                          <button type="button" className="text-blue hover:underline" onClick={() => setTab('related')}>
                            {g.entity.plural}
                          </button>
                          <span className="rounded-sm bg-bg-3 px-1.5 text-2xs text-ink-2">{g.rows.length}</span>
                        </li>
                      ))}
                    </ul>
                  </SectionCard>
                )}
              </div>
            </div>
          )}

          {tab === 'details' && (
            <div className="hair overflow-hidden rounded-md border-line">
              <table className="w-full text-sm">
                <tbody>
                  <tr className="hair-b border-line">
                    <td className="w-64 bg-bg-2 px-3 py-2 text-xs font-semibold text-ink-2 uppercase">Record ID</td>
                    <td className="px-3 py-2">
                      <CodeChip>{row.id}</CodeChip>
                    </td>
                  </tr>
                  {entity.fields.filter((f) => f.key !== 'code').map((f) => (
                    <tr key={f.key} className="hair-b border-line last:border-0">
                      <td className="w-64 bg-bg-2 px-3 py-2 text-xs font-semibold text-ink-2 uppercase">{f.label}</td>
                      <td className="px-3 py-2">
                        <FieldValue field={f} value={row[f.key]} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {tab === 'financial' && (
            <div className="flex flex-col gap-3.5">
              <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
                {moneyFields.map((f) => (
                  <KpiCard key={f.key} label={f.label} value={formatINRCompact(row[f.key])} icon="ti-currency-rupee" />
                ))}
                {moneyFields.length >= 2 && (
                  <KpiCard
                    label={`${moneyFields[1].label} vs ${moneyFields[0].label}`}
                    value={`${Math.round((Number(row[moneyFields[1].key]) / Math.max(1, Number(row[moneyFields[0].key]))) * 100)}%`}
                    progress={Math.min(100, (Number(row[moneyFields[1].key]) / Math.max(1, Number(row[moneyFields[0].key]))) * 100)}
                  />
                )}
              </div>
              <SectionCard title="Payment Schedule" icon="ti-calendar-dollar" plain>
                <DataTable
                  bare
                  srNo
                  rows={['Advance', 'RA Bill 1', 'RA Bill 2', 'RA Bill 3', 'Retention Release'].map((m, i) => ({ id: `${i}`, milestone: m, pct: [10, 25, 25, 30, 10][i], status: i < 2 ? 'Paid' : i === 2 ? 'Due' : 'Planned' }))}
                  columns={[
                    { key: 'milestone', label: 'Milestone' },
                    { key: 'pct', label: 'Share', align: 'right', render: (x) => `${x.pct}%` },
                    { key: 'amount', label: 'Amount', align: 'right', render: (x) => formatINRCompact((Number(row[moneyFields[0]?.key]) || 0) * (x.pct / 100)) },
                    { key: 'status', label: 'Status', render: (x) => <StatusBadge value={x.status} /> },
                  ]}
                  getId={(x) => x.id}
                  selectable={false}
                />
              </SectionCard>
            </div>
          )}

          {tab === 'progress' && (
            <div className="grid grid-cols-1 gap-3.5 lg:grid-cols-2">
              {(pctFields.length ? pctFields : [{ key: '_p', label: 'Completion', type: 'percent' as const }]).map((f) => {
                const v = Number(row[f.key] ?? 60);
                return (
                  <SectionCard key={f.key} title={f.label} icon="ti-progress" plain>
                    <div className="flex items-baseline justify-between">
                      <span className="text-[26px] font-semibold text-ink">{v}%</span>
                      <span className="text-xs text-ink-3">Planned {Math.min(100, v + 8)}%</span>
                    </div>
                    <ProgressBar value={v} className="mt-2 h-2" />
                    <div className="mt-3 grid grid-cols-4 gap-2 text-center text-xs">
                      {['Jun', 'Jul', 'Aug', 'Sep'].map((m, i) => (
                        <div key={m} className="hair rounded-sm border-line bg-bg-2 py-1.5">
                          <div className="text-ink-3">{m}</div>
                          <div className="font-medium text-ink">{Math.max(0, v - (3 - i) * 7)}%</div>
                        </div>
                      ))}
                    </div>
                  </SectionCard>
                );
              })}
            </div>
          )}

          {tab === 'related' && (
            <div className="flex flex-col gap-3.5">
              {related.map((g) => {
                const base = registerPathFor(g.entity.id);
                return (
                  <SectionCard key={`${g.entity.id}-${g.field}`} title={`${g.entity.plural} (${g.field})`} icon="ti-link" plain>
                    <ul className="divide-y divide-line">
                      {g.rows.slice(0, 8).map((x) => (
                        <li key={x.id} className="flex items-center gap-3 py-1.5 text-sm">
                          <CodeChip>{x.id}</CodeChip>
                          {base ? (
                            <Link to={`${base}/${x.id}`} className="flex-1 truncate text-blue hover:underline">
                              {String(x[g.entity.titleField] ?? x.id)}
                            </Link>
                          ) : (
                            <span className="flex-1 truncate">{String(x[g.entity.titleField] ?? x.id)}</span>
                          )}
                          {x.status !== undefined && <StatusBadge value={x.status} />}
                        </li>
                      ))}
                    </ul>
                  </SectionCard>
                );
              })}
            </div>
          )}

          {tab === 'documents' && (
            <DataTable
              rows={docs}
              getId={(d) => d.id}
              columns={[
                { key: 'name', label: 'Document', render: (d) => <span className="flex items-center gap-1.5"><Icon name={d.type === 'PDF' ? 'ti-file-type-pdf' : d.type === 'XLSX' ? 'ti-file-spreadsheet' : 'ti-file-zip'} className="text-[14px] text-blue" />{d.name}</span> },
                { key: 'version', label: 'Version' },
                { key: 'size', label: 'Size', align: 'right' },
                { key: 'by', label: 'Uploaded By' },
                { key: 'date', label: 'Date', render: (d) => formatDate(d.date) },
                { key: 'status', label: 'Status', render: (d) => <StatusBadge value={d.status} /> },
              ]}
              addLabel="Upload Document"
              onAdd={() => toast.success('Document uploaded', `Attached to ${row.id}`)}
              onView={(d) => toast.info('Opening preview', d.name)}
              exportName={`${row.id} documents`}
            />
          )}

          {tab === 'activities' && (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_320px]">
              <Timeline
                items={[
                  ...notes.map((n) => ({ date: n.at, title: 'Comment added', actor: 'Arun S', text: n.text })),
                  ...myAudit.map((a) => ({ date: a.at.slice(0, 10), title: a.action, actor: a.by, text: a.text })),
                  ...activity,
                ]}
              />
              <SectionCard title="Add Comment" icon="ti-message">
                <TextArea value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Write a note for the team…" />
                <div className="mt-2 flex justify-end">
                  <Button
                    variant="primary"
                    icon="ti-send"
                    disabled={!comment.trim()}
                    onClick={() => {
                      setNotes((n) => [{ text: comment.trim(), at: new Date().toISOString().slice(0, 10) }, ...n]);
                      setComment('');
                      toast.success('Comment posted');
                    }}
                  >
                    Post
                  </Button>
                </div>
              </SectionCard>
            </div>
          )}

          {tab === 'approvals' && (
            <div className="flex flex-col gap-4">
              <SectionCard title="Approval Workflow" icon="ti-route" plain>
                <div className="py-2">
                  <ApprovalStepper stages={approvals.stages} current={approvals.current} rejected={approvals.rejected} />
                </div>
                {pending && st && (
                  <div className="hair-t mt-3 flex items-center justify-end gap-2 border-line pt-3">
                    <span className="mr-auto text-xs text-ink-3">You are the approver for the current stage.</span>
                    <Button onClick={() => setDecision('Return')} icon="ti-arrow-back-up">
                      Return
                    </Button>
                    <Button variant="danger" icon="ti-x" onClick={() => setDecision('Reject')}>
                      Reject
                    </Button>
                    <Button variant="primary" icon="ti-check" onClick={() => setDecision('Approve')}>
                      Approve
                    </Button>
                  </div>
                )}
              </SectionCard>
              <DataTable
                bare
                selectable={false}
                rows={approvals.stages.filter((s) => s.date).map((s, i) => ({ id: String(i), ...s }))}
                getId={(x) => x.id}
                columns={[
                  { key: 'label', label: 'Stage' },
                  { key: 'by', label: 'Action By' },
                  { key: 'date', label: 'Date' },
                  { key: 'result', label: 'Result', render: () => <StatusBadge value="Approved" /> },
                ]}
                emptyText="No approval actions recorded yet."
              />
            </div>
          )}

          {tab === 'history' && (
            <DataTable
              bare
              selectable={false}
              rows={[
                ...myAudit.map((a, i) => ({ id: `a${i}`, at: a.at.slice(0, 10), field: a.action, from: '—', to: a.text ?? '—', by: a.by })),
                ...history.map((h, i) => ({ id: `h${i}`, ...h })),
              ]}
              getId={(x) => x.id}
              columns={[
                { key: 'at', label: 'Date', render: (x) => formatDate(x.at) },
                { key: 'field', label: 'Field / Action' },
                { key: 'from', label: 'Old Value' },
                { key: 'to', label: 'New Value' },
                { key: 'by', label: 'Changed By' },
              ]}
            />
          )}
        </div>
      </div>

      <RecordModal entity={entity} open={edit} onOpenChange={setEdit} initial={row} />
      <Modal
        open={!!decision}
        onOpenChange={(v) => !v && setDecision(null)}
        title={`${decision ?? ''} ${entity.label}`}
        icon={decision === 'Approve' ? 'ti-circle-check' : decision === 'Reject' ? 'ti-circle-x' : 'ti-arrow-back-up'}
        onSave={decide}
        saveLabel={decision ?? 'Confirm'}
      >
        <p className="text-sm text-ink-2">
          {decision} <strong className="font-semibold text-ink">{row.id} — {title}</strong>?
        </p>
        <div>
          <div className="field-label mb-1">
            Comments{decision === 'Reject' && <span className="ml-0.5 text-danger">*</span>}
          </div>
          <TextArea value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Reason / remarks for the record…" />
        </div>
      </Modal>
    </div>
  );
}
