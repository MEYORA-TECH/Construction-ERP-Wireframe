import { area, date, docs, fieldView, group, money, num, page, pct, ref, register, select, status, text } from '../dsl';
import type { AppConfig, ChartSpec, EntityDef, KpiSpec, Row, ViewSpec } from '../types';

const CR = 1e7;
const cr = (x: number) => Math.round(x * CR);
const pad = (n: number) => String(n).padStart(3, '0');
const r2 = (x: number) => Math.round(x * 100) / 100;

const EST_STATUS = ['Draft', 'In Progress', 'Under Review', 'Submitted', 'Approved', 'Rejected', 'Archived'];
const HV = 'EST-001 Harbour View Hospital — Phase II';

/* ───────── Estimates (seed rows keep title ↔ client ↔ tender consistent) ───────── */
/** [title, tender ref, client, category, basis, version, BUA sqft, direct ₹Cr, total cost ₹Cr, final estimate ₹Cr, margin %, estimator, prepared on, status] */
const estData: [string, string, string, string, string, string, number, number, number, number, number, string, string, string][] = [
  ['Harbour View Hospital — Phase II Medical Block', 'TND-001', 'CL-007', 'Institutional', 'Tender Estimate', 'R2', 340000, 118.0, 129.9, 142.9, 10.0, 'EMP-016', '2026-09-24', 'Under Review'],
  ['Orbit Tech Park Phase III — Tower C & D Shell', 'TND-002', 'CL-006', 'Commercial', 'Tender Estimate', 'R3', 620000, 138.5, 152.4, 169.2, 11.0, 'EMP-038', '2026-09-26', 'Approved'],
  ['Meridian Logistics Park — Warehouse Blocks A–F', 'TND-003', 'CL-010', 'Industrial', 'Tender Estimate', 'R1', 540000, 73.3, 80.6, 88.7, 10.0, 'EMP-006', '2026-09-21', 'In Progress'],
  ['Pinnacle Heights — G+22 Residential Towers', 'TND-004', 'CL-009', 'Residential', 'Tender Estimate', 'R0', 460000, 107.4, 118.2, 128.8, 9.0, 'EMP-016', '2026-09-18', 'Draft'],
  ['ABC Grand — Luxury Apartments, Adyar', 'TND-010', 'CL-001', 'Residential', 'Tender Estimate', 'R1', 185000, 45.8, 50.4, 56.4, 12.0, 'EMP-038', '2026-09-23', 'In Progress'],
  ['XYZ Riverfront Mall — Civil & Structure', 'TND-011', 'CL-002', 'Commercial', 'Tender Estimate', 'R2', 510000, 98.7, 108.6, 118.4, 9.0, 'EMP-006', '2026-09-25', 'Under Review'],
  ['XYZ Developers — Affordable Housing (480 units)', 'TND-020', 'CL-002', 'Residential', 'Tender Estimate', 'R0', 312000, 44.5, 48.9, 52.3, 7.0, 'EMP-016', '2026-09-20', 'Draft'],
  ['Greenfield Township Phase 3 — Villas & Clubhouse', 'TND-006', 'CL-003', 'Residential', 'Tender Estimate', 'R2', 410000, 92.0, 101.2, 110.8, 9.5, 'EMP-038', '2026-09-12', 'Submitted'],
  ['Metro Corporate Park — Block B Superstructure', 'TND-007', 'CL-004', 'Commercial', 'Tender Estimate', 'R2', 350000, 70.5, 77.6, 84.9, 9.4, 'EMP-006', '2026-09-08', 'Submitted'],
  ['Lakeview Residency Phase 2 — Towers 5 & 6', 'TND-008', 'CL-005', 'Residential', 'Tender Estimate', 'R3', 380000, 77.4, 85.2, 93.4, 9.6, 'EMP-016', '2026-08-04', 'Approved'],
  ['Sunrise Business Hotel — Annex Block', 'TND-014', 'CL-008', 'Hospitality', 'Tender Estimate', 'R2', 96000, 27.1, 29.8, 33.2, 11.4, 'EMP-038', '2026-08-12', 'Approved'],
  ['Pinnacle IT Park — Hinjewadi Phase 1', 'TND-015', 'CL-009', 'Commercial', 'Tender Estimate', 'R2', 580000, 116.7, 128.4, 139.6, 8.7, 'EMP-006', '2026-07-02', 'Archived'],
  ['Metro Office Tower — Façade & Interiors Package', 'TND-017', 'CL-004', 'Commercial', 'Tender Estimate', 'R1', 210000, 37.5, 41.2, 45.6, 10.7, 'EMP-016', '2026-07-24', 'Approved'],
  ['Orbit Data Centre — Civil Works', 'TND-013', 'CL-006', 'Industrial', 'Preliminary Estimate', 'R0', 420000, 131.5, 144.6, 158.9, 9.9, 'EMP-038', '2026-09-27', 'In Progress'],
  ['Riverside Villas — Clubhouse Addition', '—', 'CL-002', 'Residential', 'Detailed Estimate', 'R1', 28000, 6.2, 6.8, 7.6, 11.8, 'EMP-006', '2026-09-15', 'Rejected'],
  ['Coastal Nursing College & Hostel', 'TND-009', 'CL-007', 'Institutional', 'Tender Estimate', 'R2', 165000, 32.2, 35.4, 38.9, 9.9, 'EMP-016', '2026-07-15', 'Archived'],
];

const ASSUMPTIONS = 'Rates as of Sep 2026 incl. transport to site; GST extra. Excludes client-supplied equipment, land development charges and statutory approval fees.';
const estRows: Row[] = estData.map(([title, tenderRef, client, category, basis, version, builtUp, direct, totalCost, total, margin, estimator, preparedOn, st], i) => ({
  id: `EST-${pad(i + 1)}`,
  code: `EST-${pad(i + 1)}`,
  title,
  tenderRef,
  client,
  category,
  basis,
  version,
  builtUp,
  estimator,
  preparedOn,
  assumptions: ASSUMPTIONS,
  directCost: cr(direct),
  totalCost: cr(totalCost),
  margin,
  total: cr(total),
  costPerSqft: Math.round((totalCost * CR) / builtUp),
  approver: 'EMP-032',
  approvalRemarks: st === 'Rejected' ? 'Client revised scope; re-estimate with updated clubhouse layout.' : st === 'Approved' ? 'Approved by Bid Committee.' : '',
  status: st,
}));

/* ───────── Line-item seed data ───────── */
type Line = [string, string, string, number, number];
function lines(prefix: string, data: Line[], extraKey?: string, extra?: string[]): Row[] {
  return data.map(([section, description, unit, qty, rate], i) => ({
    id: `${prefix}-${pad(i + 1)}`,
    code: `${prefix}-${pad(i + 1)}`,
    section,
    description,
    unit,
    qty,
    rate,
    ...(extraKey && extra ? { [extraKey]: extra[i] } : {}),
  }));
}

/** [section, description, unit, nos, length, breadth, depth/height, rate, fixed qty (BBS)] */
const measData: [string, string, string, number | null, number | null, number | null, number | null, number, number?][] = [
  ['Earthwork', 'Excavation for isolated footings F1 — Grid A–D', 'Cum', 12, 2.4, 2.4, 1.8, 285],
  ['Earthwork', 'Excavation for footings F2 — Grid E–H', 'Cum', 16, 3.0, 3.0, 2.0, 285],
  ['Earthwork', 'Excavation for plinth beam trenches', 'Cum', 1, 486, 0.6, 0.9, 265],
  ['Earthwork', 'Sand filling below floors — Block A', 'Cum', 1, 42, 28, 0.23, 1450],
  ['Concrete', 'PCC M10 below footings', 'Cum', 28, 2.8, 2.8, 0.1, 5150],
  ['Concrete', 'RCC M25 footings F1', 'Cum', 12, 2.2, 2.2, 0.6, 6850],
  ['Concrete', 'RCC M25 footings F2', 'Cum', 16, 2.8, 2.8, 0.75, 6850],
  ['Concrete', 'RCC M30 columns C1 (GF – 1F)', 'Cum', 28, 0.45, 0.6, 3.6, 7650],
  ['Concrete', 'RCC M25 plinth beams', 'Cum', 1, 486, 0.3, 0.45, 7100],
  ['Concrete', 'RCC M30 roof slab 150 mm — Block A', 'Cum', 1, 42, 28, 0.15, 7450],
  ['Reinforcement', 'TMT Fe500D — footings (as per BBS)', 'MT', null, null, null, null, 66500, 9.8],
  ['Reinforcement', 'TMT Fe500D — columns (as per BBS)', 'MT', null, null, null, null, 66500, 6.4],
  ['Reinforcement', 'TMT Fe500D — plinth beams & slab (as per BBS)', 'MT', null, null, null, null, 66500, 18.6],
  ['Masonry', 'AAC block masonry 200 mm — external walls GF', 'Cum', 1, 132, 0.2, 3.0, 5650],
  ['Masonry', 'AAC block masonry 100 mm — partitions GF', 'Cum', 1, 218, 0.1, 3.0, 5900],
  ['Masonry', 'Brick masonry 230 mm — compound wall', 'Cum', 1, 320, 0.23, 1.8, 5800],
  ['Plaster & Finishes', 'Internal plaster 12 mm CM 1:4 — GF (both faces)', 'Sqm', 2, 218, null, 3.0, 360],
  ['Plaster & Finishes', 'External plaster 20 mm CM 1:4 — Block A', 'Sqm', 1, 140, null, 9.6, 415],
  ['Plaster & Finishes', 'Vitrified tile flooring 800×800 — Block A GF', 'Sqm', 1, 42, 28, null, 1280],
  ['Plaster & Finishes', 'Interior emulsion 2 coats over putty — GF', 'Sqm', 2, 218, null, 3.0, 175],
];
const measRows: Row[] = measData.map(([section, description, unit, nos, length, breadth, depth, rate, fixed], i) => ({
  id: `MS-${pad(i + 1)}`,
  code: `MS-${pad(i + 1)}`,
  section,
  description,
  unit,
  nos: nos ?? undefined,
  length: length ?? undefined,
  breadth: breadth ?? undefined,
  depth: depth ?? undefined,
  qty: fixed ?? r2((nos ?? 1) * (length ?? 1) * (breadth ?? 1) * (depth ?? 1)),
  rate,
}));

/** [section, BOQ ref, description, unit, qty, rate] */
const boqData: [string, string, string, string, number, number][] = [
  ['Earthwork', '1.01', 'Excavation in all soils up to 3 m depth incl. disposal within 1 km', 'Cum', 42600, 295],
  ['Earthwork', '1.02', 'Excavation in soft / hard rock by chiselling (no blasting)', 'Cum', 3800, 1150],
  ['Earthwork', '1.03', 'Anti-termite treatment — pre-construction', 'Sqm', 12400, 68],
  ['Earthwork', '1.04', 'Back-filling in trenches & plinth with approved earth', 'Cum', 14200, 210],
  ['Concrete', '2.01', 'PCC M10 (1:3:6) below foundations & floors', 'Cum', 1480, 5150],
  ['Concrete', '2.02', 'RCC M25 raft & footings (RMC, pump placed)', 'Cum', 5620, 6650],
  ['Concrete', '2.03', 'RCC M30 columns & shear walls', 'Cum', 3960, 7650],
  ['Concrete', '2.04', 'RCC M30 beams & slabs incl. staircase', 'Cum', 7580, 7450],
  ['Concrete', '2.05', 'RCC M25 retaining walls & lift pits', 'Cum', 1480, 7100],
  ['Concrete', '2.06', 'Centering & shuttering — plywood, all heights', 'Sqm', 102400, 545],
  ['Reinforcement', '3.01', 'TMT Fe500D bars 8–12 mm — cut, bent & placed', 'MT', 780, 66800],
  ['Reinforcement', '3.02', 'TMT Fe500D bars 16–32 mm — cut, bent & placed', 'MT', 1640, 65200],
  ['Reinforcement', '3.03', 'Mechanical couplers 25 / 32 mm', 'Nos', 8600, 185],
  ['Masonry', '4.01', 'AAC block masonry 200 mm in CM 1:4', 'Cum', 4120, 5650],
  ['Masonry', '4.02', 'AAC block masonry 100 mm partitions', 'Cum', 1460, 5900],
  ['Masonry', '4.03', 'Brick masonry 230 mm (wire-cut) in CM 1:5', 'Cum', 800, 5800],
  ['Finishes', '5.01', 'Internal plaster 12 mm CM 1:4', 'Sqm', 86400, 360],
  ['Finishes', '5.02', 'External plaster 20 mm CM 1:4 with waterproof compound', 'Sqm', 26000, 415],
  ['Finishes', '5.03', 'Vitrified tile flooring 800×800 incl. bedding', 'Sqm', 21600, 1280],
  ['Finishes', '5.04', 'Epoxy flooring — OT & ICU areas', 'Sqm', 3200, 2450],
  ['Finishes', '5.05', 'Acrylic emulsion — 2 coats over putty', 'Sqm', 124000, 175],
  ['Finishes', '5.06', 'Terrace waterproofing — APP membrane + screed', 'Sqm', 7800, 890],
];
const boqRows: Row[] = boqData.map(([section, itemCode, description, unit, qty, rate], i) => ({
  id: `BOQ-${pad(i + 1)}`,
  code: `BOQ-${pad(i + 1)}`,
  description,
  itemCode,
  section,
  unit,
  qty,
  rate,
  amount: qty * rate,
}));

const materialData: Line[] = [
  ['Cement & Concrete', 'Cement OPC 53 grade', 'Bag', 112000, 395],
  ['Cement & Concrete', 'Ready Mix Concrete M25', 'Cum', 7100, 5400],
  ['Cement & Concrete', 'Ready Mix Concrete M30', 'Cum', 11540, 5850],
  ['Cement & Concrete', 'Admixture — superplasticiser', 'Ltr', 64000, 95],
  ['Steel', 'TMT Fe500D 8–12 mm', 'MT', 780, 62500],
  ['Steel', 'TMT Fe500D 16–32 mm', 'MT', 1640, 60800],
  ['Steel', 'Binding wire 18G', 'Kg', 19400, 78],
  ['Aggregates & Sand', 'M-Sand (manufactured sand)', 'Cum', 4800, 1850],
  ['Aggregates & Sand', 'P-Sand (plastering)', 'Cum', 2650, 2150],
  ['Aggregates & Sand', 'Coarse aggregate 20 mm', 'Cum', 2100, 1650],
  ['Masonry', 'AAC block 600×200×200', 'Nos', 343000, 58],
  ['Masonry', 'Wire-cut red brick', 'Nos', 360000, 9],
  ['Finishes & Formwork', 'Vitrified tile 800×800', 'Sqm', 22700, 720],
  ['Finishes & Formwork', 'Interior emulsion', 'Ltr', 26000, 310],
  ['Finishes & Formwork', 'Exterior emulsion', 'Ltr', 7800, 395],
  ['Finishes & Formwork', 'Shuttering plywood 12 mm', 'Sheet', 6400, 1450],
];
const materialSource = ['UltraBuild Cements', 'Chennai RMC Pvt Ltd', 'Chennai RMC Pvt Ltd', 'Techno Waterproofing', 'Shree Balaji Steel Traders', 'Shree Balaji Steel Traders', 'Deccan Hardware Mart', 'Sri Murugan Aggregates', 'Sri Murugan Aggregates', 'Sri Murugan Aggregates', 'Kaveri Bricks & Blocks', 'Kaveri Bricks & Blocks', 'Stonecraft Tiles & Granite', 'ColorCraft Paints', 'ColorCraft Paints', 'FormTech Shuttering'];

const labourData: Line[] = [
  ['Skilled', 'Mason', 'Day', 18400, 1100],
  ['Skilled', 'Carpenter (shuttering)', 'Day', 14200, 1050],
  ['Skilled', 'Bar bender', 'Day', 9800, 1000],
  ['Skilled', 'Tile layer', 'Day', 4600, 1150],
  ['Skilled', 'Painter', 'Day', 6200, 950],
  ['Semi-skilled', 'Helper — mason / carpenter', 'Day', 26500, 800],
  ['Semi-skilled', 'Vibrator / mixer operator', 'Day', 2400, 900],
  ['Unskilled', 'Mazdoor (male)', 'Day', 38000, 750],
  ['Unskilled', 'Mazdoor (female)', 'Day', 16000, 650],
  ['Gang Rates', 'Shuttering labour — fix & remove', 'Sqm', 102400, 145],
  ['Gang Rates', 'Bar bending — cut, bend & tie', 'MT', 2420, 6500],
  ['Gang Rates', 'Concreting gang — place & compact', 'Cum', 18640, 450],
  ['Gang Rates', 'Block work labour', 'Cum', 5580, 1250],
  ['Gang Rates', 'Plastering labour', 'Sqm', 112400, 95],
];

const equipmentData: Line[] = [
  ['Lifting', 'Tower crane TC-5013 (internal hire)', 'Month', 20, 480000],
  ['Lifting', 'Material hoist 2 T', 'Month', 18, 65000],
  ['Lifting', 'Hydra crane 14 T', 'Hr', 1200, 1450],
  ['Concrete', 'Concrete boom pump 36 m', 'Cum', 18640, 320],
  ['Concrete', 'Batching plant CP30 (standby)', 'Hr', 600, 3200],
  ['Concrete', 'Needle vibrators (set of 4)', 'Month', 20, 12000],
  ['Concrete', 'Bar bending & cutting machines', 'Month', 20, 18000],
  ['Earthmoving', 'Excavator Hitachi ZX200', 'Hr', 1850, 2400],
  ['Earthmoving', 'JCB 3DX backhoe loader', 'Hr', 2200, 1150],
  ['Earthmoving', 'Tipper 16 cum', 'Trip', 5400, 1450],
  ['Earthmoving', 'Vibratory roller 11 T', 'Hr', 320, 2200],
  ['Power & Utilities', 'DG set 250 kVA incl. diesel', 'Month', 22, 185000],
  ['Power & Utilities', 'DG set 125 kVA incl. diesel', 'Month', 22, 95000],
  ['Power & Utilities', 'Dewatering pumps', 'Month', 6, 42000],
];

const subcontractData: Line[] = [
  ['Civil Packages', 'Waterproofing — terrace & wet areas', 'Sqm', 7800, 890],
  ['Civil Packages', 'Anti-termite treatment', 'Sqm', 12400, 68],
  ['Civil Packages', 'Aluminium windows & louvres', 'Sqm', 3000, 6200],
  ['Civil Packages', 'Gypsum false ceiling', 'Sqm', 18000, 1150],
  ['MEP Packages', 'Electrical — LT panels & internal wiring', 'Sqft', 340000, 95],
  ['MEP Packages', 'Plumbing & sanitary', 'Sqft', 340000, 62],
  ['MEP Packages', 'Fire fighting & fire alarm', 'Sqft', 340000, 48],
  ['MEP Packages', 'HVAC — hospital grade (AHU + ducting)', 'TR', 480, 62000],
  ['Specialist Works', 'Medical gas pipeline system', 'Outlet', 620, 42000],
  ['Specialist Works', 'Passenger & bed lifts', 'Nos', 8, 4200000],
  ['Specialist Works', 'Landscaping & hardscape', 'Sqm', 4000, 850],
  ['Specialist Works', 'STP 150 KLD — design & build', 'LS', 1, 2500000],
];
const subcontractParty = ['AquaSeal Waterproofing', 'AquaSeal Waterproofing', 'Southern Glass & Aluminium', 'Vertex Formwork Solutions', 'BrightSpark Electricals', 'PipeMasters Plumbing', 'FireSafe Systems', 'CoolAir HVAC Engineers', 'Precision MEP Services', 'Bharat Lifts & Escalators', 'GreenLeaf Landscaping', 'Precision MEP Services'];

const overheadData: Line[] = [
  ['Staff & Supervision', 'Project Manager', 'Month', 24, 220000],
  ['Staff & Supervision', 'Site & QS engineers (6 nos)', 'Month', 24, 590000],
  ['Staff & Supervision', 'Stores & administration (3 nos)', 'Month', 24, 114000],
  ['Site Establishment', 'Site office, stores & labour camp', 'LS', 1, 11000000],
  ['Site Establishment', 'Temporary power, DG & construction water', 'Month', 24, 405000],
  ['Site Establishment', 'Security, housekeeping & site vehicles', 'Month', 24, 420000],
  ['Site Establishment', 'Field laboratory & QA/QC testing', 'Month', 24, 75000],
  ['Insurance & Finance', 'Contractor’s All Risk (CAR) policy', 'LS', 1, 4800000],
  ['Insurance & Finance', 'BG commission — performance & advance', 'LS', 1, 2200000],
  ['Insurance & Finance', 'Workmen compensation policy', 'LS', 1, 950000],
  ['Head Office & Tendering', 'Head-office overhead @ 2.5% of direct cost', 'LS', 1, 29500000],
  ['Head Office & Tendering', 'Tender & pre-construction costs', 'LS', 1, 1800000],
];

/** Small line-item entity definition (description / section / unit / qty / rate + optional extra text column). */
function lineEntity(id: string, label: string, plural: string, prefix: string, sections: string[], data: Line[], qtyLabel: string, rateLabel: string, extra?: { key: string; label: string; values: string[] }): EntityDef {
  return {
    id,
    label,
    plural,
    app: 'estimation',
    codePrefix: prefix,
    titleField: 'description',
    fields: [
      text('description', 'Description', data.map((d) => d[1]), { required: true }),
      select('section', 'Category', sections),
      ...(extra ? [text(extra.key, extra.label, extra.values)] : []),
      text('unit', 'Unit'),
      num('qty', qtyLabel),
      money('rate', rateLabel),
    ],
    rows: lines(prefix, data, extra?.key, extra?.values),
  };
}

/* ───────── Cost build-up shared by the Cost Estimate pages (EST-001, ₹ Cr) ───────── */
const buildUp: ChartSpec = {
  title: 'Cost Build-up — EST-001 (₹ Cr)',
  kind: 'waterfall',
  categories: ['Material', 'Labour', 'Equipment', 'Subcontract', 'Overheads', 'Contingency', 'Profit', 'Final estimate'],
  series: [{ name: 'Value', data: [62.4, 24.6, 9.8, 21.2, 9.4, 2.5, 13.0, 0] }],
  unit: '₹Cr',
  span: 2,
};

function costView(title: string, kpis: KpiSpec[], side: ChartSpec, table: Extract<ViewSpec, { type: 'analysis' }>['table']): ViewSpec {
  return { type: 'analysis', title: `${title} — ${HV}`, kpis, charts: [buildUp, side], table };
}

export const estimationApp: AppConfig = {
  id: 'estimation',
  name: 'Estimation',
  icon: 'ti-calculator',
  description: 'Estimates, quantity take-off, BOQ, rate analysis and cost build-up',
  menus: [
    group('Estimate Management', 'ti-file-invoice', [
      page('Estimate', register('estimate')),
      page('Estimate Version', {
        type: 'comparison',
        title: `Estimate Versions — ${HV}`,
        subjectLabel: 'Cost Head',
        subjects: ['R0 — Concept', 'R1 — Tender BOQ', 'R2 — Final Bid', 'Client Tender Estimate', 'Actual — Phase I Benchmark'],
        recommend: 2,
        note: 'R2 is the approved bid estimate. Phase I actuals are escalated to Sep 2026 prices for benchmarking (3.4 lakh sq ft BUA).',
        rows: [
          { group: 'Direct Cost', label: 'Material', values: [cr(66.8), cr(64.1), cr(62.4), cr(65.0), cr(63.2)], best: 'min', format: 'currency' },
          { group: 'Direct Cost', label: 'Labour', values: [cr(26.2), cr(25.3), cr(24.6), cr(25.8), cr(25.9)], best: 'min', format: 'currency' },
          { group: 'Direct Cost', label: 'Equipment', values: [cr(10.6), cr(10.1), cr(9.8), cr(10.4), cr(9.1)], best: 'min', format: 'currency' },
          { group: 'Direct Cost', label: 'Subcontract', values: [cr(22.4), cr(21.9), cr(21.2), cr(22.6), cr(21.6)], best: 'min', format: 'currency' },
          { group: 'Indirect Cost', label: 'Overheads', values: [cr(10.2), cr(9.8), cr(9.4), cr(10.8), cr(10.1)], best: 'min', format: 'currency' },
          { group: 'Indirect Cost', label: 'Contingency', values: [cr(4.1), cr(3.2), cr(2.5), 0, cr(1.9)], format: 'currency' },
          { group: 'Summary', label: 'Total cost', values: [cr(140.3), cr(134.4), cr(129.9), cr(134.6), cr(131.8)], best: 'min', format: 'currency' },
          { group: 'Summary', label: 'Profit', values: [cr(14.0), cr(13.4), cr(13.0), cr(13.4), cr(9.6)], format: 'currency' },
          { group: 'Summary', label: 'Final estimate', values: [cr(154.3), cr(147.8), cr(142.9), cr(148.0), cr(141.4)], best: 'min', format: 'currency' },
          { group: 'Summary', label: 'Cost per sq ft (₹)', values: [4126, 3953, 3821, 3959, 3876], best: 'min', format: 'number' },
          { group: 'Summary', label: 'Margin on cost', values: [10.0, 10.0, 10.0, 10.0, 7.3], format: 'percent' },
          { group: 'Summary', label: 'Version status', values: ['Superseded', 'Superseded', 'Approved', 'Reference', 'Benchmark'], format: 'text' },
        ],
      }),
      page('Estimate Status', register('estimate', { tabs: { field: 'status', values: EST_STATUS } })),
    ]),
    group('Quantity Takeoff', 'ti-ruler-2', [
      page('Drawings', docs(['Architectural', 'Structural', 'MEP', 'Site & Survey', 'Tender Drawings', 'Revisions'], undefined, 'Take-off Drawings')),
      page('Measurements', { type: 'lineitems', tax: 0, entity: 'estMeasurement', title: `Measurement Sheet — ${HV}, Block A`, extra: ['nos', 'length', 'breadth', 'depth'] }),
      page('Quantities', {
        type: 'analysis',
        title: `Quantity Summary — ${HV}`,
        kpis: [
          { label: 'RCC concrete', value: '18,640 cum', delta: '+2.7% vs BOQ', up: true, good: false, icon: 'ti-cube' },
          { label: 'Reinforcement', value: '2,420 MT', delta: '+5.2% vs BOQ', up: true, good: false, icon: 'ti-stack-2' },
          { label: 'Masonry', value: '6,380 cum', icon: 'ti-wall' },
          { label: 'Plaster', value: '1,12,400 sqm', icon: 'ti-paint' },
          { label: 'Steel ratio', value: '130 kg/cum', progress: 72, icon: 'ti-gauge', sub: 'Benchmark 120–140' },
        ],
        charts: [
          { title: 'RCC Quantity by Element — Take-off vs BOQ (cum)', kind: 'bar', categories: ['Raft & footings', 'Retaining walls', 'Columns & walls', 'Beams & slabs'], series: [{ name: 'Take-off', data: [5620, 1480, 3960, 7580] }, { name: 'Tender BOQ', data: [5400, 1500, 3850, 7400] }], span: 2 },
          { title: 'Concrete by Block (cum)', kind: 'donut', categories: ['Block A — Wards', 'Block B — OT & ICU', 'Block C — Services', 'Podium & ramps'], series: [{ name: 'cum', data: [6820, 5960, 3240, 2620] }], subtitle: '18,640 cum' },
        ],
        table: {
          title: 'Quantity Summary vs Tender BOQ',
          columns: [
            { key: 'item', label: 'Item' },
            { key: 'unit', label: 'Unit' },
            { key: 'takeoff', label: 'Take-off Qty', type: 'number' },
            { key: 'boq', label: 'Tender BOQ Qty', type: 'number' },
            { key: 'variance', label: 'Variance', type: 'percent' },
          ],
          rows: [
            { item: 'Excavation (all soils)', unit: 'Cum', takeoff: 42600, boq: 40000, variance: 6.5 },
            { item: 'Rock excavation', unit: 'Cum', takeoff: 3800, boq: 2500, variance: 52.0 },
            { item: 'PCC M10', unit: 'Cum', takeoff: 1480, boq: 1400, variance: 5.7 },
            { item: 'RCC (M25 / M30)', unit: 'Cum', takeoff: 18640, boq: 18150, variance: 2.7 },
            { item: 'Reinforcement Fe500D', unit: 'MT', takeoff: 2420, boq: 2300, variance: 5.2 },
            { item: 'Shuttering', unit: 'Sqm', takeoff: 102400, boq: 98000, variance: 4.5 },
            { item: 'Masonry (AAC + brick)', unit: 'Cum', takeoff: 6380, boq: 6250, variance: 2.1 },
            { item: 'Plaster (internal + external)', unit: 'Sqm', takeoff: 112400, boq: 110000, variance: 2.2 },
            { item: 'Flooring (tile + epoxy)', unit: 'Sqm', takeoff: 24800, boq: 24800, variance: 0 },
            { item: 'Painting', unit: 'Sqm', takeoff: 124000, boq: 121500, variance: 2.1 },
          ],
        },
      }),
    ]),
    group('BOQ', 'ti-list-numbers', [
      page('BOQ Items', { type: 'lineitems', entity: 'estBoq', title: `Priced BOQ — ${HV}`, extra: ['itemCode'] }),
      page('Quantity', fieldView('estBoq', 'qty')),
      page('Unit', fieldView('estBoq', 'unit')),
      page('Rate', fieldView('estBoq', 'rate')),
      page('Amount', fieldView('estBoq', 'amount')),
    ]),
    group('Rate Analysis', 'ti-coins', [
      page('Material', { type: 'lineitems', tax: 0, entity: 'estMaterialRate', title: 'Material Rates at Site — Sep 2026 (EST-001 requirement)', extra: ['source'] }),
      page('Labour', { type: 'lineitems', tax: 0, entity: 'estLabourRate', title: 'Labour Rates — Visakhapatnam, Sep 2026' }),
      page('Equipment', { type: 'lineitems', tax: 0, entity: 'estEquipmentRate', title: 'Equipment Hire Rates — EST-001' }),
      page('Subcontract', { type: 'lineitems', tax: 0, entity: 'estSubcontractRate', title: 'Subcontract Package Rates — EST-001', extra: ['party'] }),
      page('Overhead', { type: 'lineitems', tax: 0, entity: 'estOverheadRate', title: 'Overhead Calculation — EST-001' }),
    ]),
    group('Cost Estimate', 'ti-report-money', [
      page('Direct Cost', costView(
        'Direct Cost',
        [
          { label: 'Direct cost', value: '₹ 118.0 Cr', progress: 83, icon: 'ti-stack-2', sub: '82.6% of final estimate' },
          { label: 'Material', value: '₹ 62.4 Cr', progress: 53, icon: 'ti-box', sub: '52.9% of direct' },
          { label: 'Labour', value: '₹ 24.6 Cr', progress: 21, icon: 'ti-users', sub: '20.8% of direct' },
          { label: 'Equipment', value: '₹ 9.8 Cr', progress: 8, icon: 'ti-bulldozer', sub: '8.3% of direct' },
          { label: 'Subcontract', value: '₹ 21.2 Cr', progress: 18, icon: 'ti-heart-handshake', sub: '18.0% of direct' },
        ],
        { title: 'Direct Cost Mix', kind: 'donut', categories: ['Material', 'Labour', 'Equipment', 'Subcontract'], series: [{ name: '₹ Cr', data: [62.4, 24.6, 9.8, 21.2] }], unit: '₹Cr' },
        {
          title: 'Direct Cost by Work Package',
          columns: [
            { key: 'pkg', label: 'Work Package' },
            { key: 'material', label: 'Material', type: 'currency' },
            { key: 'labour', label: 'Labour', type: 'currency' },
            { key: 'equipment', label: 'Equipment', type: 'currency' },
            { key: 'sub', label: 'Subcontract', type: 'currency' },
            { key: 'total', label: 'Total', type: 'currency' },
          ],
          rows: [
            { pkg: 'Substructure', material: cr(8.6), labour: cr(3.2), equipment: cr(2.6), sub: cr(1.2), total: cr(15.6) },
            { pkg: 'Superstructure', material: cr(24.8), labour: cr(9.4), equipment: cr(4.2), sub: cr(0.8), total: cr(39.2) },
            { pkg: 'Masonry & Finishes', material: cr(16.2), labour: cr(8.1), equipment: cr(0.9), sub: cr(2.4), total: cr(27.6) },
            { pkg: 'MEP Services', material: cr(9.4), labour: cr(2.6), equipment: cr(0.8), sub: cr(12.6), total: cr(25.4) },
            { pkg: 'External Works', material: cr(3.4), labour: cr(1.3), equipment: cr(1.3), sub: cr(4.2), total: cr(10.2) },
          ],
        },
      )),
      page('Indirect Cost', costView(
        'Indirect Cost',
        [
          { label: 'Indirect cost', value: '₹ 9.40 Cr', icon: 'ti-building', sub: '8.0% of direct cost' },
          { label: 'Site overheads', value: '₹ 6.27 Cr', progress: 67, icon: 'ti-home', sub: 'Staff, facilities, insurance' },
          { label: 'Head office & tendering', value: '₹ 3.13 Cr', progress: 33, icon: 'ti-building-skyscraper', sub: '2.5% HO + tender costs' },
          { label: 'Overhead per month', value: '₹ 39.2 L', icon: 'ti-calendar', sub: '24-month duration' },
        ],
        { title: 'Indirect Cost Heads (₹ L)', kind: 'hbar', categories: ['Head office & tendering', 'Site establishment', 'Staff & supervision', 'Insurance & finance'], series: [{ name: '₹ L', data: [313, 326, 221.8, 79.5] }], unit: '₹L' },
        {
          title: 'Indirect Cost Register',
          columns: [
            { key: 'head', label: 'Cost Head' },
            { key: 'basis', label: 'Basis' },
            { key: 'amount', label: 'Amount', type: 'currency' },
            { key: 'share', label: '% of Direct', type: 'percent' },
          ],
          rows: [
            { head: 'Staff & supervision', basis: '10 staff × 24 months', amount: 22176000, share: 1.9 },
            { head: 'Site establishment', basis: 'Office, camp, power, water, security, lab', amount: 32600000, share: 2.8 },
            { head: 'Insurance & finance', basis: 'CAR, BG commission, WC policy', amount: 7950000, share: 0.7 },
            { head: 'Head office & tendering', basis: '2.5% of direct + tender costs', amount: 31300000, share: 2.7 },
          ],
        },
      )),
      page('Contingency', costView(
        'Contingency',
        [
          { label: 'Contingency provided', value: '₹ 2.50 Cr', icon: 'ti-shield-check', sub: '2.0% of base cost ₹ 127.4 Cr' },
          { label: 'Risk exposure identified', value: '₹ 6.80 Cr', icon: 'ti-alert-triangle', sub: '5 priced risks' },
          { label: 'Probability-weighted', value: '₹ 2.48 Cr', progress: 99, icon: 'ti-percentage', sub: 'Cover 101%' },
          { label: 'R0 → R2 contingency', value: '-₹ 1.6 Cr', up: false, good: true, delta: '4.1 → 2.5 Cr', icon: 'ti-arrows-diff' },
        ],
        { title: 'Risk-weighted Contingency (₹ L)', kind: 'bar', categories: ['Steel price', 'Rock quantity', 'Monsoon delay', 'MEP design', 'Dewatering'], series: [{ name: 'Exposure', data: [280, 120, 150, 80, 50] }, { name: 'Weighted', data: [98, 48, 45, 32, 25] }], unit: '₹L' },
        {
          title: 'Contingency Risk Register',
          columns: [
            { key: 'risk', label: 'Risk' },
            { key: 'exposure', label: 'Exposure', type: 'currency' },
            { key: 'probability', label: 'Probability', type: 'percent' },
            { key: 'weighted', label: 'Weighted Value', type: 'currency' },
            { key: 'status', label: 'Status', type: 'status' },
          ],
          rows: [
            { risk: 'Steel price escalation beyond 5%', exposure: 28000000, probability: 35, weighted: 9800000, status: 'Open' },
            { risk: 'Rock strata deeper than soil report', exposure: 12000000, probability: 40, weighted: 4800000, status: 'Open' },
            { risk: 'Monsoon impact on substructure', exposure: 15000000, probability: 30, weighted: 4500000, status: 'Under Review' },
            { risk: 'MEP design development changes', exposure: 8000000, probability: 40, weighted: 3200000, status: 'Open' },
            { risk: 'Dewatering in high water table', exposure: 5000000, probability: 50, weighted: 2500000, status: 'Accepted' },
          ],
        },
      )),
      page('Profit', costView(
        'Profit',
        [
          { label: 'Profit', value: '₹ 13.0 Cr', icon: 'ti-trending-up', sub: 'On total cost ₹ 129.9 Cr' },
          { label: 'Margin on cost', value: '10.0%', progress: 100, icon: 'ti-percentage', sub: 'Target ≥ 8%' },
          { label: 'Margin on estimate', value: '9.1%', progress: 91, icon: 'ti-chart-pie' },
          { label: 'Final estimate', value: '₹ 142.9 Cr', delta: '-3.4% vs client', up: false, good: true, icon: 'ti-file-dollar' },
        ],
        { title: 'Margin by Active Estimate (%)', kind: 'hbar', categories: ['EST-005 ABC Grand', 'EST-002 Orbit Ph III', 'EST-001 Harbour View', 'EST-003 Meridian', 'EST-014 Orbit DC', 'EST-004 Pinnacle', 'EST-006 XYZ Mall', 'EST-007 XYZ Housing'], series: [{ name: 'Margin', data: [12.0, 11.0, 10.0, 10.0, 9.9, 9.0, 9.0, 7.0] }], unit: '%' },
        {
          title: 'Profit by Estimate',
          columns: [
            { key: 'est', label: 'Estimate', type: 'code' },
            { key: 'name', label: 'Title' },
            { key: 'cost', label: 'Total Cost', type: 'currency' },
            { key: 'profit', label: 'Profit', type: 'currency' },
            { key: 'total', label: 'Final Estimate', type: 'currency' },
            { key: 'margin', label: 'Margin', type: 'percent' },
            { key: 'status', label: 'Status', type: 'status' },
          ],
          rows: [0, 1, 2, 3, 4, 5, 6, 13].map((i) => {
            const e = estData[i];
            return { est: `EST-${pad(i + 1)}`, name: e[0], cost: cr(e[8]), profit: cr(e[9]) - cr(e[8]), total: cr(e[9]), margin: e[10], status: e[13] };
          }),
        },
      )),
    ]),
  ],
  dashboard: {
    flow: [
      { label: 'Estimates', value: '16 FY · 7 active' },
      { label: 'Quantity Takeoff', value: '3 in progress' },
      { label: 'BOQ', value: '1,284 items priced' },
      { label: 'Rate Analysis', value: '312 rates revised (Sep)' },
      { label: 'Final Estimate', value: '₹ 746 Cr under estimation' },
    ],
    kpis: [
      { label: 'Active Estimates', value: '7', delta: '+2', up: true, progress: 44, icon: 'ti-file-invoice', sub: 'Draft 2 · In progress 3 · Review 2' },
      { label: 'Value Under Estimation', value: '₹ 746.4 Cr', delta: '+14%', up: true, progress: 62, icon: 'ti-currency-rupee' },
      { label: 'Average Margin', value: '9.6%', delta: '-0.4 pts', up: false, good: false, progress: 96, icon: 'ti-percentage', sub: 'Target ≥ 8% on cost' },
      { label: 'Pending Approvals', value: '2', icon: 'ti-hourglass', sub: 'EST-001, EST-006' },
      { label: 'Estimate Accuracy', value: '97.7%', progress: 98, icon: 'ti-target', sub: 'Budget vs forecast, live projects' },
      { label: 'Avg Cost / sq ft', value: '₹ 2,535', delta: '+3.1%', up: true, good: false, icon: 'ti-ruler-measure' },
    ],
    charts: [
      {
        title: 'Estimate vs Forecast at Completion — Live Projects (₹ Cr)',
        kind: 'bar',
        categories: ['Skyline', 'Riverside', 'Greenfield', 'Metro Tower', 'Lakeview', 'Orbit TP', 'Harbour View', 'Sunrise'],
        series: [
          { name: 'Estimate (budget)', data: [73.1, 36.1, 49.9, 55.0, 24.1, 15.5, 12.9, 8.6] },
          { name: 'Forecast', data: [74.9, 35.4, 52.3, 56.1, 25.0, 15.3, 13.6, 9.0] },
        ],
        unit: '₹Cr',
        span: 2,
      },
      { title: 'Estimates by Status', kind: 'donut', categories: EST_STATUS, series: [{ name: 'Estimates', data: [2, 3, 2, 2, 4, 1, 2] }], tones: ['gray', 'blue', 'yellow', 'blue', 'green', 'red', 'gray'] },
      buildUp,
      { title: 'Material Price Index (Apr = 100)', kind: 'line', categories: ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'], series: [{ name: 'TMT steel', data: [100, 101.8, 103.1, 104.6, 106.0, 106.2] }, { name: 'Cement', data: [100, 99.2, 100.5, 101.8, 102.6, 103.4] }], subtitle: 'Steel +6.2% vs estimate' },
    ],
    table: { entity: 'estimate', title: 'Estimate Register', columns: ['title', 'client', 'version', 'total', 'margin', 'status'], limit: 8 },
    rail: [
      { kind: 'health', title: 'Estimate Status', items: [{ label: 'Draft', value: 2, tone: 'gray' }, { label: 'In Progress', value: 3, tone: 'blue' }, { label: 'Under Review', value: 2, tone: 'yellow' }, { label: 'Submitted', value: 2, tone: 'blue' }, { label: 'Approved', value: 4, tone: 'green' }, { label: 'Rejected', value: 1, tone: 'red' }] },
      {
        kind: 'dates',
        title: 'Estimates Due',
        items: [
          { date: '2026-10-04', title: 'XYZ Affordable Housing', sub: 'EST-007 · for TND-020 (6 Oct)' },
          { date: '2026-10-06', title: 'Harbour View Hospital Ph II', sub: 'EST-001 · for TND-001 (8 Oct)' },
          { date: '2026-10-08', title: 'XYZ Riverfront Mall', sub: 'EST-006 · for TND-011 (10 Oct)' },
          { date: '2026-10-12', title: 'Meridian Logistics Park', sub: 'EST-003 · for TND-003 (14 Oct)' },
          { date: '2026-10-14', title: 'ABC Grand, Adyar', sub: 'EST-005 · for TND-010 (16 Oct)' },
        ],
      },
      {
        kind: 'list',
        title: 'Rate Updates',
        items: [
          { avatar: 'Kavya R', title: 'TMT Fe500D revised to ₹ 60,800 / MT', sub: 'Shree Balaji Steel Traders · +2.4%', meta: '2 days ago' },
          { avatar: 'Swathi N', title: 'RMC M30 revised to ₹ 5,850 / cum', sub: 'Chennai RMC Pvt Ltd', meta: '5 days ago' },
          { avatar: 'Priya M', title: 'Labour rates updated — Visakhapatnam', sub: 'Mason ₹ 1,100 / day', meta: '1 week ago' },
          { avatar: 'Kavya R', title: 'AAC block rate confirmed ₹ 58 / no.', sub: 'Kaveri Bricks & Blocks', meta: '1 week ago' },
        ],
      },
    ],
  },
  entities: [
    {
      id: 'estimate',
      label: 'Estimate',
      plural: 'Estimates',
      app: 'estimation',
      codePrefix: 'EST',
      titleField: 'title',
      form: 'wizard',
      sections: [
        { id: 'basic', title: 'Estimate Details', icon: 'ti-file-invoice' },
        { id: 'scope', title: 'Scope & Basis', icon: 'ti-ruler-2' },
        { id: 'cost', title: 'Cost Summary', icon: 'ti-report-money' },
        { id: 'approval', title: 'Review & Approval', icon: 'ti-user-check' },
      ],
      fields: [
        text('title', 'Estimate Title', estData.map((e) => e[0]), { required: true, section: 'basic', list: true }),
        text('tenderRef', 'Tender Ref.', undefined, { section: 'basic', list: true }),
        ref('client', 'Client', 'client', { required: true, section: 'basic', list: true }),
        select('category', 'Project Category', ['Residential', 'Commercial', 'Institutional', 'Industrial', 'Hospitality', 'Infrastructure'], { section: 'basic' }),
        select('basis', 'Estimate Type', ['Preliminary Estimate', 'Budget Estimate', 'Tender Estimate', 'Detailed Estimate', 'Revised Estimate'], { required: true, section: 'basic' }),
        select('version', 'Version', ['R0', 'R1', 'R2', 'R3'], { section: 'scope', list: true }),
        num('builtUp', 'Built-up Area', undefined, { unit: 'sq ft', section: 'scope' }),
        ref('estimator', 'Estimator', 'employee', { section: 'scope', list: true }),
        date('preparedOn', 'Prepared On', undefined, { section: 'scope', list: false }),
        area('assumptions', 'Assumptions & Exclusions', undefined, { section: 'scope' }),
        money('directCost', 'Direct Cost', undefined, { section: 'cost', list: false }),
        money('totalCost', 'Total Cost', undefined, { section: 'cost', list: false }),
        pct('margin', 'Profit Margin', undefined, { section: 'cost', list: true }),
        money('total', 'Final Estimate', undefined, { required: true, section: 'cost', list: true }),
        money('costPerSqft', 'Cost / sq ft', undefined, { section: 'cost', list: false }),
        ref('approver', 'Approver', 'employee', { section: 'approval', list: false }),
        area('approvalRemarks', 'Approval Remarks', undefined, { section: 'approval' }),
        status(EST_STATUS, { section: 'basic' }),
      ],
      rows: estRows,
    },
    {
      id: 'estMeasurement',
      label: 'Measurement',
      plural: 'Measurements',
      app: 'estimation',
      codePrefix: 'MS',
      titleField: 'description',
      fields: [
        text('description', 'Description', measData.map((m) => m[1]), { required: true }),
        select('section', 'Trade', ['Earthwork', 'Concrete', 'Reinforcement', 'Masonry', 'Plaster & Finishes']),
        num('nos', 'Nos'),
        num('length', 'Length', undefined, { unit: 'm' }),
        num('breadth', 'Breadth', undefined, { unit: 'm' }),
        num('depth', 'Depth / Height', undefined, { unit: 'm' }),
        text('unit', 'Unit'),
        num('qty', 'Quantity'),
        money('rate', 'Rate'),
      ],
      rows: measRows,
    },
    {
      id: 'estBoq',
      label: 'BOQ Item',
      plural: 'BOQ Items',
      app: 'estimation',
      codePrefix: 'BOQ',
      titleField: 'description',
      fields: [
        text('description', 'Description', boqData.map((b) => b[2]), { required: true }),
        text('itemCode', 'BOQ Ref.'),
        select('section', 'BOQ Section', ['Earthwork', 'Concrete', 'Reinforcement', 'Masonry', 'Finishes']),
        text('unit', 'Unit'),
        num('qty', 'Quantity'),
        money('rate', 'Rate'),
        money('amount', 'Amount'),
      ],
      rows: boqRows,
    },
    lineEntity('estMaterialRate', 'Material Rate', 'Material Rates', 'MR', ['Cement & Concrete', 'Steel', 'Aggregates & Sand', 'Masonry', 'Finishes & Formwork'], materialData, 'Required Qty', 'Rate at Site', { key: 'source', label: 'Source / Vendor', values: materialSource }),
    lineEntity('estLabourRate', 'Labour Rate', 'Labour Rates', 'LR', ['Skilled', 'Semi-skilled', 'Unskilled', 'Gang Rates'], labourData, 'Man-days / Qty', 'Rate'),
    lineEntity('estEquipmentRate', 'Equipment Rate', 'Equipment Rates', 'ER', ['Lifting', 'Concrete', 'Earthmoving', 'Power & Utilities'], equipmentData, 'Usage', 'Hire Rate'),
    lineEntity('estSubcontractRate', 'Subcontract Rate', 'Subcontract Rates', 'SR', ['Civil Packages', 'MEP Packages', 'Specialist Works'], subcontractData, 'Quantity', 'Package Rate', { key: 'party', label: 'Proposed Subcontractor', values: subcontractParty }),
    lineEntity('estOverheadRate', 'Overhead Item', 'Overhead Items', 'OR', ['Staff & Supervision', 'Site Establishment', 'Insurance & Finance', 'Head Office & Tendering'], overheadData, 'Quantity', 'Rate'),
  ],
};
