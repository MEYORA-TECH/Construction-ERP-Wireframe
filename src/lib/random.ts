/** Deterministic PRNG so the demo data is identical on every load. */
export function hashString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export interface Rng {
  next(): number;
  int(min: number, max: number): number;
  pick<T>(arr: readonly T[]): T;
  pickSome<T>(arr: readonly T[], min: number, max: number): T[];
  chance(p: number): boolean;
}

export function createRng(seed: string | number): Rng {
  let a = typeof seed === 'number' ? seed : hashString(seed);
  const next = () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const int = (min: number, max: number) => Math.floor(next() * (max - min + 1)) + min;
  function pick<T>(arr: readonly T[]): T {
    return arr[Math.floor(next() * arr.length)];
  }
  function pickSome<T>(arr: readonly T[], min: number, max: number): T[] {
    const n = Math.min(arr.length, int(min, max));
    const copy = [...arr];
    const out: T[] = [];
    for (let i = 0; i < n; i++) out.push(copy.splice(Math.floor(next() * copy.length), 1)[0]);
    return out;
  }
  return { next, int, pick, pickSome, chance: (p: number) => next() < p };
}
