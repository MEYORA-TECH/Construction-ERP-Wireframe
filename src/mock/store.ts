/**
 * In-session data store. Seeded deterministically from the entity configs;
 * create / edit / archive / status changes update the UI immediately. "Reset demo data" restores the seed.
 */
import { create } from 'zustand';
import { allEntities, getEntity, hasEntity } from '@/config/registry';
import type { Row } from '@/config/types';
import { generateRows, makeCode } from './generate';

export interface AuditEntry {
  at: string;
  entity: string;
  recordId: string;
  action: string;
  by: string;
  text?: string;
}

function buildSeed(): Record<string, Row[]> {
  const out: Record<string, Row[]> = {};
  const visiting = new Set<string>();
  const lookup = (id: string): Row[] => {
    if (out[id]) return out[id];
    if (!hasEntity(id) || visiting.has(id)) return [];
    visiting.add(id);
    out[id] = generateRows(getEntity(id), lookup);
    visiting.delete(id);
    return out[id];
  };
  for (const e of allEntities()) lookup(e.id);
  return out;
}

const CURRENT_USER = 'Arun S';

interface DataState {
  rows: Record<string, Row[]>;
  audit: AuditEntry[];
  create(entityId: string, data: Record<string, unknown>): Row;
  update(entityId: string, id: string, patch: Record<string, unknown>, action?: string): void;
  remove(entityId: string, ids: string[]): void;
  reset(): void;
}

const now = () => new Date().toISOString();

export const useData = create<DataState>((set, get) => ({
  rows: buildSeed(),
  audit: [],
  create(entityId, data) {
    const entity = getEntity(entityId);
    const existing = get().rows[entityId] ?? [];
    const code = makeCode(entity, existing.length + 100);
    const row: Row = { ...data, id: code, code };
    set((s) => ({
      rows: { ...s.rows, [entityId]: [row, ...existing] },
      audit: [{ at: now(), entity: entityId, recordId: code, action: 'Created', by: CURRENT_USER }, ...s.audit],
    }));
    return row;
  },
  update(entityId, id, patch, action = 'Updated') {
    set((s) => ({
      rows: { ...s.rows, [entityId]: (s.rows[entityId] ?? []).map((r) => (r.id === id ? { ...r, ...patch } : r)) },
      audit: [
        {
          at: now(),
          entity: entityId,
          recordId: id,
          action,
          by: CURRENT_USER,
          text: Object.entries(patch)
            .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : String(v)}`)
            .join(' · '),
        },
        ...s.audit,
      ],
    }));
  },
  remove(entityId, ids) {
    set((s) => ({
      rows: { ...s.rows, [entityId]: (s.rows[entityId] ?? []).filter((r) => !ids.includes(r.id)) },
      audit: [...ids.map((id) => ({ at: now(), entity: entityId, recordId: id, action: 'Archived', by: CURRENT_USER })), ...s.audit],
    }));
  },
  reset() {
    set({ rows: buildSeed(), audit: [] });
  },
}));

const EMPTY: Row[] = [];

export function useRows(entityId: string): Row[] {
  return useData((s) => s.rows[entityId] ?? EMPTY);
}

export function getRows(entityId: string): Row[] {
  return useData.getState().rows[entityId] ?? EMPTY;
}

export function findRow(entityId: string, id: string): Row | undefined {
  return getRows(entityId).find((r) => r.id === id);
}

/** Display label for a reference (e.g. project id → project name). */
export function refLabel(entityId: string | undefined, id: unknown): string {
  if (!entityId || !id) return '—';
  if (!hasEntity(entityId)) return String(id);
  const row = findRow(entityId, String(id));
  if (!row) return String(id);
  return String(row[getEntity(entityId).titleField] ?? row.id);
}
