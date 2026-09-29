import { Fragment } from 'react';
import { Link } from 'react-router-dom';
import { getApp } from '@/config/registry';
import type { ChartSpec, KpiSpec, RailSpec } from '@/config/types';
import { Chart } from '@/components/Chart';
import { Menu } from '@/components/overlays';
import { Button, Icon, KpiCard, PageTitle, Panel } from '@/components/ui';
import { toast } from '@/mock/toast';
import { Breadcrumbs, PageBody, Shell } from '@/shell/Layout';
import { RailPanel } from '@/templates/Dashboard';

const LIFECYCLE: string[][] = [['crm'], ['tender', 'land'], ['estimation'], ['project'], ['procurement'], ['store'], ['site'], ['workforce', 'equipment', 'subcontract'], ['contracts'], ['billing'], ['finance'], ['quality-and-safety'], ['variations', 'claims'], ['handover'], ['reporting']];

const KPIS: KpiSpec[] = [
  { label: 'Active Projects', value: '8', delta: '+2', up: true, icon: 'ti-building-skyscraper', progress: 80, sub: '5 on track · 2 at risk · 1 delayed' },
  { label: 'Total Contract Value', value: '₹ 320 Cr', delta: '+8%', up: true, icon: 'ti-file-certificate', progress: 64 },
  { label: 'Revenue (Billed)', value: '₹ 214.5 Cr', delta: '+11%', up: true, icon: 'ti-trending-up', progress: 67 },
  { label: 'Cost Incurred', value: '₹ 186 Cr', delta: '+12%', up: true, good: false, icon: 'ti-coins', progress: 58 },
  { label: 'Gross Profit', value: '₹ 28.5 Cr', delta: '13.3%', up: true, icon: 'ti-chart-pie', sub: 'Margin on billed revenue' },
  { label: 'Receivables', value: '₹ 38.4 Cr', delta: '-4%', up: false, good: true, icon: 'ti-cash', sub: '₹ 6.1 Cr overdue > 90 days' },
  { label: 'Payables', value: '₹ 21.7 Cr', delta: '+3%', up: true, good: false, icon: 'ti-receipt', sub: '₹ 4.8 Cr due this week' },
  { label: 'Workforce', value: '1,842', delta: '+64', up: true, icon: 'ti-users', sub: '312 staff · 1,530 workers' },
  { label: 'Active Sites', value: '8', icon: 'ti-map-pin', sub: '4 states · 1,717 on site today' },
  { label: 'Open Claims', value: '6', delta: '₹ 14.2 Cr', up: true, good: false, icon: 'ti-scale', sub: '2 under negotiation' },
  { label: 'Open Variations', value: '11', delta: '₹ 9.8 Cr', up: true, icon: 'ti-arrows-exchange', sub: '4 awaiting client approval' },
  { label: 'Safety Incidents (MTD)', value: '3', delta: '-2', up: false, good: true, icon: 'ti-first-aid-kit', sub: '0 lost-time incidents' },
];

const SHORT = ['Skyline', 'Riverside', 'Greenfield', 'Metro Tower', 'Lakeview', 'Orbit TP', 'Harbour View', 'Sunrise'];
const MONTHS = ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'];

const CHARTS: ChartSpec[] = [
  { title: 'Project Progress — Planned vs Actual', kind: 'bar', categories: SHORT, series: [{ name: 'Planned', data: [72, 52, 45, 58, 36, 95, 90, 80] }, { name: 'Actual', data: [68, 45, 32, 55, 28, 92, 84, 76] }], unit: '%', span: 2 },
  { title: 'Revenue vs Cost (₹ Cr)', kind: 'barline', categories: MONTHS, series: [{ name: 'Revenue', data: [16.2, 18.9, 21.4, 19.8, 24.6, 26.1], type: 'bar' }, { name: 'Cost', data: [14.1, 16.8, 18.2, 17.9, 21.0, 22.7], type: 'line' }], unit: '₹Cr' },
  { title: 'Budget vs Actual by Cost Head (₹ Cr)', kind: 'bar', categories: ['Material', 'Labour', 'Subcontract', 'Equipment', 'Overheads'], series: [{ name: 'Budget', data: [82, 46, 38, 22, 18] }, { name: 'Actual', data: [78, 49, 35, 21, 16] }], unit: '₹Cr' },
  { title: 'Project Profitability (Gross Margin %)', kind: 'hbar', categories: SHORT, series: [{ name: 'Margin', data: [14.2, 11.8, 6.4, 13.1, 9.2, 16.8, 8.9, 12.5] }], unit: '%' },
  { title: 'Procurement Spend by Category', kind: 'donut', categories: ['Steel', 'Cement & RMC', 'Aggregates', 'MEP', 'Finishes', 'Others'], series: [{ name: 'Spend (₹ Cr)', data: [22.4, 18.6, 6.2, 9.8, 7.1, 5.4] }], unit: '₹Cr' },
  { title: 'Workforce Trend', kind: 'area', categories: MONTHS, series: [{ name: 'Workers', data: [1320, 1385, 1410, 1462, 1498, 1530] }, { name: 'Staff', data: [288, 294, 298, 305, 309, 312] }] },
  { title: 'Receivables Ageing (₹ Cr)', kind: 'bar', categories: ['0–30 days', '31–60 days', '61–90 days', '> 90 days'], series: [{ name: 'Outstanding', data: [17.6, 9.3, 5.4, 6.1] }], unit: '₹Cr' },
];

const OVERVIEWS: { title: string; app: string; rows: [string, string][] }[] = [
  { title: 'Business Overview', app: 'crm', rows: [['Pipeline value', '₹ 412 Cr'], ['Tenders in progress', '7'], ['Win rate (FY)', '34%']] },
  { title: 'Project Overview', app: 'project', rows: [['Overall progress', '56%'], ['Milestones due (30 d)', '6'], ['Open issues / risks', '14 / 9']] },
  { title: 'Financial Overview', app: 'finance', rows: [['Cash & bank', '₹ 18.9 Cr'], ['Net cash flow (Sep)', '₹ 3.4 Cr'], ['Working capital', '₹ 16.7 Cr']] },
  { title: 'Procurement Overview', app: 'procurement', rows: [['Open POs', '42 · ₹ 26.8 Cr'], ['Pending PRs', '17'], ['Deliveries delayed', '5']] },
  { title: 'Workforce Overview', app: 'workforce', rows: [['Attendance today', '93.4%'], ['Overtime (Sep)', '4,860 hrs'], ['Payroll (Sep)', '₹ 6.42 Cr']] },
  { title: 'Site Overview', app: 'site', rows: [['DPRs submitted today', '7 of 8'], ['Open site issues', '12'], ['Equipment utilisation', '76%']] },
  { title: 'Contract Overview', app: 'contracts', rows: [['Active contracts', '8 · ₹ 320 Cr'], ['Guarantees expiring (60 d)', '2'], ['Obligations due', '5']] },
  { title: 'Billing Overview', app: 'billing', rows: [['RA bills pending certification', '4'], ['Billed this month', '₹ 26.1 Cr'], ['Retention held', '₹ 10.7 Cr']] },
  { title: 'Quality & Safety Overview', app: 'quality-and-safety', rows: [['Inspections passed', '91%'], ['Open NCRs', '8'], ['Safe man-hours', '1.26 M']] },
];

const RAIL: RailSpec[] = [
  {
    kind: 'list',
    title: 'Pending Approvals',
    items: [
      { title: 'RA Bill RA-07 · Skyline Apartments', sub: '₹ 2.84 Cr · Billing', status: 'Pending Approval' },
      { title: 'PO-014 · Shree Balaji Steel Traders', sub: '₹ 48.6 L · Procurement', status: 'Pending Approval' },
      { title: 'Variation VO-005 · Metro Office Tower', sub: '₹ 1.12 Cr · Variations', status: 'Under Review' },
      { title: 'Budget revision R2 · Greenfield Township', sub: '+₹ 3.4 Cr · Project', status: 'Pending' },
    ],
  },
  {
    kind: 'list',
    title: 'Alerts & Risks',
    items: [
      { title: 'Greenfield Township 18 days behind schedule', sub: 'Critical path: Superstructure', status: 'Delayed' },
      { title: 'Steel price up 6.2% vs estimate', sub: 'Impact ₹ 1.9 Cr across 3 projects', status: 'At Risk' },
      { title: 'Performance guarantee expiring', sub: 'CON-003 · in 21 days', status: 'Expiring Soon' },
      { title: 'Receivables > 90 days', sub: 'Lakeview Estates · ₹ 3.2 Cr', status: 'Overdue' },
    ],
  },
  {
    kind: 'dates',
    title: 'Upcoming Milestones',
    items: [
      { date: '2026-10-05', title: 'Structure completion', sub: 'Riverside Villas' },
      { date: '2026-10-12', title: 'MEP installation', sub: 'Metro Office Tower' },
      { date: '2026-10-20', title: 'Internal finishing', sub: 'Skyline Apartments' },
      { date: '2026-10-28', title: 'Client inspection', sub: 'Orbit Tech Park Phase II' },
    ],
  },
  {
    kind: 'list',
    title: 'Recent Activities',
    items: [
      { avatar: 'Ravi Kumar K', title: 'Ravi K approved material request', sub: 'Riverside Villas', meta: '2 hours ago' },
      { avatar: 'Sneha P', title: 'Sneha P updated project progress', sub: 'Metro Office Tower', meta: '4 hours ago' },
      { avatar: 'Divya T', title: 'Divya T added a new document', sub: 'Greenfield Township', meta: '5 hours ago' },
      { avatar: 'Arun S', title: 'Arun S created a new project', sub: 'Lakeview Residency', meta: '1 day ago' },
    ],
  },
];

export function EnterpriseDashboard() {
  return (
    <Shell>
      <Breadcrumbs items={[{ label: 'Enterprise Dashboard' }]} />
      <PageBody>
        <PageTitle
          icon="ti-layout-dashboard"
          title="Enterprise Dashboard"
          subtitle="Company-wide view across all 19 applications · data as on 29 Sep 2026, 09:30"
          actions={
            <>
              <Menu trigger={<Button icon="ti-calendar" iconRight="ti-chevron-down">FY 2026-27 · YTD</Button>} items={['This Month', 'Last Quarter', 'FY 2026-27 · YTD', 'FY 2025-26'].map((p) => ({ label: p, onSelect: () => toast.info('Period changed', p) }))} />
              <Button icon="ti-download" onClick={() => toast.success('Dashboard exported', 'Enterprise Dashboard.pdf')}>
                Export
              </Button>
            </>
          }
        />

        <Panel title="Construction Lifecycle" actions={<span className="text-ink-3">Click a stage to open the application</span>} bodyClass="p-2.5">
          <div className="flex items-stretch gap-1 overflow-x-auto pb-1">
            {LIFECYCLE.map((stage, i) => (
              <Fragment key={i}>
                <div className="hair flex min-w-[124px] flex-1 flex-col gap-1 rounded-md border-line bg-bg-2 p-1.5">
                  <span className="flex h-4 w-4 items-center justify-center rounded-full bg-navy text-[9px] font-bold text-white">{i + 1}</span>
                  {stage.map((id) => {
                    const a = getApp(id);
                    if (!a) return null;
                    return (
                      <Link key={id} to={`/${id}`} className="flex items-center gap-1.5 rounded-sm px-1 py-0.5 text-xs text-ink hover:bg-blue-tint hover:text-navy" title={a.description}>
                        <Icon name={a.icon} className="text-[14px] text-blue" />
                        <span className="truncate">{a.name}</span>
                      </Link>
                    );
                  })}
                </div>
                {i < LIFECYCLE.length - 1 && (
                  <div className="flex items-center text-blue-line">
                    <Icon name="ti-chevron-right" className="text-[14px]" />
                  </div>
                )}
              </Fragment>
            ))}
          </div>
        </Panel>

        <div className="grid grid-cols-2 gap-2.5 md:grid-cols-3 xl:grid-cols-6">
          {KPIS.map((k) => (
            <KpiCard key={k.label} {...k} />
          ))}
        </div>

        <div className="grid grid-cols-1 gap-3.5 xl:grid-cols-[1fr_320px]">
          <div className="flex min-w-0 flex-col gap-3.5">
            <div className="grid grid-cols-1 gap-3.5 lg:grid-cols-2">
              {CHARTS.map((c) => (
                <Panel key={c.title} title={c.title} className={c.span === 2 ? 'lg:col-span-2' : ''}>
                  <Chart spec={c} />
                </Panel>
              ))}
            </div>
            <div className="grid grid-cols-1 gap-3.5 md:grid-cols-2 2xl:grid-cols-3">
              {OVERVIEWS.map((o) => {
                const a = getApp(o.app);
                return (
                  <Panel
                    key={o.title}
                    title={o.title}
                    actions={
                      <Link to={`/${o.app}`} className="flex items-center gap-1 text-blue hover:underline">
                        Open {a?.name} <Icon name="ti-arrow-right" className="text-[12px]" />
                      </Link>
                    }
                    bodyClass="p-0"
                  >
                    <dl className="divide-y divide-line">
                      {o.rows.map(([k, v]) => (
                        <div key={k} className="flex items-center justify-between px-3.5 py-2 text-sm">
                          <dt className="text-ink-2">{k}</dt>
                          <dd className="font-semibold text-ink tabular-nums">{v}</dd>
                        </div>
                      ))}
                    </dl>
                  </Panel>
                );
              })}
            </div>
          </div>
          <div className="flex min-w-0 flex-col gap-3.5">
            {RAIL.map((r) => (
              <RailPanel key={r.title} rail={r} />
            ))}
          </div>
        </div>
      </PageBody>
    </Shell>
  );
}
