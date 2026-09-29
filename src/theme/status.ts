export type Tone = 'blue' | 'green' | 'yellow' | 'red' | 'gray';

/**
 * Semantic status system (Proposed_Design.md §28):
 * Blue → Active / In Progress · Green → Completed / Approved / On Track
 * Yellow → Pending / At Risk / Awaiting · Red → Delayed / Rejected / Critical · Gray → Draft / Inactive
 */
const EXACT: Record<string, Tone> = {
  active: 'blue',
  'in progress': 'blue',
  open: 'blue',
  ordered: 'blue',
  issued: 'blue',
  submitted: 'blue',
  'under evaluation': 'blue',
  'in transit': 'blue',
  dispatched: 'blue',
  running: 'blue',
  working: 'blue',
  assigned: 'blue',
  allocated: 'blue',
  deployed: 'blue',
  'in use': 'blue',
  new: 'blue',
  contacted: 'blue',
  negotiation: 'blue',
  proposal: 'blue',
  scheduled: 'blue',
  owned: 'blue',
  rented: 'blue',
  leased: 'blue',
  'bid preparation': 'blue',
  'in preparation': 'blue',
  mobilizing: 'blue',
  posted: 'blue',
  escalated: 'red',
  prospect: 'blue',
  demobilized: 'gray',
  'on leave': 'yellow',
  'notice period': 'yellow',
  blacklisted: 'red',
  returned: 'gray',
  'eot claimed': 'yellow',
  mitigated: 'green',
  present: 'green',
  'fully received': 'green',
  received: 'green',
  paid: 'green',
  completed: 'green',
  complete: 'green',
  approved: 'green',
  certified: 'green',
  'on track': 'green',
  won: 'green',
  qualified: 'green',
  converted: 'green',
  closed: 'green',
  passed: 'green',
  pass: 'green',
  verified: 'green',
  accepted: 'green',
  compliant: 'green',
  clear: 'green',
  available: 'green',
  settled: 'green',
  reconciled: 'green',
  valid: 'green',
  released: 'green',
  resolved: 'green',
  rectified: 'green',
  'handed over': 'green',
  'in stock': 'green',
  pending: 'yellow',
  'at risk': 'yellow',
  'under review': 'yellow',
  'awaiting approval': 'yellow',
  'pending approval': 'yellow',
  'on hold': 'yellow',
  'due soon': 'yellow',
  due: 'yellow',
  expiring: 'yellow',
  'expiring soon': 'yellow',
  late: 'yellow',
  'half day': 'yellow',
  warning: 'yellow',
  medium: 'yellow',
  moderate: 'yellow',
  minor: 'yellow',
  idle: 'yellow',
  'under maintenance': 'yellow',
  'partially received': 'yellow',
  'partially paid': 'yellow',
  'low stock': 'yellow',
  'reorder level': 'yellow',
  delayed: 'red',
  rejected: 'red',
  critical: 'red',
  lost: 'red',
  overdue: 'red',
  failed: 'red',
  fail: 'red',
  'non-compliant': 'red',
  expired: 'red',
  breakdown: 'red',
  high: 'red',
  major: 'red',
  absent: 'red',
  blocked: 'red',
  disputed: 'red',
  'out of stock': 'red',
  cancelled: 'gray',
  draft: 'gray',
  inactive: 'gray',
  archived: 'gray',
  'not started': 'gray',
  planned: 'gray',
  low: 'gray',
  'no bid': 'gray',
  unqualified: 'gray',
  leave: 'gray',
  exited: 'gray',
  na: 'gray',
  'n/a': 'gray',
};

const RULES: [RegExp, Tone][] = [
  [/reject|delay|overdue|critical|fail|lost|expired|breakdown|dispute|default|accident|stop|severe/i, 'red'],
  [/pending|await|review|risk|hold|due|expir|partial|query|revis|clarif/i, 'yellow'],
  [/complete|approv|certif|won|paid|closed|pass|verif|accept|settled|reconcil|releas|resolv|done|received|track|signed|registered/i, 'green'],
  [/draft|inactive|archiv|cancel|not started|planned/i, 'gray'],
  [/active|progress|open|ordered|issued|submit|transit|running|assign|schedul|new|negotiat|prepar|evaluat/i, 'blue'],
];

export function toneOf(status: unknown): Tone {
  const s = String(status ?? '').trim().toLowerCase();
  if (!s) return 'gray';
  if (EXACT[s]) return EXACT[s];
  for (const [re, tone] of RULES) if (re.test(s)) return tone;
  return 'blue';
}

/** True when the status is covered by the explicit map or a rule (used by the status audit test). */
export function isKnownStatus(status: string): boolean {
  const s = status.trim().toLowerCase();
  return !!EXACT[s] || RULES.some(([re]) => re.test(s));
}

export const TONE_CLASSES: Record<Tone, string> = {
  blue: 'bg-blue-tint text-blue-ink',
  green: 'bg-ok-bg text-ok',
  yellow: 'bg-warn-bg text-warn',
  red: 'bg-bad-bg text-bad',
  gray: 'bg-mute-bg text-mute',
};

export const TONE_DOT: Record<Tone, string> = {
  blue: 'bg-blue',
  green: 'bg-ok',
  yellow: 'bg-warn',
  red: 'bg-bad',
  gray: 'bg-ink-3',
};

/** Hex values for charts where the data itself is a status. */
export const TONE_HEX: Record<Tone, string> = {
  blue: '#185FA5',
  green: '#2E8B57',
  yellow: '#D4A017',
  red: '#C0392B',
  gray: '#9AA3AF',
};

/** Blue-led chart ramp from the sample wireframe. */
export const CHART_RAMP = ['#0C3B6E', '#185FA5', '#5B8FC9', '#B5D4F4', '#7B8594', '#C9D1DB', '#0C447C', '#8FB5DE'];
