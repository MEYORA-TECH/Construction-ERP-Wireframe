import type { Tone } from '@/theme/status';

/* ─────────────────────────── Entities ─────────────────────────── */

export type FieldType =
  | 'text'
  | 'textarea'
  | 'number'
  | 'currency'
  | 'percent'
  | 'date'
  | 'select'
  | 'multiselect'
  | 'status'
  | 'ref'
  | 'email'
  | 'phone'
  | 'file'
  | 'boolean'
  | 'rating';

export interface FieldDef {
  key: string;
  label: string;
  type: FieldType;
  /** select / multiselect / status values */
  options?: string[];
  /** entity id for type 'ref' (e.g. 'project', 'client', 'vendor', 'employee') */
  ref?: string;
  required?: boolean;
  /** form section id (EntityDef.sections) */
  section?: string;
  hint?: string;
  placeholder?: string;
  /** show in register table; default = first 8 non-textarea fields */
  list?: boolean;
  /**
   * Mock generation:
   *  text/textarea/email/phone → sample strings (picked in order, then randomly)
   *  number/currency/percent/rating → [min, max]
   *  date → [minDaysFromToday, maxDaysFromToday]
   */
  gen?: string[] | [number, number];
  /** unit suffix shown after numbers, e.g. 'm³', 'hrs', 'MT' */
  unit?: string;
}

export type Row = Record<string, unknown> & { id: string };

export interface EntityDef {
  id: string;
  /** singular, e.g. 'Lead' */
  label: string;
  plural: string;
  app: string;
  /** code prefix, e.g. 'LD' → LD-001 */
  codePrefix: string;
  /** field key used as the record title */
  titleField: string;
  fields: FieldDef[];
  sections?: { id: string; title: string; icon?: string }[];
  /** defaults to 'status' when such a field exists */
  statusField?: string;
  /** number of mock rows (default 18) */
  count?: number;
  /** fixed seed rows (masters); when present no generation happens */
  rows?: Row[];
  /** create/edit presentation; default modal when ≤ 8 fields, page otherwise; 'wizard' = one step per section */
  form?: 'modal' | 'page' | 'wizard';
  /** show the Excel import panel on the register */
  import?: boolean;
  /** info-bar text on the register */
  info?: string;
  /** extra detail tabs beyond the standard set */
  tabs?: string[];
}

/* ─────────────────────────── Dashboards / analysis ─────────────────────────── */

export interface KpiSpec {
  label: string;
  value: string;
  delta?: string;
  /** direction of the delta arrow */
  up?: boolean;
  /** whether the delta is good (defaults to up) */
  good?: boolean;
  /** 0–100, draws the thin navy progress bar */
  progress?: number;
  icon?: string;
  sub?: string;
}

export type ChartKind =
  | 'bar'
  | 'hbar'
  | 'stacked'
  | 'line'
  | 'area'
  | 'donut'
  | 'barline'
  | 'funnel'
  | 'waterfall'
  | 'heatmap'
  | 'gauge';

export interface ChartSpec {
  title: string;
  kind: ChartKind;
  categories?: string[];
  series: { name: string; data: number[]; type?: 'bar' | 'line' }[];
  /** heatmap only: y-axis categories; series[0].data is row-major (y by x) */
  yCategories?: string[];
  /** value formatting: '₹L' = lakhs, '₹Cr' = crores, '%' = percent */
  unit?: '₹L' | '₹Cr' | '%' | string;
  /** grid columns to span (1–3) */
  span?: 1 | 2 | 3;
  height?: number;
  /** donut: colour slices by status tone instead of the blue ramp */
  tones?: Tone[];
  subtitle?: string;
}

export interface TableSpec {
  title: string;
  columns: { key: string; label: string; type?: 'text' | 'currency' | 'number' | 'percent' | 'status' | 'date' | 'code' }[];
  rows: Record<string, string | number>[];
}

export type RailSpec =
  | { kind: 'list'; title: string; items: { title: string; sub?: string; meta?: string; status?: string; avatar?: string }[] }
  | { kind: 'health'; title: string; items: { label: string; value: number | string; tone: Tone }[] }
  | { kind: 'dates'; title: string; items: { date: string; title: string; sub?: string; done?: boolean }[] };

export interface DashboardSpec {
  /** domain flow strip, e.g. ['Leads','Pipeline','Opportunities','Conversion'] */
  flow?: { label: string; value: string }[];
  kpis: KpiSpec[];
  charts: ChartSpec[];
  /** register snippet: shows the first rows of an entity */
  table?: { entity: string; title: string; columns?: string[]; limit?: number };
  rail?: RailSpec[];
  /** small operational photo cards (e.g. recent site updates) */
  updates?: { title: string; sub: string; date: string }[];
}

/* ─────────────────────────── Views ─────────────────────────── */

export interface WizardStep {
  title: string;
  icon?: string;
  fields?: FieldDef[];
  lines?: { columns: string[]; rows: (string | number)[][] };
  checklist?: string[];
  note?: string;
  upload?: string[];
}

export interface CompareRow {
  label: string;
  values: (string | number)[];
  /** highlight the best numeric value */
  best?: 'min' | 'max';
  group?: string;
  format?: 'currency' | 'number' | 'percent' | 'text' | 'status';
}

export interface TreeNode {
  label: string;
  code?: string;
  values?: Record<string, string | number>;
  children?: TreeNode[];
}

export interface TimelineEvent {
  date: string;
  title: string;
  actor?: string;
  text?: string;
  status?: string;
  amount?: number;
}

export interface StatementSection {
  title: string;
  lines: { label: string; values: number[]; bold?: boolean; indent?: number }[];
  total?: { label: string; values: number[] };
}

export type ViewSpec =
  | {
      type: 'register';
      entity: string;
      /** alternative presentations toggled with the segmented control */
      views?: ('table' | 'board' | 'calendar')[];
      boardField?: string;
      dateField?: string;
      /** pre-filter, e.g. { category: 'Machinery' } */
      filter?: Record<string, string>;
      /** paired sub-entities shown as a segmented toggle, e.g. Topic | Sub-Topic */
      pair?: string[];
      /** status tabs across the top of the table */
      tabs?: { field: string; values: string[] };
    }
  | { type: 'status'; entity: string; field: string; value: string }
  | { type: 'field'; entity: string; field: string }
  | { type: 'wizard'; title: string; entity?: string; steps: WizardStep[]; submitLabel?: string }
  | { type: 'lineitems'; entity: string; title?: string; extra?: string[]; /** GST % added to the total (default 18; 0 hides the tax rows) */ tax?: number }
  | { type: 'board'; entity: string; field: string; columns?: string[]; meta?: string[] }
  | { type: 'documents'; title?: string; folders: string[]; folder?: string }
  | { type: 'checklist'; title: string; subject?: string; groups: { title: string; items: string[] }[]; scored?: boolean }
  | { type: 'comparison'; title: string; subjectLabel?: string; subjects: string[]; rows: CompareRow[]; note?: string; recommend?: number }
  | { type: 'tree'; title: string; columns: { key: string; label: string; type?: 'text' | 'currency' | 'number' | 'percent' | 'status' }[]; nodes: TreeNode[] }
  | { type: 'gantt'; title: string; mode?: 'schedule' | 'dependencies' | 'impact' }
  | { type: 'calendar'; title: string; mode: 'month'; entity: string; dateField: string }
  | {
      type: 'calendar';
      title: string;
      mode: 'grid';
      rowsEntity: string;
      codes: { code: string; label: string; tone: Tone }[];
      /** relative weights of codes */
      weights?: number[];
      days?: number;
    }
  | { type: 'timeline'; title: string; subject?: string; events: TimelineEvent[] }
  | { type: 'approval'; entity: string; stages: string[] }
  | { type: 'analysis'; title: string; kpis: KpiSpec[]; charts: ChartSpec[]; table?: TableSpec }
  | { type: 'statement'; title: string; periods: string[]; sections: StatementSection[]; net?: { label: string; values: number[] } }
  | { type: 'gallery'; title: string; captions?: string[] }
  | {
      type: 'print';
      entity: string;
      docTitle: string;
      lines?: { columns: string[]; rows: (string | number)[][] };
      totals?: { label: string; value: string; bold?: boolean }[];
      signatures?: string[];
    }
  | { type: 'map'; entity: string; title?: string }
  | { type: 'settings'; title: string; sections: { title: string; icon?: string; fields: FieldDef[] }[] }
  | { type: 'custom'; component: string; props?: Record<string, unknown> };

/* ─────────────────────────── Navigation ─────────────────────────── */

export interface NavChild {
  id: string;
  label: string;
  view: ViewSpec;
}

export interface NavMenu {
  id: string;
  label: string;
  icon: string;
  /** group with child menus … */
  children?: NavChild[];
  /** … or a leaf menu that is itself a page */
  view?: ViewSpec;
}

export interface AppConfig {
  id: string;
  name: string;
  icon: string;
  description: string;
  menus: NavMenu[];
  dashboard: DashboardSpec;
  entities: EntityDef[];
}
