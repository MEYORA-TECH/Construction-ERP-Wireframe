import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { App } from '@/App';
import { allPages, getEntity } from '@/config/registry';
import { getRows } from '@/mock/store';
import { viewEntity } from '@/templates/ViewRenderer';

afterEach(cleanup);

/** Links hard-coded in the shell (notifications, search) must resolve to real pages. */
const HARD_LINKS = [
  '/billing/bill-certification',
  '/procurement/purchase-order/po',
  '/project/planning-and-control/delays',
  '/store/inventory/stock',
  '/variations/approval',
  '/quality-and-safety/safety/incident',
  '/contracts/commercial-terms/performance-guarantee',
  '/workforce/attendance/leave',
  '/project/project-master/project-name',
  '/tender/tender-documents/drawings',
  '/handover/completion/completion-certificate',
];

function renderAt(path: string) {
  const errors: unknown[] = [];
  const spy = vi.spyOn(console, 'error').mockImplementation((...args) => {
    const msg = String(args[0] ?? '');
    // React act() / Radix aria warnings are noise in jsdom
    if (/act\(|DialogContent|aria-describedby|not wrapped/.test(msg)) return;
    errors.push(args);
  });
  const utils = render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  );
  spy.mockRestore();
  return { ...utils, errors };
}

describe('route crawl', () => {
  it('enterprise dashboard and component gallery render', () => {
    for (const p of ['/', '/gallery']) {
      const { container, errors } = renderAt(p);
      expect(container.textContent).toMatch(/Construction ERP/);
      expect(errors).toEqual([]);
      cleanup();
    }
  });

  it('every app dashboard renders', () => {
    const apps = [...new Set(allPages().map((p) => p.app.id))];
    for (const id of apps) {
      const { container, errors } = renderAt(`/${id}`);
      expect(container.textContent, id).toMatch(/Dashboard/);
      expect(container.textContent, id).not.toMatch(/This page does not exist/);
      expect(errors, id).toEqual([]);
      cleanup();
    }
  });

  it('every one of the 337 sidebar pages renders without errors and is not empty', () => {
    const failures: string[] = [];
    for (const p of allPages()) {
      try {
        const { container, errors } = renderAt(p.path);
        const text = container.textContent ?? '';
        if (/This page does not exist|Unsupported view|is not registered/.test(text)) failures.push(`${p.path}: unresolved`);
        if (errors.length) failures.push(`${p.path}: console.error ${String((errors[0] as unknown[])[0]).slice(0, 160)}`);
        if ((p.view.type === 'field' || p.view.type === 'status' || p.view.type === 'register') && /No records to display/.test(text)) failures.push(`${p.path}: empty register`);
      } catch (e) {
        failures.push(`${p.path}: threw ${(e as Error).message}`);
      }
      cleanup();
    }
    expect(failures).toEqual([]);
  }, 300_000);

  it('record detail, new and edit routes render for every entity-backed page', () => {
    const failures: string[] = [];
    const seen = new Set<string>();
    for (const p of allPages()) {
      const entityId = viewEntity(p.view);
      if (!entityId || seen.has(entityId)) continue;
      seen.add(entityId);
      const row = getRows(entityId)[0];
      if (!row) {
        failures.push(`${entityId}: no seed rows`);
        continue;
      }
      for (const suffix of [`/${row.id}`, '/new', `/${row.id}/edit`]) {
        try {
          const { container, errors } = renderAt(`${p.path}${suffix}`);
          const text = container.textContent ?? '';
          if (/not found|does not exist/.test(text)) failures.push(`${p.path}${suffix}: not found`);
          if (suffix === `/${row.id}` && !text.includes(row.id)) failures.push(`${p.path}${suffix}: record id missing`);
          if (errors.length) failures.push(`${p.path}${suffix}: console.error ${String((errors[0] as unknown[])[0]).slice(0, 160)}`);
        } catch (e) {
          failures.push(`${p.path}${suffix} (${getEntity(entityId).label}): threw ${(e as Error).message}`);
        }
        cleanup();
      }
    }
    expect(failures).toEqual([]);
  }, 300_000);

  it('hard-coded shell links resolve', () => {
    for (const l of HARD_LINKS) {
      const { container } = renderAt(l);
      expect(container.textContent, l).not.toMatch(/This page does not exist/);
      cleanup();
    }
  });
});
