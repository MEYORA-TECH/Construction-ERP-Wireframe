import { approval, area, date, f, gantt, group, leaf, money, num, page, ref, register, select, status, statusView, text, lineItemsNoTax } from '../dsl';
import type { AppConfig, Row } from '../types';

const P8 = ['Skyline', 'Riverside', 'Greenfield', 'Metro Tower', 'Lakeview', 'Orbit TP', 'Harbour View', 'Sunrise'];
const REASONS = ['Client Change', 'Design Change', 'Site Condition', 'Regulatory Change'];
const TYPES = ['Quantity Variation', 'Rate Variation', 'New Item'];

/* ── variation orders (index-aligned so VO-001 … VO-018 read consistently everywhere) ── */
const VO_TITLES = [
  'Additional basement parking bay extension',
  'Lobby flooring upgrade to Italian marble',
  'Revised column sizes per structural redesign',
  'Rock excavation encountered below -4.5 m',
  'Additional fire staircase per revised NBC norms',
  'Façade glazing upgrade to DGU',
  'Dewatering due to high groundwater table',
  'Podium slab thickness increase (200 → 250 mm)',
  'Rainwater harvesting sump per CMDA amendment',
  'Additional EV charging points — basement',
  'Steel grade change Fe500 → Fe550D',
  'Soil stabilisation — soft clay pockets',
  'Clubhouse terrace landscaping addition',
  'Revised MEP shaft layout — Tower A',
  'Rooftop solar PV per green building mandate',
  'Modular kitchen specification upgrade',
  'Retaining wall height increase — revised site levels',
  'Omission of false ceiling in service corridors',
];
const VO_REASON = ['Client Change', 'Client Change', 'Design Change', 'Site Condition', 'Regulatory Change', 'Client Change', 'Site Condition', 'Design Change', 'Regulatory Change', 'Client Change', 'Design Change', 'Site Condition', 'Client Change', 'Design Change', 'Regulatory Change', 'Client Change', 'Site Condition', 'Design Change'];
const VO_TYPE = ['Quantity Variation', 'Rate Variation', 'Quantity Variation', 'New Item', 'New Item', 'Rate Variation', 'New Item', 'Quantity Variation', 'New Item', 'New Item', 'Rate Variation', 'Quantity Variation', 'New Item', 'Quantity Variation', 'New Item', 'Rate Variation', 'Quantity Variation', 'Quantity Variation'];
// 11 open (5 Submitted + 6 Under Review), 4 Approved, 2 Draft, 1 Rejected
const VO_STATUS = ['Under Review', 'Approved', 'Submitted', 'Under Review', 'Submitted', 'Approved', 'Under Review', 'Draft', 'Submitted', 'Under Review', 'Approved', 'Rejected', 'Submitted', 'Under Review', 'Approved', 'Draft', 'Submitted', 'Under Review'];

/* ── line items: [description, section, boqRef, unit, contractQty, variedQty, rate] ── */
const QTY_LINES: [string, string, string, string, number, number, number][] = [
  ['Excavation in ordinary soil up to 3 m depth', 'VO-001 · Basement parking extension', 'BOQ 2.1.2', 'm³', 18400, 3250, 285],
  ['PCC M15 below raft', 'VO-001 · Basement parking extension', 'BOQ 2.3.1', 'm³', 620, 118, 5850],
  ['RCC M35 raft incl. pumping', 'VO-001 · Basement parking extension', 'BOQ 2.4.1', 'm³', 4200, 760, 7450],
  ['Reinforcement Fe550D — raft & walls', 'VO-001 · Basement parking extension', 'BOQ 2.5.1', 'MT', 610, 96, 72500],
  ['Basement retaining wall RCC M35', 'VO-001 · Basement parking extension', 'BOQ 2.4.3', 'm³', 1350, 210, 7850],
  ['RCC M40 columns — L1 to L6', 'VO-003 · Revised column sizes', 'BOQ 3.1.1', 'm³', 1860, 142, 8150],
  ['Reinforcement Fe550D — columns', 'VO-003 · Revised column sizes', 'BOQ 3.2.1', 'MT', 312, 28.5, 72500],
  ['Column shuttering — film-faced plywood', 'VO-003 · Revised column sizes', 'BOQ 3.3.1', 'm²', 14200, 1180, 540],
  ['RCC M35 podium slab (200 → 250 mm)', 'VO-008 · Podium slab thickness', 'BOQ 3.1.4', 'm³', 2240, 560, 7650],
  ['Reinforcement Fe550D — podium slab', 'VO-008 · Podium slab thickness', 'BOQ 3.2.4', 'MT', 268, 42, 72500],
  ['Crystalline waterproofing — podium', 'VO-008 · Podium slab thickness', 'BOQ 6.2.1', 'm²', 6800, 450, 385],
  ['Gypsum false ceiling — service corridors', 'VO-018 · Omission — false ceiling', 'BOQ 8.4.2', 'm²', 5400, -3860, 1150],
  ['GI framing for false ceiling', 'VO-018 · Omission — false ceiling', 'BOQ 8.4.3', 'm²', 5400, -3860, 310],
  ['Access panels 600 × 600 mm', 'VO-018 · Omission — false ceiling', 'BOQ 8.4.5', 'Nos', 180, -124, 2450],
];
/* [description, section, boqRef, unit, balanceQty, contractRate, revisedRate] */
const RATE_LINES: [string, string, string, string, number, number, number][] = [
  ['Italian marble flooring 18 mm — lobby', 'VO-002 · Lobby flooring — Italian marble', 'BOQ 8.1.4', 'm²', 1450, 2850, 6400],
  ['Marble skirting 100 mm', 'VO-002 · Lobby flooring — Italian marble', 'BOQ 8.1.6', 'Rmt', 980, 420, 890],
  ['Diamond polishing & sealing', 'VO-002 · Lobby flooring — Italian marble', 'BOQ 8.1.9', 'm²', 1450, 120, 310],
  ['DGU glazing 6+12+6 mm — curtain wall', 'VO-006 · Façade glazing upgrade to DGU', 'BOQ 9.2.1', 'm²', 7800, 6850, 9400],
  ['Aluminium mullion system — thermal break', 'VO-006 · Façade glazing upgrade to DGU', 'BOQ 9.2.3', 'Rmt', 11200, 1650, 2280],
  ['Structural silicone & weather sealant', 'VO-006 · Façade glazing upgrade to DGU', 'BOQ 9.2.6', 'Rmt', 15600, 185, 265],
  ['TMT reinforcement Fe550D — superstructure', 'VO-011 · Steel grade Fe500 → Fe550D', 'BOQ 3.2.1', 'MT', 1240, 68500, 72500],
  ['Mechanical couplers — Ø25 / Ø32', 'VO-011 · Steel grade Fe500 → Fe550D', 'BOQ 3.2.7', 'Nos', 8600, 145, 185],
  ['Modular kitchen — base & wall units (acrylic)', 'VO-016 · Modular kitchen upgrade', 'BOQ 10.3.1', 'Sets', 216, 185000, 248000],
  ['Quartz countertop 20 mm', 'VO-016 · Modular kitchen upgrade', 'BOQ 10.3.2', 'Rmt', 864, 6200, 8900],
  ['Chimney & hob — premium brand', 'VO-016 · Modular kitchen upgrade', 'BOQ 10.3.4', 'Sets', 216, 38500, 52000],
  ['SS double-bowl sink with drainer', 'VO-016 · Modular kitchen upgrade', 'BOQ 10.3.5', 'Nos', 216, 9800, 14200],
];
/* [description, section, rate basis, unit, qty, agreed rate, rate status] */
const NEW_LINES: [string, string, string, string, number, number, string][] = [
  ['Excavation in hard rock by controlled blasting', 'VO-004 · Rock excavation below -4.5 m', 'Rate Analysis', 'm³', 2650, 1480, 'Approved'],
  ['Chiselling of rock by hydraulic breaker', 'VO-004 · Rock excavation below -4.5 m', 'Rate Analysis', 'm³', 780, 2150, 'Approved'],
  ['Disposal of excavated rock beyond 5 km lead', 'VO-004 · Rock excavation below -4.5 m', 'Market Rate', 'm³', 3430, 320, 'Approved'],
  ['RCC M35 staircase — waist slab & landings', 'VO-005 · Additional fire staircase', 'Analogous BOQ Item', 'm³', 186, 8350, 'Under Review'],
  ['MS fire-rated door 2 hr with panic bar', 'VO-005 · Additional fire staircase', 'Market Rate', 'Nos', 24, 48500, 'Under Review'],
  ['Staircase pressurisation fan 18,000 CFM', 'VO-005 · Additional fire staircase', 'Market Rate', 'Nos', 2, 385000, 'Pending'],
  ['Deep wellpoint dewatering system', 'VO-007 · Dewatering', 'Rate Analysis', 'Days', 75, 18500, 'Approved'],
  ['Dewatering pump 10 HP — running hours', 'VO-007 · Dewatering', 'Market Rate', 'Hrs', 2160, 420, 'Approved'],
  ['RCC RWH sump 150 KL incl. waterproofing', 'VO-009 · Rainwater harvesting sump', 'Rate Analysis', 'LS', 1, 1860000, 'Pending'],
  ['Recharge wells 1.2 m dia × 6 m deep', 'VO-009 · Rainwater harvesting sump', 'Market Rate', 'Nos', 12, 42500, 'Pending'],
  ['Rooftop solar PV — mono-PERC 540 Wp modules', 'VO-015 · Rooftop solar PV', 'Client Negotiated', 'kWp', 180, 46500, 'Under Review'],
  ['Module mounting structure — hot-dip GI', 'VO-015 · Rooftop solar PV', 'Market Rate', 'kWp', 180, 5200, 'Under Review'],
  ['Grid-tie inverter 60 kW', 'VO-015 · Rooftop solar PV', 'Market Rate', 'Nos', 3, 285000, 'Under Review'],
  ['Net metering & CEIG approval', 'VO-015 · Rooftop solar PV', 'Client Negotiated', 'LS', 1, 145000, 'Pending'],
];

const code = (p: string, i: number) => `${p}-${String(i + 1).padStart(3, '0')}`;
const qtyRows: Row[] = QTY_LINES.map(([description, section, boqRef, unit, origQty, qty, rate], i) => ({ id: code('VQ', i), code: code('VQ', i), description, section, boqRef, unit, origQty, qty, rate }));
const rateRows: Row[] = RATE_LINES.map(([description, section, boqRef, unit, qty, origRate, newRate], i) => ({ id: code('VR', i), code: code('VR', i), description, section, boqRef, unit, qty, origRate, newRate, rate: newRate - origRate }));
const newRows: Row[] = NEW_LINES.map(([description, section, basis, unit, qty, rate, st], i) => ({ id: code('VN', i), code: code('VN', i), description, section, basis, unit, qty, rate, status: st }));
const uniq = (xs: string[]) => [...new Set(xs)];

/* ── consistent enterprise figures (₹ Cr) ── */
const APPROVED = [3.2, 0.9, 2.4, 2.1, 0.6, 0.4, 0.8, 0.3]; // 10.7
const PENDING = [2.6, 0.7, 2.2, 1.9, 0.9, 0.3, 0.8, 0.4]; // 9.8
const TCV = [85, 42, 58, 64, 28, 18, 15, 10];
const CR = 1e7;

export const variationsApp: AppConfig = {
  id: 'variations',
  name: 'Variations',
  icon: 'ti-arrows-exchange',
  description: 'Variation requests, quantity / rate / new-item changes, cost & schedule impact, approvals and contract updates',
  menus: [
    leaf('Variation Request', 'ti-file-plus', register('varRequest', { views: ['table', 'board'], tabs: { field: 'status', values: ['Draft', 'Submitted', 'Under Review', 'Approved', 'Rejected'] } })),
    group('Reason', 'ti-help-circle', REASONS.map((r) => page(r, statusView('varRequest', r, 'reason')))),
    leaf('Quantity Variation', 'ti-ruler-measure', lineItemsNoTax('varQtyItem', 'Quantity Variations — BOQ Quantity Changes', ['boqRef', 'origQty'])),
    leaf('Rate Variation', 'ti-currency-rupee', lineItemsNoTax('varRateItem', 'Rate Variations — Revised Rates', ['boqRef', 'origRate', 'newRate'])),
    leaf('New Item', 'ti-square-plus', lineItemsNoTax('varNewItem', 'New (Extra) Items — Non-BOQ', ['basis', 'status'])),
    leaf('Cost Impact', 'ti-coins', {
      type: 'analysis',
      title: 'Cost Impact of Variations',
      kpis: [
        { label: 'Total variations raised', value: '₹ 20.5 Cr', icon: 'ti-arrows-exchange', sub: '18 variation orders · FY 2026-27' },
        { label: 'Approved variations', value: '₹ 10.7 Cr', progress: 52, icon: 'ti-circle-check', sub: 'Incorporated in revised contract' },
        { label: 'Pending approval', value: '₹ 9.8 Cr', icon: 'ti-hourglass', sub: '11 open · 4 awaiting client' },
        { label: 'Impact on contract value', value: '+3.3%', delta: '₹ 320 → 330.7 Cr', up: true, icon: 'ti-trending-up' },
        { label: 'Margin on variations', value: '18.6%', delta: '+5.3 pts vs base', up: true, icon: 'ti-percentage' },
      ],
      charts: [
        { title: 'Approved vs Pending Variations by Project (₹ Cr)', kind: 'stacked', categories: P8, series: [{ name: 'Approved', data: APPROVED }, { name: 'Pending', data: PENDING }], unit: '₹Cr', span: 2 },
        { title: 'Variation Value by Type', kind: 'donut', categories: TYPES, series: [{ name: '₹ Cr', data: [9.6, 4.3, 6.6] }], unit: '₹Cr', subtitle: '₹ 20.5 Cr raised' },
        { title: 'Approved Value by Reason (₹ Cr)', kind: 'waterfall', categories: [...REASONS, 'Approved Total'], series: [{ name: 'Approved', data: [4.6, 3.1, 1.9, 1.1, 0] }], unit: '₹Cr' },
        { title: 'Cost Heads Affected (₹ Cr)', kind: 'hbar', categories: ['Material', 'Labour', 'Subcontract', 'Equipment', 'Site Overheads'], series: [{ name: 'Impact', data: [9.2, 4.1, 3.9, 1.8, 1.5] }], unit: '₹Cr', span: 2 },
      ],
      table: {
        title: 'Largest Variations — Cost Impact',
        columns: [
          { key: 'vo', label: 'VO No.', type: 'code' },
          { key: 'title', label: 'Variation' },
          { key: 'reason', label: 'Reason' },
          { key: 'type', label: 'Type' },
          { key: 'value', label: 'Value', type: 'currency' },
          { key: 'margin', label: 'Margin', type: 'percent' },
          { key: 'status', label: 'Status', type: 'status' },
        ],
        rows: [0, 5, 3, 14, 10, 2, 6, 15].map((i, k) => ({
          vo: code('VO', i),
          title: VO_TITLES[i],
          reason: VO_REASON[i],
          type: VO_TYPE[i],
          value: [26400000, 24800000, 21700000, 16200000, 13900000, 11600000, 9400000, 8700000][k],
          margin: [17, 21, 24, 15, 9, 16, 22, 19][k],
          status: VO_STATUS[i],
        })),
      },
    }),
    leaf('Schedule Impact', 'ti-calendar-time', gantt('Schedule Impact of Variations', 'impact')),
    leaf('Approval', 'ti-checks', approval('varRequest', ['Internal Review', 'Consultant', 'Client', 'Final Approval'])),
    leaf('Contract Update', 'ti-file-pencil', {
      type: 'comparison',
      title: 'Contract Update — Original vs Approved Variations vs Revised Contract',
      subjectLabel: 'Project',
      subjects: P8,
      note: 'Revised Contract = Original Contract + Approved Variations. Pending variations are shown for information only and are not yet incorporated into the contract amendment.',
      rows: [
        { group: 'Contract Value', label: 'Original contract value', values: TCV.map((v) => v * CR), format: 'currency' },
        { group: 'Contract Value', label: 'Approved variations', values: APPROVED.map((v) => v * CR), format: 'currency', best: 'max' },
        { group: 'Contract Value', label: 'Pending variations (not incorporated)', values: PENDING.map((v) => v * CR), format: 'currency' },
        { group: 'Contract Value', label: 'Revised contract value', values: TCV.map((v, i) => Math.round((v + APPROVED[i]) * 10) * 1e6), format: 'currency' },
        { group: 'Contract Value', label: 'Change vs original', values: [3.8, 2.1, 4.1, 3.3, 2.1, 2.2, 5.3, 3.0], format: 'percent' },
        { group: 'Time', label: 'Original completion', values: ['31 Dec 2026', '30 Nov 2026', '28 Feb 2027', '31 Dec 2026', '30 Jun 2027', '30 Nov 2026', '15 Dec 2026', '31 Dec 2026'], format: 'text' },
        { group: 'Time', label: 'EOT granted (days)', values: [21, 0, 45, 14, 0, 0, 21, 0], format: 'number' },
        { group: 'Time', label: 'Revised completion', values: ['21 Jan 2027', '30 Nov 2026', '14 Apr 2027', '14 Jan 2027', '30 Jun 2027', '30 Nov 2026', '05 Jan 2027', '31 Dec 2026'], format: 'text' },
        { group: 'Contract Amendment', label: 'Amendment no.', values: ['AMD-03', 'AMD-01', 'AMD-02', 'AMD-02', 'AMD-01', 'AMD-01', 'AMD-02', 'AMD-01'], format: 'text' },
        { group: 'Contract Amendment', label: 'Approved VOs incorporated', values: [4, 2, 3, 3, 1, 1, 2, 1], format: 'number' },
        { group: 'Contract Amendment', label: 'Amendment status', values: ['Approved', 'Approved', 'Pending Approval', 'Approved', 'Draft', 'Approved', 'Under Review', 'Approved'], format: 'status' },
      ],
    }),
  ],
  dashboard: {
    flow: [
      { label: 'Requests', value: '18 raised · ₹ 20.5 Cr' },
      { label: 'Internal Review', value: '5 submitted' },
      { label: 'Consultant / Client', value: '6 under review' },
      { label: 'Approved', value: '₹ 10.7 Cr' },
      { label: 'Contract Updated', value: '6 amendments' },
    ],
    kpis: [
      { label: 'Open Variations', value: '11', sub: '₹ 9.8 Cr under approval', icon: 'ti-arrows-exchange', progress: 61 },
      { label: 'Awaiting Client Approval', value: '4', delta: '+1 this week', up: true, good: false, icon: 'ti-hourglass' },
      { label: 'Approved Value (FY)', value: '₹ 10.7 Cr', delta: '+₹ 2.1 Cr', up: true, icon: 'ti-circle-check', progress: 52 },
      { label: 'Contract Value Impact', value: '+3.3%', sub: '₹ 320 Cr → ₹ 330.7 Cr', icon: 'ti-trending-up' },
      { label: 'Time Impact Sought', value: '164 days', sub: '101 days granted as EOT', icon: 'ti-calendar-time' },
    ],
    charts: [
      { title: 'Variation Value by Project (₹ Cr)', kind: 'stacked', categories: P8, series: [{ name: 'Approved', data: APPROVED }, { name: 'Pending', data: PENDING }], unit: '₹Cr', span: 2 },
      { title: 'Variations by Reason', kind: 'donut', categories: REASONS, series: [{ name: '₹ Cr', data: [8.4, 6.1, 3.8, 2.2] }], unit: '₹Cr', subtitle: '₹ 20.5 Cr raised' },
      { title: 'Open Variation Ageing', kind: 'bar', categories: ['< 15 days', '15–30 days', '31–60 days', '> 60 days'], series: [{ name: 'Variations', data: [3, 4, 3, 1] }] },
    ],
    table: { entity: 'varRequest', title: 'Recent Variation Requests', columns: ['title', 'project', 'reason', 'type', 'value', 'status'], limit: 6 },
    rail: [
      {
        kind: 'health',
        title: 'Variation Status',
        items: [
          { label: 'Draft', value: 2, tone: 'gray' },
          { label: 'Submitted', value: 5, tone: 'blue' },
          { label: 'Under Review', value: 6, tone: 'yellow' },
          { label: 'Approved', value: 4, tone: 'green' },
          { label: 'Rejected', value: 1, tone: 'red' },
        ],
      },
      {
        kind: 'list',
        title: 'Awaiting Client Approval',
        items: [0, 3, 9, 13].map((i, k) => ({ title: `${code('VO', i)} — ${VO_TITLES[i]}`, sub: VO_REASON[i], meta: ['18 days', '12 days', '9 days', '4 days'][k], status: 'Under Review' })),
      },
      {
        kind: 'dates',
        title: 'Upcoming Reviews',
        items: [
          { date: '2026-10-01', title: 'Consultant review — VO-003, VO-008', sub: 'Skyline Apartments' },
          { date: '2026-10-06', title: 'Client variation meeting', sub: 'Metro Office Tower' },
          { date: '2026-10-09', title: 'Contract amendment AMD-02 sign-off', sub: 'Greenfield Township' },
          { date: '2026-10-15', title: 'Rate negotiation — rooftop solar PV', sub: 'Harbour View Hospital' },
        ],
      },
    ],
  },
  entities: [
    {
      id: 'varRequest',
      label: 'Variation',
      plural: 'Variations',
      app: 'variations',
      codePrefix: 'VO',
      titleField: 'title',
      count: 18,
      form: 'wizard',
      info: 'Variation orders move Draft → Submitted → Under Review (internal, consultant, client) → Approved / Rejected. Approved values flow into the revised contract.',
      sections: [
        { id: 'request', title: 'Request Details', icon: 'ti-file-description' },
        { id: 'reason', title: 'Reason & Justification', icon: 'ti-help-circle' },
        { id: 'impact', title: 'Cost & Time Impact', icon: 'ti-coins' },
      ],
      fields: [
        text('title', 'Variation Title', VO_TITLES, { required: true, section: 'request' }),
        ref('project', 'Project', 'project', { required: true, section: 'request' }),
        select('type', 'Variation Type', TYPES, { required: true, section: 'request', gen: VO_TYPE }),
        select('initiatedBy', 'Initiated By', ['Client', 'Consultant', 'Contractor', 'Authority'], { section: 'request', list: false }),
        ref('requestedBy', 'Requested By', 'employee', { section: 'request', list: false }),
        date('date', 'Request Date', [-160, -3], { required: true, section: 'request' }),
        select('reason', 'Reason', REASONS, { required: true, section: 'reason', gen: VO_REASON }),
        text('instruction', 'Instruction Ref.', ['CI-014', 'CI-017', 'SI-022', 'SI-031', 'AUTH-004', 'CI-019', 'SI-035', 'SI-038', 'AUTH-006', 'CI-023', 'SI-041', 'SI-044', 'CI-026', 'SI-047', 'AUTH-009', 'CI-029', 'SI-052', 'SI-055'], { section: 'reason', list: false }),
        area('justification', 'Justification', [
          'Client instruction vide letter dated 12 Aug 2026 to add 42 parking bays in basement 2.',
          'Architect revised lobby finish schedule; approved sample of Italian marble.',
          'Structural consultant revised column schedule after wind-load re-analysis.',
          'Hard rock encountered below -4.5 m; geotechnical report GTR-07 attached.',
          'Revised NBC 2016 fire norms require second staircase for towers above 45 m.',
          'Client upgraded façade to DGU for energy performance (EPI target).',
          'Groundwater table at -2.1 m against -6.0 m assumed in tender.',
        ], { section: 'reason' }),
        money('value', 'Variation Value', [1200000, 26000000], { required: true, section: 'impact' }),
        num('timeImpact', 'Time Impact', [0, 45], { unit: 'days', section: 'impact' }),
        num('boqItems', 'BOQ Items Affected', [2, 18], { section: 'impact', list: false }),
        status(['Draft', 'Submitted', 'Under Review', 'Approved', 'Rejected'], { section: 'request', gen: VO_STATUS }),
      ],
    },
    {
      id: 'varQtyItem',
      label: 'Quantity Variation Line',
      plural: 'Quantity Variation Lines',
      app: 'variations',
      codePrefix: 'VQ',
      titleField: 'description',
      rows: qtyRows,
      fields: [
        text('description', 'Description', undefined, { required: true }),
        select('section', 'Variation Order', uniq(QTY_LINES.map((l) => l[1]))),
        text('boqRef', 'BOQ Ref.'),
        text('unit', 'Unit'),
        num('origQty', 'Contract Qty'),
        num('qty', 'Varied Qty (+/-)'),
        money('rate', 'BOQ Rate'),
      ],
    },
    {
      id: 'varRateItem',
      label: 'Rate Variation Line',
      plural: 'Rate Variation Lines',
      app: 'variations',
      codePrefix: 'VR',
      titleField: 'description',
      rows: rateRows,
      fields: [
        text('description', 'Description', undefined, { required: true }),
        select('section', 'Variation Order', uniq(RATE_LINES.map((l) => l[1]))),
        text('boqRef', 'BOQ Ref.'),
        text('unit', 'Unit'),
        num('qty', 'Balance Qty'),
        money('origRate', 'Contract Rate'),
        money('newRate', 'Revised Rate'),
        money('rate', 'Rate Difference'),
      ],
    },
    {
      id: 'varNewItem',
      label: 'New Item',
      plural: 'New Items',
      app: 'variations',
      codePrefix: 'VN',
      titleField: 'description',
      rows: newRows,
      fields: [
        text('description', 'Description', undefined, { required: true }),
        select('section', 'Variation Order', uniq(NEW_LINES.map((l) => l[1]))),
        select('basis', 'Rate Basis', ['Rate Analysis', 'Market Rate', 'Analogous BOQ Item', 'Client Negotiated']),
        text('unit', 'Unit'),
        num('qty', 'Quantity'),
        money('rate', 'Agreed Rate'),
        f('status', 'Rate Status', 'status', { options: ['Pending', 'Under Review', 'Approved'] }),
      ],
    },
  ],
};
