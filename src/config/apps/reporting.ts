import { group, page } from '../dsl';
import type { AppConfig } from '../types';

/* ─────────── Enterprise figures (single source of truth for this analytics layer) ─────────── */
const CR = 1e7;
const P8 = ['Skyline', 'Riverside', 'Greenfield', 'Metro Tower', 'Lakeview', 'Orbit TP', 'Harbour View', 'Sunrise'];
const PROJ = ['Skyline Apartments', 'Riverside Villas', 'Greenfield Township', 'Metro Office Tower', 'Lakeview Residency', 'Orbit Tech Park Phase II', 'Harbour View Hospital', 'Sunrise Business Hotel'];
const CLIENT = ['ABC Builders Pvt Ltd', 'XYZ Developers', 'Greenfield Infra Ltd', 'Metro Constructions', 'Lakeview Estates', 'Orbit Tech Parks', 'Coastal Healthcare Trust', 'Sunrise Hospitality'];
const STATUS = ['On Track', 'On Track', 'Delayed', 'On Track', 'At Risk', 'On Track', 'At Risk', 'On Track'];
const MONTHS = ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'];

const TCV = [85, 42, 58, 64, 28, 18, 15, 10]; // 320
const COST = [52, 22, 24, 40, 10, 17, 13, 8]; // 186
const REV = [62.4, 25.0, 27.3, 46.7, 11.4, 17.9, 14.6, 9.2]; // 214.5
const GP = [10.4, 3.0, 3.3, 6.7, 1.4, 0.9, 1.6, 1.2]; // 28.5
const MARGIN = [16.7, 12.0, 12.1, 14.3, 12.3, 5.0, 11.0, 13.0];
const PLAN = [72, 52, 45, 58, 36, 95, 90, 80];
const ACT = [68, 45, 32, 55, 28, 92, 84, 76];
const BUDGET = [73.1, 36.1, 49.9, 55.0, 24.1, 15.5, 12.9, 8.6]; // 275.2
const COMMITTED = [58.6, 25.4, 29.8, 44.9, 10.1, 17.6, 13.4, 8.6]; // 208.4
const EAC = [74.6, 36.4, 50.6, 56.3, 23.0, 17.9, 13.9, 8.9]; // 281.6
const REVISED_TCV = [88.2, 42.9, 60.4, 66.1, 28.6, 18.4, 15.8, 10.3]; // 330.7
const M_REV = [16.2, 18.9, 21.4, 19.8, 24.6, 26.1]; // 127.0 YTD
const M_COST = [14.1, 16.8, 18.2, 17.9, 21.0, 22.7]; // 110.7 YTD
const M_IN = [14.8, 17.2, 19.6, 18.1, 22.4, 24.3]; // 116.4 collections
const M_OUT = [13.9, 16.4, 18.9, 17.2, 20.8, 22.1]; // 109.3 payments
const M_CLOSE = [6.4, 7.2, 7.9, 8.8, 10.4, 12.6]; // opening Apr ₹ 5.5 Cr
const SPEND_CAT = ['Steel', 'Cement & RMC', 'Aggregates', 'MEP', 'Finishes', 'Others'];
const SPEND = [22.4, 18.6, 6.2, 9.8, 7.1, 5.4]; // 69.5
const WORKERS = [412, 186, 264, 338, 142, 96, 58, 34]; // 1,530
const STAFF = [64, 32, 46, 52, 28, 22, 18, 14]; // 276 + 36 HO = 312
const OT = [1280, 520, 690, 1040, 380, 460, 330, 160]; // 4,860 hrs

const cr = (v: number) => Math.round(v * 100) * (CR / 100); // ₹ Cr → raw rupees
const round1 = (v: number) => Math.round(v * 10) / 10;

export const reportingApp: AppConfig = {
  id: 'reporting',
  name: 'Reporting',
  icon: 'ti-chart-histogram',
  description: 'Enterprise analytics — executive, project, procurement, workforce and finance reports across all projects',
  menus: [
    /* ═══════════════════════ Executive Dashboard ═══════════════════════ */
    group('Executive Dashboard', 'ti-presentation-analytics', [
      page('Revenue', {
        type: 'analysis',
        title: 'Revenue',
        kpis: [
          { label: 'Revenue billed (to date)', value: '₹ 214.5 Cr', progress: 67, icon: 'ti-currency-rupee', sub: 'of ₹ 320 Cr contract value' },
          { label: 'FY 2026-27 YTD revenue', value: '₹ 127.0 Cr', delta: '+18.4% YoY', up: true, icon: 'ti-trending-up' },
          { label: 'September revenue', value: '₹ 26.1 Cr', delta: '+6.1% MoM', up: true, icon: 'ti-calendar-stats' },
          { label: 'Unbilled order book', value: '₹ 105.5 Cr', icon: 'ti-file-text', sub: 'Excl. ₹ 10.7 Cr approved variations' },
          { label: 'Billing vs certification', value: '94%', progress: 94, icon: 'ti-receipt' },
        ],
        charts: [
          { title: 'Monthly Revenue vs Target (₹ Cr)', kind: 'barline', categories: MONTHS, series: [{ name: 'Revenue', data: M_REV, type: 'bar' }, { name: 'Target', data: [17.0, 19.0, 20.5, 22.0, 23.5, 25.0], type: 'line' }], unit: '₹Cr', span: 2 },
          { title: 'Revenue by Segment (to date)', kind: 'donut', categories: ['Residential', 'Township', 'Commercial', 'IT Park', 'Healthcare', 'Hospitality'], series: [{ name: '₹ Cr', data: [98.8, 27.3, 46.7, 17.9, 14.6, 9.2] }], unit: '₹Cr', subtitle: '₹ 214.5 Cr' },
          { title: 'Contract Value vs Revenue Billed by Project (₹ Cr)', kind: 'hbar', categories: P8, series: [{ name: 'Contract value', data: TCV }, { name: 'Billed', data: REV }], unit: '₹Cr', span: 2, height: 260 },
          { title: 'Contract Value Billed', kind: 'gauge', series: [{ name: 'Billed to date', data: [67] }], unit: '%' },
        ],
        table: {
          title: 'Revenue by Project',
          columns: [
            { key: 'code', label: 'Project No.', type: 'code' },
            { key: 'project', label: 'Project' },
            { key: 'client', label: 'Client' },
            { key: 'tcv', label: 'Contract Value', type: 'currency' },
            { key: 'billed', label: 'Billed to Date', type: 'currency' },
            { key: 'pct', label: '% Billed', type: 'percent' },
            { key: 'sep', label: 'Sep 2026 Billing', type: 'currency' },
            { key: 'unbilled', label: 'Unbilled', type: 'currency' },
          ],
          rows: PROJ.map((p, i) => ({
            code: `PRJ-00${i + 1}`,
            project: p,
            client: CLIENT[i],
            tcv: cr(TCV[i]),
            billed: cr(REV[i]),
            pct: round1((REV[i] / TCV[i]) * 100),
            sep: cr([7.2, 2.9, 3.6, 5.8, 1.9, 1.4, 1.9, 1.4][i]),
            unbilled: cr(round1(TCV[i] - REV[i])),
          })),
        },
      }),
      page('Profit', {
        type: 'analysis',
        title: 'Profit',
        kpis: [
          { label: 'Gross profit (to date)', value: '₹ 28.5 Cr', icon: 'ti-coins', sub: '13.3% gross margin' },
          { label: 'FY YTD gross profit', value: '₹ 16.3 Cr', delta: '12.8% margin', up: true, icon: 'ti-chart-line' },
          { label: 'September gross profit', value: '₹ 3.4 Cr', delta: '13.0% margin', up: true, icon: 'ti-calendar-stats' },
          { label: 'Highest margin', value: '16.7%', sub: 'Skyline Apartments', icon: 'ti-arrow-up-right' },
          { label: 'Lowest margin', value: '5.0%', sub: 'Orbit Tech Park Phase II', delta: '-4.2 pts vs budget', up: false, icon: 'ti-arrow-down-right' },
        ],
        charts: [
          { title: 'Monthly Revenue vs Cost (₹ Cr)', kind: 'area', categories: MONTHS, series: [{ name: 'Revenue', data: M_REV }, { name: 'Cost', data: M_COST }], unit: '₹Cr', span: 2 },
          { title: 'Gross Margin by Project (%)', kind: 'bar', categories: P8, series: [{ name: 'Margin', data: MARGIN }], unit: '%' },
          { title: 'Revenue Build-up — Cost Heads to Gross Profit (₹ Cr)', kind: 'waterfall', categories: ['Material', 'Labour', 'Subcontract', 'Equipment', 'Site overheads', 'Gross profit', 'Revenue'], series: [{ name: '₹ Cr', data: [70.7, 40.9, 33.5, 18.6, 22.3, 28.5, 0] }], unit: '₹Cr', span: 2 },
          { title: 'Profit Contribution by Project', kind: 'donut', categories: P8, series: [{ name: '₹ Cr', data: GP }], unit: '₹Cr', subtitle: '₹ 28.5 Cr' },
        ],
        table: {
          title: 'Monthly Profit Trend — FY 2026-27',
          columns: [
            { key: 'month', label: 'Month' },
            { key: 'revenue', label: 'Revenue', type: 'currency' },
            { key: 'cost', label: 'Cost', type: 'currency' },
            { key: 'gp', label: 'Gross Profit', type: 'currency' },
            { key: 'margin', label: 'Margin', type: 'percent' },
            { key: 'status', label: 'vs 12% Target', type: 'status' },
          ],
          rows: MONTHS.map((m, i) => {
            const gp = round1(M_REV[i] - M_COST[i]);
            const margin = round1((gp / M_REV[i]) * 100);
            return { month: `${m} 2026`, revenue: cr(M_REV[i]), cost: cr(M_COST[i]), gp: cr(gp), margin, status: margin >= 12 ? 'On Track' : 'At Risk' };
          }),
        },
      }),
      page('Active Projects', {
        type: 'analysis',
        title: 'Active Projects',
        kpis: [
          { label: 'Active projects', value: '8', icon: 'ti-building-skyscraper', sub: '5 on track · 2 at risk · 1 delayed' },
          { label: 'Total contract value', value: '₹ 320 Cr', icon: 'ti-file-text', sub: 'Revised ₹ 330.7 Cr with variations' },
          { label: 'Overall progress', value: '56%', progress: 56, icon: 'ti-chart-line', sub: 'Planned 61% (value-weighted)' },
          { label: 'Handovers due by Dec 2026', value: '6', icon: 'ti-key' },
          { label: 'Avg schedule slippage', value: '6.0 pts', delta: '+0.8 pts MoM', up: true, good: false, icon: 'ti-clock-exclamation' },
        ],
        charts: [
          { title: 'Project Health', kind: 'donut', categories: ['On Track', 'At Risk', 'Delayed'], series: [{ name: 'Projects', data: [5, 2, 1] }], tones: ['green', 'yellow', 'red'] },
          { title: 'Contract Value vs Cost Incurred (₹ Cr)', kind: 'bar', categories: P8, series: [{ name: 'Contract value', data: TCV }, { name: 'Cost incurred', data: COST }], unit: '₹Cr', span: 2 },
          { title: 'Projects by Completion Quarter', kind: 'bar', categories: ['Q3 FY27 (Oct–Dec 26)', 'Q4 FY27 (Jan–Mar 27)', 'Q1 FY28 (Apr–Jun 27)'], series: [{ name: 'Projects', data: [6, 1, 1] }] },
          { title: 'Portfolio by Project Type (₹ Cr contract value)', kind: 'hbar', categories: ['Residential', 'Commercial', 'Township', 'IT Park', 'Healthcare', 'Hospitality'], series: [{ name: 'Contract value', data: [155, 64, 58, 18, 15, 10] }], unit: '₹Cr', span: 2 },
        ],
        table: {
          title: 'Active Project Portfolio',
          columns: [
            { key: 'code', label: 'Project No.', type: 'code' },
            { key: 'project', label: 'Project' },
            { key: 'client', label: 'Client' },
            { key: 'tcv', label: 'Contract Value', type: 'currency' },
            { key: 'cost', label: 'Cost Incurred', type: 'currency' },
            { key: 'progress', label: 'Progress', type: 'percent' },
            { key: 'end', label: 'Completion', type: 'date' },
            { key: 'status', label: 'Status', type: 'status' },
          ],
          rows: PROJ.map((p, i) => ({
            code: `PRJ-00${i + 1}`,
            project: p,
            client: CLIENT[i],
            tcv: cr(TCV[i]),
            cost: cr(COST[i]),
            progress: ACT[i],
            end: ['2026-12-31', '2026-11-30', '2027-02-28', '2026-12-31', '2027-06-30', '2026-11-30', '2026-12-15', '2026-12-31'][i],
            status: STATUS[i],
          })),
        },
      }),
      page('Cash Flow', {
        type: 'analysis',
        title: 'Cash Flow — Executive Summary',
        kpis: [
          { label: 'Cash & bank balance', value: '₹ 12.6 Cr', delta: '+₹ 7.1 Cr since Apr', up: true, icon: 'ti-building-bank' },
          { label: 'Collections (FY YTD)', value: '₹ 116.4 Cr', icon: 'ti-arrow-down-left' },
          { label: 'Payments (FY YTD)', value: '₹ 109.3 Cr', icon: 'ti-arrow-up-right' },
          { label: 'Net cash flow (FY YTD)', value: '+₹ 7.1 Cr', delta: '+₹ 2.2 Cr in Sep', up: true, icon: 'ti-cash' },
          { label: 'Days sales outstanding', value: '54 days', delta: '-4 days', up: false, good: true, icon: 'ti-clock' },
        ],
        charts: [
          { title: 'Monthly Inflow vs Outflow (₹ Cr)', kind: 'barline', categories: MONTHS, series: [{ name: 'Inflow', data: M_IN, type: 'bar' }, { name: 'Outflow', data: M_OUT, type: 'bar' }, { name: 'Closing balance', data: M_CLOSE, type: 'line' }], unit: '₹Cr', span: 2 },
          { title: 'Outflow Mix — September', kind: 'donut', categories: ['Vendors', 'Subcontractors', 'Payroll', 'Overheads & others'], series: [{ name: '₹ Cr', data: [9.8, 5.1, 6.4, 0.8] }], unit: '₹Cr', subtitle: '₹ 22.1 Cr' },
        ],
        table: {
          title: 'Cash Flow Summary — FY 2026-27',
          columns: [
            { key: 'month', label: 'Month' },
            { key: 'opening', label: 'Opening', type: 'currency' },
            { key: 'inflow', label: 'Inflow', type: 'currency' },
            { key: 'outflow', label: 'Outflow', type: 'currency' },
            { key: 'net', label: 'Net Flow', type: 'currency' },
            { key: 'closing', label: 'Closing', type: 'currency' },
          ],
          rows: MONTHS.map((m, i) => ({
            month: `${m} 2026`,
            opening: cr(i === 0 ? 5.5 : M_CLOSE[i - 1]),
            inflow: cr(M_IN[i]),
            outflow: cr(M_OUT[i]),
            net: cr(round1(M_IN[i] - M_OUT[i])),
            closing: cr(M_CLOSE[i]),
          })),
        },
      }),
    ]),

    /* ═══════════════════════ Project Reports ═══════════════════════ */
    group('Project Reports', 'ti-building-skyscraper', [
      page('Project Progress', {
        type: 'analysis',
        title: 'Project Progress Report',
        kpis: [
          { label: 'Overall physical progress', value: '56%', progress: 56, icon: 'ti-chart-line', sub: 'Planned 61%' },
          { label: 'Projects > 5 pts behind plan', value: '4 of 8', icon: 'ti-alert-triangle', sub: 'Riverside · Greenfield · Lakeview · Harbour View' },
          { label: 'Milestones achieved (FY)', value: '23 / 29', progress: 79, icon: 'ti-flag-check' },
          { label: 'Activities completed (Sep)', value: '186', delta: '+22 vs Aug', up: true, icon: 'ti-checklist' },
          { label: 'Portfolio SPI', value: '0.92', delta: '+0.02', up: true, icon: 'ti-gauge' },
        ],
        charts: [
          { title: 'Planned vs Actual Progress by Project (%)', kind: 'bar', categories: P8, series: [{ name: 'Planned', data: PLAN }, { name: 'Actual', data: ACT }], unit: '%', span: 2 },
          { title: 'Overall Physical Progress', kind: 'gauge', series: [{ name: 'Actual vs 61% planned', data: [56] }], unit: '%' },
          { title: 'Portfolio S-Curve — Planned vs Actual (%)', kind: 'line', categories: MONTHS, series: [{ name: 'Planned', data: [40, 44, 48, 52, 57, 61] }, { name: 'Actual', data: [37, 41, 44, 48, 52, 56] }], unit: '%', span: 2 },
          { title: 'Progress Gap (planned − actual, pts)', kind: 'hbar', categories: P8, series: [{ name: 'Gap', data: PLAN.map((p, i) => p - ACT[i]) }] },
        ],
        table: {
          title: 'Progress Status by Project',
          columns: [
            { key: 'project', label: 'Project' },
            { key: 'planned', label: 'Planned', type: 'percent' },
            { key: 'actual', label: 'Actual', type: 'percent' },
            { key: 'gap', label: 'Gap (pts)', type: 'number' },
            { key: 'spi', label: 'SPI', type: 'number' },
            { key: 'stage', label: 'Current Stage' },
            { key: 'status', label: 'Status', type: 'status' },
          ],
          rows: PROJ.map((p, i) => ({
            project: p,
            planned: PLAN[i],
            actual: ACT[i],
            gap: PLAN[i] - ACT[i],
            spi: Math.round((ACT[i] / PLAN[i]) * 100) / 100,
            stage: ['Tower A frame / finishes', 'Villa superstructure', 'Phase 2 foundations', 'Superstructure L9', 'Substructure', 'MEP testing & handover', 'Interior fit-out', 'Façade & finishes'][i],
            status: STATUS[i],
          })),
        },
      }),
      page('Project Cost', {
        type: 'analysis',
        title: 'Project Cost Report',
        kpis: [
          { label: 'Cost incurred (to date)', value: '₹ 186.0 Cr', progress: 58, icon: 'ti-database', sub: '58% of contract value' },
          { label: 'Approved budget', value: '₹ 275.2 Cr', icon: 'ti-report-money' },
          { label: 'Committed (POs + WOs)', value: '₹ 208.4 Cr', progress: 76, icon: 'ti-file-check' },
          { label: 'Cost to complete', value: '₹ 95.6 Cr', icon: 'ti-hourglass' },
          { label: 'September cost', value: '₹ 22.7 Cr', delta: '+8.1% MoM', up: true, good: false, icon: 'ti-calendar-stats' },
        ],
        charts: [
          {
            title: 'Cost Incurred by Head and Project (₹ Cr)',
            kind: 'stacked',
            categories: P8,
            series: [
              { name: 'Material', data: [19.8, 8.4, 9.1, 15.2, 3.8, 6.5, 4.9, 3.0] },
              { name: 'Labour', data: [11.4, 4.8, 5.3, 8.8, 2.2, 3.7, 2.9, 1.8] },
              { name: 'Subcontract', data: [9.4, 4.0, 4.3, 7.2, 1.8, 3.1, 2.3, 1.4] },
              { name: 'Equipment', data: [5.2, 2.2, 2.4, 4.0, 1.0, 1.7, 1.3, 0.8] },
              { name: 'Site overheads', data: [6.2, 2.6, 2.9, 4.8, 1.2, 2.0, 1.6, 1.0] },
            ],
            unit: '₹Cr',
            span: 2,
          },
          { title: 'Cost Mix (to date)', kind: 'donut', categories: ['Material', 'Labour', 'Subcontract', 'Equipment', 'Site overheads'], series: [{ name: '₹ Cr', data: [70.7, 40.9, 33.5, 18.6, 22.3] }], unit: '₹Cr', subtitle: '₹ 186 Cr' },
          { title: 'Monthly Cost Trend (₹ Cr)', kind: 'line', categories: MONTHS, series: [{ name: 'Actual cost', data: M_COST }, { name: 'Budgeted cost', data: [14.6, 16.2, 17.8, 18.4, 20.1, 21.8] }], unit: '₹Cr', span: 3 },
        ],
        table: {
          title: 'Cost Summary by Project',
          columns: [
            { key: 'project', label: 'Project' },
            { key: 'budget', label: 'Budget', type: 'currency' },
            { key: 'committed', label: 'Committed', type: 'currency' },
            { key: 'actual', label: 'Actual to Date', type: 'currency' },
            { key: 'ctc', label: 'Cost to Complete', type: 'currency' },
            { key: 'eac', label: 'Forecast at Completion', type: 'currency' },
            { key: 'used', label: 'Budget Used', type: 'percent' },
          ],
          rows: PROJ.map((p, i) => ({
            project: p,
            budget: cr(BUDGET[i]),
            committed: cr(COMMITTED[i]),
            actual: cr(COST[i]),
            ctc: cr(round1(EAC[i] - COST[i])),
            eac: cr(EAC[i]),
            used: Math.round((COST[i] / BUDGET[i]) * 100),
          })),
        },
      }),
      page('Budget Variance', {
        type: 'analysis',
        title: 'Budget Variance Report',
        kpis: [
          { label: 'Approved budget', value: '₹ 275.2 Cr', icon: 'ti-report-money' },
          { label: 'Forecast at completion', value: '₹ 281.6 Cr', icon: 'ti-chart-arrows' },
          { label: 'Forecast overrun', value: '₹ 6.4 Cr', delta: '+2.3%', up: true, good: false, icon: 'ti-alert-triangle' },
          { label: 'Projects over budget', value: '7 of 8', sub: 'Only Lakeview under budget', icon: 'ti-building' },
          { label: 'Cost performance index', value: '0.96', delta: '-0.01 MoM', up: false, good: false, icon: 'ti-gauge' },
        ],
        charts: [
          { title: 'Budget vs Forecast at Completion (₹ Cr)', kind: 'bar', categories: P8, series: [{ name: 'Budget', data: BUDGET }, { name: 'Forecast (EAC)', data: EAC }], unit: '₹Cr', span: 2 },
          { title: 'Variance by Project (₹ Cr)', kind: 'hbar', categories: P8, series: [{ name: 'EAC − Budget', data: EAC.map((e, i) => round1(e - BUDGET[i])) }], unit: '₹Cr' },
          { title: 'Overrun by Cost Head (₹ Cr)', kind: 'waterfall', categories: ['Material', 'Labour', 'Subcontract', 'Equipment', 'Site overheads', 'Total overrun'], series: [{ name: 'Variance', data: [3.2, 1.5, 1.1, 0.3, 0.3, 0] }], unit: '₹Cr', span: 2 },
          { title: 'Variance Drivers', kind: 'donut', categories: ['Steel escalation', 'Design changes', 'Productivity loss', 'Rework', 'Other'], series: [{ name: 'Share', data: [41, 24, 17, 10, 8] }], unit: '%' },
        ],
        table: {
          title: 'Budget Variance by Project',
          columns: [
            { key: 'project', label: 'Project' },
            { key: 'budget', label: 'Budget', type: 'currency' },
            { key: 'actual', label: 'Actual to Date', type: 'currency' },
            { key: 'eac', label: 'Forecast (EAC)', type: 'currency' },
            { key: 'variance', label: 'Variance', type: 'currency' },
            { key: 'pct', label: 'Variance %', type: 'percent' },
            { key: 'status', label: 'Status', type: 'status' },
          ],
          rows: PROJ.map((p, i) => {
            const v = round1(EAC[i] - BUDGET[i]);
            const pct = round1((v / BUDGET[i]) * 100);
            return { project: p, budget: cr(BUDGET[i]), actual: cr(COST[i]), eac: cr(EAC[i]), variance: cr(v), pct, status: pct > 10 ? 'Critical' : pct > 5 ? 'At Risk' : 'On Track' };
          }),
        },
      }),
      page('Schedule', {
        type: 'analysis',
        title: 'Schedule Performance Report',
        kpis: [
          { label: 'Forecast on time (≤ 15 days)', value: '3 of 8', icon: 'ti-calendar-check' },
          { label: 'Average forecast delay', value: '25 days', delta: '+3 days MoM', up: true, good: false, icon: 'ti-calendar-time' },
          { label: 'Critical activities late', value: '14', icon: 'ti-alert-triangle' },
          { label: 'Milestones due in 30 days', value: '7', icon: 'ti-flag' },
          { label: 'EOT granted (portfolio)', value: '101 days', sub: '4 projects', icon: 'ti-calendar-plus' },
        ],
        charts: [
          { title: 'Forecast Delay vs Contract Completion (days)', kind: 'hbar', categories: P8, series: [{ name: 'Forecast delay', data: [18, 25, 62, 12, 40, 6, 28, 10] }, { name: 'EOT granted', data: [21, 0, 45, 14, 0, 0, 21, 0] }], unit: 'days', span: 2, height: 260 },
          { title: 'Delay Causes', kind: 'donut', categories: ['Client / design', 'Material supply', 'Labour', 'Weather', 'Statutory'], series: [{ name: 'Share', data: [38, 18, 14, 16, 14] }], unit: '%' },
          {
            title: 'Milestone Status by Project',
            kind: 'stacked',
            categories: P8,
            series: [
              { name: 'Completed', data: [9, 5, 3, 7, 2, 11, 8, 6] },
              { name: 'Upcoming', data: [4, 5, 7, 5, 8, 1, 2, 3] },
              { name: 'Delayed', data: [1, 2, 3, 1, 2, 0, 2, 1] },
            ],
            span: 3,
          },
        ],
        table: {
          title: 'Schedule Status by Project',
          columns: [
            { key: 'project', label: 'Project' },
            { key: 'contract', label: 'Contract Completion', type: 'date' },
            { key: 'forecast', label: 'Forecast Completion', type: 'date' },
            { key: 'delay', label: 'Delay (days)', type: 'number' },
            { key: 'late', label: 'Critical Activities Late', type: 'number' },
            { key: 'next', label: 'Next Milestone' },
            { key: 'status', label: 'Status', type: 'status' },
          ],
          rows: PROJ.map((p, i) => ({
            project: p,
            contract: ['2026-12-31', '2026-11-30', '2027-02-28', '2026-12-31', '2027-06-30', '2026-11-30', '2026-12-15', '2026-12-31'][i],
            forecast: ['2027-01-18', '2026-12-25', '2027-05-01', '2027-01-12', '2027-08-09', '2026-12-06', '2027-01-12', '2027-01-10'][i],
            delay: [18, 25, 62, 12, 40, 6, 28, 10][i],
            late: [2, 2, 4, 1, 2, 0, 2, 1][i],
            next: ['Internal Finishing', 'Structure Completion', 'Client Inspection', 'MEP Installation', 'Raft Completion', 'Handover', 'Fire NOC', 'Façade Completion'][i],
            status: STATUS[i],
          })),
        },
      }),
    ]),

    /* ═══════════════════════ Procurement Reports ═══════════════════════ */
    group('Procurement Reports', 'ti-shopping-cart', [
      page('Purchase', {
        type: 'analysis',
        title: 'Purchase Report',
        kpis: [
          { label: 'Purchase value (FY YTD)', value: '₹ 69.5 Cr', icon: 'ti-shopping-cart', sub: 'Across 6 categories' },
          { label: 'Purchase orders issued', value: '412', delta: '+64 vs LY', up: true, icon: 'ti-file-invoice' },
          { label: 'September purchases', value: '₹ 12.9 Cr', delta: '+6.6% MoM', up: true, good: false, icon: 'ti-calendar-stats' },
          { label: 'Open POs', value: '58', sub: '₹ 14.6 Cr pending delivery', icon: 'ti-truck-delivery' },
          { label: 'Avg PO cycle time', value: '4.2 days', delta: '-0.8 days', up: false, good: true, icon: 'ti-clock' },
        ],
        charts: [
          { title: 'Monthly Purchases vs Procurement Plan (₹ Cr)', kind: 'barline', categories: MONTHS, series: [{ name: 'Actual', data: [9.8, 11.2, 12.6, 10.9, 12.1, 12.9], type: 'bar' }, { name: 'Plan', data: [10.5, 11.0, 12.0, 11.8, 12.4, 13.0], type: 'line' }], unit: '₹Cr', span: 2 },
          { title: 'Spend by Category', kind: 'donut', categories: SPEND_CAT, series: [{ name: '₹ Cr', data: SPEND }], unit: '₹Cr', subtitle: '₹ 69.5 Cr' },
          { title: 'Purchases by Project (₹ Cr)', kind: 'hbar', categories: P8, series: [{ name: 'Purchases', data: [20.8, 7.9, 9.6, 15.4, 4.6, 3.7, 4.4, 3.1] }], unit: '₹Cr', span: 2 },
          { title: 'PO Status', kind: 'funnel', categories: ['Requisitions', 'POs issued', 'Partially received', 'Fully received', 'Invoiced'], series: [{ name: 'Count', data: [468, 412, 96, 354, 331] }] },
        ],
        table: {
          title: 'Top Purchase Orders — September 2026',
          columns: [
            { key: 'po', label: 'PO No.', type: 'code' },
            { key: 'vendor', label: 'Vendor' },
            { key: 'project', label: 'Project' },
            { key: 'category', label: 'Category' },
            { key: 'value', label: 'PO Value', type: 'currency' },
            { key: 'date', label: 'PO Date', type: 'date' },
            { key: 'status', label: 'Status', type: 'status' },
          ],
          rows: [
            { po: 'PO-0412', vendor: 'Shree Balaji Steel Traders', project: 'Skyline Apartments', category: 'Steel', value: 18600000, date: '2026-09-26', status: 'Ordered' },
            { po: 'PO-0407', vendor: 'Chennai RMC Pvt Ltd', project: 'Metro Office Tower', category: 'Cement & RMC', value: 12400000, date: '2026-09-22', status: 'Partially Received' },
            { po: 'PO-0401', vendor: 'UltraBuild Cements', project: 'Greenfield Township', category: 'Cement & RMC', value: 8600000, date: '2026-09-18', status: 'Fully Received' },
            { po: 'PO-0398', vendor: 'Apex Electricals', project: 'Metro Office Tower', category: 'MEP', value: 7200000, date: '2026-09-16', status: 'Partially Received' },
            { po: 'PO-0392', vendor: 'Stonecraft Tiles & Granite', project: 'Harbour View Hospital', category: 'Finishes', value: 5400000, date: '2026-09-12', status: 'Fully Received' },
            { po: 'PO-0388', vendor: 'Sri Murugan Aggregates', project: 'Skyline Apartments', category: 'Aggregates', value: 3900000, date: '2026-09-10', status: 'Fully Received' },
            { po: 'PO-0384', vendor: 'Southern Glass & Aluminium', project: 'Sunrise Business Hotel', category: 'Finishes', value: 3600000, date: '2026-09-08', status: 'Ordered' },
            { po: 'PO-0379', vendor: 'FlowLine Pipes & Fittings', project: 'Riverside Villas', category: 'MEP', value: 2800000, date: '2026-09-05', status: 'Fully Received' },
          ],
        },
      }),
      page('Vendor', {
        type: 'analysis',
        title: 'Vendor Performance Report',
        kpis: [
          { label: 'Active vendors', value: '20', icon: 'ti-building-store', sub: '6 new this FY' },
          { label: 'Top-5 vendor share', value: '60%', icon: 'ti-chart-pie', sub: 'of ₹ 69.5 Cr spend' },
          { label: 'On-time delivery', value: '87%', progress: 87, delta: '+5 pts', up: true, icon: 'ti-truck-delivery' },
          { label: 'Avg vendor rating', value: '4.1 / 5', icon: 'ti-star' },
          { label: 'Quality rejections', value: '1.8%', delta: '-0.4 pts', up: false, good: true, icon: 'ti-circle-x' },
        ],
        charts: [
          { title: 'Spend by Vendor — Top 8 (₹ Cr)', kind: 'hbar', categories: ['Shree Balaji Steel', 'UltraBuild Cements', 'Chennai RMC', 'Apex Electricals', 'Stonecraft Tiles', 'Sri Murugan Aggregates', 'FlowLine Pipes', 'Southern Glass'], series: [{ name: 'Spend', data: [14.6, 9.2, 8.1, 5.4, 4.3, 3.9, 2.6, 2.2] }], unit: '₹Cr', span: 2, height: 260 },
          { title: 'On-time Delivery Trend (%)', kind: 'line', categories: MONTHS, series: [{ name: 'On-time', data: [82, 84, 85, 86, 88, 87] }], unit: '%' },
          {
            title: 'Vendor Scorecard (1–5)',
            kind: 'heatmap',
            categories: ['Quality', 'Delivery', 'Price', 'Responsiveness', 'Compliance'],
            yCategories: ['Shree Balaji Steel', 'UltraBuild Cements', 'Chennai RMC', 'Apex Electricals', 'Stonecraft Tiles'],
            series: [{ name: 'Score', data: [4, 5, 3, 4, 5, 5, 4, 4, 4, 5, 4, 3, 4, 3, 4, 4, 4, 3, 5, 4, 3, 3, 4, 3, 4] }],
            span: 2,
            height: 240,
          },
          { title: 'Vendor Rating Distribution', kind: 'bar', categories: ['5 ★', '4 ★', '3 ★', '2 ★'], series: [{ name: 'Vendors', data: [5, 9, 5, 1] }] },
        ],
        table: {
          title: 'Vendor Performance Scorecard',
          columns: [
            { key: 'vendor', label: 'Vendor' },
            { key: 'category', label: 'Category' },
            { key: 'spend', label: 'Spend (FY)', type: 'currency' },
            { key: 'pos', label: 'POs', type: 'number' },
            { key: 'ontime', label: 'On-time', type: 'percent' },
            { key: 'reject', label: 'Rejections', type: 'percent' },
            { key: 'rating', label: 'Rating', type: 'number' },
            { key: 'status', label: 'Status', type: 'status' },
          ],
          rows: [
            { vendor: 'Shree Balaji Steel Traders', category: 'Steel', spend: 146000000, pos: 48, ontime: 91, reject: 0.8, rating: 4.4, status: 'Active' },
            { vendor: 'UltraBuild Cements', category: 'Cement', spend: 92000000, pos: 62, ontime: 94, reject: 0.5, rating: 4.6, status: 'Active' },
            { vendor: 'Chennai RMC Pvt Ltd', category: 'Ready Mix Concrete', spend: 81000000, pos: 74, ontime: 83, reject: 2.4, rating: 3.9, status: 'Active' },
            { vendor: 'Apex Electricals', category: 'Electrical', spend: 54000000, pos: 31, ontime: 79, reject: 1.9, rating: 3.8, status: 'Under Review' },
            { vendor: 'Stonecraft Tiles & Granite', category: 'Finishes', spend: 43000000, pos: 22, ontime: 76, reject: 3.6, rating: 3.4, status: 'On Hold' },
            { vendor: 'Sri Murugan Aggregates', category: 'Aggregates & Sand', spend: 39000000, pos: 58, ontime: 92, reject: 1.2, rating: 4.2, status: 'Active' },
            { vendor: 'FlowLine Pipes & Fittings', category: 'Plumbing', spend: 26000000, pos: 19, ontime: 88, reject: 1.1, rating: 4.1, status: 'Active' },
            { vendor: 'Southern Glass & Aluminium', category: 'Glazing', spend: 22000000, pos: 9, ontime: 72, reject: 2.8, rating: 3.6, status: 'Under Review' },
          ],
        },
      }),
      page('Material Cost', {
        type: 'analysis',
        title: 'Material Cost Report',
        kpis: [
          { label: 'Material cost (to date)', value: '₹ 70.7 Cr', icon: 'ti-package', sub: '38% of total cost' },
          { label: 'Steel avg rate', value: '₹ 72,500 / MT', delta: '+6.6% vs budget', up: true, good: false, icon: 'ti-building-factory-2' },
          { label: 'Cement avg rate', value: '₹ 385 / bag', delta: '+2.7% vs budget', up: true, good: false, icon: 'ti-bucket' },
          { label: 'RMC M30 avg rate', value: '₹ 6,450 / m³', delta: '+4.0%', up: true, good: false, icon: 'ti-truck' },
          { label: 'Wastage vs norm', value: '2.8%', sub: 'Norm 2.5%', icon: 'ti-recycle' },
        ],
        charts: [
          { title: 'Material Spend — Budget vs Actual by Category (₹ Cr)', kind: 'bar', categories: SPEND_CAT, series: [{ name: 'Budget', data: [21.2, 18.1, 6.4, 10.2, 7.6, 5.2] }, { name: 'Actual', data: SPEND }], unit: '₹Cr', span: 2 },
          { title: 'Steel Price Trend (₹ / MT)', kind: 'line', categories: MONTHS, series: [{ name: 'TMT Fe550D', data: [66800, 68200, 69500, 70900, 71800, 72500] }] },
          { title: 'Wastage by Material (%)', kind: 'hbar', categories: ['Steel', 'Cement', 'Blocks', 'Tiles', 'Aggregates', 'Plywood'], series: [{ name: 'Actual', data: [2.9, 3.1, 4.2, 5.1, 3.6, 6.8] }, { name: 'Norm', data: [2.5, 2.5, 4.0, 4.0, 3.0, 7.5] }], unit: '%', span: 2 },
          { title: 'Price Escalation Impact by Material (₹ L)', kind: 'waterfall', categories: ['Steel', 'RMC', 'Cement', 'Sand', 'Aggregates', 'Tiles', 'Net impact'], series: [{ name: '₹ L', data: [139, 42, 19, 11, 0, 0, 0] }], unit: '₹L' },
        ],
        table: {
          title: 'Material Rate Analysis',
          columns: [
            { key: 'material', label: 'Material' },
            { key: 'unit', label: 'Unit' },
            { key: 'budget', label: 'Budget Rate', type: 'currency' },
            { key: 'current', label: 'Current Rate', type: 'currency' },
            { key: 'var', label: 'Variance', type: 'percent' },
            { key: 'qty', label: 'Qty Consumed', type: 'number' },
            { key: 'impact', label: 'Cost Impact', type: 'currency' },
          ],
          rows: [
            { material: 'TMT Steel Fe550D', unit: 'MT', budget: 68000, current: 72500, var: 6.6, qty: 3090, impact: 13905000 },
            { material: 'RMC M30', unit: 'm³', budget: 6200, current: 6450, var: 4.0, qty: 16800, impact: 4200000 },
            { material: 'OPC 53 Grade Cement', unit: 'Bag', budget: 375, current: 385, var: 2.7, qty: 186000, impact: 1860000 },
            { material: 'M-Sand', unit: 'm³', budget: 1250, current: 1310, var: 4.8, qty: 18500, impact: 1110000 },
            { material: '20 mm Aggregate', unit: 'm³', budget: 1450, current: 1420, var: -2.1, qty: 24000, impact: -720000 },
            { material: 'Vitrified Tiles 800×800', unit: 'm²', budget: 820, current: 795, var: -3.0, qty: 52000, impact: -1300000 },
            { material: 'AAC Blocks 200 mm', unit: 'm³', budget: 4650, current: 4720, var: 1.5, qty: 9800, impact: 686000 },
            { material: 'FR Copper Wire 2.5 sq mm', unit: 'Coil', budget: 2350, current: 2520, var: 7.2, qty: 4200, impact: 714000 },
          ],
        },
      }),
    ]),

    /* ═══════════════════════ Workforce Reports ═══════════════════════ */
    group('Workforce Reports', 'ti-users', [
      page('Attendance', {
        type: 'analysis',
        title: 'Attendance Report — September 2026',
        kpis: [
          { label: 'Total workforce', value: '1,842', icon: 'ti-users', sub: '312 staff · 1,530 workers' },
          { label: 'Attendance rate', value: '93.4%', progress: 93, delta: '+0.6 pts', up: true, icon: 'ti-user-check' },
          { label: 'Present today', value: '1,717', icon: 'ti-id-badge' },
          { label: 'Absenteeism', value: '6.6%', delta: '-0.6 pts', up: false, good: true, icon: 'ti-user-x' },
          { label: 'Overtime (Sep)', value: '4,860 hrs', delta: '+11%', up: true, good: false, icon: 'ti-clock-plus' },
        ],
        charts: [
          { title: 'Attendance by Project (%)', kind: 'bar', categories: P8, series: [{ name: 'Attendance', data: [94.2, 92.8, 91.6, 93.9, 92.4, 95.1, 93.3, 94.0] }], unit: '%', span: 2 },
          { title: 'Headcount Mix', kind: 'donut', categories: ['Staff', 'Skilled workers', 'Semi-skilled', 'Unskilled'], series: [{ name: 'Headcount', data: [312, 684, 498, 348] }], subtitle: '1,842' },
          { title: 'Weekly Attendance Trend (%)', kind: 'line', categories: ['1–5 Sep', '7–12 Sep', '14–19 Sep', '21–26 Sep', '28–29 Sep'], series: [{ name: 'Attendance', data: [92.8, 93.6, 94.1, 93.0, 93.5] }], unit: '%' },
          {
            title: 'Absenteeism by Trade and Day (%)',
            kind: 'heatmap',
            categories: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
            yCategories: ['Masons', 'Carpenters', 'Bar benders', 'Electricians', 'Helpers'],
            series: [{ name: 'Absent %', data: [9, 6, 5, 5, 6, 8, 8, 5, 4, 5, 5, 7, 7, 5, 4, 4, 5, 8, 5, 4, 3, 3, 4, 6, 11, 7, 6, 6, 8, 10] }],
            span: 2,
            height: 240,
          },
        ],
        table: {
          title: 'Attendance Summary by Project — September 2026',
          columns: [
            { key: 'project', label: 'Project' },
            { key: 'staff', label: 'Staff', type: 'number' },
            { key: 'workers', label: 'Workers', type: 'number' },
            { key: 'headcount', label: 'Headcount', type: 'number' },
            { key: 'attendance', label: 'Attendance', type: 'percent' },
            { key: 'ot', label: 'Overtime (hrs)', type: 'number' },
            { key: 'status', label: 'Status', type: 'status' },
          ],
          rows: [
            ...PROJ.map((p, i) => {
              const att = [94.2, 92.8, 91.6, 93.9, 92.4, 95.1, 93.3, 94.0][i];
              return { project: p, staff: STAFF[i], workers: WORKERS[i], headcount: STAFF[i] + WORKERS[i], attendance: att, ot: OT[i], status: att < 92 ? 'At Risk' : 'On Track' };
            }),
            { project: 'Head Office', staff: 36, workers: 0, headcount: 36, attendance: 96.8, ot: 0, status: 'On Track' },
          ],
        },
      }),
      page('Labour Cost', {
        type: 'analysis',
        title: 'Labour Cost Report',
        kpis: [
          { label: 'Payroll (Sep)', value: '₹ 6.42 Cr', delta: '+3.2% MoM', up: true, good: false, icon: 'ti-cash' },
          { label: 'Labour cost (to date)', value: '₹ 40.9 Cr', icon: 'ti-users-group', sub: '22% of project cost' },
          { label: 'Overtime cost (Sep)', value: '₹ 38 L', sub: '4,860 hrs', icon: 'ti-clock-plus' },
          { label: 'Cost per worker-day', value: '₹ 812', delta: '+2.4%', up: true, good: false, icon: 'ti-user-dollar' },
          { label: 'Contract labour share', value: '64%', icon: 'ti-users' },
        ],
        charts: [
          {
            title: 'Monthly Payroll by Category (₹ Cr)',
            kind: 'stacked',
            categories: MONTHS,
            series: [
              { name: 'Staff salaries', data: [1.82, 1.84, 1.86, 1.88, 1.9, 1.92] },
              { name: 'Direct wages', data: [2.3, 2.46, 2.58, 2.62, 2.74, 2.86] },
              { name: 'Contract labour', data: [1.02, 1.12, 1.18, 1.14, 1.24, 1.26] },
              { name: 'Overtime', data: [0.24, 0.28, 0.31, 0.26, 0.34, 0.38] },
            ],
            unit: '₹Cr',
            span: 2,
          },
          { title: 'Labour Cost by Trade (Sep)', kind: 'donut', categories: ['Masonry', 'Carpentry & formwork', 'Bar bending', 'MEP trades', 'Finishing', 'Helpers'], series: [{ name: '₹ L', data: [96, 88, 74, 62, 58, 72] }], unit: '₹L', subtitle: 'Workers ₹ 4.50 Cr' },
          { title: 'Payroll by Project — September (₹ L)', kind: 'bar', categories: [...P8, 'Head Office'], series: [{ name: 'Payroll', data: [168, 72, 94, 136, 52, 44, 30, 18, 28] }], unit: '₹L', span: 3 },
        ],
        table: {
          title: 'Labour Cost by Trade — September 2026',
          columns: [
            { key: 'trade', label: 'Trade' },
            { key: 'headcount', label: 'Headcount', type: 'number' },
            { key: 'wage', label: 'Avg Daily Wage', type: 'currency' },
            { key: 'mandays', label: 'Man-days', type: 'number' },
            { key: 'wages', label: 'Wages', type: 'currency' },
            { key: 'ot', label: 'Overtime', type: 'currency' },
            { key: 'total', label: 'Total Cost', type: 'currency' },
          ],
          rows: [
            { trade: 'Masonry', headcount: 318, wage: 1150, mandays: 7950, wages: 9142500, ot: 460000, total: 9602500 },
            { trade: 'Carpentry & formwork', headcount: 276, wage: 1250, mandays: 6900, wages: 8625000, ot: 175000, total: 8800000 },
            { trade: 'Bar bending', headcount: 232, wage: 1180, mandays: 5800, wages: 6844000, ot: 556000, total: 7400000 },
            { trade: 'MEP trades', headcount: 184, wage: 1320, mandays: 4600, wages: 6072000, ot: 128000, total: 6200000 },
            { trade: 'Finishing', headcount: 172, wage: 1300, mandays: 4300, wages: 5590000, ot: 210000, total: 5800000 },
            { trade: 'Helpers', headcount: 348, wage: 780, mandays: 8700, wages: 6786000, ot: 414000, total: 7200000 },
          ],
        },
      }),
      page('Productivity', {
        type: 'analysis',
        title: 'Labour Productivity Report',
        kpis: [
          { label: 'Output per man-day', value: '₹ 4,280', delta: '+3.6%', up: true, icon: 'ti-trending-up', sub: 'Value of work done' },
          { label: 'Productivity index', value: '0.94', delta: '+0.03', up: true, icon: 'ti-gauge', sub: 'Actual vs norm output' },
          { label: 'Concrete placement', value: '0.92 m³', sub: 'per man-day · norm 1.0', icon: 'ti-bucket' },
          { label: 'Steel fixing', value: '285 kg', sub: 'per man-day · norm 300', icon: 'ti-building-factory-2' },
          { label: 'Idle hours (Sep)', value: '3,120 hrs', delta: '-12%', up: false, good: true, icon: 'ti-player-pause' },
        ],
        charts: [
          { title: 'Productivity vs Norm by Activity (%)', kind: 'hbar', categories: ['Concreting', 'Reinforcement', 'Formwork', 'Block work', 'Plastering', 'Tiling', 'Painting'], series: [{ name: 'Productivity', data: [92, 95, 88, 104, 97, 86, 101] }], unit: '%', span: 2, height: 260 },
          { title: 'Productivity Index Trend', kind: 'line', categories: MONTHS, series: [{ name: 'Index', data: [0.88, 0.9, 0.87, 0.89, 0.91, 0.94] }, { name: 'Target', data: [0.95, 0.95, 0.95, 0.95, 0.95, 0.95] }] },
          { title: 'Output per Man-day by Project (₹)', kind: 'bar', categories: P8, series: [{ name: 'Output', data: [4620, 3980, 3710, 4480, 3560, 4850, 4210, 4390] }], span: 2 },
          { title: 'Idle Time Causes (Sep)', kind: 'donut', categories: ['Material wait', 'Rain', 'Equipment breakdown', 'Drawings / RFI', 'Other'], series: [{ name: 'Hours', data: [1120, 760, 540, 480, 220] }], unit: 'hrs' },
        ],
        table: {
          title: 'Activity Productivity — September 2026',
          columns: [
            { key: 'activity', label: 'Activity' },
            { key: 'unit', label: 'Unit' },
            { key: 'norm', label: 'Norm / Man-day', type: 'number' },
            { key: 'actual', label: 'Actual / Man-day', type: 'number' },
            { key: 'index', label: 'Index', type: 'percent' },
            { key: 'best', label: 'Best Project' },
            { key: 'status', label: 'Status', type: 'status' },
          ],
          rows: [
            { activity: 'Concreting (pump)', unit: 'm³', norm: 1.0, actual: 0.92, index: 92, best: 'Orbit Tech Park Phase II', status: 'At Risk' },
            { activity: 'Reinforcement fixing', unit: 'kg', norm: 300, actual: 285, index: 95, best: 'Skyline Apartments', status: 'On Track' },
            { activity: 'Formwork (slab)', unit: 'm²', norm: 12, actual: 10.6, index: 88, best: 'Metro Office Tower', status: 'At Risk' },
            { activity: 'Block work 200 mm', unit: 'm²', norm: 8.3, actual: 8.6, index: 104, best: 'Riverside Villas', status: 'On Track' },
            { activity: 'Internal plastering', unit: 'm²', norm: 11, actual: 10.7, index: 97, best: 'Sunrise Business Hotel', status: 'On Track' },
            { activity: 'Floor tiling', unit: 'm²', norm: 9, actual: 7.7, index: 86, best: 'Harbour View Hospital', status: 'Delayed' },
            { activity: 'Painting (2 coats)', unit: 'm²', norm: 28, actual: 28.3, index: 101, best: 'Orbit Tech Park Phase II', status: 'On Track' },
          ],
        },
      }),
    ]),

    /* ═══════════════════════ Finance Reports ═══════════════════════ */
    group('Finance Reports', 'ti-report-money', [
      page('Receivables', {
        type: 'analysis',
        title: 'Receivables Report',
        kpis: [
          { label: 'Total receivables', value: '₹ 38.4 Cr', icon: 'ti-receipt', sub: '8 clients' },
          { label: 'Overdue > 60 days', value: '₹ 11.5 Cr', delta: '+₹ 1.2 Cr', up: true, good: false, icon: 'ti-alert-triangle' },
          { label: 'Days sales outstanding', value: '54 days', delta: '-4 days', up: false, good: true, icon: 'ti-clock' },
          { label: 'Collections (Sep)', value: '₹ 24.3 Cr', delta: '+8.5% MoM', up: true, icon: 'ti-arrow-down-left' },
          { label: 'Collection efficiency', value: '93%', progress: 93, icon: 'ti-target' },
        ],
        charts: [
          { title: 'Receivables Ageing (₹ Cr)', kind: 'bar', categories: ['0–30 days', '31–60 days', '61–90 days', '> 90 days'], series: [{ name: 'Outstanding', data: [17.6, 9.3, 5.4, 6.1] }], unit: '₹Cr' },
          { title: 'Receivables by Client (₹ Cr)', kind: 'hbar', categories: CLIENT, series: [{ name: 'Outstanding', data: [11.2, 4.6, 6.8, 7.4, 2.3, 2.1, 2.6, 1.4] }], unit: '₹Cr', span: 2, height: 260 },
          { title: 'Billed vs Collected (₹ Cr)', kind: 'barline', categories: MONTHS, series: [{ name: 'Billed', data: M_REV, type: 'bar' }, { name: 'Collected', data: M_IN, type: 'line' }], unit: '₹Cr', span: 3 },
        ],
        table: {
          title: 'Client-wise Receivables Ageing',
          columns: [
            { key: 'client', label: 'Client' },
            { key: 'project', label: 'Project' },
            { key: 'total', label: 'Outstanding', type: 'currency' },
            { key: 'a', label: '0–30 days', type: 'currency' },
            { key: 'b', label: '31–60 days', type: 'currency' },
            { key: 'c', label: '61–90 days', type: 'currency' },
            { key: 'd', label: '> 90 days', type: 'currency' },
            { key: 'status', label: 'Status', type: 'status' },
          ],
          rows: ([
            [5.8, 2.9, 1.2, 1.3],
            [2.1, 1.1, 0.7, 0.7],
            [2.4, 1.6, 1.1, 1.7],
            [3.9, 1.8, 0.9, 0.8],
            [0.9, 0.5, 0.4, 0.5],
            [1.1, 0.5, 0.3, 0.2],
            [0.8, 0.6, 0.5, 0.7],
            [0.6, 0.3, 0.3, 0.2],
          ] as number[][]).map(([a, b, c, d], i) => ({
            client: CLIENT[i],
            project: PROJ[i],
            total: cr(round1(a + b + c + d)),
            a: cr(a),
            b: cr(b),
            c: cr(c),
            d: cr(d),
            status: d >= 1.3 ? 'Overdue' : d >= 0.7 ? 'Due Soon' : 'On Track',
          })),
        },
      }),
      page('Payables', {
        type: 'analysis',
        title: 'Payables Report',
        kpis: [
          { label: 'Total payables', value: '₹ 21.7 Cr', icon: 'ti-file-invoice', sub: 'Vendors & subcontractors' },
          { label: 'Due in next 7 days', value: '₹ 4.8 Cr', icon: 'ti-calendar-due' },
          { label: 'Overdue > 60 days', value: '₹ 4.1 Cr', delta: '-₹ 0.6 Cr', up: false, good: true, icon: 'ti-alert-triangle' },
          { label: 'Days payable outstanding', value: '42 days', icon: 'ti-clock' },
          { label: 'Paid to vendors & subs (Sep)', value: '₹ 14.9 Cr', icon: 'ti-arrow-up-right' },
        ],
        charts: [
          { title: 'Payables Trend (₹ Cr)', kind: 'area', categories: MONTHS, series: [{ name: 'Outstanding', data: [17.8, 19.2, 20.6, 19.9, 21.1, 21.7] }], unit: '₹Cr', span: 2 },
          { title: 'Payables by Category', kind: 'donut', categories: ['Steel', 'Cement & RMC', 'Subcontractors', 'MEP', 'Aggregates', 'Others'], series: [{ name: '₹ Cr', data: [5.8, 4.9, 5.2, 2.4, 1.3, 2.1] }], unit: '₹Cr', subtitle: '₹ 21.7 Cr' },
          { title: 'Payables Ageing (₹ Cr)', kind: 'bar', categories: ['0–30 days', '31–60 days', '61–90 days', '> 90 days'], series: [{ name: 'Outstanding', data: [11.4, 6.2, 2.8, 1.3] }], unit: '₹Cr' },
          { title: 'Top Payables by Party (₹ Cr)', kind: 'hbar', categories: ['Shree Balaji Steel', 'Sai Ram Constructions', 'Chennai RMC', 'UltraBuild Cements', 'Precision MEP Services', 'Sri Murugan Aggregates', 'Apex Electricals'], series: [{ name: 'Outstanding', data: [3.4, 2.9, 2.7, 2.2, 1.8, 1.3, 1.1] }], unit: '₹Cr', span: 2 },
        ],
        table: {
          title: 'Vendor & Subcontractor Payables',
          columns: [
            { key: 'party', label: 'Vendor / Subcontractor' },
            { key: 'category', label: 'Category' },
            { key: 'total', label: 'Outstanding', type: 'currency' },
            { key: 'a', label: '0–30 days', type: 'currency' },
            { key: 'b', label: '31–60 days', type: 'currency' },
            { key: 'c', label: '> 60 days', type: 'currency' },
            { key: 'due', label: 'Next Due', type: 'date' },
            { key: 'status', label: 'Status', type: 'status' },
          ],
          rows: [
            { party: 'Shree Balaji Steel Traders', category: 'Steel', total: 34000000, a: 18000000, b: 11000000, c: 5000000, due: '2026-10-03', status: 'Due Soon' },
            { party: 'Sai Ram Constructions', category: 'Subcontractor — Civil', total: 29000000, a: 15000000, b: 8000000, c: 6000000, due: '2026-10-05', status: 'Pending Approval' },
            { party: 'Chennai RMC Pvt Ltd', category: 'Cement & RMC', total: 27000000, a: 14000000, b: 9000000, c: 4000000, due: '2026-10-02', status: 'Due Soon' },
            { party: 'UltraBuild Cements', category: 'Cement & RMC', total: 22000000, a: 12000000, b: 6000000, c: 4000000, due: '2026-10-09', status: 'Pending' },
            { party: 'Precision MEP Services', category: 'Subcontractor — MEP', total: 18000000, a: 9000000, b: 5000000, c: 4000000, due: '2026-09-24', status: 'Overdue' },
            { party: 'Sri Murugan Aggregates', category: 'Aggregates', total: 13000000, a: 7000000, b: 4000000, c: 2000000, due: '2026-10-12', status: 'Pending' },
            { party: 'Apex Electricals', category: 'MEP', total: 11000000, a: 6000000, b: 3000000, c: 2000000, due: '2026-09-20', status: 'Overdue' },
          ],
        },
      }),
      page('Cash Flow', {
        type: 'analysis',
        title: 'Cash Flow Report & Forecast',
        kpis: [
          { label: 'Closing balance (Sep)', value: '₹ 12.6 Cr', icon: 'ti-building-bank' },
          { label: 'Forecast inflow (Oct–Dec)', value: '₹ 82.4 Cr', icon: 'ti-arrow-down-left' },
          { label: 'Forecast outflow (Oct–Dec)', value: '₹ 81.9 Cr', icon: 'ti-arrow-up-right' },
          { label: 'Lowest forecast balance', value: '₹ 9.2 Cr', sub: 'November 2026', icon: 'ti-alert-triangle' },
          { label: 'Working capital limit used', value: '46%', progress: 46, icon: 'ti-credit-card' },
        ],
        charts: [
          { title: 'Cash Flow Forecast — Oct 2026 to Mar 2027 (₹ Cr)', kind: 'barline', categories: ['Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'], series: [{ name: 'Inflow', data: [26.8, 27.4, 28.2, 25.1, 24.6, 29.8], type: 'bar' }, { name: 'Outflow', data: [25.9, 31.7, 24.3, 23.8, 23.1, 26.2], type: 'bar' }, { name: 'Closing balance', data: [13.5, 9.2, 13.1, 14.4, 15.9, 19.5], type: 'line' }], unit: '₹Cr', span: 2 },
          { title: 'Inflow Sources (FY YTD)', kind: 'donut', categories: ['RA bill collections', 'Advances received', 'Retention released', 'Other income'], series: [{ name: '₹ Cr', data: [104.6, 6.2, 3.8, 1.8] }], unit: '₹Cr', subtitle: '₹ 116.4 Cr' },
          { title: 'Outflow by Head (FY YTD, ₹ Cr)', kind: 'hbar', categories: ['Vendors', 'Payroll', 'Subcontractors', 'Overheads & others'], series: [{ name: 'Outflow', data: [44.6, 35.6, 23.8, 5.3] }], unit: '₹Cr' },
          { title: 'Net Cash Flow by Month (₹ Cr)', kind: 'bar', categories: MONTHS, series: [{ name: 'Net flow', data: MONTHS.map((_, i) => round1(M_IN[i] - M_OUT[i])) }], unit: '₹Cr', span: 2 },
        ],
        table: {
          title: 'Weekly Cash Forecast — October 2026',
          columns: [
            { key: 'week', label: 'Week' },
            { key: 'opening', label: 'Opening', type: 'currency' },
            { key: 'inflow', label: 'Expected Inflows', type: 'currency' },
            { key: 'outflow', label: 'Planned Payments', type: 'currency' },
            { key: 'net', label: 'Net', type: 'currency' },
            { key: 'closing', label: 'Closing', type: 'currency' },
          ],
          rows: [
            { week: 'W1 · 1–4 Oct', opening: cr(12.6), inflow: cr(5.8), outflow: cr(7.2), net: cr(-1.4), closing: cr(11.2) },
            { week: 'W2 · 5–11 Oct', opening: cr(11.2), inflow: cr(6.4), outflow: cr(5.9), net: cr(0.5), closing: cr(11.7) },
            { week: 'W3 · 12–18 Oct', opening: cr(11.7), inflow: cr(7.1), outflow: cr(6.3), net: cr(0.8), closing: cr(12.5) },
            { week: 'W4 · 19–25 Oct', opening: cr(12.5), inflow: cr(4.2), outflow: cr(3.8), net: cr(0.4), closing: cr(12.9) },
            { week: 'W5 · 26–31 Oct', opening: cr(12.9), inflow: cr(3.3), outflow: cr(2.7), net: cr(0.6), closing: cr(13.5) },
          ],
        },
      }),
      page('Project Profitability', {
        type: 'analysis',
        title: 'Project Profitability Report',
        kpis: [
          { label: 'Portfolio gross margin', value: '13.3%', icon: 'ti-percentage', sub: 'To date' },
          { label: 'Gross profit (to date)', value: '₹ 28.5 Cr', icon: 'ti-coins' },
          { label: 'Forecast margin at completion', value: '14.8%', delta: '+1.5 pts', up: true, icon: 'ti-chart-arrows', sub: 'Revised TCV ₹ 330.7 Cr vs EAC ₹ 281.6 Cr' },
          { label: 'Projects at / above 12% target', value: '6 of 8', icon: 'ti-target' },
          { label: 'Margin erosion — Orbit TP', value: '-4.2 pts', up: false, good: false, icon: 'ti-trending-down' },
        ],
        charts: [
          { title: 'Revenue vs Cost by Project (₹ Cr)', kind: 'bar', categories: P8, series: [{ name: 'Revenue', data: REV }, { name: 'Cost', data: COST }], unit: '₹Cr', span: 2 },
          { title: 'Gross Margin by Project (%)', kind: 'hbar', categories: P8, series: [{ name: 'To date', data: MARGIN }, { name: 'Forecast', data: [15.4, 15.2, 16.2, 14.8, 19.6, 2.7, 12.0, 13.6] }], unit: '%' },
          { title: 'Portfolio Margin Trend vs Target (%)', kind: 'line', categories: MONTHS, series: [{ name: 'Gross margin', data: [13.0, 11.1, 15.0, 9.6, 14.6, 13.0] }, { name: 'Target', data: [12, 12, 12, 12, 12, 12] }], unit: '%', span: 3 },
        ],
        table: {
          title: 'Project Profitability Statement',
          columns: [
            { key: 'project', label: 'Project' },
            { key: 'client', label: 'Client' },
            { key: 'tcv', label: 'Revised Contract', type: 'currency' },
            { key: 'revenue', label: 'Revenue', type: 'currency' },
            { key: 'cost', label: 'Cost', type: 'currency' },
            { key: 'gp', label: 'Gross Profit', type: 'currency' },
            { key: 'margin', label: 'Margin', type: 'percent' },
            { key: 'forecast', label: 'Forecast Margin', type: 'percent' },
            { key: 'status', label: 'Status', type: 'status' },
          ],
          rows: PROJ.map((p, i) => ({
            project: p,
            client: CLIENT[i],
            tcv: cr(REVISED_TCV[i]),
            revenue: cr(REV[i]),
            cost: cr(COST[i]),
            gp: cr(GP[i]),
            margin: MARGIN[i],
            forecast: [15.4, 15.2, 16.2, 14.8, 19.6, 2.7, 12.0, 13.6][i],
            status: MARGIN[i] < 8 ? 'Critical' : MARGIN[i] < 12 ? 'At Risk' : 'On Track',
          })),
        },
      }),
    ]),
  ],
  dashboard: {
    flow: [
      { label: 'Revenue', value: '₹ 214.5 Cr billed' },
      { label: 'Profitability', value: '13.3% gross margin' },
      { label: 'Projects', value: '8 active · 56% progress' },
      { label: 'Cash Flow', value: '+₹ 7.1 Cr FY YTD' },
      { label: 'Procurement', value: '₹ 69.5 Cr FY YTD' },
      { label: 'Workforce', value: '1,842 · 93.4% attendance' },
      { label: 'Safety', value: '3 incidents MTD · 0 LTI' },
    ],
    kpis: [
      { label: 'Revenue Billed', value: '₹ 214.5 Cr', delta: '+18.4% YoY', up: true, progress: 67, icon: 'ti-currency-rupee' },
      { label: 'Gross Profit', value: '₹ 28.5 Cr', sub: '13.3% margin', icon: 'ti-coins' },
      { label: 'Active Projects', value: '8', sub: '₹ 320 Cr contract value', progress: 56, icon: 'ti-building-skyscraper' },
      { label: 'Net Cash Flow (YTD)', value: '+₹ 7.1 Cr', sub: 'Balance ₹ 12.6 Cr', icon: 'ti-cash' },
      { label: 'Procurement Spend', value: '₹ 69.5 Cr', delta: '+6.6% MoM', up: true, good: false, icon: 'ti-shopping-cart' },
      { label: 'Workforce', value: '1,842', sub: '93.4% attendance', progress: 93, icon: 'ti-users' },
    ],
    charts: [
      { title: 'Revenue vs Cost — FY 2026-27 (₹ Cr)', kind: 'barline', categories: MONTHS, series: [{ name: 'Revenue', data: M_REV, type: 'bar' }, { name: 'Cost', data: M_COST, type: 'bar' }, { name: 'Gross profit', data: MONTHS.map((_, i) => round1(M_REV[i] - M_COST[i])), type: 'line' }], unit: '₹Cr', span: 2 },
      { title: 'Planned vs Actual Progress (%)', kind: 'bar', categories: P8, series: [{ name: 'Planned', data: PLAN }, { name: 'Actual', data: ACT }], unit: '%' },
      { title: 'Procurement Spend by Category', kind: 'donut', categories: SPEND_CAT, series: [{ name: '₹ Cr', data: SPEND }], unit: '₹Cr', subtitle: '₹ 69.5 Cr' },
      { title: 'Receivables Ageing (₹ Cr)', kind: 'bar', categories: ['0–30 days', '31–60 days', '61–90 days', '> 90 days'], series: [{ name: 'Outstanding', data: [17.6, 9.3, 5.4, 6.1] }], unit: '₹Cr' },
      { title: 'Cash Balance Trend (₹ Cr)', kind: 'area', categories: MONTHS, series: [{ name: 'Closing balance', data: M_CLOSE }], unit: '₹Cr' },
    ],
    rail: [
      {
        kind: 'health',
        title: 'Portfolio Health',
        items: [
          { label: 'On Track', value: 5, tone: 'green' },
          { label: 'At Risk', value: 2, tone: 'yellow' },
          { label: 'Delayed', value: 1, tone: 'red' },
          { label: 'Receivables > 90 days', value: '₹ 6.1 Cr', tone: 'red' },
          { label: 'Payables', value: '₹ 21.7 Cr', tone: 'blue' },
        ],
      },
      {
        kind: 'health',
        title: 'Safety — Month to Date',
        items: [
          { label: 'Incidents', value: 3, tone: 'yellow' },
          { label: 'Lost-time injuries (LTI)', value: 0, tone: 'green' },
          { label: 'Near misses reported', value: 11, tone: 'blue' },
          { label: 'Safe man-hours', value: '4.2 L', tone: 'green' },
        ],
      },
      {
        kind: 'dates',
        title: 'Scheduled Reports',
        items: [
          { date: '2026-09-28', title: 'Weekly MIS pack', sub: 'Management committee', done: true },
          { date: '2026-10-01', title: 'September P&L and cash flow', sub: 'Board of Directors' },
          { date: '2026-10-05', title: 'Monthly project review', sub: 'All project managers' },
          { date: '2026-10-10', title: 'Q2 FY27 executive review', sub: 'Promoters & lenders' },
        ],
      },
    ],
  },
  entities: [],
};

