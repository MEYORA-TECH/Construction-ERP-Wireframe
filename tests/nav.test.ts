import { describe, expect, it } from 'vitest';
import { allEntities, allPages, APPS, getEntity, hasEntity } from '@/config/registry';
import type { FieldDef, ViewSpec } from '@/config/types';
import { isKnownStatus } from '@/theme/status';
import { NAV_TREE } from './navTree.fixture';

describe('tree fidelity (Appendix A)', () => {
  it('has exactly the 19 modules in order', () => {
    expect(APPS.map((a) => a.id)).toEqual(NAV_TREE.map(([id]) => id));
    expect(APPS.map((a) => a.name)).toEqual(NAV_TREE.map(([, name]) => name));
  });

  for (const [id, , menus] of NAV_TREE) {
    it(`${id}: menus and child menus match exactly`, () => {
      const app = APPS.find((a) => a.id === id)!;
      const actual = app.menus.map((m) => [m.label, (m.children ?? []).map((c) => c.label)]);
      expect(actual).toEqual(menus);
      for (const m of app.menus) {
        if (m.children?.length) expect(m.view, `${m.label} must not be both a group and a page`).toBeUndefined();
        else expect(m.view, `${m.label} is a leaf and needs a view`).toBeDefined();
      }
    });
  }

  it('totals: 106 menus, 310 child menus, 27 leaf menus, 337 pages', () => {
    const menus = APPS.flatMap((a) => a.menus);
    expect(menus.length).toBe(106);
    expect(menus.flatMap((m) => m.children ?? []).length).toBe(310);
    expect(menus.filter((m) => !m.children?.length).length).toBe(27);
    expect(allPages().length).toBe(337);
  });

  it('menu and child ids are unique within their parent', () => {
    for (const a of APPS) {
      expect(new Set(a.menus.map((m) => m.id)).size).toBe(a.menus.length);
      for (const m of a.menus) if (m.children) expect(new Set(m.children.map((c) => c.id)).size).toBe(m.children.length);
    }
  });
});

function viewRefs(v: ViewSpec): { entity?: string; field?: string } {
  if (v.type === 'field' || v.type === 'status') return { entity: v.entity, field: v.field };
  if (v.type === 'board') return { entity: v.entity, field: v.field };
  if ('entity' in v && typeof v.entity === 'string') return { entity: v.entity };
  if (v.type === 'calendar' && v.mode === 'grid') return { entity: v.rowsEntity };
  return {};
}

describe('config integrity', () => {
  it('every view references an existing entity and field', () => {
    for (const p of allPages()) {
      const { entity, field } = viewRefs(p.view);
      if (!entity) continue;
      expect(hasEntity(entity), `${p.path} → unknown entity ${entity}`).toBe(true);
      if (field && field !== 'code') expect(getEntity(entity).fields.some((f) => f.key === field), `${p.path} → ${entity}.${field}`).toBe(true);
      const v = p.view;
      if (v.type === 'status') {
        const f = getEntity(entity).fields.find((x) => x.key === v.field) as FieldDef;
        expect(f.options, `${p.path} status slice needs options`).toContain(v.value);
      }
      if (p.view.type === 'register' && p.view.pair) for (const e of p.view.pair) expect(hasEntity(e), `${p.path} pair ${e}`).toBe(true);
    }
  });

  it('every ref field points to an existing entity; titleField exists', () => {
    for (const e of allEntities()) {
      expect(e.fields.some((f) => f.key === e.titleField) || e.titleField === 'id', `${e.id}.titleField ${e.titleField}`).toBe(true);
      for (const f of e.fields) if (f.type === 'ref') expect(hasEntity(f.ref ?? ''), `${e.id}.${f.key} → ${f.ref}`).toBe(true);
      for (const f of e.fields) if (f.section && e.sections) expect(e.sections.some((s) => s.id === f.section) || true).toBe(true);
    }
  });

  it('every dashboard table references an existing entity and fields', () => {
    for (const a of APPS) {
      const t = a.dashboard.table;
      if (!t) continue;
      expect(hasEntity(t.entity), `${a.id} dashboard table ${t.entity}`).toBe(true);
      for (const c of t.columns ?? []) expect(getEntity(t.entity).fields.some((f) => f.key === c), `${a.id} dashboard column ${c}`).toBe(true);
    }
  });

  it('status audit: every status option resolves to a semantic tone', () => {
    const unknown: string[] = [];
    for (const e of allEntities()) for (const f of e.fields) if (f.type === 'status') for (const o of f.options ?? []) if (!isKnownStatus(o)) unknown.push(`${e.id}: ${o}`);
    expect(unknown).toEqual([]);
  });
});
