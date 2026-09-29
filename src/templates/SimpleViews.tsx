import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getEntity, hasEntity, listFields, type Resolved } from '@/config/registry';
import type { Row, ViewSpec } from '@/config/types';
import { FieldControl, FieldShell, FieldValue, SelectInput } from '@/components/fields';
import { Modal } from '@/components/overlays';
import { Button, CodeChip, Icon, InfoBar, KpiCard, SectionCard, StatusBadge } from '@/components/ui';
import { PhotoTile, SaveRow, Timeline } from '@/components/widgets';
import { cn } from '@/lib/cn';
import { addDays, DEMO_TODAY, formatDate, formatINR, toISO } from '@/lib/format';
import { createRng, hashString } from '@/lib/random';
import { useRows } from '@/mock/store';
import { toast } from '@/mock/toast';
import { COMPANIES, useUi } from '@/mock/ui';
import { toneOf, TONE_DOT } from '@/theme/status';

/* ───────── Timeline ───────── */
export function TimelineView({ view }: { r: Resolved; view: Extract<ViewSpec, { type: 'timeline' }> }) {
  const subjects = useRows(view.subject && hasEntity(view.subject) ? view.subject : 'project');
  const e = view.subject && hasEntity(view.subject) ? getEntity(view.subject) : getEntity('project');
  const [sid, setSid] = useState(subjects[0]?.id ?? '');
  const events = [...view.events].sort((a, b) => b.date.localeCompare(a.date));
  const amounts = view.events.filter((x) => x.amount !== undefined);
  return (
    <div className="flex flex-col gap-3">
      <div className="hair flex flex-wrap items-end gap-3 rounded-md border-line bg-bg-2 px-3.5 py-2.5">
        <div className="w-80">
          <div className="field-label mb-1">{e.label}</div>
          <SelectInput value={sid} onChange={(ev) => setSid(ev.target.value)} options={subjects.map((s) => ({ value: s.id, label: `${s.id} — ${String(s[e.titleField] ?? s.id)}` }))} />
        </div>
        <div className="flex-1" />
        <Button variant="primary" icon="ti-plus" onClick={() => toast.success('Entry added', `New event recorded for ${sid}`)}>
          Add Entry
        </Button>
      </div>
      {amounts.length > 0 && (
        <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
          <KpiCard label="First position" value={formatINR(amounts[0].amount)} icon="ti-flag" />
          <KpiCard label="Latest position" value={formatINR(amounts[amounts.length - 1].amount)} icon="ti-flag-check" />
          <KpiCard label="Movement" value={formatINR((amounts[amounts.length - 1].amount ?? 0) - (amounts[0].amount ?? 0))} icon="ti-arrows-diff" />
          <KpiCard label="Rounds / entries" value={view.events.length} icon="ti-list-numbers" />
        </div>
      )}
      <SectionCard title={view.title} icon="ti-timeline" plain>
        <Timeline items={events.map((x) => ({ date: x.date, title: x.amount !== undefined ? `${x.title} — ${formatINR(x.amount)}` : x.title, actor: x.actor, text: x.text, status: x.status }))} />
      </SectionCard>
    </div>
  );
}

/* ───────── Gallery ───────── */
export function GalleryView({ view }: { r: Resolved; view: Extract<ViewSpec, { type: 'gallery' }> }) {
  const projects = useRows('project');
  const [pid, setPid] = useState('');
  const [open, setOpen] = useState<number | null>(null);
  const captions = view.captions ?? ['Raft foundation concreting', 'Column casting — Level 4', 'Slab shuttering in progress', 'Block work — Tower A', 'MEP conduiting', 'External plaster', 'Tower crane erection', 'Site mobilization', 'Waterproofing — terrace', 'Façade glazing', 'Landscaping works', 'Final cleaning'];
  const photos = useMemo(() => {
    const out: { title: string; sub: string; date: string; project: string; seed: number }[] = [];
    projects.slice(0, 6).forEach((p, pi) => {
      const rng = createRng(`photo:${p.id}:${view.title}`);
      for (let i = 0; i < 4; i++) out.push({ title: rng.pick(captions), sub: String(p.name), date: toISO(addDays(DEMO_TODAY, -rng.int(0, 45))), project: p.id, seed: pi * 4 + i });
    });
    return out.sort((a, b) => b.date.localeCompare(a.date));
  }, [projects, view.title, captions]);
  const list = photos.filter((p) => !pid || p.project === pid);
  const cur = open !== null ? list[open] : undefined;
  return (
    <div className="flex flex-col gap-3">
      <div className="hair flex flex-wrap items-end gap-3 rounded-md border-line bg-bg-2 px-3.5 py-2.5">
        <div className="w-72">
          <div className="field-label mb-1">Project</div>
          <SelectInput value={pid} onChange={(e) => setPid(e.target.value)} options={projects.map((p) => ({ value: p.id, label: `${p.id} — ${p.name}` }))} placeholder="All projects" />
        </div>
        <div className="flex-1" />
        <Button variant="primary" icon="ti-camera-plus" onClick={() => toast.success('Photos uploaded', '4 photos · geo-tagged')}>
          Upload Photos
        </Button>
      </div>
      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 xl:grid-cols-4">
        {list.map((p, i) => (
          <PhotoTile key={`${p.project}-${i}`} title={p.title} sub={p.sub} date={formatDate(p.date)} seed={p.seed} onClick={() => setOpen(i)} />
        ))}
      </div>
      <Modal open={!!cur} onOpenChange={(v) => !v && setOpen(null)} title={cur?.title ?? ''} icon="ti-photo" width={720}
        footer={<><Button icon="ti-chevron-left" disabled={!open} onClick={() => setOpen((o) => (o ?? 1) - 1)}>Previous</Button><Button icon="ti-chevron-right" disabled={open === list.length - 1} onClick={() => setOpen((o) => (o ?? 0) + 1)}>Next</Button><Button onClick={() => setOpen(null)}>Close</Button></>}>
        {cur && (
          <>
            <div className="flex h-[360px] items-center justify-center rounded-md" style={{ background: 'repeating-linear-gradient(135deg,#E3E7ED 0 10px,#EEF1F5 10px 20px)' }}>
              <Icon name="ti-building-skyscraper" className="text-[64px] text-ink-3" />
            </div>
            <div className="flex items-center gap-3 text-sm text-ink-2">
              <span>{cur.sub}</span>·<span>{formatDate(cur.date)}</span>·<span className="flex items-center gap-1"><Icon name="ti-map-pin" className="text-[13px]" />Geo-tagged</span>
            </div>
          </>
        )}
      </Modal>
    </div>
  );
}

/* ───────── Print view ───────── */
export function PrintView({ view }: { r: Resolved; view: Extract<ViewSpec, { type: 'print' }> }) {
  const entity = getEntity(view.entity);
  const rows = useRows(entity.id);
  const [id, setId] = useState(rows[0]?.id ?? '');
  const row = rows.find((x) => x.id === id) ?? rows[0];
  const company = useUi((s) => s.company);
  const org = COMPANIES.find((c) => c.id === company) ?? COMPANIES[0];
  const fields = listFields(entity).filter((f) => f.key !== entity.titleField);
  if (!row) return <InfoBar>No {entity.plural.toLowerCase()} available.</InfoBar>;
  return (
    <div className="flex flex-col gap-3">
      <div className="hair flex flex-wrap items-end gap-3 rounded-md border-line bg-bg-2 px-3.5 py-2.5">
        <div className="w-80">
          <div className="field-label mb-1">{entity.label}</div>
          <SelectInput value={id} onChange={(e) => setId(e.target.value || id)} options={rows.map((x) => ({ value: x.id, label: `${x.id} — ${String(x[entity.titleField] ?? '')}` }))} />
        </div>
        <div className="flex-1" />
        <Button icon="ti-mail" onClick={() => toast.success('Sent by email', `${view.docTitle} ${row.id}`)}>
          Email
        </Button>
        <Button icon="ti-download" onClick={() => toast.success('PDF downloaded', `${view.docTitle.replace(/\s+/g, '_')}_${row.id}.pdf`)}>
          Download PDF
        </Button>
        <Button variant="primary" icon="ti-printer" onClick={() => toast.info('Sent to printer', `${view.docTitle} ${row.id}`)}>
          Print
        </Button>
      </div>
      <div className="flex justify-center bg-bg-3 p-6">
        <div className="hair w-full max-w-[820px] border-line-2 bg-white p-8 shadow-[0_2px_12px_rgb(0_0_0/0.08)]">
          <div className="flex items-start gap-3 border-b-2 border-navy pb-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-navy">
              <Icon name="ti-building-skyscraper" className="text-[24px] text-white" />
            </div>
            <div>
              <div className="text-base font-semibold text-navy">{org.name}</div>
              <div className="text-xs text-ink-2">No. 42, Rajiv Gandhi Salai, Taramani, Chennai – 600 113 · GSTIN 33AABCS1234F1Z5</div>
            </div>
            <div className="ml-auto text-right">
              <div className="text-md font-semibold tracking-wide text-ink uppercase">{view.docTitle}</div>
              <div className="text-xs text-ink-2">No. {row.id}</div>
              <div className="text-xs text-ink-2">Date {formatDate(DEMO_TODAY)}</div>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-x-6 gap-y-2.5 text-sm">
            <div className="col-span-2">
              <div className="field-label">{entity.fields.find((f) => f.key === entity.titleField)?.label ?? entity.label}</div>
              <div className="font-medium">{String(row[entity.titleField] ?? row.id)}</div>
            </div>
            {fields.map((f) => (
              <div key={f.key}>
                <div className="field-label">{f.label}</div>
                <div>
                  <FieldValue field={f} value={row[f.key]} link={false} />
                </div>
              </div>
            ))}
          </div>
          {view.lines && (
            <table className="mt-5 w-full border-collapse text-sm">
              <thead>
                <tr>
                  <th className="border border-line-2 bg-blue-tint px-2 py-1.5 text-left text-xs font-semibold text-blue-ink">#</th>
                  {view.lines.columns.map((c, ci) => (
                    <th key={`${ci}-${c}`} className="border border-line-2 bg-blue-tint px-2 py-1.5 text-left text-xs font-semibold text-blue-ink">
                      {c}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {view.lines.rows.map((lr, i) => (
                  <tr key={i}>
                    <td className="border border-line-2 px-2 py-1.5 text-ink-2">{i + 1}</td>
                    {lr.map((v, j) => (
                      <td key={j} className={cn('border border-line-2 px-2 py-1.5', typeof v === 'number' && 'text-right tabular-nums')}>
                        {typeof v === 'number' ? v.toLocaleString('en-IN') : v}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {view.totals && (
            <div className="mt-3 ml-auto w-72 text-sm">
              {view.totals.map((t) => (
                <div key={t.label} className={cn('flex justify-between py-1', t.bold && 'border-t-2 border-navy pt-1.5 font-semibold text-navy')}>
                  <span>{t.label}</span>
                  <span className="tabular-nums">{t.value}</span>
                </div>
              ))}
            </div>
          )}
          <div className="mt-12 grid grid-cols-3 gap-6 text-center text-xs text-ink-2">
            {(view.signatures ?? ['Prepared by', 'Checked by', 'Authorised Signatory']).map((s) => (
              <div key={s}>
                <div className="mb-1 h-10 border-b border-line-2" />
                {s}
              </div>
            ))}
          </div>
          <div className="mt-6 text-center text-2xs text-ink-3">This is a system-generated document from Construction ERP.</div>
        </div>
      </div>
    </div>
  );
}

/* ───────── Map ───────── */
export function MapView({ r, view }: { r: Resolved; view: Extract<ViewSpec, { type: 'map' }> }) {
  const entity = getEntity(view.entity);
  const rows = useRows(entity.id);
  const navigate = useNavigate();
  const [sel, setSel] = useState<Row | null>(null);
  const pos = (row: Row) => {
    const h = hashString(row.id + entity.id);
    return { x: 8 + (h % 84), y: 16 + ((h >> 8) % 70) };
  };
  return (
    <div className="grid grid-cols-1 gap-3.5 lg:grid-cols-[1fr_320px]">
      <div className="hair relative h-[520px] overflow-hidden rounded-md border-line bg-[#EEF3F8]">
        <svg className="absolute inset-0 h-full w-full" preserveAspectRatio="none" viewBox="0 0 100 100">
          {Array.from({ length: 11 }, (_, i) => (
            <line key={`v${i}`} x1={i * 10} y1={0} x2={i * 10} y2={100} stroke="#DDE5EE" strokeWidth="0.2" />
          ))}
          {Array.from({ length: 11 }, (_, i) => (
            <line key={`h${i}`} x1={0} y1={i * 10} x2={100} y2={i * 10} stroke="#DDE5EE" strokeWidth="0.2" />
          ))}
          <path d="M0,62 C20,58 35,70 52,60 S80,40 100,46" stroke="#C9D1DB" strokeWidth="1.4" fill="none" />
          <path d="M28,0 C30,30 40,48 36,100" stroke="#C9D1DB" strokeWidth="1" fill="none" />
          <path d="M70,0 C66,24 78,60 74,100" stroke="#D6DEE7" strokeWidth="0.8" fill="none" />
          <path d="M0,88 C18,84 30,92 48,86 S76,78 100,82 L100,100 L0,100 Z" fill="#DCE9F6" />
        </svg>
        {rows.map((row) => {
          const p = pos(row);
          return (
            <button
              key={row.id}
              type="button"
              onClick={() => setSel(row)}
              className="absolute -translate-x-1/2 -translate-y-full"
              style={{ left: `${p.x}%`, top: `${p.y}%` }}
              title={String(row[entity.titleField] ?? row.id)}
            >
              <Icon name="ti-map-pin" className={cn('text-[26px]', sel?.id === row.id ? 'text-bad' : 'text-navy')} />
            </button>
          );
        })}
        <div className="hair absolute top-3 left-3 flex flex-col overflow-hidden rounded-md border-line-2 bg-bg">
          <button type="button" className="hair-b flex h-7 w-7 items-center justify-center border-line" aria-label="Zoom in"><Icon name="ti-plus" /></button>
          <button type="button" className="flex h-7 w-7 items-center justify-center" aria-label="Zoom out"><Icon name="ti-minus" /></button>
        </div>
        <div className="hair absolute right-3 bottom-3 rounded-md border-line bg-bg/90 px-2.5 py-1.5 text-2xs text-ink-2">Map placeholder · {rows.length} locations</div>
      </div>
      <SectionCard title={sel ? `${sel.id}` : `${entity.plural} (${rows.length})`} icon="ti-map-2" plain className="self-start">
        {sel ? (
          <div className="flex flex-col gap-2.5">
            <div className="text-sm font-semibold text-ink">{String(sel[entity.titleField] ?? sel.id)}</div>
            {listFields(entity).slice(0, 6).map((f) => (
              <div key={f.key}>
                <div className="field-label">{f.label}</div>
                <div className="text-sm"><FieldValue field={f} value={sel[f.key]} /></div>
              </div>
            ))}
            <div className="mt-1 flex gap-2">
              <Button variant="primary" size="sm" onClick={() => navigate(`${r.base}/${sel.id}`)}>Open record</Button>
              <Button size="sm" onClick={() => setSel(null)}>Back to list</Button>
            </div>
          </div>
        ) : (
          <ul className="-mx-1 max-h-[440px] divide-y divide-line overflow-y-auto">
            {rows.map((row) => (
              <li key={row.id}>
                <button type="button" onClick={() => setSel(row)} className="flex w-full items-center gap-2 px-1 py-2 text-left hover:bg-bg-2">
                  <span className={cn('h-2 w-2 rounded-full', TONE_DOT[toneOf(row.status)])} />
                  <CodeChip>{row.id}</CodeChip>
                  <span className="flex-1 truncate text-sm">{String(row[entity.titleField] ?? row.id)}</span>
                  {row.status !== undefined && <StatusBadge value={row.status} />}
                </button>
              </li>
            ))}
          </ul>
        )}
      </SectionCard>
    </div>
  );
}

/* ───────── Settings form ───────── */
export function SettingsView({ view }: { r: Resolved; view: Extract<ViewSpec, { type: 'settings' }> }) {
  const [values, setValues] = useState<Record<string, unknown>>(() => {
    const v: Record<string, unknown> = {};
    view.sections.forEach((s) => s.fields.forEach((f) => {
      const g = f.gen;
      if (f.options?.length) v[f.key] = f.type === 'multiselect' ? f.options.slice(0, 2) : f.options[0];
      else if (Array.isArray(g) && typeof g[0] === 'string') v[f.key] = g[0];
      else if (Array.isArray(g) && typeof g[0] === 'number') v[f.key] = g[0];
    }));
    return v;
  });
  return (
    <div className="flex flex-col gap-3.5">
      <InfoBar icon="ti-settings">{view.title} — these defaults apply to all new records.</InfoBar>
      {view.sections.map((s) => (
        <SectionCard key={s.title} title={s.title} icon={s.icon}>
          <div className="grid grid-cols-1 gap-x-3.5 gap-y-2.5 md:grid-cols-2 xl:grid-cols-3">
            {s.fields.map((f) => (
              <FieldShell key={f.key} label={f.label} required={f.required} hint={f.hint} className={cn(f.type === 'textarea' && 'md:col-span-2 xl:col-span-3')}>
                <FieldControl field={f} value={values[f.key]} onChange={(v) => setValues((x) => ({ ...x, [f.key]: v }))} />
              </FieldShell>
            ))}
          </div>
        </SectionCard>
      ))}
      <SaveRow label={`Save ${view.title}`} onClick={() => toast.success(`${view.title} saved`)} />
    </div>
  );
}

export { Timeline };
