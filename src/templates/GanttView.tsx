import { useMemo, useState } from 'react';
import type { Resolved } from '@/config/registry';
import type { ViewSpec } from '@/config/types';
import { SelectInput } from '@/components/fields';
import { Button, CodeChip, Icon, InfoBar, KpiCard, SegToggle } from '@/components/ui';
import { cn } from '@/lib/cn';
import { addDays, DEMO_TODAY, formatDate, parseISO, toISO } from '@/lib/format';
import { createRng } from '@/lib/random';
import { useRows } from '@/mock/store';
import { toast } from '@/mock/toast';

interface Task {
  wbs: string;
  name: string;
  level: 0 | 1;
  start: string;
  end: string;
  bStart: string;
  bEnd: string;
  progress: number;
  deps: number[];
  critical?: boolean;
  impacted?: boolean;
}

const PLAN: [string, string[], number, number][] = [
  ['Mobilization & Site Setup', ['Site office & fencing', 'Temporary power & water'], 0, 45],
  ['Substructure', ['Excavation & shoring', 'PCC & raft foundation', 'Basement retaining walls'], 30, 150],
  ['Superstructure', ['Columns & shear walls', 'Slabs L1–L6', 'Slabs L7–L12', 'Terrace & water tank'], 150, 300],
  ['Masonry & Plaster', ['Block work', 'Internal plaster'], 300, 150],
  ['MEP Services', ['Electrical conduiting', 'Plumbing & drainage', 'Fire fighting & HVAC'], 330, 190],
  ['Facade & Glazing', ['Aluminium windows', 'Structural glazing'], 420, 110],
  ['Finishes', ['Flooring & tiling', 'Painting', 'Joinery & fixtures'], 480, 150],
  ['External Works', ['Roads & landscaping', 'STP & utilities'], 560, 90],
  ['Testing, Commissioning & Handover', ['Testing & commissioning', 'Snag rectification', 'Handover to client'], 640, 90],
];

function buildTasks(projectId: string, projectStart: string, projectEnd: string, mode: string, behind: boolean): Task[] {
  const rng = createRng(`gantt:${projectId}`);
  const s0 = parseISO(projectStart);
  const span = Math.max(180, (parseISO(projectEnd).getTime() - s0.getTime()) / 86400000);
  const k = span / 730;
  const tasks: Task[] = [];
  let prevPhaseIdx = -1;
  PLAN.forEach(([phase, subs, off0, dur0], pi) => {
    const off = Math.round(off0 * k);
    const dur = Math.round(dur0 * k);
    const slip = behind ? rng.int(6, 30) : rng.int(-4, 8);
    const phaseIdx = tasks.length;
    const pStart = addDays(s0, off);
    const pEnd = addDays(s0, off + dur + slip);
    tasks.push({
      wbs: `${pi + 1}`,
      name: phase,
      level: 0,
      start: toISO(pStart),
      end: toISO(pEnd),
      bStart: toISO(pStart),
      bEnd: toISO(addDays(s0, off + dur)),
      progress: 0,
      deps: prevPhaseIdx >= 0 ? [prevPhaseIdx] : [],
      critical: [1, 2, 6, 8].includes(pi),
    });
    const sub = Math.floor(dur / subs.length);
    subs.forEach((name, si) => {
      const st = addDays(pStart, si * sub * 0.8);
      const bEnd = addDays(st, sub * 1.3);
      const extra = rng.chance(behind ? 0.55 : 0.25) ? rng.int(4, behind ? 26 : 14) : rng.int(-5, 0);
      const end = addDays(bEnd, extra);
      const total = (end.getTime() - st.getTime()) / 86400000;
      const done = (DEMO_TODAY.getTime() - st.getTime()) / 86400000;
      const progress = Math.max(0, Math.min(100, Math.round((done / total) * 100 - rng.int(0, 12))));
      tasks.push({
        wbs: `${pi + 1}.${si + 1}`,
        name,
        level: 1,
        start: toISO(st),
        end: toISO(end),
        bStart: toISO(st),
        bEnd: toISO(bEnd),
        progress: progress < 3 ? 0 : progress > 97 ? 100 : progress,
        deps: si === 0 ? (prevPhaseIdx >= 0 ? [prevPhaseIdx + 1] : []) : [tasks.length - 1],
        critical: [1, 2, 6, 8].includes(pi) && si === 0,
        impacted: mode === 'impact' && (pi === 2 || pi === 4 || pi === 6) && si === 1,
      });
    });
    const children = tasks.slice(phaseIdx + 1);
    tasks[phaseIdx].progress = Math.round(children.reduce((a, t) => a + t.progress, 0) / children.length);
    prevPhaseIdx = phaseIdx;
  });
  if (mode === 'impact') {
    for (const t of tasks) if (t.impacted) t.end = toISO(addDays(parseISO(t.end), 21));
  }
  return tasks;
}

const ROW = 32;
const DAY = 1.6;

export function GanttView({ view }: { r: Resolved; view: Extract<ViewSpec, { type: 'gantt' }> }) {
  const projects = useRows('project');
  const [pid, setPid] = useState(projects[0]?.id ?? 'PRJ-001');
  const [scale, setScale] = useState<'month' | 'quarter'>('month');
  const [collapsed, setCollapsed] = useState<string[]>([]);
  const project = projects.find((p) => p.id === pid) ?? projects[0];
  const mode = view.mode ?? 'schedule';
  const tasks = useMemo(
    () => buildTasks(pid, String(project?.start ?? '2025-01-01'), String(project?.end ?? '2027-01-01'), mode, /delay|risk/i.test(String(project?.status ?? ''))),
    [pid, project, mode],
  );
  const visible = tasks.filter((t) => t.level === 0 || !collapsed.includes(t.wbs.split('.')[0]));
  const dayW = scale === 'month' ? DAY : DAY * 0.55;
  const t0 = parseISO(tasks[0].start);
  const tEnd = parseISO(tasks.reduce((m, t) => (t.end > m ? t.end : m), tasks[0].end));
  const months: Date[] = [];
  for (let d = new Date(t0.getFullYear(), t0.getMonth(), 1); d <= tEnd; d = new Date(d.getFullYear(), d.getMonth() + 1, 1)) months.push(d);
  const x = (iso: string | Date) => ((typeof iso === 'string' ? parseISO(iso) : iso).getTime() - months[0].getTime()) / 86400000 * dayW;
  const width = x(new Date(months[months.length - 1].getFullYear(), months[months.length - 1].getMonth() + 1, 1));
  const delayed = tasks.filter((t) => t.level === 1 && t.end > t.bEnd).length;
  const overall = Math.round(tasks.filter((t) => t.level === 0).reduce((a, t) => a + t.progress, 0) / PLAN.length);
  const finish = tasks.reduce((m, t) => (t.end > m ? t.end : m), tasks[0].end);
  const bFinish = tasks.reduce((m, t) => (t.bEnd > m ? t.bEnd : m), tasks[0].bEnd);
  const slipDays = Math.round((parseISO(finish).getTime() - parseISO(bFinish).getTime()) / 86400000);
  const idx = new Map(visible.map((t, i) => [t, i]));

  return (
    <div className="flex flex-col gap-3">
      <div className="hair flex flex-wrap items-end gap-3 rounded-md border-line bg-bg-2 px-3.5 py-2.5">
        <div className="w-72">
          <div className="field-label mb-1">Project</div>
          <SelectInput value={pid} onChange={(e) => setPid(e.target.value || pid)} options={projects.map((p) => ({ value: p.id, label: `${p.id} — ${p.name}` }))} />
        </div>
        <SegToggle value={scale} onChange={setScale} options={[{ value: 'month', label: 'Months' }, { value: 'quarter', label: 'Quarters' }]} />
        <div className="flex-1" />
        <Button icon="ti-lock" onClick={() => toast.success('Baseline saved', `Baseline B2 captured for ${pid}`)}>
          Save Baseline
        </Button>
        <Button icon="ti-file-import" onClick={() => toast.success('Schedule imported', 'Primavera P6 XER · 32 activities')}>
          Import P6 / MSP
        </Button>
        <Button icon="ti-download" onClick={() => toast.success('Gantt exported', 'PDF · A3 landscape')}>
          Export
        </Button>
      </div>
      <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
        <KpiCard label="Overall progress" value={`${overall}%`} progress={overall} icon="ti-progress" />
        <KpiCard label="Forecast finish" value={formatDate(finish)} icon="ti-flag-check" sub={`Baseline ${formatDate(bFinish)}`} />
        <KpiCard label="Schedule variance" value={`${slipDays > 0 ? '+' : ''}${slipDays} days`} icon="ti-clock-exclamation" delta={slipDays > 0 ? 'behind' : 'ahead'} up={slipDays > 0} good={slipDays <= 0} />
        <KpiCard label="Delayed activities" value={`${delayed} of ${tasks.filter((t) => t.level === 1).length}`} icon="ti-alert-triangle" />
      </div>
      {mode === 'dependencies' && <InfoBar icon="ti-git-branch">Finish-to-start links shown as connectors. Critical path activities are outlined in navy.</InfoBar>}
      {mode === 'impact' && <InfoBar icon="ti-arrows-diff">Schedule impact of approved variations: impacted activities are extended by 21 days (hatched) against the original baseline.</InfoBar>}
      <div className="hair flex overflow-hidden rounded-md border-line bg-bg">
        <div className="hair-r w-[420px] shrink-0 border-line">
          <div className="hair-b flex h-[46px] items-end border-blue-line bg-blue-tint px-2.5 pb-1.5 text-xs font-semibold text-blue-ink">
            <span className="w-12">WBS</span>
            <span className="flex-1">Activity</span>
            <span className="w-[74px]">Start</span>
            <span className="w-[74px]">Finish</span>
            <span className="w-10 text-right">%</span>
          </div>
          {visible.map((t) => (
            <div key={t.wbs} className={cn('hair-b flex items-center border-line px-2.5 text-xs', t.level === 0 ? 'bg-bg-2 font-semibold text-ink' : 'text-ink-2')} style={{ height: ROW }}>
              <span className="w-12">
                <CodeChip>{t.wbs}</CodeChip>
              </span>
              <span className="flex flex-1 items-center gap-1 truncate" style={{ paddingLeft: t.level * 14 }}>
                {t.level === 0 && (
                  <button type="button" onClick={() => setCollapsed((c) => (c.includes(t.wbs) ? c.filter((x) => x !== t.wbs) : [...c, t.wbs]))} aria-label="Toggle">
                    <Icon name={collapsed.includes(t.wbs) ? 'ti-chevron-right' : 'ti-chevron-down'} className="text-[12px] text-ink-3" />
                  </button>
                )}
                <span className="truncate">{t.name}</span>
                {t.level === 1 && t.end > t.bEnd && <Icon name="ti-alert-circle" className="text-[12px] text-bad" />}
              </span>
              <span className="w-[74px] tabular-nums">{formatDate(t.start).slice(0, 6)} {t.start.slice(2, 4)}</span>
              <span className="w-[74px] tabular-nums">{formatDate(t.end).slice(0, 6)} {t.end.slice(2, 4)}</span>
              <span className="w-10 text-right tabular-nums">{t.progress}</span>
            </div>
          ))}
        </div>
        <div className="min-w-0 flex-1 overflow-x-auto">
          <div style={{ width }} className="relative">
            <div className="hair-b flex h-[46px] border-blue-line bg-blue-tint">
              {months.map((m) => {
                const w = new Date(m.getFullYear(), m.getMonth() + 1, 0).getDate() * dayW;
                return (
                  <div key={toISO(m)} className="hair-r flex shrink-0 flex-col justify-end border-blue-line px-1 pb-1.5 text-2xs text-blue-ink" style={{ width: w }}>
                    {m.getMonth() === 0 || m === months[0] ? <span className="font-semibold">{m.getFullYear()}</span> : <span>&nbsp;</span>}
                    <span>{scale === 'month' ? ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'][m.getMonth()] + (dayW > 1.2 ? ['an', 'eb', 'ar', 'pr', 'ay', 'un', 'ul', 'ug', 'ep', 'ct', 'ov', 'ec'][m.getMonth()] : '') : m.getMonth() % 3 === 0 ? `Q${m.getMonth() / 3 + 1}` : ''}</span>
                  </div>
                );
              })}
            </div>
            <div className="relative" style={{ height: visible.length * ROW }}>
              {months.map((m) => (
                <div key={toISO(m)} className="absolute top-0 bottom-0 w-px bg-line" style={{ left: x(m) }} />
              ))}
              <div className="absolute top-0 bottom-0 z-10 w-0 border-l-2 border-dashed border-blue" style={{ left: x(DEMO_TODAY) }}>
                <span className="absolute -top-0 left-1 rounded-sm bg-blue px-1 text-2xs whitespace-nowrap text-white">Today</span>
              </div>
              {visible.map((t, i) => {
                const top = i * ROW;
                const left = x(t.start);
                const w = Math.max(4, x(t.end) - left);
                const bl = x(t.bStart);
                const bw = Math.max(4, x(t.bEnd) - bl);
                return (
                  <div key={t.wbs} className="hair-b absolute right-0 left-0 border-line" style={{ top, height: ROW }}>
                    <div className="absolute rounded-full bg-line-2" style={{ left: bl, width: bw, top: ROW - 9, height: 3 }} title="Baseline" />
                    {t.level === 0 ? (
                      <div className="absolute rounded-sm bg-ink-2" style={{ left, width: w, top: 11, height: 8 }} title={`${t.name}: ${t.progress}%`}>
                        <div className="h-full rounded-sm bg-navy" style={{ width: `${t.progress}%` }} />
                      </div>
                    ) : (
                      <div
                        className={cn('absolute overflow-hidden rounded-sm bg-blue-line', mode === 'dependencies' && t.critical && 'ring-2 ring-navy', t.impacted && 'ring-2 ring-bad')}
                        style={{ left, width: w, top: 7, height: 14, backgroundImage: t.impacted ? 'repeating-linear-gradient(135deg,#FCEBEA 0 4px,#F5C6C5 4px 8px)' : undefined }}
                        title={`${t.name} · ${formatDate(t.start)} → ${formatDate(t.end)} · ${t.progress}%`}
                      >
                        <div className="h-full bg-blue" style={{ width: `${t.progress}%` }} />
                      </div>
                    )}
                  </div>
                );
              })}
              {mode === 'dependencies' && (
                <svg className="pointer-events-none absolute inset-0" width={width} height={visible.length * ROW}>
                  <defs>
                    <marker id="arr" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                      <path d="M0,0 L6,3 L0,6 z" fill="#0C3B6E" />
                    </marker>
                  </defs>
                  {visible.map((t) =>
                    t.deps.map((d) => {
                      const pred = tasks[d];
                      if (!pred || !idx.has(pred)) return null;
                      const pi = idx.get(pred)!;
                      const ti = idx.get(t)!;
                      const x1 = x(pred.end);
                      const y1 = pi * ROW + ROW / 2;
                      const x2 = x(t.start);
                      const y2 = ti * ROW + ROW / 2;
                      const mid = Math.max(x1 + 6, Math.min(x2 - 6, x1 + 10));
                      return <path key={`${pred.wbs}-${t.wbs}`} d={`M${x1},${y1} H${mid} V${y2} H${x2 - 1}`} stroke="#0C3B6E" strokeWidth="1" fill="none" markerEnd="url(#arr)" opacity={0.55} />;
                    }),
                  )}
                </svg>
              )}
            </div>
          </div>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-4 text-xs text-ink-2">
        <span className="flex items-center gap-1.5"><span className="h-2.5 w-6 rounded-sm bg-blue" />Actual progress</span>
        <span className="flex items-center gap-1.5"><span className="h-2.5 w-6 rounded-sm bg-blue-line" />Planned (forecast)</span>
        <span className="flex items-center gap-1.5"><span className="h-[3px] w-6 rounded-full bg-line-2" />Baseline</span>
        <span className="flex items-center gap-1.5"><Icon name="ti-alert-circle" className="text-[12px] text-bad" />Behind baseline</span>
        <span className="flex items-center gap-1.5"><span className="h-3 w-0 border-l-2 border-dashed border-blue" />Today ({formatDate(DEMO_TODAY)})</span>
      </div>
    </div>
  );
}
