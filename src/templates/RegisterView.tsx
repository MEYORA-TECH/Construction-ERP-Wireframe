import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getEntity, type Resolved } from '@/config/registry';
import type { EntityDef, FieldDef, Row, ViewSpec } from '@/config/types';
import { DataTable } from '@/components/DataTable';
import { fieldText } from '@/components/fields';
import { InfoBar, MetaStrip, SegToggle, Tabs } from '@/components/ui';
import { ImportPanel } from '@/components/widgets';
import { formatDate, formatINRCompact, formatNumber, DEMO_TODAY, daysFromToday } from '@/lib/format';
import { useData, useRows } from '@/mock/store';
import { toast } from '@/mock/toast';
import { useUi, COMPANIES } from '@/mock/ui';
import { BoardBody } from './BoardView';
import { MonthCalendar } from './CalendarView';
import { entityColumns, useRowMenu } from './columns';
import { formMode, RecordModal } from './RecordForm';

type RegisterSpec = Extract<ViewSpec, { type: 'register' | 'status' | 'field' }>;

function applyFilter(rows: Row[], filter?: Record<string, string>) {
  if (!filter) return rows;
  return rows.filter((r) => Object.entries(filter).every(([k, v]) => String(r[k]) === v));
}

function fieldSummary(field: FieldDef, rows: Row[]): { label: string; value: string }[] {
  const vals = rows.map((r) => r[field.key]).filter((v) => v !== undefined && v !== null && v !== '');
  if (field.type === 'currency' || field.type === 'number' || field.type === 'percent') {
    const nums = vals.map(Number).filter(Number.isFinite);
    const sum = nums.reduce((a, b) => a + b, 0);
    const f = (n: number) => (field.type === 'currency' ? formatINRCompact(n) : field.type === 'percent' ? `${Math.round(n)}%` : `${formatNumber(n, 1)}${field.unit ? ` ${field.unit}` : ''}`);
    return [
      { label: field.type === 'percent' ? 'Average' : 'Total', value: f(field.type === 'percent' ? sum / (nums.length || 1) : sum) },
      { label: 'Minimum', value: nums.length ? f(Math.min(...nums)) : '—' },
      { label: 'Maximum', value: nums.length ? f(Math.max(...nums)) : '—' },
      { label: 'Records with value', value: `${nums.length} of ${rows.length}` },
    ];
  }
  if (field.type === 'date') {
    const sorted = vals.map(String).sort();
    const upcoming = sorted.filter((d) => daysFromToday(d) >= 0 && daysFromToday(d) <= 30).length;
    const past = sorted.filter((d) => daysFromToday(d) < 0).length;
    return [
      { label: 'Earliest', value: sorted.length ? formatDate(sorted[0]) : '—' },
      { label: 'Latest', value: sorted.length ? formatDate(sorted[sorted.length - 1]) : '—' },
      { label: 'Next 30 days', value: String(upcoming) },
      { label: 'Before today', value: String(past) },
    ];
  }
  const counts = new Map<string, number>();
  for (const v of vals) {
    const k = fieldText(field, v);
    counts.set(k, (counts.get(k) ?? 0) + 1);
  }
  const top = [...counts.entries()].sort((a, b) => b[1] - a[1]);
  return [
    { label: 'Distinct values', value: String(counts.size) },
    ...top.slice(0, 3).map(([k, n]) => ({ label: k.length > 28 ? `${k.slice(0, 28)}…` : k, value: `${n} record${n > 1 ? 's' : ''}` })),
  ];
}

export function RegisterView({ r, view }: { r: Resolved; view: RegisterSpec }) {
  const navigate = useNavigate();
  const company = useUi((s) => s.company);
  const pair = view.type === 'register' ? view.pair : undefined;
  const [activeEntity, setActiveEntity] = useState(view.entity);
  const entity = getEntity(pair ? activeEntity : view.entity);
  const allRows = useRows(entity.id);
  const remove = useData((s) => s.remove);
  const rowMenu = useRowMenu(entity);
  const [modal, setModal] = useState<{ open: boolean; row?: Row }>({ open: false });
  const modes = view.type === 'register' ? view.views : undefined;
  const [mode, setMode] = useState<'table' | 'board' | 'calendar'>('table');
  const tabsSpec = view.type === 'register' ? view.tabs : undefined;
  const [tab, setTab] = useState('All');

  const baseFilter: Record<string, string> | undefined =
    view.type === 'status' ? { [view.field]: view.value } : view.type === 'register' ? view.filter : undefined;
  const rows = useMemo(() => {
    let out = applyFilter(allRows, baseFilter);
    if (tabsSpec && tab !== 'All') out = out.filter((row) => String(row[tabsSpec.field]) === tab);
    return out;
  }, [allRows, JSON.stringify(baseFilter), tab, tabsSpec]);

  const highlight = view.type === 'field' ? view.field : undefined;
  const hField = highlight ? entity.fields.find((f) => f.key === highlight) : undefined;
  const columns = useMemo(() => entityColumns(entity, highlight), [entity, highlight]);
  const mode_ = formMode(entity);

  const openCreate = () => {
    if (mode_ === 'modal') setModal({ open: true });
    else navigate(`${r.base}/new`, { state: { prefill: baseFilter } });
  };
  const openEdit = (row: Row) => {
    if (mode_ === 'modal') setModal({ open: true, row });
    else navigate(`${r.base}/${row.id}/edit`);
  };

  const title = r.child?.label ?? r.menu?.label ?? entity.plural;
  const org = COMPANIES.find((c) => c.id === company) ?? COMPANIES[0];

  return (
    <div className="flex flex-col gap-3">
      <MetaStrip
        items={[
          { label: 'Organisation', value: org.name },
          { label: 'Financial Year', value: 'FY 2026 – 2027' },
          { label: view.type === 'status' ? `${view.value} records` : 'Records in register', value: `${rows.length} ${rows.length === 1 ? entity.label : entity.plural}` },
          { label: 'As on', value: `${formatDate(DEMO_TODAY)}, 09:30` },
        ]}
      />
      {view.type === 'field' && hField && (
        <>
          <InfoBar icon="ti-focus-2">
            Showing the <strong className="font-semibold">{entity.plural}</strong> register focused on <strong className="font-semibold">{hField.label}</strong> — the column is highlighted and sorted.
          </InfoBar>
          <MetaStrip items={fieldSummary(hField, rows)} />
        </>
      )}
      {view.type === 'status' && (
        <InfoBar icon="ti-filter">
          {entity.plural} filtered to <strong className="font-semibold">{view.value}</strong>. New records created here are pre-set to “{view.value}”.
        </InfoBar>
      )}
      {entity.info && <InfoBar>{entity.info}</InfoBar>}
      {entity.import && view.type !== 'field' && <ImportPanel targets={pair ? pair.map((p) => getEntity(p).plural) : [entity.plural]} />}
      {(pair || (modes && modes.length > 1)) && (
        <div className="flex flex-wrap items-center gap-3">
          {pair && (
            <SegToggle
              value={activeEntity}
              onChange={(v) => { setActiveEntity(v); setTab('All'); }}
              options={pair.map((p) => ({ value: p, label: `${getEntity(p).label} Details` }))}
            />
          )}
          {modes && modes.length > 1 && (
            <div className="ml-auto">
              <SegToggle
                value={mode}
                onChange={setMode}
                options={modes.map((m) => ({ value: m, label: m === 'table' ? 'Table' : m === 'board' ? 'Board' : 'Calendar', icon: m === 'table' ? 'ti-table' : m === 'board' ? 'ti-layout-kanban' : 'ti-calendar' }))}
              />
            </div>
          )}
        </div>
      )}
      {tabsSpec && (
        <Tabs
          value={tab}
          onChange={setTab}
          tabs={['All', ...tabsSpec.values].map((v) => ({
            value: v,
            label: v,
            count: v === 'All' ? applyFilter(allRows, baseFilter).length : applyFilter(allRows, baseFilter).filter((row) => String(row[tabsSpec.field]) === v).length,
          }))}
        />
      )}

      {mode === 'board' && view.type === 'register' ? (
        <BoardBody entity={entity} rows={rows} field={view.boardField ?? 'status'} onOpen={(row) => navigate(`${r.base}/${row.id}`)} />
      ) : mode === 'calendar' && view.type === 'register' ? (
        <MonthCalendar entity={entity} rows={rows} dateField={view.dateField ?? entity.fields.find((f) => f.type === 'date')?.key ?? 'date'} onOpen={(row) => navigate(`${r.base}/${row.id}`)} />
      ) : (
        <DataTable
          key={`${entity.id}-${highlight ?? ''}`}
          rows={rows}
          columns={columns}
          getId={(row) => row.id}
          onRowClick={(row) => navigate(`${r.base}/${row.id}`)}
          onView={(row) => navigate(`${r.base}/${row.id}`)}
          onEdit={openEdit}
          onDelete={(ids) => {
            remove(entity.id, ids);
            toast.success(`${ids.length} record(s) deleted`, `${entity.plural} register updated.`);
          }}
          rowMenu={rowMenu}
          addLabel={`Add ${entity.label}`}
          onAdd={openCreate}
          exportName={title}
          initialSort={highlight ? { key: highlight, dir: hField && (hField.type === 'currency' || hField.type === 'number' || hField.type === 'percent') ? 'desc' : 'asc' } : undefined}
        />
      )}

      <RecordModal
        entity={entity}
        open={modal.open}
        onOpenChange={(v) => setModal((m) => ({ ...m, open: v }))}
        initial={modal.row}
        prefill={baseFilter}
      />
    </div>
  );
}

export type { EntityDef };
