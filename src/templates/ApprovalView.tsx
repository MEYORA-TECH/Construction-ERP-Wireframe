import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getEntity, listFields, statusFieldOf, type Resolved } from '@/config/registry';
import type { Row, ViewSpec } from '@/config/types';
import { DataTable } from '@/components/DataTable';
import { FieldValue, TextArea } from '@/components/fields';
import { Modal } from '@/components/overlays';
import { Button, CodeChip, KpiCard, SectionCard, StatusBadge, Tabs } from '@/components/ui';
import { ApprovalStepper } from '@/components/widgets';
import { hashString } from '@/lib/random';
import { useData, useRows } from '@/mock/store';
import { toast } from '@/mock/toast';
import { toneOf } from '@/theme/status';

type Bucket = 'Pending' | 'Approved' | 'Rejected' | 'All';

/** Draft / inactive records (gray) are not yet in the approval queue — they only appear under "All". */
function bucketOf(status: unknown): Exclude<Bucket, 'All'> | 'Draft' {
  const t = toneOf(status);
  return t === 'green' ? 'Approved' : t === 'red' ? 'Rejected' : t === 'gray' ? 'Draft' : 'Pending';
}

export function ApprovalView({ r, view }: { r: Resolved; view: Extract<ViewSpec, { type: 'approval' }> }) {
  const entity = getEntity(view.entity);
  const rows = useRows(entity.id);
  const update = useData((s) => s.update);
  const navigate = useNavigate();
  const [tab, setTab] = useState<Bucket>('Pending');
  const [focus, setFocus] = useState<Row | null>(null);
  const [decision, setDecision] = useState<{ row: Row; kind: 'Approve' | 'Reject' } | null>(null);
  const [comment, setComment] = useState('');
  const st = statusFieldOf(entity);
  const stageOf = (row: Row) => {
    const b = bucketOf(row[st?.key ?? 'status']);
    return b === 'Approved' ? view.stages.length : b === 'Rejected' ? hashString(row.id) % view.stages.length : hashString(row.id) % Math.max(1, view.stages.length - 1);
  };
  const list = useMemo(() => rows.filter((x) => tab === 'All' || bucketOf(x[st?.key ?? 'status']) === tab), [rows, tab, st]);
  const counts = (b: Bucket) => rows.filter((x) => b === 'All' || bucketOf(x[st?.key ?? 'status']) === b).length;
  const cols = listFields(entity).filter((f) => f.type !== 'status').slice(0, 5);
  const current = focus ? rows.find((x) => x.id === focus.id) ?? null : list[0] ?? null;

  const decide = () => {
    if (!decision || !st) return;
    const target =
      decision.kind === 'Approve'
        ? st.options?.find((o) => /approv|certif|accept|verified|settled/i.test(o)) ?? 'Approved'
        : st.options?.find((o) => /reject/i.test(o)) ?? 'Rejected';
    update(entity.id, decision.row.id, { [st.key]: target }, decision.kind === 'Approve' ? 'Approved' : 'Rejected');
    toast.success(decision.kind === 'Approve' ? 'Approved' : 'Rejected', `${decision.row.id} → ${target}`);
    setDecision(null);
    setComment('');
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
        <KpiCard label="Awaiting approval" value={counts('Pending')} icon="ti-hourglass" />
        <KpiCard label="Approved" value={counts('Approved')} icon="ti-circle-check" />
        <KpiCard label="Rejected / returned" value={counts('Rejected')} icon="ti-circle-x" />
        <KpiCard label="Avg. turnaround" value="2.4 days" icon="ti-clock" delta="0.6 d" up={false} good />
      </div>
      <Tabs value={tab} onChange={setTab} tabs={(['Pending', 'Approved', 'Rejected', 'All'] as Bucket[]).map((b) => ({ value: b, label: b, count: counts(b) }))} />
      <div className="grid grid-cols-1 gap-3.5 2xl:grid-cols-[1fr_380px]">
        <DataTable
          rows={list}
          getId={(x) => x.id}
          onRowClick={(x) => setFocus(x)}
          onView={(x) => navigate(`${r.base}/${x.id}`)}
          columns={[
            { key: 'code', label: `${entity.label} No.`, render: (x) => <CodeChip>{x.id}</CodeChip>, value: (x) => x.id },
            ...cols.map((f) => ({ key: f.key, label: f.label, render: (x: Row) => <FieldValue field={f} value={x[f.key]} />, align: (f.type === 'currency' ? 'right' : 'left') as 'right' | 'left' })),
            { key: '_stage', label: 'Current Stage', render: (x) => (bucketOf(x[st?.key ?? 'status']) === 'Pending' ? view.stages[stageOf(x)] : '—'), value: (x) => stageOf(x) },
            { key: 'status', label: 'Status', render: (x) => <StatusBadge value={x[st?.key ?? 'status']} /> },
          ]}
          rowMenu={(x) => [
            { label: 'Approve', icon: 'ti-check', onSelect: () => setDecision({ row: x, kind: 'Approve' }) },
            { label: 'Reject', icon: 'ti-x', danger: true, onSelect: () => setDecision({ row: x, kind: 'Reject' }) },
          ]}
          exportName={`${entity.plural} approvals`}
        />
        {current && (
          <SectionCard title={`${current.id} — Approval Flow`} icon="ti-route" plain className="self-start">
            <div className="mb-3 text-sm font-medium text-ink">{String(current[entity.titleField] ?? current.id)}</div>
            <ApprovalStepper
              stages={view.stages.map((s, i) => ({ label: s, by: i < stageOf(current) ? ['Sneha P', 'Harish V', 'Siddharth Rao', 'Arun S', 'Gayathri S'][i % 5] : undefined }))}
              current={stageOf(current)}
              rejected={bucketOf(current[st?.key ?? 'status']) === 'Rejected'}
            />
            <div className="mt-4 grid grid-cols-2 gap-x-3 gap-y-2">
              {cols.slice(0, 4).map((f) => (
                <div key={f.key}>
                  <div className="field-label">{f.label}</div>
                  <div className="text-sm">
                    <FieldValue field={f} value={current[f.key]} />
                  </div>
                </div>
              ))}
            </div>
            {bucketOf(current[st?.key ?? 'status']) === 'Pending' && (
              <div className="hair-t mt-4 flex justify-end gap-2 border-line pt-3">
                <Button variant="danger" icon="ti-x" onClick={() => setDecision({ row: current, kind: 'Reject' })}>
                  Reject
                </Button>
                <Button variant="primary" icon="ti-check" onClick={() => setDecision({ row: current, kind: 'Approve' })}>
                  Approve
                </Button>
              </div>
            )}
          </SectionCard>
        )}
      </div>
      <Modal open={!!decision} onOpenChange={(v) => !v && setDecision(null)} title={`${decision?.kind ?? ''} ${entity.label}`} icon={decision?.kind === 'Approve' ? 'ti-circle-check' : 'ti-circle-x'} onSave={decide} saveLabel={decision?.kind ?? 'Confirm'}>
        <p className="text-sm text-ink-2">
          {decision?.kind} <strong className="font-semibold text-ink">{decision?.row.id}</strong> at stage “{decision ? view.stages[Math.min(stageOf(decision.row), view.stages.length - 1)] : ''}”?
        </p>
        <div>
          <div className="field-label mb-1">Comments</div>
          <TextArea value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Remarks for the record…" />
        </div>
      </Modal>
    </div>
  );
}
