/**
 * Deterministic mock-data generator. Every entity is generated from its field definitions,
 * so app configs only describe fields (with optional `gen` hints) and never hand-write rows.
 */
import { addDays, DEMO_TODAY, toISO } from '@/lib/format';
import { createRng, type Rng } from '@/lib/random';
import type { EntityDef, FieldDef, Row } from '@/config/types';

const SENTENCES = [
  'Work progressing as per revised schedule; no hindrance reported.',
  'Awaiting consultant clarification on the latest drawing revision.',
  'Material delivered at site and verified against the delivery challan.',
  'Rectification planned for next week after curing period.',
  'Client requested revised quote including GST impact.',
  'Checked against approved specification and IS code requirements.',
  'Measurement jointly recorded with the client engineer.',
  'Follow-up meeting scheduled with the project team.',
  'Minor deviation observed; corrective action initiated.',
  'Supporting documents uploaded for review and approval.',
];

const FILES = ['GA_Drawing_Rev2.pdf', 'Structural_Report.pdf', 'Site_Photos.zip', 'BOQ_v3.xlsx', 'Test_Certificate.pdf', 'Approval_Letter.pdf', 'Invoice_Scan.pdf', 'Survey_Map.dwg'];

export const pad3 = (n: number) => String(n).padStart(3, '0');

export function makeCode(entity: EntityDef, index: number): string {
  return `${entity.codePrefix}-${pad3(index + 1)}`;
}

export function generateValue(field: FieldDef, i: number, rng: Rng, lookup: (entityId: string) => Row[]): unknown {
  const gen = field.gen;
  const strings = Array.isArray(gen) && typeof gen[0] === 'string' ? (gen as string[]) : undefined;
  const range = Array.isArray(gen) && typeof gen[0] === 'number' ? (gen as [number, number]) : undefined;
  const pickString = () => (strings ? (i < strings.length ? strings[i] : rng.pick(strings)) : undefined);

  switch (field.type) {
    case 'text':
      return pickString() ?? `${field.label} ${i + 1}`;
    case 'textarea':
      return pickString() ?? rng.pick(SENTENCES);
    case 'email':
      return pickString() ?? `user${i + 1}@example.in`;
    case 'phone':
      return pickString() ?? `+91 9${rng.int(100, 999)}${rng.int(10, 99)} ${rng.int(10000, 99999)}`;
    case 'number': {
      const [a, b] = range ?? [1, 100];
      return Number.isInteger(a) && Number.isInteger(b) ? rng.int(a, b) : Math.round((a + rng.next() * (b - a)) * 10) / 10;
    }
    case 'currency': {
      const [a, b] = range ?? [50_000, 50_00_000];
      const v = a + rng.next() * (b - a);
      const step = v > 1e6 ? 10_000 : v > 1e4 ? 100 : 1;
      return Math.round(v / step) * step;
    }
    case 'percent': {
      const [a, b] = range ?? [0, 100];
      return rng.int(a, b);
    }
    case 'rating': {
      const [a, b] = range ?? [2, 5];
      return rng.int(a, b);
    }
    case 'date': {
      const [a, b] = range ?? [-120, 60];
      return toISO(addDays(DEMO_TODAY, rng.int(a, b)));
    }
    case 'select':
    case 'status':
      return field.options?.length ? (strings ? pickString() : rng.pick(field.options)) : '';
    case 'multiselect':
      return field.options?.length ? rng.pickSome(field.options, 1, Math.min(3, field.options.length)) : [];
    case 'boolean':
      return rng.chance(0.6);
    case 'file':
      return pickString() ?? rng.pick(FILES);
    case 'ref': {
      const rows = field.ref ? lookup(field.ref) : [];
      if (!rows.length) return '';
      // bias towards the first (active) records so data clusters on the flagship projects
      const idx = rng.chance(0.7) ? rng.int(0, Math.min(rows.length, 5) - 1) : rng.int(0, rows.length - 1);
      return rows[idx].id;
    }
    default:
      return '';
  }
}

export function generateRows(entity: EntityDef, lookup: (entityId: string) => Row[]): Row[] {
  if (entity.rows) return entity.rows.map((r) => ({ ...r }));
  const rng = createRng(`entity:${entity.id}`);
  const count = entity.count ?? 18;
  const rows: Row[] = [];
  for (let i = 0; i < count; i++) {
    const code = makeCode(entity, i);
    const row: Row = { id: code, code };
    for (const field of entity.fields) {
      if (field.key === 'code') continue;
      row[field.key] = generateValue(field, i, rng, lookup);
    }
    rows.push(row);
  }
  return rows;
}
