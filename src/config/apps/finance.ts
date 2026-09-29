import { date, group, money, page, ref, register, select, status, text } from '../dsl';
import type { AppConfig, Row, TreeNode } from '../types';

const CR = 1e7;

/* ───────── Chart of Accounts helpers (group values are summed from their ledgers) ───────── */
function ledger(code: string, label: string, type: string, opening: number, balance: number): TreeNode {
  return { code, label, values: { type, opening, balance } };
}
function acGroup(code: string, label: string, children: TreeNode[]): TreeNode {
  const sum = (k: 'opening' | 'balance') => children.reduce((a, c) => a + Number(c.values?.[k] ?? 0), 0);
  return { code, label, values: { type: 'Group', opening: sum('opening'), balance: sum('balance') }, children };
}

const COA: TreeNode[] = [
  acGroup('1000', 'Assets', [
    acGroup('1100', 'Fixed Assets', [
      ledger('1110', 'Plant & Machinery', 'Fixed Asset', 412000000, 438600000),
      ledger('1120', 'Vehicles', 'Fixed Asset', 38400000, 41200000),
      ledger('1130', 'Office Equipment & IT', 'Fixed Asset', 12600000, 13800000),
      ledger('1140', 'Accumulated Depreciation', 'Contra Asset', -126400000, -138960000),
    ]),
    acGroup('1200', 'Current Assets', [
      ledger('1210', 'Trade Receivables — Clients', 'Receivable', 331800000, 384000000),
      ledger('1220', 'Retention Receivable', 'Receivable', 160400000, 186200000),
      ledger('1230', 'Unbilled Revenue (WIP)', 'Current Asset', 342000000, 296400000),
      ledger('1240', 'Inventory — Site Stores', 'Inventory', 152800000, 164200000),
      ledger('1250', 'GST Input Credit', 'Tax Asset', 48600000, 52400000),
      ledger('1260', 'TDS Receivable', 'Tax Asset', 61200000, 67000000),
    ]),
    acGroup('1300', 'Cash & Bank', [
      ledger('1310', 'HDFC Bank CA — 5020 (HO)', 'Bank', 58400000, 72600000),
      ledger('1320', 'ICICI Bank CA — 0078 (Collections)', 'Bank', 44100000, 51800000),
      ledger('1330', 'SBI CA — 3346 (Projects)', 'Bank', 29800000, 38200000),
      ledger('1340', 'Axis Bank CA — 9121 (Payroll)', 'Bank', 17600000, 24100000),
      ledger('1350', 'Petty Cash — Sites', 'Cash', 1580000, 2300000),
    ]),
  ]),
  acGroup('2000', 'Liabilities', [
    acGroup('2100', 'Current Liabilities', [
      ledger('2110', 'Trade Payables — Vendors', 'Payable', 131200000, 152600000),
      ledger('2120', 'Subcontractor Payables', 'Payable', 55200000, 64400000),
      ledger('2130', 'Retention Payable', 'Payable', 49860000, 61240000),
      ledger('2140', 'Mobilisation Advance from Clients', 'Advance', 172200000, 212600000),
      ledger('2150', 'GST Output Payable', 'Tax Liability', 18400000, 21200000),
      ledger('2160', 'TDS Payable', 'Tax Liability', 9240000, 10660000),
    ]),
    acGroup('2200', 'Borrowings', [
      ledger('2210', 'Term Loan — HDFC Bank', 'Loan', 342000000, 285000000),
      ledger('2220', 'Cash Credit — SBI', 'Loan', 94000000, 118000000),
      ledger('2230', 'Equipment Finance — Tata Capital', 'Loan', 0, 32000000),
    ]),
  ]),
  acGroup('3000', 'Equity', [
    ledger('3100', 'Share Capital', 'Equity', 250000000, 250000000),
    ledger('3200', 'Reserves & Surplus', 'Equity', 596020000, 640000000),
    ledger('3300', 'Current Year Profit', 'Equity', 0, 44600000),
  ]),
  acGroup('4000', 'Income', [
    ledger('4100', 'Contract Revenue — RA Bills', 'Income', 0, 942050000),
    ledger('4200', 'Variation & Escalation Income', 'Income', 0, 31240000),
    ledger('4300', 'Other Operating Income', 'Income', 0, 8620000),
    ledger('4400', 'Interest on Deposits', 'Other Income', 0, 4260000),
    ledger('4500', 'Scrap Sales', 'Other Income', 0, 1830000),
  ]),
  acGroup('5000', 'Expenses', [
    acGroup('5100', 'Material Consumption', [
      ledger('5101', 'Material — Steel', 'Direct Cost', 0, 148200000),
      ledger('5102', 'Material — Cement & RMC', 'Direct Cost', 0, 121600000),
      ledger('5103', 'Material — Aggregates', 'Direct Cost', 0, 46800000),
      ledger('5104', 'Material — Finishes', 'Direct Cost', 0, 98640000),
    ]),
    acGroup('5200', 'Labour', [
      ledger('5201', 'Labour — Direct', 'Direct Cost', 0, 48260000),
      ledger('5202', 'Labour — Contract', 'Direct Cost', 0, 75400000),
    ]),
    acGroup('5300', 'Subcontract', [
      ledger('5301', 'Subcontract — Civil', 'Direct Cost', 0, 128400000),
      ledger('5302', 'Subcontract — MEP', 'Direct Cost', 0, 86420000),
    ]),
    acGroup('5400', 'Equipment', [
      ledger('5401', 'Equipment — Owned (fuel & upkeep)', 'Direct Cost', 0, 21870000),
      ledger('5402', 'Equipment — Hired', 'Direct Cost', 0, 31600000),
    ]),
    ledger('5501', 'Site Overheads', 'Direct Cost', 0, 44010000),
    ledger('5601', 'Employee Benefits — HO', 'Indirect Cost', 0, 31240000),
    ledger('5701', 'Administration & General', 'Indirect Cost', 0, 14860000),
    ledger('5801', 'Finance Costs', 'Indirect Cost', 0, 18620000),
    ledger('5901', 'Depreciation', 'Indirect Cost', 0, 12480000),
  ]),
];

/* ───────── Journal vouchers (seeded so every voucher balances: Dr = Cr) ───────── */
const JV: [string, string, string, string, string, string, number, string, string, string][] = [
  ['Steel consumption booked — Tower A slabs L9–L10', 'Journal', '2026-09-28', 'PRJ-001', '5101 Material — Steel', '1240 Inventory — Site Stores', 8640000, 'MIS/SKY/0914', 'EMP-008', 'Pending Approval'],
  ['RA Bill 14 revenue recognition — Skyline Apartments', 'Sales', '2026-09-27', 'PRJ-001', '1210 Trade Receivables — Clients', '4100 Contract Revenue — RA Bills', 42800000, 'RA-SKY-14', 'EMP-033', 'Posted'],
  ['Depreciation for September 2026 — plant & machinery', 'Journal', '2026-09-26', 'PRJ-001', '5901 Depreciation', '1140 Accumulated Depreciation', 2080000, 'DEP/2026-09', 'EMP-020', 'Draft'],
  ['TDS on subcontractor bill — Sai Ram Constructions', 'Journal', '2026-09-25', 'PRJ-003', '2120 Subcontractor Payables', '2160 TDS Payable', 186000, 'SB-GFT-0412', 'EMP-008', 'Posted'],
  ['Retention withheld — Precision MEP RA 6', 'Journal', '2026-09-24', 'PRJ-004', '2120 Subcontractor Payables', '2130 Retention Payable', 412000, 'SB-MOT-0388', 'EMP-033', 'Posted'],
  ['Mobilisation advance adjusted against RA Bill 9', 'Journal', '2026-09-23', 'PRJ-004', '2140 Mobilisation Advance from Clients', '1210 Trade Receivables — Clients', 3650000, 'RA-MOT-09', 'EMP-020', 'Posted'],
  ['Provision for crane hire — September (unbilled)', 'Journal', '2026-09-22', 'PRJ-001', '5402 Equipment — Hired', '2110 Trade Payables — Vendors', 1140000, 'PRV/EQ/0926', 'EMP-008', 'Pending Approval'],
  ['GST input reversal — ineligible credit on staff welfare', 'Journal', '2026-09-21', 'PRJ-002', '5701 Administration & General', '1250 GST Input Credit', 38400, 'GST/REV/0921', 'EMP-033', 'Posted'],
  ['Interest accrued on FD — HDFC Bank', 'Journal', '2026-09-20', 'PRJ-001', '1310 HDFC Bank CA — 5020 (HO)', '4400 Interest on Deposits', 264000, 'FD/INT/0920', 'EMP-020', 'Posted'],
  ['Cement consumption booked — Riverside Villas', 'Journal', '2026-09-19', 'PRJ-002', '5102 Material — Cement & RMC', '1240 Inventory — Site Stores', 2380000, 'MIS/RVV/0911', 'EMP-008', 'Posted'],
  ['Escalation claim income — steel PVC (Q2)', 'Sales', '2026-09-18', 'PRJ-003', '1210 Trade Receivables — Clients', '4200 Variation & Escalation Income', 5120000, 'ESC-GFT-Q2', 'EMP-020', 'Pending Approval'],
  ['Scrap steel sale — Metro Office Tower', 'Receipt', '2026-09-17', 'PRJ-004', '1320 ICICI Bank CA — 0078 (Collections)', '4500 Scrap Sales', 318000, 'SCR/MOT/0917', 'EMP-033', 'Posted'],
  ['Reclassification — plumbing materials to Lakeview', 'Journal', '2026-09-16', 'PRJ-005', '5104 Material — Finishes', '5103 Material — Aggregates', 146000, 'RCL/0916', 'EMP-008', 'Rejected'],
  ['Payroll accrual — site staff September', 'Journal', '2026-09-15', 'PRJ-006', '5201 Labour — Direct', '2110 Trade Payables — Vendors', 6240000, 'PAY/2026-09', 'EMP-020', 'Draft'],
  ['Bank charges — SBI CA quarterly maintenance', 'Payment', '2026-09-14', 'PRJ-007', '5801 Finance Costs', '1330 SBI CA — 3346 (Projects)', 40000, 'SBI/CHG/Q2', 'EMP-033', 'Posted'],
  ['Unbilled revenue — work done not certified (Harbour View)', 'Journal', '2026-09-13', 'PRJ-007', '1230 Unbilled Revenue (WIP)', '4100 Contract Revenue — RA Bills', 7860000, 'WIP/HVH/09', 'EMP-020', 'Pending Approval'],
];
const journalRows: Row[] = JV.map(([narration, type, dt, project, drLedger, crLedger, amt, reference, preparedBy, st], i) => {
  const code = `JV-${String(i + 412).padStart(4, '0')}`;
  return { id: code, code, narration, type, date: dt, project, drLedger, crLedger, debit: amt, credit: amt, reference, preparedBy, status: st };
});

/* ───────── Analysis tables ───────── */
const PAYABLE_AGEING: [string, number, number, number, number][] = [
  ['Shree Balaji Steel Traders', 2.6, 1.6, 0.8, 0.4],
  ['Chennai RMC Pvt Ltd', 1.9, 1.0, 0.6, 0.3],
  ['Sai Ram Constructions', 1.3, 0.9, 0.5, 0.4],
  ['UltraBuild Cements', 1.2, 0.8, 0.4, 0.2],
  ['Precision MEP Services', 0.8, 0.6, 0.4, 0.4],
  ['Bharat Lifts & Escalators', 0.7, 0.4, 0.3, 0.2],
  ['Crane Hire India', 0.4, 0.3, 0.3, 0.2],
  ['Others (42 vendors)', 0.9, 0.5, 0.2, 0.2],
];
const RECEIVABLE_AGEING: [string, string, number, number, number, number][] = [
  ['ABC Builders Pvt Ltd', 'Skyline Apartments', 6.2, 3.1, 1.6, 1.5],
  ['Metro Constructions', 'Metro Office Tower', 3.4, 1.8, 0.9, 1.0],
  ['Greenfield Infra Ltd', 'Greenfield Township', 2.1, 1.6, 1.2, 1.9],
  ['XYZ Developers', 'Riverside Villas', 2.8, 1.2, 0.6, 0.6],
  ['Lakeview Estates', 'Lakeview Residency', 0.9, 0.5, 0.4, 0.5],
  ['Orbit Tech Parks', 'Orbit Tech Park Phase II', 1.0, 0.5, 0.2, 0.2],
  ['Coastal Healthcare Trust', 'Harbour View Hospital', 0.7, 0.4, 0.3, 0.2],
  ['Sunrise Hospitality', 'Sunrise Business Hotel', 0.5, 0.2, 0.2, 0.2],
];
const ageRow = (a: number, b: number, c: number, d: number) => ({ b1: a * CR, b2: b * CR, b3: c * CR, b4: d * CR, total: Math.round((a + b + c + d) * 10) / 10 * CR });

// project, contract value, billed, cost, gross profit, budgeted margin, status (₹ Cr)
const PROFIT: [string, number, number, number, number, number, string][] = [
  ['Skyline Apartments', 85, 60.4, 52, 8.4, 14.5, 'On Track'],
  ['Riverside Villas', 42, 25.8, 22, 3.8, 14.0, 'On Track'],
  ['Greenfield Township', 58, 26.1, 24, 2.1, 12.5, 'At Risk'],
  ['Metro Office Tower', 64, 46.2, 40, 6.2, 13.5, 'On Track'],
  ['Lakeview Residency', 28, 11.2, 10, 1.2, 13.0, 'At Risk'],
  ['Orbit Tech Park Phase II', 18, 20.3, 17, 3.3, 15.0, 'On Track'],
  ['Harbour View Hospital', 15, 15.1, 13, 2.1, 13.0, 'On Track'],
  ['Sunrise Business Hotel', 10, 9.4, 8, 1.4, 14.0, 'On Track'],
];
const short = (p: string) => p.replace(' Apartments', '').replace(' Villas', '').replace(' Township', '').replace(' Office Tower', ' Tower').replace(' Residency', '').replace(' Tech Park Phase II', ' TP').replace(' Hospital', '').replace(' Business Hotel', '');

export const financeApp: AppConfig = {
  id: 'finance',
  name: 'Finance',
  icon: 'ti-building-bank',
  description: 'General ledger, payables, receivables, cash, bank reconciliation and financial statements',
  menus: [
    group('General Ledger', 'ti-book', [
      page('Chart of Accounts', {
        type: 'tree',
        title: 'Chart of Accounts — FY 2026-27',
        columns: [
          { key: 'type', label: 'Account Type' },
          { key: 'opening', label: 'Opening Balance (01 Apr 2026)', type: 'currency' },
          { key: 'balance', label: 'Balance (29 Sep 2026)', type: 'currency' },
        ],
        nodes: COA,
      }),
      page('Journal', register('finJournal', { tabs: { field: 'status', values: ['Draft', 'Pending Approval', 'Posted', 'Rejected'] } })),
      page('Accounting Entries', register('finPosting')),
    ]),
    group('Accounts Payable', 'ti-file-invoice', [
      page('Vendor Bills', register('finVendorBill', { tabs: { field: 'status', values: ['Pending Approval', 'Approved', 'Partially Paid', 'Paid', 'Overdue'] } })),
      page('Payables', {
        type: 'analysis',
        title: 'Payables Ageing',
        kpis: [
          { label: 'Total payables', value: '₹ 21.7 Cr', delta: '+₹ 1.4 Cr', up: true, good: false, icon: 'ti-file-invoice', sub: '50 vendors & subcontractors' },
          { label: 'Due in next 7 days', value: '₹ 4.2 Cr', icon: 'ti-calendar-due', sub: '18 bills' },
          { label: 'Overdue > 60 days', value: '₹ 5.8 Cr', delta: '27%', up: true, good: false, progress: 27, icon: 'ti-alert-triangle' },
          { label: 'Average payable days (DPO)', value: '48 days', delta: '-3 d', up: false, good: false, icon: 'ti-clock' },
        ],
        charts: [
          { title: 'Payables Ageing (₹ Cr)', kind: 'bar', categories: ['0–30 days', '31–60 days', '61–90 days', '> 90 days'], series: [{ name: 'Outstanding', data: [9.8, 6.1, 3.5, 2.3] }], unit: '₹Cr' },
          { title: 'Top Vendors by Outstanding (₹ Cr)', kind: 'stacked', categories: PAYABLE_AGEING.map((r) => r[0].replace(' Pvt Ltd', '').replace(' (42 vendors)', '')), series: [0, 1, 2, 3].map((k) => ({ name: ['0–30', '31–60', '61–90', '> 90'][k], data: PAYABLE_AGEING.map((r) => r[k + 1] as number) })), unit: '₹Cr', span: 2 },
        ],
        table: {
          title: 'Vendor-wise Payables Ageing',
          columns: [
            { key: 'vendor', label: 'Vendor / Subcontractor' },
            { key: 'b1', label: '0–30 days', type: 'currency' },
            { key: 'b2', label: '31–60 days', type: 'currency' },
            { key: 'b3', label: '61–90 days', type: 'currency' },
            { key: 'b4', label: '> 90 days', type: 'currency' },
            { key: 'total', label: 'Total', type: 'currency' },
          ],
          rows: [...PAYABLE_AGEING.map(([vendor, a, b, c, d]) => ({ vendor, ...ageRow(a, b, c, d) })), { vendor: 'Total', ...ageRow(9.8, 6.1, 3.5, 2.3) }],
        },
      }),
      page('Vendor Settlement', register('finSettlement', { tabs: { field: 'status', values: ['Scheduled', 'Pending Approval', 'Paid', 'Rejected'] } })),
    ]),
    group('Accounts Receivable', 'ti-receipt', [
      page('Client Receivables', register('finReceivable', { tabs: { field: 'status', values: ['Due', 'Partially Paid', 'Overdue', 'Paid', 'Disputed'] } })),
      page('Outstanding', {
        type: 'analysis',
        title: 'Receivables Outstanding & Ageing',
        kpis: [
          { label: 'Total outstanding', value: '₹ 38.4 Cr', delta: '+₹ 2.1 Cr', up: true, good: false, icon: 'ti-receipt', sub: '8 clients · 46 invoices' },
          { label: 'Current (0–30 days)', value: '₹ 17.6 Cr', progress: 46, icon: 'ti-circle-check' },
          { label: 'Overdue > 90 days', value: '₹ 6.1 Cr', delta: '16%', up: true, good: false, progress: 16, icon: 'ti-alert-triangle' },
          { label: 'Days sales outstanding (DSO)', value: '64 days', delta: '-5 d', up: false, good: true, icon: 'ti-clock' },
        ],
        charts: [
          { title: 'Receivables Ageing', kind: 'donut', categories: ['0–30 days', '31–60 days', '61–90 days', '> 90 days'], series: [{ name: '₹ Cr', data: [17.6, 9.3, 5.4, 6.1] }], unit: '₹Cr', tones: ['green', 'blue', 'yellow', 'red'], subtitle: '₹ 38.4 Cr outstanding' },
          { title: 'Outstanding by Client (₹ Cr)', kind: 'stacked', categories: RECEIVABLE_AGEING.map((r) => r[0].replace(' Pvt Ltd', '').replace(' Ltd', '')), series: [0, 1, 2, 3].map((k) => ({ name: ['0–30', '31–60', '61–90', '> 90'][k], data: RECEIVABLE_AGEING.map((r) => r[k + 2] as number) })), unit: '₹Cr', span: 2 },
        ],
        table: {
          title: 'Client-wise Ageing',
          columns: [
            { key: 'client', label: 'Client' },
            { key: 'project', label: 'Project' },
            { key: 'b1', label: '0–30 days', type: 'currency' },
            { key: 'b2', label: '31–60 days', type: 'currency' },
            { key: 'b3', label: '61–90 days', type: 'currency' },
            { key: 'b4', label: '> 90 days', type: 'currency' },
            { key: 'total', label: 'Total', type: 'currency' },
          ],
          rows: [...RECEIVABLE_AGEING.map(([client, project, a, b, c, d]) => ({ client, project, ...ageRow(a, b, c, d) })), { client: 'Total', project: '—', ...ageRow(17.6, 9.3, 5.4, 6.1) }],
        },
      }),
      page('Collections', register('finCollection', { views: ['table', 'calendar'], dateField: 'date' })),
    ]),
    group('Cash', 'ti-cash', [
      page('Petty Cash', register('finPettyCash', { tabs: { field: 'status', values: ['Draft', 'Pending Approval', 'Approved', 'Rejected'] } })),
      page('Cash Transactions', register('finCashTxn')),
    ]),
    group('Bank', 'ti-building-bank', [
      page('Bank Accounts', register('finBankAccount')),
      page('Transactions', register('finBankTxn', { tabs: { field: 'status', values: ['Pending', 'Under Review', 'Reconciled'] } })),
      page('Reconciliation', {
        type: 'comparison',
        title: 'Bank Reconciliation — HDFC Bank CA 50200012345020',
        subjectLabel: 'Particulars (01 Sep – 28 Sep 2026)',
        subjects: ['Books', 'Bank Statement', 'Difference'],
        note: 'HDFC Bank CA — 5020 (HO) · statement imported up to 28 Sep 2026 · difference of ₹ 10,70,000 fully explained by 4 reconciling items.',
        rows: [
          { group: 'Balances', label: 'Opening balance (01 Sep 2026)', values: [41250000, 41250000, 0], format: 'currency' },
          { group: 'Balances', label: 'Receipts during the period', values: [68420000, 66345000, -2075000], format: 'currency' },
          { group: 'Balances', label: 'Payments during the period', values: [70540000, 67395000, -3145000], format: 'currency' },
          { group: 'Balances', label: 'Closing balance (28 Sep 2026)', values: [39130000, 40200000, 1070000], format: 'currency' },
          { group: 'Reconciling items', label: 'Cheques issued, not yet presented (14)', values: [3185000, 0, 3185000], format: 'currency' },
          { group: 'Reconciling items', label: 'Deposits in transit — RA-SKY-14 part receipt', values: [2200000, 0, -2200000], format: 'currency' },
          { group: 'Reconciling items', label: 'Interest credited by bank, not booked', values: [0, 125000, 125000], format: 'currency' },
          { group: 'Reconciling items', label: 'Bank charges debited, not booked', values: [0, 40000, -40000], format: 'currency' },
          { group: 'Summary', label: 'Unexplained difference', values: [0, 0, 0], format: 'currency' },
          { group: 'Summary', label: 'Entries matched / total', values: ['412 / 418', '412 / 416', '6 open'], format: 'text' },
          { group: 'Summary', label: 'Reconciliation status', values: ['Pending', 'Pending', 'Under Review'], format: 'status' },
        ],
      }),
    ]),
    group('Financial Reporting', 'ti-report-analytics', [
      page('P&L', {
        type: 'statement',
        title: 'Statement of Profit & Loss',
        periods: ['H1 FY 2026-27', 'H1 FY 2025-26'],
        sections: [
          {
            title: 'Revenue from Operations',
            lines: [
              { label: 'Contract revenue (certified RA bills)', values: [9420.5, 8112.3] },
              { label: 'Variation & escalation income', values: [312.4, 204.6] },
              { label: 'Other operating income', values: [86.2, 71.4] },
            ],
            total: { label: 'Total revenue from operations', values: [9819.1, 8388.3] },
          },
          {
            title: 'Direct Contract Costs',
            lines: [
              { label: 'Materials consumed', values: [4152.4, 3612.8] },
              { label: 'Subcontract charges', values: [2148.2, 1804.5] },
              { label: 'Labour cost', values: [1236.6, 1066.2] },
              { label: 'Equipment hire, fuel & maintenance', values: [534.7, 472.1] },
              { label: 'Site overheads', values: [440.1, 398.6] },
            ],
            total: { label: 'Total direct costs', values: [8512.0, 7354.2] },
          },
          {
            title: 'Gross Profit',
            lines: [{ label: 'Gross profit (13.3% vs 12.3%)', values: [1307.1, 1034.1], bold: true }],
          },
          {
            title: 'Other Income',
            lines: [
              { label: 'Interest on fixed deposits & margin money', values: [42.6, 31.2] },
              { label: 'Scrap sales & miscellaneous income', values: [18.3, 14.6] },
            ],
            total: { label: 'Total other income', values: [60.9, 45.8] },
          },
          {
            title: 'Indirect Expenses',
            lines: [
              { label: 'Employee benefits — head office', values: [312.4, 284.1] },
              { label: 'Administration & general expenses', values: [148.6, 136.9] },
              { label: 'Finance costs', values: [186.2, 204.7] },
              { label: 'Depreciation & amortisation', values: [124.8, 112.3] },
            ],
            total: { label: 'Total indirect expenses', values: [772.0, 738.0] },
          },
          {
            title: 'Profit Before Tax & Tax Expense',
            lines: [
              { label: 'Profit before tax', values: [596.0, 341.9], bold: true },
              { label: 'Current tax', values: [138.4, 79.6], indent: 2 },
              { label: 'Deferred tax', values: [11.6, 6.5], indent: 2 },
            ],
            total: { label: 'Total tax expense', values: [150.0, 86.1] },
          },
        ],
        net: { label: 'Net Profit after Tax', values: [446.0, 255.8] },
      }),
      page('Balance Sheet', {
        type: 'statement',
        title: 'Balance Sheet',
        periods: ['H1 FY 2026-27', 'H1 FY 2025-26'],
        sections: [
          {
            title: "Shareholders' Funds",
            lines: [
              { label: 'Share capital', values: [2500.0, 2500.0] },
              { label: 'Reserves & surplus', values: [6846.0, 5960.2] },
            ],
            total: { label: "Total shareholders' funds", values: [9346.0, 8460.2] },
          },
          {
            title: 'Non-current Liabilities',
            lines: [
              { label: 'Long-term borrowings (term loan)', values: [2850.0, 3420.0] },
              { label: 'Mobilisation advances — long-term portion', values: [1240.0, 980.0] },
            ],
            total: { label: 'Total non-current liabilities', values: [4090.0, 4400.0] },
          },
          {
            title: 'Current Liabilities',
            lines: [
              { label: 'Trade payables', values: [2170.0, 1864.0] },
              { label: 'Retention payable to subcontractors', values: [612.4, 498.6] },
              { label: 'Client advances — current portion', values: [886.0, 742.0] },
              { label: 'Short-term borrowings (CC / OD)', values: [1180.0, 1420.0] },
              { label: 'Statutory dues (GST, TDS, PF, ESI)', values: [318.6, 276.4] },
              { label: 'Other current liabilities & provisions', values: [243.0, 199.0] },
            ],
            total: { label: 'Total current liabilities', values: [5410.0, 5000.0] },
          },
          {
            title: 'Total Equity & Liabilities',
            lines: [{ label: 'Total equity & liabilities', values: [18846.0, 17860.2], bold: true }],
          },
          {
            title: 'Non-current Assets',
            lines: [
              { label: 'Property, plant & equipment (net)', values: [3412.0, 3286.0] },
              { label: 'Capital work-in-progress', values: [186.0, 240.0] },
              { label: 'Long-term deposits (EMD, security deposits)', values: [428.0, 392.0] },
            ],
            total: { label: 'Total non-current assets', values: [4026.0, 3918.0] },
          },
          {
            title: 'Current Assets',
            lines: [
              { label: 'Inventories — site stores', values: [1642.0, 1528.0] },
              { label: 'Trade receivables', values: [3840.0, 3318.0] },
              { label: 'Unbilled revenue (work-in-progress)', values: [2964.0, 3420.0] },
              { label: 'Retention receivable', values: [1862.0, 1604.0] },
              { label: 'Cash & bank balances', values: [1890.0, 1512.0] },
              { label: 'Loans & advances (vendors, staff)', values: [1428.0, 1276.0] },
              { label: 'Other current assets (GST input, TDS receivable)', values: [1194.0, 1284.2] },
            ],
            total: { label: 'Total current assets', values: [14820.0, 13942.2] },
          },
        ],
        net: { label: 'Total Assets', values: [18846.0, 17860.2] },
      }),
      page('Cash Flow', {
        type: 'statement',
        title: 'Cash Flow Statement',
        periods: ['H1 FY 2026-27', 'H1 FY 2025-26'],
        sections: [
          {
            title: 'A. Cash Flow from Operating Activities',
            lines: [
              { label: 'Profit before tax', values: [596.0, 341.9], bold: true },
              { label: 'Add: Depreciation & amortisation', values: [124.8, 112.3] },
              { label: 'Add: Finance costs', values: [186.2, 204.7] },
              { label: 'Less: Interest income', values: [-42.6, -31.2] },
              { label: '(Increase) in trade receivables', values: [-522.0, -410.0] },
              { label: '(Increase) in unbilled revenue & retention', values: [-318.4, -246.3] },
              { label: 'Decrease / (increase) in inventories', values: [64.2, -38.4] },
              { label: 'Increase in trade payables', values: [306.0, 188.0] },
              { label: 'Increase in client advances', values: [144.0, 96.0] },
              { label: 'Income tax paid', values: [-142.0, -84.0] },
            ],
            total: { label: 'Net cash from operating activities', values: [396.2, 133.0] },
          },
          {
            title: 'B. Cash Flow from Investing Activities',
            lines: [
              { label: 'Purchase of plant & machinery', values: [-268.4, -312.6] },
              { label: 'Proceeds from sale of old equipment', values: [42.0, 18.5] },
              { label: 'Interest received', values: [42.6, 31.2] },
              { label: 'Fixed deposits / margin money (placed) / matured', values: [-26.0, 64.0] },
            ],
            total: { label: 'Net cash used in investing activities', values: [-209.8, -198.9] },
          },
          {
            title: 'C. Cash Flow from Financing Activities',
            lines: [
              { label: 'Repayment of term loan', values: [-285.0, -240.0] },
              { label: 'Net drawdown of cash credit', values: [240.0, 180.0] },
              { label: 'Equipment finance availed', values: [320.0, 260.0] },
              { label: 'Finance costs paid', values: [-186.2, -204.7] },
            ],
            total: { label: 'Net cash from / (used in) financing activities', values: [88.8, -4.7] },
          },
          {
            title: 'Cash & Cash Equivalents',
            lines: [
              { label: 'Net increase / (decrease) in cash (A + B + C)', values: [275.2, -70.6], bold: true },
              { label: 'Opening cash & bank balance (01 Apr)', values: [1614.8, 1582.6] },
            ],
          },
        ],
        net: { label: 'Closing Cash & Bank Balance (30 Sep)', values: [1890.0, 1512.0] },
      }),
      page('Project Profitability', {
        type: 'analysis',
        title: 'Project Profitability',
        kpis: [
          { label: 'Revenue billed (to date)', value: '₹ 214.5 Cr', delta: '+11%', up: true, icon: 'ti-receipt-2', sub: '8 active projects' },
          { label: 'Cost incurred (to date)', value: '₹ 186.0 Cr', delta: '+12%', up: true, good: false, icon: 'ti-coins' },
          { label: 'Gross profit', value: '₹ 28.5 Cr', delta: '+₹ 3.1 Cr', up: true, icon: 'ti-trending-up' },
          { label: 'Gross margin', value: '13.3%', delta: '-0.4 pt', up: false, good: false, progress: 13, icon: 'ti-percentage', sub: 'Budgeted 13.9%' },
        ],
        charts: [
          { title: 'Revenue vs Cost by Project (₹ Cr)', kind: 'bar', categories: PROFIT.map((p) => short(p[0])), series: [{ name: 'Revenue billed', data: PROFIT.map((p) => p[2]) }, { name: 'Cost incurred', data: PROFIT.map((p) => p[3]) }], unit: '₹Cr', span: 2 },
          { title: 'Gross Margin by Project', kind: 'hbar', categories: PROFIT.map((p) => short(p[0])), series: [{ name: 'Margin', data: PROFIT.map((p) => Math.round((p[4] / p[2]) * 1000) / 10) }], unit: '%' },
        ],
        table: {
          title: 'Project-wise Profitability (cumulative to 29 Sep 2026)',
          columns: [
            { key: 'project', label: 'Project' },
            { key: 'contract', label: 'Contract Value', type: 'currency' },
            { key: 'billed', label: 'Revenue Billed', type: 'currency' },
            { key: 'cost', label: 'Cost Incurred', type: 'currency' },
            { key: 'gp', label: 'Gross Profit', type: 'currency' },
            { key: 'margin', label: 'Margin', type: 'percent' },
            { key: 'budget', label: 'Budgeted Margin', type: 'percent' },
            { key: 'status', label: 'Status', type: 'status' },
          ],
          rows: [
            ...PROFIT.map(([project, contract, billed, cost, gp, budget, st]) => ({ project, contract: contract * CR, billed: billed * CR, cost: cost * CR, gp: gp * CR, margin: Math.round((gp / billed) * 1000) / 10, budget, status: st })),
            { project: 'Total', contract: 320 * CR, billed: 214.5 * CR, cost: 186 * CR, gp: 28.5 * CR, margin: 13.3, budget: 13.9, status: 'On Track' },
          ],
        },
      }),
    ]),
  ],
  dashboard: {
    flow: [
      { label: 'Revenue', value: '₹ 214.5 Cr billed' },
      { label: 'Cost', value: '₹ 186 Cr incurred' },
      { label: 'Receivables', value: '₹ 38.4 Cr outstanding' },
      { label: 'Payables', value: '₹ 21.7 Cr due' },
      { label: 'Cash', value: '₹ 18.9 Cr in bank' },
    ],
    kpis: [
      { label: 'Cash & Bank Balance', value: '₹ 18.9 Cr', delta: '+₹ 2.8 Cr', up: true, progress: 63, icon: 'ti-building-bank', sub: '4 banks · 10 accounts' },
      { label: 'Net Cash Flow (Sep)', value: '₹ 3.4 Cr', delta: '+₹ 2.1 Cr', up: true, icon: 'ti-arrows-exchange' },
      { label: 'Receivables', value: '₹ 38.4 Cr', delta: '+5.8%', up: true, good: false, progress: 46, icon: 'ti-receipt', sub: '₹ 6.1 Cr > 90 days' },
      { label: 'Payables', value: '₹ 21.7 Cr', delta: '+6.9%', up: true, good: false, progress: 45, icon: 'ti-file-invoice', sub: '₹ 4.2 Cr due in 7 days' },
      { label: 'Working Capital', value: '₹ 16.7 Cr', delta: '+₹ 0.7 Cr', up: true, icon: 'ti-scale', sub: 'Receivables − payables' },
    ],
    charts: [
      {
        title: 'Monthly Cash Flow (₹ Cr)',
        kind: 'barline',
        categories: ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'],
        series: [
          { name: 'Inflow', data: [14.2, 15.8, 13.6, 16.4, 17.1, 19.6], type: 'bar' },
          { name: 'Outflow', data: [15.0, 17.0, 13.2, 16.7, 15.8, 16.2], type: 'bar' },
          { name: 'Net cash flow', data: [-0.8, -1.2, 0.4, -0.3, 1.3, 3.4], type: 'line' },
        ],
        unit: '₹Cr',
        span: 2,
      },
      { title: 'Receivables Ageing', kind: 'donut', categories: ['0–30 days', '31–60 days', '61–90 days', '> 90 days'], series: [{ name: '₹ Cr', data: [17.6, 9.3, 5.4, 6.1] }], unit: '₹Cr', tones: ['green', 'blue', 'yellow', 'red'], subtitle: '₹ 38.4 Cr total' },
      { title: 'Revenue vs Cost by Project (₹ Cr)', kind: 'bar', categories: PROFIT.map((p) => short(p[0])), series: [{ name: 'Revenue billed', data: PROFIT.map((p) => p[2]) }, { name: 'Cost incurred', data: PROFIT.map((p) => p[3]) }], unit: '₹Cr', span: 2 },
      { title: 'Payables Ageing (₹ Cr)', kind: 'hbar', categories: ['0–30 days', '31–60 days', '61–90 days', '> 90 days'], series: [{ name: 'Payables', data: [9.8, 6.1, 3.5, 2.3] }], unit: '₹Cr' },
    ],
    table: { entity: 'finVendorBill', title: 'Vendor Bills Awaiting Payment', columns: ['billNo', 'vendor', 'project', 'dueDate', 'net', 'status'], limit: 8 },
    rail: [
      {
        kind: 'health',
        title: 'Bank Balances (₹ Cr)',
        items: [
          { label: 'HDFC Bank', value: '7.26', tone: 'blue' },
          { label: 'ICICI Bank', value: '5.18', tone: 'blue' },
          { label: 'SBI', value: '3.82', tone: 'blue' },
          { label: 'Axis Bank', value: '2.41', tone: 'blue' },
          { label: 'Petty cash (sites)', value: '0.23', tone: 'gray' },
        ],
      },
      {
        kind: 'dates',
        title: 'Statutory & Payment Calendar',
        items: [
          { date: '2026-10-07', title: 'TDS deposit — September', sub: '₹ 18.4 L · Form 26Q' },
          { date: '2026-10-15', title: 'PF & ESI remittance', sub: '₹ 12.6 L · 1,240 employees' },
          { date: '2026-10-20', title: 'GSTR-3B filing — September', sub: 'Net GST ₹ 1.12 Cr' },
          { date: '2026-10-31', title: 'Term loan EMI — HDFC Bank', sub: '₹ 47.5 L' },
        ],
      },
      {
        kind: 'list',
        title: 'Recent Finance Activity',
        items: [
          { avatar: 'Gayathri S', title: 'Gayathri S approved 12 vendor bills', sub: '₹ 2.84 Cr · Skyline Apartments', meta: '1 hour ago' },
          { avatar: 'Lakshmi N', title: 'Lakshmi N posted RA Bill 14 receipt', sub: '₹ 4.28 Cr · ABC Builders', meta: '3 hours ago' },
          { avatar: 'Nandhini P', title: 'Nandhini P reconciled HDFC CA', sub: '412 of 418 entries matched', meta: '5 hours ago' },
          { avatar: 'Gayathri S', title: 'Gayathri S released NEFT batch', sub: '18 payments · ₹ 1.96 Cr', meta: '1 day ago' },
        ],
      },
    ],
  },
  entities: [
    {
      id: 'finJournal',
      label: 'Journal Voucher',
      plural: 'Journal Vouchers',
      app: 'finance',
      codePrefix: 'JV',
      titleField: 'narration',
      form: 'page',
      info: 'Every voucher must balance — total debit equals total credit. Vouchers above ₹ 25 L need Finance Manager approval before posting.',
      sections: [
        { id: 'voucher', title: 'Voucher Details', icon: 'ti-file-text' },
        { id: 'lines', title: 'Debit / Credit', icon: 'ti-arrows-left-right' },
        { id: 'audit', title: 'Reference & Approval', icon: 'ti-user-check' },
      ],
      rows: journalRows,
      fields: [
        text('narration', 'Narration', JV.map((j) => j[0]), { required: true, section: 'voucher' }),
        select('type', 'Voucher Type', ['Journal', 'Sales', 'Purchase', 'Payment', 'Receipt', 'Contra'], { required: true, section: 'voucher' }),
        date('date', 'Voucher Date', [-20, 0], { required: true, section: 'voucher' }),
        ref('project', 'Project / Cost Centre', 'project', { required: true, section: 'voucher' }),
        text('drLedger', 'Debit Ledger', undefined, { required: true, section: 'lines' }),
        money('debit', 'Debit Amount', undefined, { required: true, section: 'lines' }),
        text('crLedger', 'Credit Ledger', undefined, { required: true, section: 'lines' }),
        money('credit', 'Credit Amount', undefined, { required: true, section: 'lines' }),
        text('reference', 'Source Reference', undefined, { section: 'audit', list: false }),
        ref('preparedBy', 'Prepared By', 'employee', { section: 'audit', list: false }),
        status(['Draft', 'Pending Approval', 'Posted', 'Rejected'], { section: 'audit' }),
      ],
    },
    {
      id: 'finPosting',
      label: 'Ledger Posting',
      plural: 'Accounting Entries',
      app: 'finance',
      codePrefix: 'LP',
      titleField: 'ledger',
      count: 24,
      info: 'System-generated postings from vouchers, bills, receipts and payments. Read-only — reverse through a journal voucher.',
      fields: [
        text('ledger', 'Ledger Account', ['1210 Trade Receivables — Clients', '4100 Contract Revenue — RA Bills', '5101 Material — Steel', '1240 Inventory — Site Stores', '2110 Trade Payables — Vendors', '1310 HDFC Bank CA — 5020 (HO)', '5301 Subcontract — Civil', '2120 Subcontractor Payables', '2160 TDS Payable', '1250 GST Input Credit', '5102 Material — Cement & RMC', '2130 Retention Payable', '5402 Equipment — Hired', '1320 ICICI Bank CA — 0078 (Collections)', '2140 Mobilisation Advance from Clients', '5201 Labour — Direct', '1330 SBI CA — 3346 (Projects)', '5501 Site Overheads', '2150 GST Output Payable', '1350 Petty Cash — Sites', '5302 Subcontract — MEP', '5901 Depreciation', '1140 Accumulated Depreciation', '5801 Finance Costs'], { required: true }),
        text('voucher', 'Voucher No.', ['JV-0413', 'JV-0413', 'JV-0412', 'JV-0412', 'PB-2291', 'PV-1184', 'SB-0412', 'SB-0412', 'SB-0412', 'PB-2291', 'JV-0421', 'SB-0388', 'JV-0418', 'RV-0766', 'JV-0417', 'JV-0425', 'PV-1190', 'PC-0342', 'RV-0766', 'PC-0342', 'SB-0391', 'JV-0414', 'JV-0414', 'PV-1193']),
        date('date', 'Posting Date', [-25, 0]),
        select('side', 'Dr / Cr', ['Dr', 'Cr'], { gen: ['Dr', 'Cr', 'Dr', 'Cr', 'Cr', 'Cr', 'Dr', 'Cr', 'Cr', 'Dr', 'Dr', 'Cr', 'Dr', 'Dr', 'Dr', 'Dr', 'Cr', 'Dr', 'Cr', 'Cr', 'Dr', 'Dr', 'Cr', 'Dr'] }),
        money('amount', 'Amount', [40000, 42800000]),
        ref('project', 'Cost Centre', 'project'),
        select('source', 'Source', ['Journal', 'Vendor Bill', 'Payment', 'Receipt', 'Subcontract Bill', 'Petty Cash']),
        status(['Posted', 'Reconciled', 'Under Review']),
      ],
    },
    {
      id: 'finVendorBill',
      label: 'Vendor Bill',
      plural: 'Vendor Bills',
      app: 'finance',
      codePrefix: 'PB',
      titleField: 'billNo',
      count: 22,
      form: 'page',
      import: true,
      info: 'Bills are 3-way matched against PO and GRN before approval. TDS under section 194C / 194Q is deducted automatically.',
      sections: [
        { id: 'bill', title: 'Bill Details', icon: 'ti-file-invoice' },
        { id: 'amount', title: 'Amount & Taxes', icon: 'ti-receipt-tax' },
        { id: 'match', title: 'Matching & Payment', icon: 'ti-link' },
      ],
      fields: [
        text('billNo', 'Vendor Invoice No.', ['SBST/26-27/1184', 'CRMC/SEP/0642', 'UBC/INV/88217', 'SMA/2026/0419', 'KBB/26-27/0233', 'APX/EL/1052', 'FLP/26/0871', 'CCP/INV/2290', 'STG/HYD/0415', 'FTS/26-27/0188', 'SGP/0934', 'DHM/26/1720', 'SGA/BLR/0311', 'PGR/SEP/0078', 'CHI/26-27/0402', 'NTD/0619', 'CFS/SEP/2231', 'TWP/26/0145', 'BLE/MUM/0087', 'SBST/26-27/1201', 'CRMC/SEP/0671', 'UBC/INV/88342'], { required: true, section: 'bill' }),
        ref('vendor', 'Vendor', 'vendor', { required: true, section: 'bill' }),
        ref('project', 'Project', 'project', { required: true, section: 'bill' }),
        date('billDate', 'Bill Date', [-75, -2], { section: 'bill' }),
        date('dueDate', 'Due Date', [-30, 40], { section: 'bill' }),
        money('taxable', 'Taxable Value', [180000, 9200000], { section: 'amount', list: false }),
        money('gst', 'GST @ 18%', [32400, 1656000], { section: 'amount', list: false }),
        money('tds', 'TDS Deducted', [1800, 92000], { section: 'amount', list: false }),
        money('net', 'Net Payable', [210000, 10800000], { section: 'amount' }),
        text('po', 'PO / GRN Ref.', ['PO-0412 / GRN-1180', 'PO-0398 / GRN-1176', 'PO-0415 / GRN-1183', 'PO-0391 / GRN-1161', 'PO-0402 / GRN-1170'], { section: 'match', list: false }),
        select('match', '3-Way Match', ['Matched', 'Qty Variance', 'Rate Variance'], { section: 'match', gen: ['Matched', 'Matched', 'Matched', 'Qty Variance', 'Matched', 'Matched', 'Rate Variance', 'Matched'] }),
        status(['Pending Approval', 'Approved', 'Partially Paid', 'Paid', 'Overdue'], { section: 'match' }),
      ],
    },
    {
      id: 'finSettlement',
      label: 'Vendor Payment',
      plural: 'Vendor Settlements',
      app: 'finance',
      codePrefix: 'PV',
      titleField: 'description',
      count: 18,
      form: 'page',
      fields: [
        text('description', 'Payment Description', ['Steel supply — August bills (3 invoices)', 'RMC supply — Tower A slabs L8–L10', 'Cement — OPC 53 grade, Sep week 1', 'M-Sand & aggregates — Greenfield Phase 2', 'AAC blocks — Riverside villas cluster B', 'Electrical cables & DBs — Metro Tower', 'CPVC & uPVC pipes — Lakeview', 'Interior emulsion — Skyline show flats', 'Granite & vitrified tiles — lobby', 'Shuttering plywood — advance 30%', 'PPE kits — quarterly supply', 'Crane hire — TC-5013, September', 'DG set rental — August', 'Façade glazing — milestone 2 (40%)', 'Lift supply — advance against PI', 'Waterproofing chemicals — terrace', 'Diesel supply — Sep fortnight 1', 'Hardware & consumables — monthly'], { required: true }),
        ref('vendor', 'Vendor', 'vendor', { required: true }),
        ref('bill', 'Against Bill', 'finVendorBill'),
        ref('project', 'Project', 'project'),
        select('mode', 'Payment Mode', ['NEFT', 'RTGS', 'Cheque', 'LC'], { gen: ['RTGS', 'RTGS', 'NEFT', 'NEFT', 'NEFT', 'RTGS', 'NEFT', 'Cheque', 'NEFT', 'RTGS', 'NEFT', 'NEFT', 'NEFT', 'RTGS', 'LC', 'NEFT', 'NEFT', 'Cheque'] }),
        select('bank', 'Paid From', ['HDFC Bank CA — 5020', 'ICICI Bank CA — 0078', 'SBI CA — 3346', 'Axis Bank CA — 9121']),
        money('amount', 'Amount Paid', [120000, 12400000]),
        money('tds', 'TDS Deducted', [1200, 124000], { list: false }),
        text('utr', 'UTR / Cheque No.', ['HDFCR52026092812441', 'HDFCR52026092711873', 'ICICN26092600413', 'SBIN226092500981', 'ICICN26092400377', 'HDFCR52026092310652', 'SBIN226092200874', 'CHQ 004512', 'ICICN26092000291'], { list: false }),
        date('date', 'Payment Date', [-20, 10]),
        status(['Scheduled', 'Pending Approval', 'Paid', 'Rejected']),
      ],
    },
    {
      id: 'finReceivable',
      label: 'Client Invoice',
      plural: 'Client Receivables',
      app: 'finance',
      codePrefix: 'AR',
      titleField: 'invoiceNo',
      count: 20,
      form: 'page',
      sections: [
        { id: 'invoice', title: 'Invoice Details', icon: 'ti-file-invoice' },
        { id: 'amount', title: 'Amount & Collection', icon: 'ti-currency-rupee' },
      ],
      fields: [
        text('invoiceNo', 'Invoice No.', ['INV/SKY/RA-14', 'INV/MOT/RA-09', 'INV/GFT/RA-07', 'INV/RVV/RA-11', 'INV/SKY/RA-13', 'INV/LKV/RA-04', 'INV/OTP/RA-18', 'INV/HVH/RA-12', 'INV/SBH/RA-08', 'INV/MOT/RA-08', 'INV/GFT/ESC-Q2', 'INV/RVV/RA-10', 'INV/SKY/VO-03', 'INV/OTP/RA-17', 'INV/HVH/RA-11', 'INV/LKV/RA-03', 'INV/GFT/RA-06', 'INV/SBH/RA-07', 'INV/MOT/VO-02', 'INV/SKY/RA-12'], { required: true, section: 'invoice' }),
        ref('client', 'Client', 'client', { required: true, section: 'invoice' }),
        ref('project', 'Project', 'project', { required: true, section: 'invoice' }),
        date('invoiceDate', 'Invoice Date', [-140, -3], { section: 'invoice' }),
        date('dueDate', 'Due Date', [-110, 30], { section: 'invoice' }),
        money('amount', 'Invoice Amount (incl. GST)', [8500000, 48000000], { section: 'amount' }),
        money('retention', 'Retention Withheld (5%)', [425000, 2400000], { section: 'amount', list: false }),
        money('outstanding', 'Outstanding', [1200000, 32000000], { section: 'amount' }),
        select('ageing', 'Ageing Bucket', ['0–30 days', '31–60 days', '61–90 days', '> 90 days'], { section: 'amount' }),
        status(['Due', 'Partially Paid', 'Overdue', 'Paid', 'Disputed'], { section: 'amount' }),
      ],
    },
    {
      id: 'finCollection',
      label: 'Receipt',
      plural: 'Collections',
      app: 'finance',
      codePrefix: 'RV',
      titleField: 'particulars',
      count: 18,
      fields: [
        text('particulars', 'Particulars', ['RA Bill 13 — final settlement', 'RA Bill 9 — part payment', 'Escalation claim Q1 — PVC steel', 'RA Bill 10 — net of retention', 'Mobilisation advance — Phase 2', 'RA Bill 17 — full payment', 'RA Bill 11 — part payment', 'Variation order VO-02', 'RA Bill 7 — net of TDS', 'Retention release — Block A', 'RA Bill 14 — part receipt', 'RA Bill 3 — Lakeview', 'RA Bill 6 — Greenfield', 'Security deposit refund', 'RA Bill 12 — Harbour View', 'RA Bill 8 — Metro Tower', 'Advance against lifts', 'RA Bill 12 — Skyline'], { required: true }),
        ref('client', 'Client', 'client', { required: true }),
        ref('project', 'Project', 'project'),
        date('date', 'Receipt Date', [-40, 15]),
        select('mode', 'Mode', ['RTGS', 'NEFT', 'Cheque'], { gen: ['RTGS', 'RTGS', 'NEFT', 'RTGS', 'RTGS', 'NEFT', 'RTGS', 'Cheque'] }),
        select('bank', 'Deposited To', ['ICICI Bank CA — 0078', 'HDFC Bank CA — 5020', 'SBI CA — 3346']),
        money('amount', 'Amount Received', [2200000, 42800000]),
        status(['Received', 'Reconciled', 'Pending', 'Cancelled'], { gen: ['Reconciled', 'Received', 'Pending', 'Reconciled', 'Received', 'Reconciled', 'Pending', 'Received', 'Reconciled', 'Cancelled'] }),
      ],
    },
    {
      id: 'finPettyCash',
      label: 'Petty Cash Voucher',
      plural: 'Petty Cash',
      app: 'finance',
      codePrefix: 'PC',
      titleField: 'purpose',
      count: 20,
      info: 'Site imprest limit ₹ 50,000 per site. Vouchers above ₹ 5,000 need Site Manager approval; replenishment is raised weekly.',
      fields: [
        text('purpose', 'Purpose', ['Tea & refreshments — site staff', 'Local conveyance — drawing collection', 'Emergency plumbing fittings', 'Courier — RA bill to client', 'Diesel for dewatering pump', 'First-aid box refill', 'Stationery — site office', 'Labour camp water tanker', 'Electrician tools — minor', 'Photocopy of drawings (A1)', 'Auto hire — cube samples to lab', 'Safety signage printing', 'Pooja for slab casting', 'Drinking water cans', 'Hardware — nails & binding wire', 'Mobile recharge — site phones', 'Vehicle puncture repair', 'Rain tarpaulin — curing cover', 'Pest control — labour camp', 'Lunch — client inspection team'], { required: true }),
        ref('project', 'Site / Project', 'project', { required: true }),
        select('head', 'Expense Head', ['Refreshments', 'Conveyance', 'Site Consumables', 'Courier & Postage', 'Fuel', 'Welfare', 'Stationery', 'Repairs']),
        money('amount', 'Amount', [180, 9500]),
        date('date', 'Date', [-20, 0]),
        ref('custodian', 'Cash Custodian', 'employee'),
        status(['Draft', 'Pending Approval', 'Approved', 'Rejected']),
      ],
    },
    {
      id: 'finCashTxn',
      label: 'Cash Transaction',
      plural: 'Cash Transactions',
      app: 'finance',
      codePrefix: 'CT',
      titleField: 'particulars',
      count: 18,
      fields: [
        text('particulars', 'Particulars', ['Imprest replenishment — Skyline site', 'Cash withdrawn from HDFC CA', 'Petty cash settlement — week 38', 'Scrap sale — MS cut pieces (cash)', 'Imprest replenishment — Metro Tower', 'Advance to foreman — labour camp', 'Cash deposited to ICICI CA', 'Imprest replenishment — Greenfield', 'Refund of unspent advance', 'Petty cash settlement — week 37', 'Imprest replenishment — Riverside', 'Cash withdrawn from SBI CA', 'Advance to driver — fuel', 'Imprest replenishment — Lakeview', 'Petty cash settlement — week 36', 'Cash sale of empty cement bags', 'Imprest replenishment — Orbit TP', 'Advance for statutory fee (cash)'], { required: true }),
        select('type', 'Type', ['Receipt', 'Payment', 'Contra'], { gen: ['Payment', 'Contra', 'Payment', 'Receipt', 'Payment', 'Payment', 'Contra', 'Payment', 'Receipt', 'Payment', 'Payment', 'Contra', 'Payment', 'Payment', 'Payment', 'Receipt', 'Payment', 'Payment'] }),
        select('account', 'Cash Account', ['Cash — Head Office', 'Cash — Skyline Site', 'Cash — Metro Tower Site', 'Cash — Greenfield Site', 'Cash — Riverside Site']),
        ref('project', 'Project', 'project'),
        money('amount', 'Amount', [2500, 50000]),
        date('date', 'Date', [-25, 0]),
        status(['Approved', 'Pending Approval', 'Cancelled'], { gen: ['Approved', 'Approved', 'Approved', 'Pending Approval', 'Approved', 'Approved', 'Approved', 'Pending Approval', 'Approved', 'Cancelled'] }),
      ],
    },
    {
      id: 'finBankAccount',
      label: 'Bank Account',
      plural: 'Bank Accounts',
      app: 'finance',
      codePrefix: 'BA',
      titleField: 'name',
      count: 10,
      fields: [
        text('name', 'Account Name', ['HDFC Bank CA — Head Office', 'ICICI Bank CA — Client Collections', 'SBI CA — Project Payments', 'Axis Bank CA — Payroll', 'HDFC Bank — RERA Escrow (Skyline)', 'ICICI Bank — RERA Escrow (Lakeview)', 'SBI — Cash Credit Account', 'Axis Bank CA — Greenfield Site', 'HDFC Bank — Margin Money FD', 'ICICI Bank CA — GST & Statutory'], { required: true }),
        select('bank', 'Bank', ['HDFC Bank', 'ICICI Bank', 'State Bank of India', 'Axis Bank'], { gen: ['HDFC Bank', 'ICICI Bank', 'State Bank of India', 'Axis Bank', 'HDFC Bank', 'ICICI Bank', 'State Bank of India', 'Axis Bank', 'HDFC Bank', 'ICICI Bank'] }),
        text('accountNo', 'Account No.', ['50200012345020', '000705010078', '38291543346', '921020045639121', '50200078810431', '000705022416', '38291560012', '921020047720188', '50300011902214', '000705031187']),
        text('ifsc', 'IFSC', ['HDFC0000082', 'ICIC0000007', 'SBIN0001542', 'UTIB0000006', 'HDFC0000082', 'ICIC0000007', 'SBIN0001542', 'UTIB0001217', 'HDFC0000082', 'ICIC0000007']),
        select('type', 'Account Type', ['Current', 'Escrow (RERA)', 'Cash Credit', 'Fixed Deposit'], { gen: ['Current', 'Current', 'Current', 'Current', 'Escrow (RERA)', 'Escrow (RERA)', 'Cash Credit', 'Current', 'Fixed Deposit', 'Current'] }),
        text('branch', 'Branch', ['Taramani, Chennai', 'Nungambakkam, Chennai', 'Anna Salai, Chennai', 'T. Nagar, Chennai', 'Taramani, Chennai', 'Nungambakkam, Chennai', 'Anna Salai, Chennai', 'Hosur', 'Taramani, Chennai', 'Nungambakkam, Chennai']),
        money('balance', 'Book Balance', [2400000, 72600000]),
        status(['Active', 'Inactive'], { gen: ['Active', 'Active', 'Active', 'Active', 'Active', 'Active', 'Active', 'Active', 'Active', 'Inactive'] }),
      ],
    },
    {
      id: 'finBankTxn',
      label: 'Bank Transaction',
      plural: 'Bank Transactions',
      app: 'finance',
      codePrefix: 'BT',
      titleField: 'narration',
      count: 24,
      import: true,
      info: 'Bank statements are imported daily (MT940 / Excel). Auto-match uses amount, UTR and date ± 3 days.',
      fields: [
        text('narration', 'Statement Narration', ['NEFT CR — ABC BUILDERS PVT LTD — RA14', 'RTGS DR — SHREE BALAJI STEEL TRADERS', 'NEFT DR — CHENNAI RMC PVT LTD', 'RTGS CR — METRO CONSTRUCTIONS — RA09', 'CHQ 004512 — ULTRABUILD CEMENTS', 'NEFT DR — SALARY BATCH SEP-26', 'INT CR — FD 50300011902214', 'NEFT DR — CRANE HIRE INDIA', 'CHG — QUARTERLY MAINT CHARGES', 'RTGS CR — XYZ DEVELOPERS — RA11', 'NEFT DR — PRECISION MEP SERVICES', 'GST PMT — CPIN 26093300012', 'TDS PMT — CHALLAN 281', 'NEFT DR — SAI RAM CONSTRUCTIONS', 'NEFT CR — ORBIT TECH PARKS — RA17', 'RTGS DR — BHARAT LIFTS — ADV', 'NEFT DR — COASTAL FUEL SERVICES', 'CASH WDL — SELF — IMPREST', 'NEFT CR — COASTAL HEALTHCARE — RA12', 'NEFT DR — FORMTECH SHUTTERING', 'EMI DR — TERM LOAN A/C 8812', 'NEFT DR — SAFEGUARD PPE SUPPLIES', 'RTGS CR — GREENFIELD INFRA — ESC-Q2', 'NEFT DR — APEX ELECTRICALS'], { required: true }),
        ref('account', 'Bank Account', 'finBankAccount', { required: true }),
        date('date', 'Value Date', [-28, 0]),
        select('type', 'Dr / Cr', ['Credit', 'Debit'], { gen: ['Credit', 'Debit', 'Debit', 'Credit', 'Debit', 'Debit', 'Credit', 'Debit', 'Debit', 'Credit', 'Debit', 'Debit', 'Debit', 'Debit', 'Credit', 'Debit', 'Debit', 'Debit', 'Credit', 'Debit', 'Debit', 'Debit', 'Credit', 'Debit'] }),
        money('amount', 'Amount', [40000, 42800000]),
        text('utr', 'UTR / Cheque', ['ICICN26092800412', 'HDFCR52026092712441', 'HDFCR52026092611873', 'SBIN226092500981', 'CHQ 004512', 'AXISN26092500112', 'FDINT0926', 'HDFCR52026092310652'], { list: false }),
        text('matchedTo', 'Matched Voucher', ['RV-0766', 'PV-1184', 'PV-1183', 'RV-0761', '—', 'JV-0425', 'JV-0420', 'PV-1190', '—', 'RV-0758'], { list: false }),
        status(['Pending', 'Under Review', 'Reconciled'], { gen: ['Reconciled', 'Reconciled', 'Reconciled', 'Reconciled', 'Pending', 'Reconciled', 'Pending', 'Reconciled', 'Pending', 'Reconciled', 'Under Review', 'Reconciled'] }),
      ],
    },
  ],
};

