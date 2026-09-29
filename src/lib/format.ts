/** Fixed demo "today" keeps overdue / due-soon states stable across demos. */
export const DEMO_TODAY = new Date(2026, 8, 29);

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function addDays(d: Date, days: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + days);
  return r;
}

export function toISO(d: Date): string {
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

export function parseISO(s: string): Date {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

export function formatDate(v: unknown): string {
  if (!v) return '—';
  const d = v instanceof Date ? v : parseISO(String(v));
  if (Number.isNaN(d.getTime())) return String(v);
  return `${String(d.getDate()).padStart(2, '0')} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

export function formatDayMonth(v: string): { day: string; month: string } {
  const d = parseISO(v);
  return { day: String(d.getDate()).padStart(2, '0'), month: MONTHS[d.getMonth()] };
}

export function daysFromToday(v: string): number {
  return Math.round((parseISO(v).getTime() - DEMO_TODAY.getTime()) / 86400000);
}

export function formatNumber(n: unknown, digits = 0): string {
  const v = Number(n);
  if (!Number.isFinite(v)) return '—';
  return v.toLocaleString('en-IN', { maximumFractionDigits: digits, minimumFractionDigits: digits });
}

/** Full Indian grouping below 1 Cr, compact Cr above. */
export function formatINR(n: unknown): string {
  const v = Number(n);
  if (!Number.isFinite(v)) return '—';
  if (Math.abs(v) >= 1e7) return `₹ ${(v / 1e7).toLocaleString('en-IN', { maximumFractionDigits: 2, minimumFractionDigits: 2 })} Cr`;
  return `₹ ${Math.round(v).toLocaleString('en-IN')}`;
}

/** Always compact — for KPI cards and charts. */
export function formatINRCompact(n: unknown): string {
  const v = Number(n);
  if (!Number.isFinite(v)) return '—';
  if (Math.abs(v) >= 1e7) return `₹ ${(v / 1e7).toFixed(2)} Cr`;
  if (Math.abs(v) >= 1e5) return `₹ ${(v / 1e5).toFixed(2)} L`;
  return `₹ ${Math.round(v).toLocaleString('en-IN')}`;
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('');
}
