import { approval, area, date, fieldView, group, leaf, money, multi, num, page, pct, ref, register, select, status, text, lineItemsNoTax } from '../dsl';
import type { AppConfig, Row } from '../types';

const CR = 1e7;
const pad = (n: number) => String(n).padStart(3, '0');
const P = ['Skyline Apartments', 'Riverside Villas', 'Greenfield Township', 'Metro Office Tower', 'Lakeview Residency', 'Orbit Tech Park Phase II', 'Harbour View Hospital', 'Sunrise Business Hotel'];

/* Contract commercial terms per project (mirrors CON-001…008) */
const RET = [5, 5, 10, 5, 10, 5, 10, 5];
const ADV = [10, 10, 5, 10, 5, 10, 15, 10];
const VALUE_CR = [85, 42, 58, 64, 28, 18, 15, 10];
const BTD_CR = [57.8, 18.9, 18.6, 35.2, 7.8, 16.6, 12.6, 7.6]; // billed to date incl. September bills
const SEP_CR = [6.2, 2.85, 3.6, 5.4, 1.95, 2.1, 2.4, 1.6]; // September RA bills — ₹ 26.1 Cr

/* ───────── RA bills: Sep (8) + Aug (8) + Oct draft ───────── */
// raNo, project index, period, bill date, gross ₹Cr, status, other deductions ₹
const raData: [string, number, string, string, number, string, number][] = [
  ['RA-18', 0, 'Sep 2026', '2026-09-26', 6.2, 'Under Review', 185000],
  ['RA-15', 1, 'Sep 2026', '2026-09-18', 2.85, 'Certified', 42000],
  ['RA-12', 2, 'Sep 2026', '2026-09-27', 3.6, 'Submitted', 96000],
  ['RA-17', 3, 'Sep 2026', '2026-09-25', 5.4, 'Under Review', 128000],
  ['RA-09', 4, 'Sep 2026', '2026-09-28', 1.95, 'Submitted', 0],
  ['RA-22', 5, 'Sep 2026', '2026-09-16', 2.1, 'Certified', 35000],
  ['RA-16', 6, 'Sep 2026', '2026-09-15', 2.4, 'Certified', 64000],
  ['RA-13', 7, 'Sep 2026', '2026-09-14', 1.6, 'Certified', 18000],
  ['RA-17', 0, 'Aug 2026', '2026-08-26', 5.8, 'Paid', 162000],
  ['RA-14', 1, 'Aug 2026', '2026-08-19', 2.6, 'Paid', 38000],
  ['RA-11', 2, 'Aug 2026', '2026-08-27', 3.1, 'Certified', 0],
  ['RA-16', 3, 'Aug 2026', '2026-08-25', 4.9, 'Certified', 0],
  ['RA-08', 4, 'Aug 2026', '2026-08-28', 1.7, 'Rejected', 0],
  ['RA-21', 5, 'Aug 2026', '2026-08-18', 2.3, 'Paid', 26000],
  ['RA-15', 6, 'Aug 2026', '2026-08-16', 2.2, 'Certified', 0],
  ['RA-12', 7, 'Aug 2026', '2026-08-14', 1.4, 'Paid', 15000],
  ['RA-23', 5, 'Oct 2026 (Final)', '2026-10-05', 0.9, 'Draft', 0],
];
const raRows: Row[] = raData.map(([raNo, p, period, billDate, grossCr, st, other], i) => {
  const gross = Math.round(grossCr * CR);
  const cumCr = period.startsWith('Sep') ? BTD_CR[p] : period.startsWith('Aug') ? BTD_CR[p] - SEP_CR[p] : BTD_CR[p] + grossCr;
  const advance = Math.round((gross * ADV[p]) / 100);
  const retention = Math.round((gross * RET[p]) / 100);
  const tds = Math.round(gross * 0.02);
  const deductions = Math.round(gross * 0.01) + other; // BOCW cess 1% + client back-charges
  const gst = Math.round(gross * 0.18);
  return {
    id: `RAB-${pad(i + 1)}`,
    code: `RAB-${pad(i + 1)}`,
    title: `${raNo} — ${P[p]}`,
    raNo,
    project: `PRJ-${pad(p + 1)}`,
    contract: `CON-${pad(p + 1)}`,
    period,
    billDate,
    gross,
    cumulative: Math.round(cumCr * CR),
    advance,
    retention,
    tds,
    deductions,
    gst,
    net: gross + gst - advance - retention - tds - deductions,
    status: st,
  };
});
const booked = raRows.filter((r) => r.status !== 'Rejected' && r.status !== 'Draft');
const pIdx = (r: Row) => Number(String(r.project).slice(-3)) - 1;

const advRecoveryRows: Row[] = booked.map((r, i) => {
  const p = pIdx(r);
  const given = Math.round((VALUE_CR[p] * CR * ADV[p]) / 100);
  const toDate = Math.round((Number(r.cumulative) * ADV[p]) / 100);
  return {
    id: `ARC-${pad(i + 1)}`,
    code: `ARC-${pad(i + 1)}`,
    raBill: r.id,
    project: r.project,
    given,
    rate: ADV[p],
    thisBill: r.advance,
    toDate,
    balance: given - toDate,
    status: given - toDate <= 0 ? 'Completed' : 'In Progress',
  };
});

const retentionRows: Row[] = booked.map((r, i) => {
  const p = pIdx(r);
  return {
    id: `BRT-${pad(i + 1)}`,
    code: `BRT-${pad(i + 1)}`,
    raBill: r.id,
    project: r.project,
    rate: RET[p],
    thisBill: r.retention,
    toDate: Math.round((Number(r.cumulative) * RET[p]) / 100),
    release: RET[p] === 10 ? '50% on completion · 50% after DLP' : '100% after DLP against BG',
    status: 'Active',
  };
});

const taxRows: Row[] = booked.map((r, i) => ({
  id: `TAX-${pad(i + 1)}`,
  code: `TAX-${pad(i + 1)}`,
  raBill: r.id,
  project: r.project,
  taxable: r.gross,
  cgst: Math.round(Number(r.gst) / 2),
  sgst: Number(r.gst) - Math.round(Number(r.gst) / 2),
  tds: r.tds,
  bocw: Math.round(Number(r.gross) * 0.01),
  returnPeriod: `GSTR-1 ${r.period}`,
  status: String(r.period).startsWith('Sep') ? 'Pending' : 'Paid',
}));

/* ───────── Client invoices — outstanding ₹ 27.7 Cr (+ ₹ 10.7 Cr retention = ₹ 38.4 Cr receivables) ───────── */
const raNet = (id: string) => Number(raRows.find((r) => r.id === id)?.net ?? 0);
// invoice no, RA bill ref (id or literal RA no.), project index, invoice date, due date, amount (0 = from RA bill), received, status
const invData: [string, string, number, string, string, number, number, string][] = [
  ['INV/2026-27/0163', 'RAB-002', 1, '2026-09-24', '2026-10-15', 0, 0, 'Due'],
  ['INV/2026-27/0162', 'RAB-006', 5, '2026-09-22', '2026-10-22', 0, 0, 'Due'],
  ['INV/2026-27/0161', 'RAB-007', 6, '2026-09-21', '2026-10-21', 0, 0, 'Due'],
  ['INV/2026-27/0160', 'RAB-008', 7, '2026-09-20', '2026-10-05', 0, 0, 'Due'],
  ['INV/2026-27/0156', 'RAB-011', 2, '2026-09-02', '2026-10-02', 0, 0, 'Due'],
  ['INV/2026-27/0155', 'RAB-012', 3, '2026-08-30', '2026-09-29', 0, 25000000, 'Partially Paid'],
  ['INV/2026-27/0154', 'RAB-015', 6, '2026-08-22', '2026-09-21', 0, 0, 'Overdue'],
  ['INV/2026-27/0153', 'RAB-009', 0, '2026-08-31', '2026-09-30', 0, -1, 'Paid'],
  ['INV/2026-27/0152', 'RAB-010', 1, '2026-08-24', '2026-09-14', 0, -1, 'Paid'],
  ['INV/2026-27/0151', 'RAB-014', 5, '2026-08-21', '2026-09-20', 0, -1, 'Paid'],
  ['INV/2026-27/0150', 'RAB-016', 7, '2026-08-18', '2026-09-02', 0, -1, 'Paid'],
  ['INV/2026-27/0141', 'RA-10 (Jul)', 2, '2026-07-31', '2026-08-30', 33600000, 0, 'Overdue'],
  ['INV/2026-27/0139', 'RA-15 (Jul)', 3, '2026-07-30', '2026-08-29', 47200000, 14240000, 'Overdue'],
  ['INV/2026-27/0138', 'RA-07 (Jul)', 4, '2026-07-30', '2026-09-13', 18900000, 0, 'Overdue'],
  ['INV/2026-27/0127', 'RA-09 (Jun)', 2, '2026-06-30', '2026-07-30', 29800000, 0, 'Overdue'],
];
const invoiceRows: Row[] = invData.map(([invoiceNo, raRef, p, invoiceDate, dueDate, amt, rec, st], i) => {
  const amount = amt || raNet(raRef);
  const received = rec < 0 ? amount : rec;
  const ra = raRows.find((r) => r.id === raRef);
  return {
    id: `CI-${pad(i + 1)}`,
    code: `CI-${pad(i + 1)}`,
    invoiceNo,
    raBillNo: ra ? String(ra.raNo) : raRef,
    project: `PRJ-${pad(p + 1)}`,
    client: `CL-${pad(p + 1)}`,
    invoiceDate,
    dueDate,
    amount,
    received,
    outstanding: amount - received,
    status: st,
  };
});

/* ───────── Measurement book — MB/SKY/RA-18, Skyline Apartments, Sep 2026 ───────── */
const mbData: [string, string, string, string, number, number, string][] = [
  ['Substructure', 'Basement waterproofing — balance area, Basement 2', 'B2 — grid A–D', 'Sqm', 1850, 1150, 'Certified'],
  ['Superstructure — Tower B', 'RCC M25 slab — Level 14', 'Tower B · L14', 'Cum', 412, 7650, 'Under Review'],
  ['Superstructure — Tower B', 'RCC M30 columns & shear walls — L14 to L15', 'Tower B · L14–L15', 'Cum', 168, 8250, 'Under Review'],
  ['Superstructure — Tower B', 'Reinforcement Fe500D — L14 slab & L15 columns', 'Tower B · L14–L15', 'MT', 86.4, 72500, 'Submitted'],
  ['Superstructure — Tower B', 'Aluminium formwork — L14 slab', 'Tower B · L14', 'Sqm', 2640, 480, 'Certified'],
  ['Masonry & Plaster', 'AAC block masonry 200 mm — L6 to L9', 'Tower A · L6–L9', 'Cum', 486, 5950, 'Certified'],
  ['Masonry & Plaster', 'Internal plaster 12 mm — L3 to L6', 'Tower A · L3–L6', 'Sqm', 18400, 260, 'Certified'],
  ['Masonry & Plaster', 'External plaster 20 mm — east elevation', 'Tower A · east face', 'Sqm', 4200, 420, 'Under Review'],
  ['Finishes', 'Vitrified tile flooring 600×600 — L1 to L3', 'Tower A · L1–L3', 'Sqm', 5600, 1250, 'Submitted'],
  ['Finishes', 'Interior emulsion — L1 to L2', 'Tower A · L1–L2', 'Sqm', 16800, 145, 'Draft'],
  ['Finishes', 'uPVC windows with glazing — L1 to L4', 'Tower A · L1–L4', 'Sqm', 720, 3650, 'Rejected'],
  ['MEP', 'Electrical wiring — 48 flats, stage 2 (60%)', 'Tower A · A-101 to A-412', 'Nos', 28.8, 185000, 'Certified'],
  ['MEP', 'Plumbing & sanitary — 48 flats, stage 1 (40%)', 'Tower A · A-101 to A-412', 'Nos', 19.2, 120000, 'Submitted'],
  ['MEP', 'Fire fighting — wet riser Tower A (30% of LS)', 'Tower A · shaft F1', 'LS', 0.3, 24500000, 'Under Review'],
];
const mbRows: Row[] = mbData.map(([section, description, location, unit, qty, rate, st], i) => ({
  id: `MB-${pad(i + 1)}`,
  code: `MB-${pad(i + 1)}`,
  description,
  section,
  location,
  unit,
  qty,
  rate,
  project: 'PRJ-001',
  measuredOn: `2026-09-${String(8 + i).padStart(2, '0')}`,
  measuredBy: ['EMP-002', 'EMP-007', 'EMP-027'][i % 3],
  status: st,
}));

export const billingApp: AppConfig = {
  id: 'billing',
  name: 'Billing',
  icon: 'ti-file-invoice',
  description: 'Measurements, progress & RA bills, client invoices, advance, retention, deductions and certification',
  menus: [
    leaf('Billing Setup', 'ti-settings', {
      type: 'settings',
      title: 'Billing Setup',
      sections: [
        {
          title: 'Billing Cycle',
          icon: 'ti-calendar-repeat',
          fields: [
            select('cycle', 'Billing Cycle', ['Monthly', 'Fortnightly', 'Milestone-based', 'Quarterly']),
            num('cutoff', 'Measurement Cut-off Day', [25, 25], { hint: 'Day of month' }),
            num('submitBy', 'RA Bill Submission Day', [28, 28], { hint: 'Day of month' }),
            select('numbering', 'RA Bill Numbering', ['RA-## per contract', 'RA/{Project}/{FY}/###']),
            num('creditDays', 'Default Credit Period', [30, 30], { unit: 'days' }),
          ],
        },
        {
          title: 'Retention',
          icon: 'ti-coins',
          fields: [
            pct('retention', 'Retention % per Bill', [5, 5]),
            pct('retCap', 'Retention Cap (% of contract value)', [5, 5]),
            select('retRelease', 'Release Schedule', ['50% on completion · 50% after DLP', '100% after DLP', 'Against bank guarantee']),
            num('dlp', 'Defect Liability Period', [12, 12], { unit: 'months' }),
          ],
        },
        {
          title: 'Advance Recovery',
          icon: 'ti-cash-banknote',
          fields: [
            pct('advPct', 'Advance Recovery % per Bill', [10, 10]),
            select('advStart', 'Recovery Starts', ['From first RA bill', 'After 10% progress', 'After 20% progress']),
            pct('advBy', 'Fully Recovered By (% billed)', [80, 80]),
            pct('secured', 'Secured Advance on Materials', [75, 75]),
          ],
        },
        {
          title: 'GST',
          icon: 'ti-receipt-tax',
          fields: [
            select('gstRate', 'GST Rate — Works Contract', ['18%', '12%', '5%']),
            text('gstin', 'GSTIN', ['33AAACE1234F1Z5']),
            select('sac', 'SAC Code', ['995411 — Residential buildings', '995412 — Commercial buildings', '995415 — Institutional buildings']),
            select('einvoice', 'E-Invoicing', ['Enabled — IRN auto-generated', 'Disabled']),
          ],
        },
        {
          title: 'TDS & Statutory Deductions',
          icon: 'ti-percentage',
          fields: [
            pct('tds', 'TDS u/s 194C', [2, 2]),
            pct('gstTds', 'GST-TDS (Govt. clients)', [2, 2]),
            pct('bocw', 'BOCW Welfare Cess', [1, 1]),
            select('ldc', 'Lower Deduction Certificate', ['Not applicable', 'Applied', 'Available']),
          ],
        },
        {
          title: 'Approval Workflow',
          icon: 'ti-route',
          fields: [
            select('levels', 'Certification Levels', ['4 levels — Prepared → QS → Engineer → Client', '3 levels — Prepared → QS → Client', '2 levels — Prepared → Client']),
            text('preparer', 'Prepared By (role)', ['Billing Engineer']),
            text('verifier', 'Verified By (role)', ['Quantity Surveyor']),
            num('sla', 'Certification SLA', [7, 7], { unit: 'days' }),
            multi('notify', 'Notify on Submission', ['Project Manager', 'Contracts Manager', 'Finance Manager', 'Client Engineer']),
          ],
        },
      ],
    }),
    group('Measurement', 'ti-ruler-measure', [
      page('Work Measurement', lineItemsNoTax('billMeasurement', 'Measurement Book — MB/SKY/RA-18 · Skyline Apartments · Sep 2026', ['location'])),
      page('Quantity', fieldView('billMeasurement', 'qty')),
      page('Certification', approval('billMeasurement', ['Site Engineer', 'QS', 'Client Engineer', 'Certified'])),
    ]),
    leaf('Progress Billing', 'ti-chart-bar', register('billProgress', { views: ['table', 'board'] })),
    leaf('RA Bill', 'ti-file-dollar', register('billRaBill', { views: ['table', 'board'], tabs: { field: 'status', values: ['Draft', 'Submitted', 'Under Review', 'Certified', 'Paid', 'Rejected'] } })),
    leaf('Client Invoice', 'ti-receipt', register('billInvoice', { tabs: { field: 'status', values: ['Due', 'Overdue', 'Paid'] } })),
    group('Commercial Adjustments', 'ti-adjustments-dollar', [
      page('Advance Recovery', register('billAdvRecovery')),
      page('Retention', register('billRetention')),
      page('Deductions', register('billDeduction')),
      page('Taxes', register('billTax')),
    ]),
    leaf('Bill Certification', 'ti-rosette-discount-check', approval('billRaBill', ['Prepared', 'QS Verified', 'Engineer Certified', 'Client Certified'])),
  ],
  dashboard: {
    flow: [
      { label: 'Measured', value: '₹ 27.4 Cr (Sep)' },
      { label: 'Billed', value: '₹ 26.1 Cr · 8 RA bills' },
      { label: 'Certification', value: '4 pending · ₹ 17.2 Cr' },
      { label: 'Invoiced', value: '₹ 8.7 Cr certified' },
      { label: 'Receivables', value: '₹ 38.4 Cr' },
    ],
    kpis: [
      { label: 'Billed This Month', value: '₹ 26.1 Cr', delta: '+3.6%', up: true, progress: 82, icon: 'ti-file-invoice', sub: '8 RA bills · September 2026' },
      { label: 'Pending Certification', value: '4', sub: '₹ 17.2 Cr gross', icon: 'ti-hourglass' },
      { label: 'Retention Held', value: '₹ 10.7 Cr', icon: 'ti-coins', sub: 'Across 8 contracts' },
      { label: 'Receivables', value: '₹ 38.4 Cr', delta: '+₹ 2.1 Cr', up: true, good: false, icon: 'ti-report-money', sub: 'Invoices ₹ 27.7 Cr + retention ₹ 10.7 Cr' },
      { label: 'Overdue Invoices', value: '₹ 13.5 Cr', sub: '5 invoices · Greenfield ₹ 6.3 Cr', icon: 'ti-alert-triangle' },
      { label: 'Advance to Recover', value: '₹ 11.6 Cr', progress: 58, icon: 'ti-cash-banknote' },
    ],
    charts: [
      { title: 'Billed vs Certified vs Collected (₹ Cr)', kind: 'bar', categories: ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'], series: [{ name: 'Billed', data: [21.4, 22.8, 23.6, 24.9, 24.0, 26.1] }, { name: 'Certified', data: [20.6, 22.1, 22.4, 24.0, 22.3, 8.95] }, { name: 'Collected', data: [18.2, 19.6, 20.4, 21.1, 20.8, 15.2] }], unit: '₹Cr', span: 2 },
      { title: 'Receivables Ageing (₹ Cr)', kind: 'donut', categories: ['Not yet due', '1–30 days', '31–60 days', '> 60 days', 'Retention'], series: [{ name: '₹ Cr', data: [14.2, 7.2, 3.3, 3.0, 10.7] }], unit: '₹Cr', subtitle: '₹ 38.4 Cr total' },
      { title: 'September Billing Funnel (₹ Cr)', kind: 'funnel', categories: ['Measured', 'Billed', 'QS verified', 'Certified', 'Invoiced'], series: [{ name: '₹ Cr', data: [27.4, 26.1, 14.3, 8.95, 8.7] }], unit: '₹Cr' },
      { title: 'RA Bill Value by Project — Sep (₹ Cr)', kind: 'hbar', categories: ['Skyline', 'Metro Tower', 'Greenfield', 'Riverside', 'Harbour View', 'Orbit TP', 'Lakeview', 'Sunrise'], series: [{ name: 'Gross', data: [6.2, 5.4, 3.6, 2.85, 2.4, 2.1, 1.95, 1.6] }], unit: '₹Cr', span: 2 },
    ],
    table: { entity: 'billRaBill', title: 'RA Bills — Latest', columns: ['title', 'period', 'gross', 'net', 'status'], limit: 8 },
    rail: [
      { kind: 'health', title: 'RA Bill Status (Sep)', items: [{ label: 'Certified', value: 4, tone: 'green' }, { label: 'Under Review', value: 2, tone: 'yellow' }, { label: 'Submitted', value: 2, tone: 'blue' }, { label: 'Rejected (Aug)', value: 1, tone: 'red' }] },
      {
        kind: 'dates',
        title: 'Collections Due',
        items: [
          { date: '2026-09-30', title: 'INV/0153 — ₹ 5.78 Cr', sub: 'Skyline Apartments · RA-17', done: true },
          { date: '2026-10-02', title: 'INV/0156 — ₹ 3.10 Cr', sub: 'Greenfield Township · RA-11' },
          { date: '2026-10-05', title: 'INV/0160 — ₹ 1.60 Cr', sub: 'Sunrise Business Hotel · RA-13' },
          { date: '2026-10-15', title: 'INV/0163 — ₹ 2.85 Cr', sub: 'Riverside Villas · RA-15' },
        ],
      },
      {
        kind: 'list',
        title: 'Recent Billing Activity',
        items: [
          { avatar: 'Anitha G', title: 'RA-09 submitted to client', sub: 'Lakeview Residency · ₹ 1.95 Cr', meta: '1 day ago', status: 'Submitted' },
          { avatar: 'Priya M', title: 'MB/SKY/RA-18 QS-verified (9 of 14 lines)', sub: 'Skyline Apartments', meta: '2 days ago' },
          { avatar: 'Siddharth Rao', title: 'RA-15 certified by client', sub: 'Riverside Villas · ₹ 2.85 Cr', meta: '5 days ago', status: 'Certified' },
          { avatar: 'Lakshmi N', title: 'Payment received ₹ 2.50 Cr', sub: 'Metro Office Tower · INV/0155', meta: '6 days ago' },
        ],
      },
    ],
  },
  entities: [
    {
      id: 'billMeasurement',
      label: 'Measurement',
      plural: 'Measurements',
      app: 'billing',
      codePrefix: 'MB',
      titleField: 'description',
      fields: [
        text('description', 'Item Description', undefined, { required: true }),
        select('section', 'Section', ['Substructure', 'Superstructure — Tower B', 'Masonry & Plaster', 'Finishes', 'MEP']),
        text('location', 'Location'),
        text('unit', 'Unit'),
        num('qty', 'Measured Quantity'),
        money('rate', 'BOQ Rate'),
        ref('project', 'Project', 'project', { list: false }),
        date('measuredOn', 'Measured On', undefined, { list: false }),
        ref('measuredBy', 'Measured By', 'employee', { list: false }),
        status(['Draft', 'Submitted', 'Under Review', 'Certified', 'Rejected']),
      ],
      rows: mbRows,
    },
    {
      id: 'billProgress',
      label: 'Progress Bill',
      plural: 'Progress Bills',
      app: 'billing',
      codePrefix: 'PB',
      titleField: 'work',
      count: 16,
      fields: [
        text('work', 'Work Completed', ['Tower B superstructure L13–L14', 'Villa cluster 5 — structure & roofing', 'Phase 1 internal roads & storm drain', 'Floors 8–9 structure & façade brackets', 'Tower A raft & basement walls', 'Shell & core — final finishes', 'OT block MEP first fix', 'Guest floors 3–4 interiors', 'Tower A masonry L6–L9', 'Villa cluster 4 — finishes', 'Clubhouse raft & columns', 'Podium waterproofing', 'Tower B columns L10–L12', 'ICU block flooring', 'Banquet hall structure', 'Tower A plaster L1–L4'], { required: true }),
        ref('project', 'Project', 'project', { required: true }),
        select('period', 'Billing Period', ['Sep 2026', 'Aug 2026', 'Jul 2026'], { gen: ['Sep 2026', 'Sep 2026', 'Sep 2026', 'Sep 2026', 'Sep 2026', 'Sep 2026', 'Sep 2026', 'Sep 2026', 'Aug 2026', 'Aug 2026', 'Aug 2026', 'Aug 2026', 'Aug 2026', 'Jul 2026', 'Jul 2026', 'Jul 2026'] }),
        money('workDone', 'Work Done (period)', [9000000, 62000000]),
        money('cumulative', 'Cumulative Work Done', [60000000, 580000000]),
        pct('progress', 'Physical Progress', [28, 92]),
        text('raNo', 'RA Bill Ref', ['RA-18', 'RA-15', 'RA-12', 'RA-17', 'RA-09', 'RA-22', 'RA-16', 'RA-13', 'RA-17', 'RA-14', 'RA-11', 'RA-16', 'RA-08', 'RA-16', 'RA-10', 'RA-15']),
        status(['In Preparation', 'Submitted', 'Certified'], { gen: ['In Preparation', 'Certified', 'Submitted', 'In Preparation', 'Submitted', 'Certified', 'Certified', 'Certified', 'Certified', 'Certified', 'Certified', 'Certified', 'Submitted', 'Certified', 'Certified', 'Certified'] }),
      ],
    },
    {
      id: 'billRaBill',
      label: 'RA Bill',
      plural: 'RA Bills',
      app: 'billing',
      codePrefix: 'RAB',
      titleField: 'title',
      form: 'page',
      info: 'September 2026: 8 RA bills · ₹ 26.1 Cr gross · 4 awaiting certification.',
      sections: [
        { id: 'header', title: 'Bill Header', icon: 'ti-file-dollar' },
        { id: 'amounts', title: 'Bill Value', icon: 'ti-currency-rupee' },
        { id: 'deductions', title: 'Recoveries & Deductions', icon: 'ti-receipt-tax' },
      ],
      fields: [
        text('title', 'RA Bill', undefined, { required: true, section: 'header' }),
        text('raNo', 'RA No.', undefined, { section: 'header', list: false }),
        ref('project', 'Project', 'project', { required: true, section: 'header', list: false }),
        ref('contract', 'Contract', 'contract', { required: true, section: 'header', list: false }),
        text('period', 'Billing Period', undefined, { section: 'header' }),
        date('billDate', 'Bill Date', undefined, { section: 'header' }),
        money('gross', 'Gross Value (this bill)', undefined, { required: true, section: 'amounts' }),
        money('cumulative', 'Cumulative Billed', undefined, { section: 'amounts', list: false }),
        money('gst', 'GST @ 18%', undefined, { section: 'amounts', list: false }),
        money('advance', 'Advance Recovery', undefined, { section: 'deductions' }),
        money('retention', 'Retention', undefined, { section: 'deductions' }),
        money('tds', 'TDS u/s 194C (2%)', undefined, { section: 'deductions', list: false }),
        money('deductions', 'Other Deductions', undefined, { section: 'deductions', list: false }),
        money('net', 'Net Payable', undefined, { section: 'amounts' }),
        status(['Draft', 'Submitted', 'Under Review', 'Certified', 'Paid', 'Rejected'], { section: 'header' }),
      ],
      rows: raRows,
    },
    {
      id: 'billInvoice',
      label: 'Client Invoice',
      plural: 'Client Invoices',
      app: 'billing',
      codePrefix: 'CI',
      titleField: 'invoiceNo',
      form: 'page',
      info: 'Outstanding against invoices ₹ 27.7 Cr; with ₹ 10.7 Cr retention, total receivables are ₹ 38.4 Cr.',
      fields: [
        text('invoiceNo', 'Invoice No.', undefined, { required: true }),
        text('raBillNo', 'RA Bill'),
        ref('project', 'Project', 'project', { required: true }),
        ref('client', 'Client', 'client', { list: false }),
        date('invoiceDate', 'Invoice Date'),
        date('dueDate', 'Due Date', undefined, { required: true }),
        money('amount', 'Invoice Amount'),
        money('received', 'Received', undefined, { list: false }),
        money('outstanding', 'Outstanding'),
        status(['Draft', 'Due', 'Overdue', 'Partially Paid', 'Paid']),
      ],
      rows: invoiceRows,
    },
    {
      id: 'billAdvRecovery',
      label: 'Advance Recovery',
      plural: 'Advance Recoveries',
      app: 'billing',
      codePrefix: 'ARC',
      titleField: 'raBill',
      fields: [
        ref('raBill', 'RA Bill', 'billRaBill', { required: true }),
        ref('project', 'Project', 'project'),
        money('given', 'Mobilisation Advance'),
        pct('rate', 'Recovery %'),
        money('thisBill', 'Recovered (this bill)'),
        money('toDate', 'Recovered to Date'),
        money('balance', 'Balance'),
        status(['In Progress', 'Completed']),
      ],
      rows: advRecoveryRows,
    },
    {
      id: 'billRetention',
      label: 'Retention Deduction',
      plural: 'Retention Deductions',
      app: 'billing',
      codePrefix: 'BRT',
      titleField: 'raBill',
      fields: [
        ref('raBill', 'RA Bill', 'billRaBill', { required: true }),
        ref('project', 'Project', 'project'),
        pct('rate', 'Retention %'),
        money('thisBill', 'Retained (this bill)'),
        money('toDate', 'Retention to Date'),
        text('release', 'Release Terms'),
        status(['Active', 'Due', 'Released']),
      ],
      rows: retentionRows,
    },
    {
      id: 'billDeduction',
      label: 'Bill Deduction',
      plural: 'Bill Deductions',
      app: 'billing',
      codePrefix: 'BDD',
      titleField: 'title',
      count: 14,
      fields: [
        text('title', 'Deduction', ['BOCW welfare cess @ 1%', 'Free-issue steel — excess consumption', 'Water & electricity charges — Sep', 'Penalty — delay in slab cycle L12', 'Safety non-compliance — no harness', 'Debris removal back-charge', 'Cube test charges — third-party lab', 'Free-issue cement — wastage recovery', 'Tower crane hire — client-owned', 'Labour camp utilities', 'Rework — honeycombing repair', 'Security services — shared', 'BOCW welfare cess @ 1%', 'Water & electricity charges — Aug'], { required: true }),
        ref('raBill', 'RA Bill', 'billRaBill', { required: true }),
        select('type', 'Type', ['Statutory', 'Material Recovery', 'Utilities', 'Penalty', 'Back-charge'], { gen: ['Statutory', 'Material Recovery', 'Utilities', 'Penalty', 'Penalty', 'Back-charge', 'Back-charge', 'Material Recovery', 'Back-charge', 'Utilities', 'Back-charge', 'Utilities', 'Statutory', 'Utilities'] }),
        money('amount', 'Amount', [18000, 620000]),
        area('remarks', 'Remarks', ['Deducted as per contract clause.', 'Contractor disputes quantity; joint reconciliation scheduled.', 'Agreed in monthly commercial meeting.', 'Deducted against client engineer instruction.']),
        status(['Approved', 'Under Review', 'Disputed'], { gen: ['Approved', 'Under Review', 'Approved', 'Disputed', 'Approved', 'Approved', 'Approved', 'Under Review', 'Approved', 'Approved', 'Disputed', 'Approved', 'Approved', 'Approved'] }),
      ],
    },
    {
      id: 'billTax',
      label: 'Tax Entry',
      plural: 'Tax Entries',
      app: 'billing',
      codePrefix: 'TAX',
      titleField: 'raBill',
      fields: [
        ref('raBill', 'RA Bill', 'billRaBill', { required: true }),
        ref('project', 'Project', 'project'),
        money('taxable', 'Taxable Value'),
        money('cgst', 'CGST @ 9%'),
        money('sgst', 'SGST @ 9%'),
        money('tds', 'TDS u/s 194C'),
        money('bocw', 'BOCW Cess', undefined, { list: false }),
        text('returnPeriod', 'Return Period'),
        status(['Pending', 'Paid']),
      ],
      rows: taxRows,
    },
  ],
};
