import { addDays, DEMO_TODAY, toISO } from '@/lib/format';
import { approval, area, date, fieldView, group, money, num, page, pct, ref, register, select, status, text, lineItemsNoTax } from '../dsl';
import type { AppConfig, Row } from '../types';

const d = (n: number) => toISO(addDays(DEMO_TODAY, n));
const code = (prefix: string, i: number) => `${prefix}-${String(i + 1).padStart(3, '0')}`;
const SUB_NAME: Record<string, string> = {
  'SUB-001': 'Sai Ram Constructions', 'SUB-002': 'Precision MEP Services', 'SUB-003': 'Vertex Formwork Solutions', 'SUB-004': 'AquaSeal Waterproofing',
  'SUB-005': 'BrightSpark Electricals', 'SUB-006': 'Royal Tiling Works', 'SUB-007': 'Skyline Facade Systems', 'SUB-008': 'PipeMasters Plumbing',
  'SUB-009': 'FireSafe Systems', 'SUB-010': 'CoolAir HVAC Engineers', 'SUB-011': 'EarthMovers & Co', 'SUB-012': 'FinePaint Contractors',
};
const TRADES = ['Civil & Structure', 'MEP', 'Formwork', 'Waterproofing', 'Electrical', 'Flooring & Tiling', 'Facade', 'Plumbing', 'Fire Fighting', 'HVAC', 'Earthwork', 'Painting'];

/* ───────── Work packages (fixed rows: scope, unit, rate and value always agree) ───────── */
// [scope, subcontractor, project, trade, location, qty, unit, rate, start, finish, progress, status]
const wpData: [string, string, string, string, string, number, string, number, number, number, number, string][] = [
  ['RCC superstructure — Tower B L1–L12', 'SUB-001', 'PRJ-001', 'Civil & Structure', 'Tower B', 7400, 'Cum', 2850, -210, 75, 74, 'In Progress'],
  ['Electrical rough-in & wiring — Tower A', 'SUB-002', 'PRJ-001', 'MEP', 'Tower A · L1–L18', 14800, 'Point', 620, -120, 110, 41, 'In Progress'],
  ['Aluminium formwork — core & slabs L8–L20', 'SUB-003', 'PRJ-004', 'Formwork', 'Core & floor plates', 42000, 'Sqm', 185, -90, 95, 52, 'In Progress'],
  ['Basement & terrace waterproofing', 'SUB-004', 'PRJ-005', 'Waterproofing', 'Basement B1–B2', 6400, 'Sqm', 420, -40, 35, 38, 'Delayed'],
  ['Electrical installation — villa clusters 1–4', 'SUB-005', 'PRJ-002', 'Electrical', 'Clusters 1–4', 5200, 'Point', 580, -60, 70, 46, 'In Progress'],
  ['Vitrified flooring & wall tiling — Tower A', 'SUB-006', 'PRJ-001', 'Flooring & Tiling', 'Tower A', 42000, 'Sqm', 165, -30, 120, 22, 'In Progress'],
  ['Unitised façade glazing — east & south', 'SUB-007', 'PRJ-004', 'Facade', 'East & south faces', 9800, 'Sqm', 2150, -45, 140, 18, 'In Progress'],
  ['Plumbing & drainage — villa clusters', 'SUB-008', 'PRJ-002', 'Plumbing', 'Clusters 1–4', 22000, 'Mtr', 145, -75, 60, 43, 'In Progress'],
  ['Fire sprinkler & hydrant system', 'SUB-009', 'PRJ-007', 'Fire Fighting', 'Hospital blocks A–C', 8600, 'Mtr', 390, -50, 80, 35, 'In Progress'],
  ['HVAC ducting & VRF installation', 'SUB-010', 'PRJ-006', 'HVAC', 'Tower 2 · L1–L10', 18500, 'Sqm', 640, -100, 25, 81, 'In Progress'],
  ['Bulk excavation & disposal — Phase 2', 'SUB-011', 'PRJ-003', 'Earthwork', 'Phase 2 plots', 48000, 'Cum', 185, -160, -20, 100, 'Completed'],
  ['Internal & external painting — hotel', 'SUB-012', 'PRJ-008', 'Painting', 'Hotel block', 64000, 'Sqm', 48, 10, 90, 0, 'Not Started'],
  ['RCC structure — villa clusters 3 & 4', 'SUB-001', 'PRJ-002', 'Civil & Structure', 'Clusters 3–4', 2150, 'Cum', 2700, -80, 45, 58, 'In Progress'],
  ['Lift shaft & core walls — Lakeview', 'SUB-001', 'PRJ-005', 'Civil & Structure', 'Towers 1–2', 640, 'Cum', 3100, -20, 70, 12, 'On Hold'],
];
const wpRows: Row[] = wpData.map(([scope, subcontractor, project, trade, location, qty, unit, rate, start, finish, progress, st], i) => ({
  id: code('SWK', i), code: code('SWK', i), scope, subcontractor, project, trade, location, qty, unit, rate, value: qty * rate, start: d(start), finish: d(finish), progress, status: st,
}));

/* ───────── Work orders — one per work package (first 12) ───────── */
const WO_STATUS = ['In Progress', 'In Progress', 'In Progress', 'In Progress', 'Issued', 'Issued', 'In Progress', 'In Progress', 'Pending Approval', 'In Progress', 'Completed', 'Draft'];
const woRows: Row[] = wpData.slice(0, 12).map(([scope, subcontractor, project, , , qty, unit, rate, start, finish], i) => ({
  id: code('SWO', i), code: code('SWO', i), title: scope, subcontractor, project, workPackage: code('SWK', i),
  woDate: d(start - 14), start: d(start), finish: d(finish), value: qty * rate, advance: i % 3 === 0 ? 10 : 5, retention: 5,
  paymentTerms: i % 2 ? 'Monthly RA — 15 days after certification' : 'Monthly RA — 21 days after certification',
  scopeText: `${qty.toLocaleString('en-IN')} ${unit} @ ₹ ${rate.toLocaleString('en-IN')}/${unit} — labour, tools, supervision and consumables; free-issue cement and steel by company.`,
  status: WO_STATUS[i],
}));

/* ───────── Agreements — one per work order (first 10) ───────── */
const agreementRows: Row[] = woRows.slice(0, 10).map((wo, i) => ({
  id: code('SCA', i), code: code('SCA', i), title: `Subcontract Agreement — ${String(wo.title)}`, subcontractor: wo.subcontractor, project: wo.project, workOrder: wo.id,
  value: wo.value, retention: 5, dlp: 12, signedOn: d(-190 + i * 16), validTill: wo.finish, status: i === 8 ? 'Pending Approval' : i === 9 ? 'Draft' : 'Signed',
}));

/* ───────── RA bills (drive certificates, deductions, payments) ───────── */
// [WO index, RA no., gross, bill date offset, status]
const billData: [number, number, number, number, string][] = [
  [0, 6, 6420000, -12, 'Under Review'], [0, 5, 5980000, -42, 'Paid'], [1, 3, 1860000, -9, 'Submitted'], [2, 4, 1540000, -15, 'Certified'],
  [3, 2, 820000, -6, 'Submitted'], [4, 2, 910000, -20, 'Approved'], [5, 1, 1120000, -4, 'Submitted'], [6, 1, 3860000, -18, 'Certified'],
  [7, 3, 1070000, -26, 'Paid'], [8, 2, 960000, -11, 'Under Review'], [9, 5, 2240000, -35, 'Paid'], [10, 4, 1780000, -60, 'Paid'],
  [1, 2, 1640000, -40, 'Paid'], [3, 1, 540000, -38, 'Rejected'],
];
const billRows: Row[] = billData.map(([w, ra, gross, dt, st], i) => {
  const wo = woRows[w];
  const deductions = Math.round(gross * (0.05 + 0.01 + (Number(wo.advance) === 10 ? 0.1 : 0.05)));
  return {
    id: code('SB', i), code: code('SB', i), bill: `RA-${String(ra).padStart(2, '0')} · ${String(wo.title).split(' — ')[0]}`, subcontractor: wo.subcontractor, project: wo.project, workOrder: wo.id,
    billDate: d(dt), gross, deductions, net: gross - deductions, status: st,
  };
});

/* Measurement certificates follow bills (certification workflow). */
const CERT_STATUS: Record<string, string> = { Submitted: 'Pending Verification', 'Under Review': 'Under Review', Certified: 'Certified', Approved: 'Certified', Paid: 'Certified', Rejected: 'Rejected' };
const certificateRows: Row[] = billRows.map((b, i) => ({
  id: code('MC', i), code: code('MC', i), title: `MB certificate — ${String(b.bill)}`, subcontractor: b.subcontractor, workOrder: b.workOrder,
  period: ['1–30 Sep 2026', '1–31 Aug 2026', '1–30 Sep 2026', '1–30 Sep 2026', '1–30 Sep 2026', '1–31 Aug 2026', '1–30 Sep 2026', '1–31 Aug 2026', '1–31 Aug 2026', '1–30 Sep 2026', '1–31 Aug 2026', '1–31 Jul 2026', '1–31 Aug 2026', '1–31 Aug 2026'][i],
  measured: b.gross, certified: Math.round(Number(b.gross) * (b.status === 'Rejected' ? 0 : 0.97)), status: CERT_STATUS[String(b.status)],
}));

/* Deductions — retention, TDS and advance recovery on the first 6 bills. */
const deductionRows: Row[] = billRows.slice(0, 6).flatMap((b, i) => {
  const wo = woRows[billData[i][0]];
  const lines: [string, number][] = [['Retention 5%', 0.05], ['TDS 1% (Sec 194C)', 0.01], ['Advance Recovery', Number(wo.advance) / 100]];
  return lines.map(([type, rate]) => ({ type, rate, b }));
}).map(({ type, rate, b }, i) => ({
  id: code('SD', i), code: code('SD', i), title: `${type} — ${String(b.bill)}`, type, subcontractor: b.subcontractor, bill: b.id,
  amount: Math.round(Number(b.gross) * rate), date: b.billDate, status: b.status === 'Paid' ? 'Settled' : b.status === 'Approved' || b.status === 'Certified' ? 'Approved' : 'Pending',
}));
deductionRows.push(
  { id: 'SD-019', code: 'SD-019', title: 'Material recovery — excess steel wastage (Tower B)', type: 'Material Recovery', subcontractor: 'SUB-001', bill: 'SB-001', amount: 184000, date: d(-12), status: 'Disputed' },
  { id: 'SD-020', code: 'SD-020', title: 'Penalty — scaffold safety violation', type: 'Penalty', subcontractor: 'SUB-003', bill: 'SB-004', amount: 25000, date: d(-15), status: 'Approved' },
  { id: 'SD-021', code: 'SD-021', title: 'Labour cess 1% — BOCW', type: 'Labour Cess 1%', subcontractor: 'SUB-007', bill: 'SB-008', amount: 38600, date: d(-18), status: 'Approved' },
);

/* Payments — against paid / approved bills. */
const paymentRows: Row[] = billRows.filter((b) => ['Paid', 'Approved', 'Certified'].includes(String(b.status))).map((b, i) => ({
  id: code('SP', i), code: code('SP', i), reference: b.status === 'Paid' ? `UTR HDFCN2026${String(80412 + i * 137).padStart(7, '0')}` : `Payment run PR-10-${String(i + 1).padStart(2, '0')}`,
  subcontractor: b.subcontractor, bill: b.id, amount: b.net, mode: b.status === 'Paid' ? 'NEFT' : 'RTGS', paidOn: b.status === 'Paid' ? d(Number(-20 + i)) : d(6 + i),
  status: b.status === 'Paid' ? 'Paid' : i === 2 ? 'On Hold' : 'Scheduled',
}));

/* Site assignments — derived from work orders. */
const assignmentRows: Row[] = woRows.map((wo, i) => ({
  id: code('SSA', i), code: code('SSA', i), area: `${String(wpData[i][4])} — ${String(wpData[i][0]).split(' — ')[0]}`, subcontractor: wo.subcontractor,
  site: `SITE-00${String(wo.project).slice(-1)}`, workOrder: wo.id, workforce: [148, 62, 84, 26, 38, 44, 52, 34, 30, 46, 0, 0][i], supervisor: ['EMP-002', 'EMP-025', 'EMP-007', 'EMP-027', 'EMP-024', 'EMP-002', 'EMP-007', 'EMP-027', 'EMP-025', 'EMP-024', 'EMP-031', 'EMP-039'][i],
  from: wo.start, to: wo.finish, status: i === 10 ? 'Completed' : i === 11 ? 'Planned' : i === 4 || i === 5 ? 'Mobilizing' : 'Deployed',
}));

/* ───────── Measurement book lines ───────── */
const mbData: [string, string, string, number, number][] = [
  ['SWO-001 · Sai Ram Constructions — RCC Tower B (RA-06)', 'RCC M30 columns L9 — labour', 'Cum', 186, 2850],
  ['SWO-001 · Sai Ram Constructions — RCC Tower B (RA-06)', 'RCC M25 slab L9 — labour', 'Cum', 412, 2850],
  ['SWO-001 · Sai Ram Constructions — RCC Tower B (RA-06)', 'Reinforcement cutting, bending & fixing', 'MT', 84, 6200],
  ['SWO-001 · Sai Ram Constructions — RCC Tower B (RA-06)', 'Shuttering to slab & beams L9', 'Sqm', 3120, 210],
  ['SWO-001 · Sai Ram Constructions — RCC Tower B (RA-06)', 'Staircase flight L8–L9', 'Cum', 22, 3400],
  ['SWO-002 · Precision MEP Services — Electrical Tower A (RA-03)', 'Conduiting in slab L6–L8', 'Point', 1240, 620],
  ['SWO-002 · Precision MEP Services — Electrical Tower A (RA-03)', 'Wiring with FR cable 2.5 sq.mm', 'Point', 860, 380],
  ['SWO-002 · Precision MEP Services — Electrical Tower A (RA-03)', 'DB installation 12-way', 'Nos', 36, 1850],
  ['SWO-002 · Precision MEP Services — Electrical Tower A (RA-03)', 'Cable tray fixing 300 mm', 'Mtr', 420, 240],
  ['SWO-003 · Vertex Formwork Solutions — Metro Tower (RA-04)', 'Aluminium formwork slab L11', 'Sqm', 3480, 185],
  ['SWO-003 · Vertex Formwork Solutions — Metro Tower (RA-04)', 'Aluminium formwork core walls L11', 'Sqm', 2260, 185],
  ['SWO-003 · Vertex Formwork Solutions — Metro Tower (RA-04)', 'De-shuttering & cleaning', 'Sqm', 5740, 22],
  ['SWO-006 · Royal Tiling Works — Tower A flooring (RA-01)', 'Vitrified tile flooring 600×600', 'Sqm', 4620, 165],
  ['SWO-006 · Royal Tiling Works — Tower A flooring (RA-01)', 'Skirting 100 mm', 'Rmt', 3850, 45],
  ['SWO-006 · Royal Tiling Works — Tower A flooring (RA-01)', 'Wall tiles — toilets', 'Sqm', 1480, 190],
  ['SWO-006 · Royal Tiling Works — Tower A flooring (RA-01)', 'Granite kitchen platform', 'Rmt', 210, 650],
];
const mbRows: Row[] = mbData.map(([section, description, unit, qty, rate], i) => ({ id: code('MB', i), code: code('MB', i), section, description, unit, qty, rate }));

export const subcontractApp: AppConfig = {
  id: 'subcontract',
  name: 'Subcontract',
  icon: 'ti-users-group',
  description: 'Subcontractor master, work packages, contracts, execution, measurement and settlement',
  menus: [
    group('Subcontractor Master', 'ti-building-community', [
      page('Company Details', register('subcontractor')),
      page('Experience', fieldView('subcontractor', 'experience')),
      page('Certifications', register('subCertification')),
      page('Insurance', register('subInsurance')),
      page('Compliance', {
        type: 'checklist',
        title: 'Subcontractor Prequalification',
        subject: 'subcontractor',
        scored: true,
        groups: [
          { title: 'Technical', items: ['Minimum 5 years in the trade', 'At least 3 similar projects in the last 5 years', 'Qualified site supervisor / engineer on payroll', 'Own tools & tackles as per trade list'] },
          { title: 'Financial', items: ['Audited financials for the last 3 years', 'Annual turnover ≥ 2× work order value', 'Bank solvency certificate', 'No pending statutory dues'] },
          { title: 'Safety', items: ['Safety policy & HSE plan submitted', 'LTI rate below 0.5 in last 12 months', 'PPE issue records maintained', 'Workmen compensation policy valid'] },
          { title: 'Statutory', items: ['GST registration', 'PAN & MSME certificate', 'EPF & ESI registration', 'Labour licence under CLRA Act'] },
        ],
      }),
    ]),
    group('Work Package', 'ti-package', [
      page('Scope', register('subWorkPackage', { views: ['table', 'board'] })),
      page('Quantity', fieldView('subWorkPackage', 'qty')),
      page('Rate', fieldView('subWorkPackage', 'rate')),
    ]),
    group('Contract', 'ti-file-certificate', [
      page('Agreement', {
        type: 'print',
        entity: 'subAgreement',
        docTitle: 'Subcontract Agreement',
        lines: {
          columns: ['Sl.', 'Item', 'Unit', 'Qty', 'Rate (₹)', 'Amount (₹)'],
          rows: [
            [1, 'RCC M30 columns & shear walls — labour', 'Cum', '2,950', '2,850', '84,07,500'],
            [2, 'RCC M25 beams & slabs — labour', 'Cum', '4,450', '2,850', '1,26,82,500'],
            [3, 'Reinforcement cutting, bending & fixing', 'MT', '480', '6,200', '29,76,000'],
            [4, 'Shuttering to slabs, beams & columns', 'Sqm', '38,000', '210', '79,80,000'],
          ],
        },
        totals: [
          { label: 'Contract value (excl. GST)', value: '₹ 3,20,46,000' },
          { label: 'Retention', value: '5% of each RA bill' },
          { label: 'Mobilisation advance', value: '10% against bank guarantee' },
          { label: 'Defect liability period', value: '12 months', bold: true },
        ],
        signatures: ['For the Contractor', 'For the Subcontractor', 'Witness 1', 'Witness 2'],
      }),
      page('Work Order', register('subWorkOrder', { tabs: { field: 'status', values: ['Draft', 'Pending Approval', 'Issued', 'In Progress', 'Completed'] } })),
      page('Terms', register('subTerms')),
    ]),
    group('Execution', 'ti-hammer', [
      page('Site Assignment', register('subSiteAssignment')),
      page('Measurement', lineItemsNoTax('subMeasurement', 'Measurement Book — September 2026 RA bills')),
      page('Work Completion', {
        type: 'analysis',
        title: 'Work Completion',
        kpis: [
          { label: 'Work order value', value: '₹ 39.8 Cr', sub: '12 active work orders', icon: 'ti-file-certificate' },
          { label: 'Work completed (value)', value: '₹ 21.6 Cr', progress: 54, icon: 'ti-circle-check' },
          { label: 'Packages delayed', value: '1', sub: 'Basement waterproofing — Lakeview', icon: 'ti-clock-exclamation' },
          { label: 'Avg. performance score', value: '82 / 100', delta: '+3', up: true, icon: 'ti-star' },
        ],
        charts: [
          { title: 'Physical Progress by Work Package (%)', kind: 'hbar', categories: wpData.map((w) => w[0].split(' — ')[0]), series: [{ name: 'Progress', data: wpData.map((w) => w[10]) }], unit: '%', span: 2, height: 360 },
          { title: 'Subcontractor Scores', kind: 'bar', categories: ['Sai Ram', 'Precision MEP', 'Vertex', 'AquaSeal', 'BrightSpark', 'Royal Tiling'], series: [{ name: 'Quality', data: [70, 77, 84, 91, 70, 77] }, { name: 'Safety', data: [72, 83, 94, 79, 90, 75] }], unit: '%' },
        ],
        table: {
          title: 'Completion Status by Work Order',
          columns: [
            { key: 'wo', label: 'Work Order', type: 'code' },
            { key: 'scope', label: 'Scope' },
            { key: 'sub', label: 'Subcontractor' },
            { key: 'value', label: 'WO Value', type: 'currency' },
            { key: 'progress', label: 'Progress', type: 'percent' },
            { key: 'status', label: 'Status', type: 'status' },
          ],
          rows: wpData.slice(0, 12).map((w, i) => ({ wo: code('SWO', i), scope: w[0], sub: SUB_NAME[w[1]], value: w[5] * w[7], progress: w[10], status: w[11] })),
        },
      }),
      page('Certification', approval('subCertificate', ['Site Engineer', 'QS Verification', 'Project Manager', 'Accounts'])),
    ]),
    group('Settlement', 'ti-cash', [
      page('Subcontractor Bill', register('subBill', { tabs: { field: 'status', values: ['Submitted', 'Under Review', 'Certified', 'Approved', 'Paid', 'Rejected'] } })),
      page('Deductions', register('subDeduction')),
      page('Payment', register('subPayment')),
    ]),
  ],
  dashboard: {
    flow: [
      { label: 'Work Packages', value: '14 packages' },
      { label: 'Work Orders', value: '12 · ₹ 39.8 Cr' },
      { label: 'Measurement', value: '₹ 3.2 Cr this month' },
      { label: 'Bills', value: '5 pending certification' },
      { label: 'Payment', value: '₹ 1.9 Cr due' },
    ],
    kpis: [
      { label: 'Active Subcontractors', value: '11', sub: '1 under review', icon: 'ti-users-group' },
      { label: 'Committed (Work Orders)', value: '₹ 39.8 Cr', progress: 80, sub: 'of ₹ 49.5 Cr subcontract budget', icon: 'ti-file-certificate' },
      { label: 'Certified to Date', value: '₹ 33.5 Cr', delta: '+₹ 3.2 Cr', up: true, icon: 'ti-circle-check' },
      { label: 'Bills Pending Certification', value: '5', delta: '+2', up: true, good: false, icon: 'ti-hourglass' },
      { label: 'Retention Held', value: '₹ 1.68 Cr', icon: 'ti-lock' },
      { label: 'Avg. Performance Score', value: '82 / 100', progress: 82, icon: 'ti-star' },
    ],
    charts: [
      {
        title: 'Monthly Certified vs Paid (₹ Cr)',
        kind: 'barline',
        categories: ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'],
        series: [
          { name: 'Certified', data: [2.6, 2.9, 3.1, 3.4, 3.6, 3.2], type: 'bar' },
          { name: 'Paid', data: [2.3, 2.7, 2.8, 3.2, 3.3, 2.1], type: 'line' },
        ],
        unit: '₹Cr',
        span: 2,
      },
      { title: 'Bill Status', kind: 'donut', categories: ['Submitted', 'Under Review', 'Certified', 'Approved', 'Paid', 'Rejected'], series: [{ name: 'Bills', data: [3, 2, 2, 1, 5, 1] }], tones: ['blue', 'yellow', 'green', 'green', 'green', 'red'] },
      { title: 'Work Order Value by Trade (₹ Cr)', kind: 'hbar', categories: ['Civil & Structure', 'Facade', 'HVAC', 'Formwork', 'Electrical / MEP', 'Earthwork', 'Plumbing & Fire', 'Finishes'], series: [{ name: 'WO value', data: [14.9, 2.1, 1.2, 0.8, 1.2, 0.9, 0.7, 1.0] }], unit: '₹Cr', span: 2 },
      { title: 'Performance — Quality vs Safety', kind: 'bar', categories: ['Sai Ram', 'Precision MEP', 'Vertex', 'AquaSeal', 'BrightSpark', 'Royal Tiling'], series: [{ name: 'Quality', data: [70, 77, 84, 91, 70, 77] }, { name: 'Safety', data: [72, 83, 94, 79, 90, 75] }], unit: '%' },
    ],
    table: { entity: 'subWorkOrder', title: 'Active Work Orders', columns: ['title', 'subcontractor', 'project', 'value', 'finish', 'status'], limit: 8 },
    rail: [
      {
        kind: 'health',
        title: 'Work Package Health',
        items: [
          { label: 'In Progress', value: 10, tone: 'blue' },
          { label: 'Completed', value: 1, tone: 'green' },
          { label: 'On Hold', value: 1, tone: 'yellow' },
          { label: 'Delayed', value: 1, tone: 'red' },
        ],
      },
      {
        kind: 'dates',
        title: 'Expiring Insurance & Certificates',
        items: [
          { date: d(6), title: 'Workmen compensation policy', sub: 'Vertex Formwork Solutions' },
          { date: d(14), title: 'ISO 45001 certificate', sub: 'Sai Ram Constructions' },
          { date: d(21), title: 'Contractor all risk policy', sub: 'Skyline Facade Systems' },
          { date: d(30), title: 'Electrical contractor licence', sub: 'BrightSpark Electricals' },
        ],
      },
      {
        kind: 'list',
        title: 'Recent Bills',
        items: [
          { avatar: 'Sai Prasad', title: 'RA-06 · RCC superstructure', sub: 'Sai Ram Constructions · ₹ 64.2 L', status: 'Under Review' },
          { avatar: 'Mukesh', title: 'RA-03 · Electrical rough-in', sub: 'Precision MEP Services · ₹ 18.6 L', status: 'Submitted' },
          { avatar: 'Anbu', title: 'RA-04 · Aluminium formwork', sub: 'Vertex Formwork Solutions · ₹ 15.4 L', status: 'Certified' },
          { avatar: 'Rajan', title: 'RA-01 · Vitrified flooring', sub: 'Royal Tiling Works · ₹ 11.2 L', status: 'Submitted' },
        ],
      },
    ],
  },
  entities: [
    {
      id: 'subCertification',
      label: 'Certification',
      plural: 'Certifications',
      app: 'subcontract',
      codePrefix: 'SCT',
      titleField: 'name',
      count: 16,
      fields: [
        text('name', 'Certification', ['ISO 9001:2015 Quality Management', 'ISO 45001:2018 OH&S', 'CIDC contractor grading — Grade A', 'Labour licence (CLRA Act)', 'EPF registration', 'ESI registration', 'GST registration', 'MSME Udyam certificate', 'Electrical contractor licence — Class A', 'Fire & safety licence (TNFRS)', 'ISO 14001:2015 Environmental', 'BOCW registration', 'Plumbing licence — CMWSSB', 'Façade system installer certificate', 'Waterproofing applicator certificate', 'HVAC OEM authorised installer'], { required: true }),
        ref('subcontractor', 'Subcontractor', 'subcontractor', { required: true }),
        text('certNo', 'Certificate No.', ['QMS-IN-24118', 'OHS-IN-7731', 'CIDC/A/2291', 'CLRA/TN/88412', 'TNMAS0041221', 'ESIC-51-00123', '33AAKFS1234F1ZP', 'UDYAM-TN-02-0041', 'EC/A/0921', 'TNFRS/FL/338', 'EMS-IN-5512', 'BOCW/CHN/7719', 'CMWSSB/PL/402', 'FSI-CERT-118', 'WPA-2026-091', 'OEM-AUTH-6621']),
        text('issuer', 'Issued By', ['Bureau Veritas', 'TÜV SÜD', 'CIDC', 'Labour Department, TN', 'EPFO', 'ESIC', 'GST Department', 'Ministry of MSME', 'Chief Electrical Inspectorate', 'TN Fire & Rescue Services', 'Bureau Veritas', 'Labour Welfare Board', 'CMWSSB', 'System supplier', 'Chemical manufacturer', 'VRF manufacturer']),
        date('issued', 'Issued On', [-900, -60]),
        date('expiry', 'Valid Until', [-10, 720]),
        status(['Valid', 'Expiring Soon', 'Expired', 'Under Review'], { gen: ['Valid', 'Expiring Soon', 'Valid', 'Valid', 'Valid', 'Valid', 'Valid', 'Valid', 'Expiring Soon', 'Valid', 'Expired', 'Valid', 'Under Review', 'Valid', 'Valid', 'Valid'] }),
      ],
    },
    {
      id: 'subInsurance',
      label: 'Insurance Policy',
      plural: 'Insurance Policies',
      app: 'subcontract',
      codePrefix: 'SIN',
      titleField: 'policyNo',
      count: 14,
      fields: [
        text('policyNo', 'Policy No.', ['WC/2026/448120', 'CAR/2026/77012', 'TPL/2026/10933', 'GPA/2026/55841', 'WC/2026/448377', 'CAR/2026/77140', 'WC/2026/449002', 'TPL/2026/11021', 'GPA/2026/55990', 'WC/2026/449215', 'CAR/2026/77388', 'WC/2026/449540', 'TPL/2026/11204', 'GPA/2026/56117'], { required: true }),
        select('policyType', 'Policy Type', ['Workmen Compensation', 'Contractor All Risk', 'Third Party Liability', 'Group Personal Accident'], { gen: ['Workmen Compensation', 'Contractor All Risk', 'Third Party Liability', 'Group Personal Accident', 'Workmen Compensation', 'Contractor All Risk', 'Workmen Compensation', 'Third Party Liability', 'Group Personal Accident', 'Workmen Compensation', 'Contractor All Risk', 'Workmen Compensation', 'Third Party Liability', 'Group Personal Accident'] }),
        ref('subcontractor', 'Subcontractor', 'subcontractor', { required: true }),
        text('insurer', 'Insurer', ['New India Assurance', 'ICICI Lombard', 'Bajaj Allianz', 'HDFC ERGO', 'United India Insurance', 'Tata AIG', 'New India Assurance', 'ICICI Lombard', 'Bajaj Allianz', 'HDFC ERGO', 'Tata AIG', 'United India Insurance', 'ICICI Lombard', 'New India Assurance']),
        money('sumInsured', 'Sum Insured', [2500000, 50000000]),
        money('premium', 'Premium', [18000, 420000]),
        num('workers', 'Workers Covered', [20, 260]),
        date('validTill', 'Valid Until', [-8, 330]),
        status(['Valid', 'Expiring Soon', 'Expired'], { gen: ['Valid', 'Valid', 'Valid', 'Expiring Soon', 'Valid', 'Valid', 'Expiring Soon', 'Valid', 'Valid', 'Expired', 'Valid', 'Valid', 'Valid', 'Valid'] }),
      ],
    },
    {
      id: 'subWorkPackage',
      label: 'Subcontract Work Package',
      plural: 'Subcontract Work Packages',
      app: 'subcontract',
      codePrefix: 'SWK',
      titleField: 'scope',
      form: 'page',
      fields: [
        text('scope', 'Scope of Work', undefined, { required: true }),
        ref('subcontractor', 'Subcontractor', 'subcontractor', { required: true }),
        ref('project', 'Project', 'project', { required: true }),
        num('qty', 'Quantity'),
        text('unit', 'Unit'),
        money('rate', 'Rate'),
        money('value', 'Package Value'),
        status(['Not Started', 'In Progress', 'Completed', 'Delayed', 'On Hold']),
        select('trade', 'Trade', TRADES, { list: false }),
        text('location', 'Location', undefined, { list: false }),
        date('start', 'Start', undefined, { list: false }),
        date('finish', 'Finish', undefined, { list: false }),
        pct('progress', 'Progress', undefined, { list: false }),
      ],
      rows: wpRows,
    },
    {
      id: 'subAgreement',
      label: 'Subcontract Agreement',
      plural: 'Subcontract Agreements',
      app: 'subcontract',
      codePrefix: 'SCA',
      titleField: 'title',
      fields: [
        text('title', 'Agreement', undefined, { required: true }),
        ref('subcontractor', 'Subcontractor', 'subcontractor', { required: true }),
        ref('project', 'Project', 'project'),
        ref('workOrder', 'Work Order', 'subWorkOrder'),
        money('value', 'Contract Value'),
        pct('retention', 'Retention'),
        num('dlp', 'Defect Liability', undefined, { unit: 'months' }),
        date('signedOn', 'Signed On'),
        date('validTill', 'Valid Until', undefined, { list: false }),
        status(['Draft', 'Pending Approval', 'Signed', 'Expired']),
      ],
      rows: agreementRows,
    },
    {
      id: 'subWorkOrder',
      label: 'Work Order',
      plural: 'Work Orders',
      app: 'subcontract',
      codePrefix: 'SWO',
      titleField: 'title',
      form: 'page',
      sections: [
        { id: 'basic', title: 'Work Order Details', icon: 'ti-file-certificate' },
        { id: 'scope', title: 'Scope & Schedule', icon: 'ti-list-details' },
        { id: 'commercial', title: 'Commercial Terms', icon: 'ti-currency-rupee' },
      ],
      tabs: ['Financial'],
      fields: [
        text('title', 'Work Order Scope', undefined, { required: true, section: 'basic' }),
        ref('subcontractor', 'Subcontractor', 'subcontractor', { required: true, section: 'basic' }),
        ref('project', 'Project', 'project', { required: true, section: 'basic' }),
        money('value', 'WO Value', undefined, { required: true, section: 'commercial' }),
        date('start', 'Start', undefined, { section: 'scope' }),
        date('finish', 'Finish', undefined, { section: 'scope' }),
        status(['Draft', 'Pending Approval', 'Issued', 'In Progress', 'Completed', 'Cancelled'], { section: 'basic' }),
        ref('workPackage', 'Work Package', 'subWorkPackage', { section: 'basic', list: false }),
        date('woDate', 'WO Date', undefined, { section: 'basic', list: false }),
        area('scopeText', 'Scope Description', undefined, { section: 'scope' }),
        pct('advance', 'Mobilisation Advance', undefined, { section: 'commercial', list: false }),
        pct('retention', 'Retention', undefined, { section: 'commercial', list: false }),
        select('paymentTerms', 'Payment Terms', ['Monthly RA — 15 days after certification', 'Monthly RA — 21 days after certification', 'Milestone based'], { section: 'commercial', list: false }),
      ],
      rows: woRows,
    },
    {
      id: 'subTerms',
      label: 'Subcontract Term',
      plural: 'Subcontract Terms',
      app: 'subcontract',
      codePrefix: 'STC',
      titleField: 'clause',
      count: 12,
      fields: [
        text('clause', 'Clause', ['Retention money — 5% of each RA bill', 'Mobilisation advance against bank guarantee', 'Monthly RA billing cycle', 'Liquidated damages — 0.5% per week', 'Defect liability period — 12 months', 'Safety non-compliance penalties', 'Free-issue material & wastage limits', 'Workmen compensation insurance', 'Labour law & statutory compliance', 'Termination for default', 'Price escalation — not applicable', 'Dispute resolution — arbitration at Chennai'], { required: true }),
        select('category', 'Category', ['Payment', 'Retention', 'Penalty / LD', 'Quality', 'Safety', 'Insurance', 'Statutory', 'Termination', 'Dispute'], { gen: ['Retention', 'Payment', 'Payment', 'Penalty / LD', 'Quality', 'Safety', 'Quality', 'Insurance', 'Statutory', 'Termination', 'Payment', 'Dispute'] }),
        area('text', 'Clause Text', ['5% retained from each RA bill; 50% released on completion and 50% after DLP.', '10% advance released against unconditional BG; recovered pro-rata from RA bills.', 'RA bills submitted by 25th; certified within 7 days; paid within 15 days.', 'Delay beyond milestone dates attracts LD of 0.5% per week, capped at 5%.', 'Subcontractor to rectify defects at own cost during 12 months DLP.']),
        select('appliesTo', 'Applies To', ['All trades', 'Civil & Structure', 'MEP', 'Finishes'], { gen: ['All trades', 'All trades', 'All trades', 'All trades', 'All trades', 'All trades', 'Civil & Structure', 'All trades', 'All trades', 'All trades', 'All trades', 'All trades'] }),
        num('reference', 'GCC Clause No.', [4, 42]),
        status(['Active', 'Under Review', 'Inactive'], { gen: ['Active', 'Active', 'Active', 'Active', 'Active', 'Active', 'Under Review', 'Active', 'Active', 'Active', 'Inactive', 'Active'] }),
      ],
    },
    {
      id: 'subSiteAssignment',
      label: 'Site Assignment',
      plural: 'Site Assignments',
      app: 'subcontract',
      codePrefix: 'SSA',
      titleField: 'area',
      fields: [
        text('area', 'Work Area', undefined, { required: true }),
        ref('subcontractor', 'Subcontractor', 'subcontractor', { required: true }),
        ref('site', 'Site', 'site', { required: true }),
        ref('workOrder', 'Work Order', 'subWorkOrder'),
        num('workforce', 'Workforce'),
        ref('supervisor', 'Our Supervisor', 'employee'),
        date('from', 'From'),
        date('to', 'To', undefined, { list: false }),
        status(['Planned', 'Mobilizing', 'Deployed', 'Completed']),
      ],
      rows: assignmentRows,
    },
    {
      id: 'subMeasurement',
      label: 'Measurement Line',
      plural: 'Measurement Lines',
      app: 'subcontract',
      codePrefix: 'MB',
      titleField: 'description',
      fields: [
        select('section', 'Work Order / RA', [...new Set(mbData.map((x) => x[0]))]),
        text('description', 'Measured Item', undefined, { required: true }),
        text('unit', 'Unit'),
        num('qty', 'Measured Qty'),
        money('rate', 'WO Rate'),
      ],
      rows: mbRows,
    },
    {
      id: 'subCertificate',
      label: 'Measurement Certificate',
      plural: 'Measurement Certificates',
      app: 'subcontract',
      codePrefix: 'MC',
      titleField: 'title',
      fields: [
        text('title', 'Certificate', undefined, { required: true }),
        ref('subcontractor', 'Subcontractor', 'subcontractor'),
        ref('workOrder', 'Work Order', 'subWorkOrder'),
        text('period', 'Measurement Period'),
        money('measured', 'Measured Value'),
        money('certified', 'Certified Value'),
        status(['Pending Verification', 'Under Review', 'Certified', 'Rejected']),
      ],
      rows: certificateRows,
    },
    {
      id: 'subBill',
      label: 'Subcontractor Bill',
      plural: 'Subcontractor Bills',
      app: 'subcontract',
      codePrefix: 'SB',
      titleField: 'bill',
      form: 'page',
      tabs: ['Financial'],
      fields: [
        text('bill', 'Bill', undefined, { required: true }),
        ref('subcontractor', 'Subcontractor', 'subcontractor', { required: true }),
        ref('project', 'Project', 'project'),
        ref('workOrder', 'Work Order', 'subWorkOrder', { list: false }),
        date('billDate', 'Bill Date'),
        money('gross', 'Gross Amount'),
        money('deductions', 'Deductions'),
        money('net', 'Net Payable'),
        status(['Submitted', 'Under Review', 'Certified', 'Approved', 'Paid', 'Rejected']),
      ],
      rows: billRows,
    },
    {
      id: 'subDeduction',
      label: 'Deduction',
      plural: 'Deductions',
      app: 'subcontract',
      codePrefix: 'SD',
      titleField: 'title',
      fields: [
        text('title', 'Deduction', undefined, { required: true }),
        select('type', 'Type', ['Retention 5%', 'TDS 1% (Sec 194C)', 'Advance Recovery', 'Material Recovery', 'Penalty', 'Labour Cess 1%', 'Debit Note']),
        ref('subcontractor', 'Subcontractor', 'subcontractor'),
        ref('bill', 'Bill', 'subBill'),
        money('amount', 'Amount'),
        date('date', 'Date'),
        status(['Pending', 'Approved', 'Settled', 'Disputed']),
      ],
      rows: deductionRows,
    },
    {
      id: 'subPayment',
      label: 'Payment',
      plural: 'Payments',
      app: 'subcontract',
      codePrefix: 'SP',
      titleField: 'reference',
      fields: [
        text('reference', 'Payment Reference', undefined, { required: true }),
        ref('subcontractor', 'Subcontractor', 'subcontractor'),
        ref('bill', 'Bill', 'subBill'),
        money('amount', 'Amount'),
        select('mode', 'Mode', ['NEFT', 'RTGS', 'Cheque']),
        date('paidOn', 'Paid / Due On'),
        status(['Scheduled', 'Paid', 'On Hold', 'Failed']),
      ],
      rows: paymentRows,
    },
  ],
};
