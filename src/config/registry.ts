import { APPS } from './apps';
import { masterEntities } from './masters';
import type { AppConfig, EntityDef, FieldDef, NavChild, NavMenu, ViewSpec } from './types';

export { APPS };

const appMap = new Map<string, AppConfig>(APPS.map((a) => [a.id, a]));

const entityMap = new Map<string, EntityDef>();
for (const e of masterEntities) entityMap.set(e.id, e);
for (const app of APPS) for (const e of app.entities) {
  if (entityMap.has(e.id)) throw new Error(`Duplicate entity id "${e.id}" (app ${app.id})`);
  entityMap.set(e.id, e);
}

export function getApp(id: string | undefined): AppConfig | undefined {
  return id ? appMap.get(id) : undefined;
}

export function getEntity(id: string): EntityDef {
  const e = entityMap.get(id);
  if (!e) throw new Error(`Unknown entity "${id}"`);
  return e;
}

export function hasEntity(id: string): boolean {
  return entityMap.has(id);
}

export function allEntities(): EntityDef[] {
  return [...entityMap.values()];
}

export function statusFieldOf(e: EntityDef): FieldDef | undefined {
  const key = e.statusField ?? 'status';
  return e.fields.find((f) => f.key === key);
}

/** Fields shown in the register table. */
export function listFields(e: EntityDef): FieldDef[] {
  const explicit = e.fields.filter((f) => f.list === true);
  const base = e.fields.filter((f) => f.list !== false && f.type !== 'textarea' && f.key !== 'code');
  const chosen = explicit.length ? [...explicit, ...base.filter((f) => !explicit.includes(f))].slice(0, 7) : base.slice(0, 7);
  const st = statusFieldOf(e);
  if (st && !chosen.includes(st)) {
    if (chosen.length >= 7) chosen.pop();
    chosen.push(st);
  }
  return chosen;
}

export interface Resolved {
  app: AppConfig;
  menu?: NavMenu;
  child?: NavChild;
  view?: ViewSpec;
  /** 'new' | record id */
  recordId?: string;
  edit?: boolean;
  /** base path of the current page (without record segments) */
  base: string;
}

/** Resolve `/:app/:menu[/:child][/new | /:id[/edit]]` against the config. */
export function resolvePath(appId: string, rest: string[]): Resolved | undefined {
  const app = getApp(appId);
  if (!app) return undefined;
  if (!rest.length) return { app, base: `/${app.id}` };
  const menu = app.menus.find((m) => m.id === rest[0]);
  if (!menu) return undefined;
  let idx = 1;
  let child: NavChild | undefined;
  let view: ViewSpec | undefined = menu.view;
  if (menu.children) {
    child = rest[1] ? menu.children.find((c) => c.id === rest[1]) : menu.children[0];
    if (!child) return undefined;
    view = child.view;
    idx = rest[1] ? 2 : 1;
  }
  const base = `/${app.id}/${menu.id}${child ? `/${child.id}` : ''}`;
  const recordId = rest[idx];
  const edit = rest[idx + 1] === 'edit';
  return { app, menu, child, view, recordId, edit, base };
}

export function pathOf(appId: string, menuId?: string, childId?: string): string {
  return `/${appId}${menuId ? `/${menuId}` : ''}${childId ? `/${childId}` : ''}`;
}

/** First page that lists records of an entity — used for cross-links from ref fields / search. */
export function registerPathFor(entityId: string): string | undefined {
  for (const app of APPS) {
    for (const m of app.menus) {
      const nodes: [NavMenu, NavChild | undefined, ViewSpec | undefined][] = m.children
        ? m.children.map((c) => [m, c, c.view])
        : [[m, undefined, m.view]];
      for (const [menu, child, v] of nodes) {
        if (v && v.type === 'register' && v.entity === entityId && !v.filter) return pathOf(app.id, menu.id, child?.id);
      }
    }
  }
  for (const app of APPS) {
    for (const m of app.menus) {
      const nodes = m.children ? m.children.map((c) => [m, c, c.view] as const) : [[m, undefined, m.view] as const];
      for (const [menu, child, v] of nodes) {
        if (v && 'entity' in v && v.entity === entityId) return pathOf(app.id, menu.id, child?.id);
      }
    }
  }
  return undefined;
}

/** Flat list of every navigable page (used by search and the route crawl test). */
export function allPages(): { app: AppConfig; menu: NavMenu; child?: NavChild; view: ViewSpec; path: string; label: string }[] {
  const out: ReturnType<typeof allPages> = [];
  for (const app of APPS) {
    for (const menu of app.menus) {
      if (menu.children) {
        for (const child of menu.children) out.push({ app, menu, child, view: child.view, path: pathOf(app.id, menu.id, child.id), label: child.label });
      } else if (menu.view) {
        out.push({ app, menu, view: menu.view, path: pathOf(app.id, menu.id), label: menu.label });
      }
    }
  }
  return out;
}
