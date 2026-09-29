/** Deterministic "extras" for any record: documents, activity, approvals, history. */
import { addDays, DEMO_TODAY, formatDate, toISO } from '@/lib/format';
import { createRng } from '@/lib/random';
import type { EntityDef, Row } from '@/config/types';
import { toneOf } from '@/theme/status';

const PEOPLE = ['Arun S', 'Sneha P', 'Ravi Kumar K', 'Divya T', 'Priya M', 'Rajesh Nair', 'Anitha G', 'Gayathri S', 'Harish V', 'Siddharth Rao'];

export function recordDocuments(entity: EntityDef, row: Row) {
  const rng = createRng(`docs:${entity.id}:${row.id}`);
  const names = [
    `${entity.label} ${row.id} — Summary.pdf`,
    'Approved Drawing Rev-2.pdf',
    'Supporting Calculation.xlsx',
    'Site Photographs.zip',
    'Correspondence Letter.pdf',
    'Test Certificate.pdf',
    'Signed Copy.pdf',
  ];
  return rng.pickSome(names, 3, 5).map((name, i) => ({
    id: `${row.id}-D${i + 1}`,
    name,
    type: name.split('.').pop()!.toUpperCase(),
    version: `R${rng.int(0, 3)}`,
    size: `${rng.int(120, 4800)} KB`,
    by: rng.pick(PEOPLE),
    date: toISO(addDays(DEMO_TODAY, -rng.int(1, 90))),
    status: rng.pick(['Approved', 'Approved', 'Under Review', 'Draft']),
  }));
}

export function recordActivity(entity: EntityDef, row: Row) {
  const rng = createRng(`act:${entity.id}:${row.id}`);
  const status = String(row.status ?? '');
  const n = rng.int(4, 6);
  const events = [
    { title: `${entity.label} created`, text: `${entity.label} ${row.id} registered in the system.` },
    { title: 'Details updated', text: 'Key fields revised after internal review.' },
    { title: 'Document uploaded', text: 'Supporting document attached for reference.' },
    { title: 'Comment added', text: 'Please confirm the quantities with the site team before approval.' },
    { title: 'Submitted for review', text: 'Forwarded to the reviewer for verification.' },
    { title: status ? `Status changed to ${status}` : 'Reviewed', text: 'Workflow step completed.', status: status || undefined },
  ];
  let day = -rng.int(40, 80);
  return events.slice(0, n).map((e, i) => {
    day += rng.int(2, 12);
    return { ...e, date: toISO(addDays(DEMO_TODAY, Math.min(day, 0))), actor: PEOPLE[(i + rng.int(0, 9)) % PEOPLE.length] };
  }).reverse();
}

export function recordApprovals(entity: EntityDef, row: Row) {
  const rng = createRng(`apr:${entity.id}:${row.id}`);
  const stages = ['Prepared', 'Reviewed', 'Verified', 'Approved'];
  const tone = toneOf(row.status);
  const current = tone === 'green' ? stages.length : tone === 'gray' ? 0 : tone === 'red' ? rng.int(1, 3) : rng.int(1, 3);
  const rejected = tone === 'red';
  return {
    stages: stages.map((label, i) => ({
      label,
      by: i < current || (i === current && rejected) ? PEOPLE[(i * 3 + rng.int(0, 9)) % PEOPLE.length] : i === current ? 'Awaiting' : undefined,
      date: i < current ? formatDate(toISO(addDays(DEMO_TODAY, -((stages.length - i) * rng.int(2, 6))))) : undefined,
    })),
    current: Math.min(current, stages.length),
    rejected,
  };
}

export function recordHistory(entity: EntityDef, row: Row) {
  const rng = createRng(`his:${entity.id}:${row.id}`);
  const fields = entity.fields.filter((f) => f.type !== 'textarea').slice(0, 6);
  return Array.from({ length: rng.int(3, 6) }, (_, i) => {
    const f = rng.pick(fields);
    return {
      at: toISO(addDays(DEMO_TODAY, -rng.int(1, 60) - i * 5)),
      field: f.label,
      from: f.type === 'status' && f.options ? rng.pick(f.options) : '(previous value)',
      to: f.type === 'status' ? String(row.status ?? '') : '(revised value)',
      by: rng.pick(PEOPLE),
    };
  }).sort((a, b) => b.at.localeCompare(a.at));
}
