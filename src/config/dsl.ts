/**
 * Small helpers that keep the 19 app configs terse and readable.
 * Menu / child ids are derived from their labels, so the label is the single source of truth.
 */
import { slug } from '@/lib/slug';
import type { FieldDef, FieldType, NavChild, NavMenu, ViewSpec } from './types';

/** A menu group with child menus. */
export function group(label: string, icon: string, children: NavChild[]): NavMenu {
  return { id: slug(label), label, icon, children };
}

/** A menu without children that is itself a page. */
export function leaf(label: string, icon: string, view: ViewSpec): NavMenu {
  return { id: slug(label), label, icon, view };
}

/** A child menu (page). */
export function page(label: string, view: ViewSpec): NavChild {
  return { id: slug(label), label, view };
}

/* ── view shorthands ── */
export const register = (entity: string, opts: Omit<Extract<ViewSpec, { type: 'register' }>, 'type' | 'entity'> = {}): ViewSpec => ({
  type: 'register',
  entity,
  ...opts,
});
export const statusView = (entity: string, value: string, field = 'status'): ViewSpec => ({ type: 'status', entity, field, value });
export const fieldView = (entity: string, field: string): ViewSpec => ({ type: 'field', entity, field });
export const board = (entity: string, field = 'status', meta?: string[], columns?: string[]): ViewSpec => ({ type: 'board', entity, field, meta, columns });
export const lineItems = (entity: string, title?: string, extra?: string[], tax?: number): ViewSpec => ({ type: 'lineitems', entity, title, extra, tax });
/** Line-item grid without GST rows (measurement books, progress quantities, asset registers …). */
export const lineItemsNoTax = (entity: string, title?: string, extra?: string[]): ViewSpec => ({ type: 'lineitems', entity, title, extra, tax: 0 });
export const docs = (folders: string[], folder?: string, title?: string): ViewSpec => ({ type: 'documents', folders, folder, title });
export const approval = (entity: string, stages: string[]): ViewSpec => ({ type: 'approval', entity, stages });
export const gantt = (title: string, mode: 'schedule' | 'dependencies' | 'impact' = 'schedule'): ViewSpec => ({ type: 'gantt', title, mode });
export const monthCalendar = (title: string, entity: string, dateField: string): ViewSpec => ({ type: 'calendar', mode: 'month', title, entity, dateField });
export const mapView = (entity: string, title?: string): ViewSpec => ({ type: 'map', entity, title });
export const gallery = (title: string, captions?: string[]): ViewSpec => ({ type: 'gallery', title, captions });

/* ── field shorthands ── */
type FieldOpts = Omit<FieldDef, 'key' | 'label' | 'type'>;
export function f(key: string, label: string, type: FieldType = 'text', opts: FieldOpts = {}): FieldDef {
  return { key, label, type, ...opts };
}
export const text = (key: string, label: string, gen?: string[], opts: FieldOpts = {}) => f(key, label, 'text', { gen, ...opts });
export const area = (key: string, label: string, gen?: string[], opts: FieldOpts = {}) => f(key, label, 'textarea', { gen, ...opts });
export const num = (key: string, label: string, gen?: [number, number], opts: FieldOpts = {}) => f(key, label, 'number', { gen, ...opts });
export const money = (key: string, label: string, gen?: [number, number], opts: FieldOpts = {}) => f(key, label, 'currency', { gen, ...opts });
export const pct = (key: string, label: string, gen?: [number, number], opts: FieldOpts = {}) => f(key, label, 'percent', { gen, ...opts });
export const date = (key: string, label: string, gen?: [number, number], opts: FieldOpts = {}) => f(key, label, 'date', { gen, ...opts });
export const select = (key: string, label: string, options: string[], opts: FieldOpts = {}) => f(key, label, 'select', { options, ...opts });
export const multi = (key: string, label: string, options: string[], opts: FieldOpts = {}) => f(key, label, 'multiselect', { options, ...opts });
export const status = (options: string[], opts: FieldOpts = {}) => f('status', 'Status', 'status', { options, ...opts });
export const ref = (key: string, label: string, entity: string, opts: FieldOpts = {}) => f(key, label, 'ref', { ref: entity, ...opts });
