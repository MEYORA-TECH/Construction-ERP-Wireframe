import { Fragment } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getEntity, listFields, registerPathFor } from '@/config/registry';
import type { AppConfig, DashboardSpec, RailSpec } from '@/config/types';
import { Chart } from '@/components/Chart';
import { DataTable } from '@/components/DataTable';
import { FieldValue } from '@/components/fields';
import { Menu } from '@/components/overlays';
import { Avatar, Button, CodeChip, Icon, KpiCard, PageTitle, Panel, StatusBadge } from '@/components/ui';
import { PhotoTile } from '@/components/widgets';
import { cn } from '@/lib/cn';
import { formatDayMonth } from '@/lib/format';
import { useRows } from '@/mock/store';
import { toast } from '@/mock/toast';
import { TONE_CLASSES } from '@/theme/status';

const HEALTH_ICON = { green: 'ti-circle-check', yellow: 'ti-alert-triangle', red: 'ti-clock-exclamation', blue: 'ti-progress-check', gray: 'ti-circle-dashed' } as const;

export function FlowStrip({ flow }: { flow: NonNullable<DashboardSpec['flow']> }) {
  return (
    <div className="hair flex items-stretch overflow-x-auto rounded-md border-line bg-bg">
      {flow.map((f, i) => (
        <Fragment key={f.label}>
          <div className="flex min-w-[140px] flex-1 items-center gap-2.5 px-3.5 py-2.5">
            <span className="flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full bg-navy text-2xs font-bold text-white">{i + 1}</span>
            <div className="min-w-0">
              <div className="truncate text-2xs text-ink-3 uppercase">{f.label}</div>
              <div className="text-md font-semibold text-ink">{f.value}</div>
            </div>
          </div>
          {i < flow.length - 1 && (
            <div className="flex items-center text-blue-line">
              <Icon name="ti-chevron-right" className="text-[18px]" />
            </div>
          )}
        </Fragment>
      ))}
    </div>
  );
}

export function RailPanel({ rail }: { rail: RailSpec }) {
  if (rail.kind === 'health') {
    return (
      <Panel title={rail.title} bodyClass="p-2">
        <ul>
          {rail.items.map((it) => (
            <li key={it.label} className="flex items-center gap-2.5 rounded-sm px-2 py-1.5 hover:bg-bg-2">
              <span className={cn('flex h-6 w-6 items-center justify-center rounded-sm', TONE_CLASSES[it.tone])}>
                <Icon name={HEALTH_ICON[it.tone]} className="text-[13px]" />
              </span>
              <span className="flex-1 text-sm text-ink">{it.label}</span>
              <span className={cn('text-sm font-semibold', it.tone === 'red' ? 'text-bad' : it.tone === 'yellow' ? 'text-warn' : it.tone === 'green' ? 'text-ok' : 'text-blue')}>{it.value}</span>
            </li>
          ))}
        </ul>
      </Panel>
    );
  }
  if (rail.kind === 'dates') {
    return (
      <Panel title={rail.title} bodyClass="p-2">
        <ul className="relative">
          {rail.items.map((it, i) => {
            const { day, month } = formatDayMonth(it.date);
            return (
              <li key={i} className="flex items-center gap-3 px-2 py-1.5">
                <span className={cn('h-2.5 w-2.5 shrink-0 rounded-full border-2', it.done ? 'border-navy bg-navy' : i === 0 ? 'border-blue bg-blue' : 'border-line-2 bg-bg')} />
                <span className="hair flex w-10 shrink-0 flex-col items-center rounded-sm border-line py-0.5 leading-tight">
                  <span className="text-sm font-semibold text-ink">{day}</span>
                  <span className="text-2xs text-ink-3">{month}</span>
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium text-ink">{it.title}</span>
                  {it.sub && <span className="block truncate text-xs text-ink-3">{it.sub}</span>}
                </span>
              </li>
            );
          })}
        </ul>
      </Panel>
    );
  }
  return (
    <Panel title={rail.title} bodyClass="p-2">
      <ul>
        {rail.items.map((it, i) => (
          <li key={i} className="flex items-start gap-2.5 rounded-sm px-2 py-1.5 hover:bg-bg-2">
            {it.avatar ? <Avatar name={it.avatar} size={28} /> : <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-blue" />}
            <span className="min-w-0 flex-1">
              <span className="block text-sm text-ink">{it.title}</span>
              {it.sub && <span className="block truncate text-xs text-ink-3">{it.sub}</span>}
            </span>
            <span className="flex shrink-0 flex-col items-end gap-1">
              {it.status && <StatusBadge value={it.status} />}
              {it.meta && <span className="text-2xs whitespace-nowrap text-ink-3">{it.meta}</span>}
            </span>
          </li>
        ))}
      </ul>
    </Panel>
  );
}

function TableSnippet({ spec, appId }: { spec: NonNullable<DashboardSpec['table']>; appId: string }) {
  const entity = getEntity(spec.entity);
  const rows = useRows(entity.id).slice(0, spec.limit ?? 6);
  const navigate = useNavigate();
  const base = registerPathFor(entity.id) ?? `/${appId}`;
  const fields = spec.columns ? spec.columns.map((k) => entity.fields.find((f) => f.key === k)).filter((f): f is NonNullable<typeof f> => !!f) : listFields(entity).slice(0, 6);
  return (
    <Panel title={spec.title} actions={<Link to={base} className="text-blue hover:underline">View All</Link>} bodyClass="p-0">
      <DataTable
        bare
        srNo={false}
        selectable={false}
        rows={rows}
        getId={(r) => r.id}
        onRowClick={(r) => navigate(`${base}/${r.id}`)}
        columns={[
          { key: 'code', label: 'Code', render: (r) => <CodeChip>{r.id}</CodeChip> },
          ...fields.map((f) => ({ key: f.key, label: f.label, align: (f.type === 'currency' ? 'right' : 'left') as 'right' | 'left', render: (r: Record<string, unknown>) => <FieldValue field={f} value={r[f.key]} /> })),
        ]}
        rowMenu={(r) => [
          { label: 'Open', icon: 'ti-external-link', onSelect: () => navigate(`${base}/${r.id}`) },
          { label: 'Edit', icon: 'ti-edit', onSelect: () => navigate(`${base}/${r.id}/edit`) },
        ]}
      />
    </Panel>
  );
}

export function DashboardBody({ spec, appId }: { spec: DashboardSpec; appId: string }) {
  const hasRail = !!spec.rail?.length;
  const kpiCols = spec.kpis.length >= 6 ? 'lg:grid-cols-6' : spec.kpis.length === 5 ? 'lg:grid-cols-5' : 'lg:grid-cols-4';
  return (
    <div className="flex flex-col gap-3.5">
      {spec.flow && <FlowStrip flow={spec.flow} />}
      <div className={cn('grid grid-cols-2 gap-2.5 md:grid-cols-3', kpiCols)}>
        {spec.kpis.map((k) => (
          <KpiCard key={k.label} {...k} />
        ))}
      </div>
      <div className={cn('grid grid-cols-1 gap-3.5', hasRail && 'xl:grid-cols-[1fr_320px]')}>
        <div className="flex min-w-0 flex-col gap-3.5">
          <div className="grid grid-cols-1 gap-3.5 lg:grid-cols-2">
            {spec.charts.map((c) => (
              <Panel key={c.title} title={c.title} className={cn(c.span && c.span >= 2 && 'lg:col-span-2')} actions={c.subtitle && <span className="text-ink-3">{c.subtitle}</span>}>
                <Chart spec={c} />
              </Panel>
            ))}
          </div>
          {spec.table && <TableSnippet spec={spec.table} appId={appId} />}
          {spec.updates && (
            <Panel title="Recent Site Updates" actions={<span className="text-ink-3">Last 7 days</span>} bodyClass="p-2.5">
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 2xl:grid-cols-4">
                {spec.updates.map((u, i) => (
                  <PhotoTile key={u.title + i} title={u.title} sub={u.sub} date={u.date} seed={i} onClick={() => toast.info(u.title, u.sub)} />
                ))}
              </div>
            </Panel>
          )}
        </div>
        {hasRail && (
          <div className="flex min-w-0 flex-col gap-3.5">
            {spec.rail!.map((r) => (
              <RailPanel key={r.title} rail={r} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function AppDashboard({ app }: { app: AppConfig }) {
  return (
    <div className="flex flex-col gap-3.5">
      <PageTitle
        icon={app.icon}
        title={`${app.name} Dashboard`}
        subtitle={app.description}
        actions={
          <>
            <Menu
              trigger={<Button icon="ti-calendar" iconRight="ti-chevron-down">FY 2026-27 · YTD</Button>}
              items={['This Month', 'Last Quarter', 'FY 2026-27 · YTD', 'FY 2025-26'].map((p) => ({ label: p, onSelect: () => toast.info('Period changed', p) }))}
            />
            <Button icon="ti-download" onClick={() => toast.success('Dashboard exported', `${app.name} Dashboard.pdf`)}>
              Export
            </Button>
            <Button icon="ti-refresh" onClick={() => toast.success('Dashboard refreshed', 'Data as on 29 Sep 2026, 09:30')}>
              Refresh
            </Button>
          </>
        }
      />
      <DashboardBody spec={app.dashboard} appId={app.id} />
    </div>
  );
}
