import { Fragment, useState } from 'react';
import type { Resolved } from '@/config/registry';
import type { ChartSpec, TableSpec, ViewSpec } from '@/config/types';
import { Chart } from '@/components/Chart';
import { DataTable } from '@/components/DataTable';
import { SelectInput } from '@/components/fields';
import { Menu } from '@/components/overlays';
import { Button, CodeChip, KpiCard, Panel, StatusBadge } from '@/components/ui';
import { cn } from '@/lib/cn';
import { formatDate, formatINR, formatNumber } from '@/lib/format';
import { useRows } from '@/mock/store';
import { toast } from '@/mock/toast';

export function ChartGrid({ charts }: { charts: ChartSpec[] }) {
  return (
    <div className="grid grid-cols-1 gap-3.5 lg:grid-cols-3">
      {charts.map((c) => (
        <Panel key={c.title} title={c.title} className={cn(c.span === 3 ? 'lg:col-span-3' : c.span === 2 ? 'lg:col-span-2' : '')} actions={c.subtitle && <span className="text-ink-3">{c.subtitle}</span>}>
          <Chart spec={c} />
        </Panel>
      ))}
    </div>
  );
}

export function SpecTable({ table }: { table: TableSpec }) {
  return (
    <Panel title={table.title} bodyClass="p-3">
      <DataTable
        rows={table.rows.map((row, i) => ({ ...row, id: String(row.id ?? i) }))}
        getId={(row) => String(row.id)}
        selectable={false}
        exportName={table.title}
        columns={table.columns.map((c) => ({
          key: c.key,
          label: c.label,
          align: c.type === 'currency' || c.type === 'number' || c.type === 'percent' ? 'right' : 'left',
          value: (row: Record<string, string | number>) => row[c.key],
          render: (row: Record<string, string | number>) => {
            const v = row[c.key];
            if (c.type === 'currency') return formatINR(v);
            if (c.type === 'number') return formatNumber(v);
            if (c.type === 'percent') return `${v}%`;
            if (c.type === 'status') return <StatusBadge value={v} />;
            if (c.type === 'date') return formatDate(v);
            if (c.type === 'code') return <CodeChip>{v}</CodeChip>;
            return String(v ?? '—');
          },
        }))}
      />
    </Panel>
  );
}

export function FilterBar({ onApply }: { onApply?: () => void }) {
  const projects = useRows('project');
  const [range, setRange] = useState('FY 2026-27 YTD');
  const [project, setProject] = useState('');
  return (
    <div className="hair flex flex-wrap items-end gap-2.5 rounded-md border-line bg-bg-2 px-3.5 py-2.5">
      <div className="w-48">
        <div className="field-label mb-1">Period</div>
        <SelectInput value={range} onChange={(e) => setRange(e.target.value)} options={['This Month', 'Last Quarter', 'FY 2026-27 YTD', 'FY 2025-26', 'Custom Range'].map((x) => ({ value: x, label: x }))} placeholder="Period" />
      </div>
      <div className="w-64">
        <div className="field-label mb-1">Project</div>
        <SelectInput value={project} onChange={(e) => setProject(e.target.value)} options={projects.map((p) => ({ value: p.id, label: `${p.id} — ${p.name}` }))} placeholder="All projects" />
      </div>
      <div className="w-44">
        <div className="field-label mb-1">Group By</div>
        <SelectInput value="Month" onChange={() => undefined} options={['Month', 'Quarter', 'Project', 'Site'].map((x) => ({ value: x, label: x }))} placeholder="Month" />
      </div>
      <Button variant="primary" icon="ti-filter" onClick={() => { onApply?.(); toast.success('Filters applied', `${range}${project ? ` · ${project}` : ' · All projects'}`); }}>
        Apply
      </Button>
      <div className="flex-1" />
      <Menu trigger={<Button icon="ti-download" iconRight="ti-chevron-down">Export</Button>} items={['Excel (.xlsx)', 'PDF', 'PowerPoint'].map((x) => ({ label: x, onSelect: () => toast.success('Report exported', x) }))} />
      <Button icon="ti-calendar-repeat" onClick={() => toast.success('Report scheduled', 'Every Monday 08:00 to management@company.in')}>
        Schedule
      </Button>
    </div>
  );
}

export function AnalysisView({ view }: { r: Resolved; view: Extract<ViewSpec, { type: 'analysis' }> }) {
  return (
    <div className="flex flex-col gap-3.5">
      <FilterBar />
      <div className={cn('grid grid-cols-2 gap-2.5', view.kpis.length >= 5 ? 'lg:grid-cols-5' : 'lg:grid-cols-4')}>
        {view.kpis.map((k) => (
          <Fragment key={k.label}>
            <KpiCard {...k} />
          </Fragment>
        ))}
      </div>
      <ChartGrid charts={view.charts} />
      {view.table && <SpecTable table={view.table} />}
    </div>
  );
}
