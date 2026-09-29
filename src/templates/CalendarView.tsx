import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getEntity, type Resolved } from '@/config/registry';
import type { EntityDef, Row, ViewSpec } from '@/config/types';
import { Button, Icon, IconButton, InfoBar, MetaStrip, SegToggle } from '@/components/ui';
import { cn } from '@/lib/cn';
import { addDays, DEMO_TODAY, toISO } from '@/lib/format';
import { createRng } from '@/lib/random';
import { useRows } from '@/mock/store';
import { toast } from '@/mock/toast';
import { toneOf, TONE_CLASSES, TONE_DOT, type Tone } from '@/theme/status';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const DOW = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export function MonthCalendar({ entity, rows, dateField, onOpen }: { entity: EntityDef; rows: Row[]; dateField: string; onOpen: (row: Row) => void }) {
  const [cursor, setCursor] = useState(new Date(DEMO_TODAY.getFullYear(), DEMO_TODAY.getMonth(), 1));
  const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
  const offset = (first.getDay() + 6) % 7;
  const start = addDays(first, -offset);
  const cells = Array.from({ length: 42 }, (_, i) => addDays(start, i));
  const byDay = useMemo(() => {
    const m = new Map<string, Row[]>();
    for (const r of rows) {
      const d = String(r[dateField] ?? '');
      if (!d) continue;
      (m.get(d) ?? m.set(d, []).get(d)!).push(r);
    }
    return m;
  }, [rows, dateField]);
  const today = toISO(DEMO_TODAY);

  return (
    <div className="hair overflow-hidden rounded-md border-line bg-bg">
      <div className="hair-b flex items-center gap-2 border-line px-3 py-2">
        <IconButton icon="ti-chevron-left" label="Previous month" onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))} />
        <span className="w-36 text-center text-sm font-semibold text-ink">
          {MONTHS[cursor.getMonth()]} {cursor.getFullYear()}
        </span>
        <IconButton icon="ti-chevron-right" label="Next month" onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))} />
        <Button size="sm" onClick={() => setCursor(new Date(DEMO_TODAY.getFullYear(), DEMO_TODAY.getMonth(), 1))}>
          Today
        </Button>
        <span className="ml-auto text-xs text-ink-3">{entity.fields.find((f) => f.key === dateField)?.label ?? 'Date'}</span>
      </div>
      <div className="grid grid-cols-7">
        {DOW.map((d) => (
          <div key={d} className="hair-b border-blue-line bg-blue-tint px-2 py-1.5 text-xs font-semibold text-blue-ink">
            {d}
          </div>
        ))}
        {cells.map((d) => {
          const iso = toISO(d);
          const items = byDay.get(iso) ?? [];
          const inMonth = d.getMonth() === cursor.getMonth();
          return (
            <div key={iso} className={cn('hair-b hair-r min-h-[92px] border-line p-1.5', !inMonth && 'bg-bg-2')}>
              <div className={cn('mb-1 flex h-5 w-5 items-center justify-center rounded-full text-xs', iso === today ? 'bg-navy font-semibold text-white' : inMonth ? 'text-ink' : 'text-ink-3')}>{d.getDate()}</div>
              <div className="flex flex-col gap-0.5">
                {items.slice(0, 3).map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => onOpen(r)}
                    className={cn('truncate rounded-sm px-1 py-px text-left text-2xs', TONE_CLASSES[toneOf(r.status)])}
                    title={String(r[entity.titleField] ?? r.id)}
                  >
                    {String(r[entity.titleField] ?? r.id)}
                  </button>
                ))}
                {items.length > 3 && <span className="px-1 text-2xs text-ink-3">+{items.length - 3} more</span>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function GridCalendar({ view }: { view: Extract<ViewSpec, { type: 'calendar'; mode: 'grid' }> }) {
  const entity = getEntity(view.rowsEntity);
  const rows = useRows(entity.id).slice(0, 16);
  const days = view.days ?? 14;
  const [weekOffset, setWeekOffset] = useState(0);
  const startDate = addDays(DEMO_TODAY, -days + 1 + weekOffset * 7);
  const dates = Array.from({ length: days }, (_, i) => addDays(startDate, i));
  const weights = view.weights ?? view.codes.map((_, i) => (i === 0 ? 8 : 1));
  const total = weights.reduce((a, b) => a + b, 0);
  const [overrides, setOverrides] = useState<Record<string, number>>({});
  const codeAt = (rowId: string, iso: string, dow: number) => {
    const k = `${rowId}|${iso}`;
    if (overrides[k] !== undefined) return overrides[k];
    if (dow === 0 && view.codes.some((c) => /off|holiday|weekly/i.test(c.label))) return view.codes.findIndex((c) => /off|holiday|weekly/i.test(c.label));
    const rng = createRng(`${view.title}|${k}`);
    let x = rng.next() * total;
    for (let i = 0; i < weights.length; i++) {
      x -= weights[i];
      if (x <= 0) return i;
    }
    return 0;
  };
  const summary = view.codes.map((c, ci) => ({
    label: c.label,
    value: String(rows.reduce((acc, r) => acc + dates.filter((d) => codeAt(r.id, toISO(d), d.getDay()) === ci).length, 0)),
  }));

  return (
    <div className="flex flex-col gap-3">
      <MetaStrip items={summary.slice(0, 6)} cols={Math.min(6, summary.length)} />
      <div className="flex flex-wrap items-center gap-2">
        <IconButton icon="ti-chevron-left" label="Previous week" onClick={() => setWeekOffset((w) => w - 1)} />
        <span className="text-sm font-medium text-ink">
          {toISO(dates[0]).slice(8)} {MONTHS[dates[0].getMonth()].slice(0, 3)} – {toISO(dates[dates.length - 1]).slice(8)} {MONTHS[dates[dates.length - 1].getMonth()].slice(0, 3)} {dates[dates.length - 1].getFullYear()}
        </span>
        <IconButton icon="ti-chevron-right" label="Next week" onClick={() => setWeekOffset((w) => Math.min(0, w + 1))} />
        <div className="flex-1" />
        {view.codes.map((c) => (
          <span key={c.code} className="flex items-center gap-1 text-xs text-ink-2">
            <span className={cn('flex h-4 min-w-4 items-center justify-center rounded-sm px-0.5 text-2xs font-semibold', TONE_CLASSES[c.tone])}>{c.code}</span>
            {c.label}
          </span>
        ))}
        <Button size="sm" icon="ti-file-import" onClick={() => toast.success('Biometric data imported', `${rows.length} records synced for ${days} days`)}>
          Import
        </Button>
      </div>
      <div className="hair overflow-x-auto rounded-md border-line bg-bg">
        <table className="w-full border-collapse text-xs">
          <thead>
            <tr>
              <th className="hair-b sticky left-0 min-w-[200px] border-blue-line bg-blue-tint px-2.5 py-1.5 text-left font-semibold text-blue-ink">{entity.label}</th>
              {dates.map((d) => (
                <th key={toISO(d)} className={cn('hair-b border-blue-line px-1 py-1.5 text-center font-semibold text-blue-ink', d.getDay() === 0 ? 'bg-blue-line' : 'bg-blue-tint')}>
                  <div>{DOW[(d.getDay() + 6) % 7].slice(0, 2)}</div>
                  <div className="font-normal">{d.getDate()}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="hover:bg-bg-2">
                <td className="hair-b sticky left-0 border-line bg-bg px-2.5 py-1">
                  <div className="truncate text-sm text-ink">{String(r[entity.titleField] ?? r.id)}</div>
                  <div className="text-2xs text-ink-3">{r.id}</div>
                </td>
                {dates.map((d) => {
                  const iso = toISO(d);
                  const ci = codeAt(r.id, iso, d.getDay());
                  const c = view.codes[ci];
                  return (
                    <td key={iso} className="hair-b border-line p-0.5 text-center">
                      <button
                        type="button"
                        title={`${c.label} — click to change`}
                        onClick={() => setOverrides((o) => ({ ...o, [`${r.id}|${iso}`]: (ci + 1) % view.codes.length }))}
                        className={cn('h-6 w-full min-w-6 rounded-sm text-2xs font-semibold', TONE_CLASSES[c.tone as Tone])}
                      >
                        {c.code}
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function CalendarView({ r, view }: { r: Resolved; view: Extract<ViewSpec, { type: 'calendar' }> }) {
  const navigate = useNavigate();
  if (view.mode === 'grid') {
    return (
      <div className="flex flex-col gap-3">
        <InfoBar icon="ti-calendar-stats">{view.title} — click any cell to change its value. Sundays are highlighted.</InfoBar>
        <GridCalendar view={view} />
      </div>
    );
  }
  return <MonthPage r={r} view={view} onOpen={(row) => navigate(`${r.base}/${row.id}`)} />;
}

function MonthPage({ view, onOpen }: { r: Resolved; view: Extract<ViewSpec, { type: 'calendar'; mode: 'month' }>; onOpen: (row: Row) => void }) {
  const entity = getEntity(view.entity);
  const rows = useRows(entity.id);
  const [mode, setMode] = useState<'month' | 'list'>('month');
  const upcoming = rows
    .filter((r) => String(r[view.dateField] ?? '') >= toISO(DEMO_TODAY))
    .sort((a, b) => String(a[view.dateField]).localeCompare(String(b[view.dateField])))
    .slice(0, 12);
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <InfoBar icon="ti-calendar-event">{view.title} — {rows.length} {entity.plural.toLowerCase()} plotted by {entity.fields.find((f) => f.key === view.dateField)?.label.toLowerCase()}.</InfoBar>
        <div className="ml-auto">
          <SegToggle value={mode} onChange={setMode} options={[{ value: 'month', label: 'Month', icon: 'ti-calendar' }, { value: 'list', label: 'Upcoming', icon: 'ti-list' }]} />
        </div>
      </div>
      {mode === 'month' ? (
        <MonthCalendar entity={entity} rows={rows} dateField={view.dateField} onOpen={onOpen} />
      ) : (
        <div className="hair divide-y divide-line rounded-md border-line bg-bg">
          {upcoming.map((r) => (
            <button key={r.id} type="button" onClick={() => onOpen(r)} className="flex w-full items-center gap-3 px-3.5 py-2.5 text-left hover:bg-bg-2">
              <span className={cn('h-2 w-2 rounded-full', TONE_DOT[toneOf(r.status)])} />
              <span className="w-28 text-sm text-ink-2">{String(r[view.dateField])}</span>
              <span className="flex-1 truncate text-sm text-ink">{String(r[entity.titleField] ?? r.id)}</span>
              <Icon name="ti-chevron-right" className="text-ink-3" />
            </button>
          ))}
          {!upcoming.length && <div className="p-6 text-center text-sm text-ink-3 italic">No upcoming items.</div>}
        </div>
      )}
    </div>
  );
}
