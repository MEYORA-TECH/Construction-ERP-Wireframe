import { useMemo, useState } from 'react';
import { getEntity, hasEntity, type Resolved } from '@/config/registry';
import type { ViewSpec } from '@/config/types';
import { SelectInput, TextInput } from '@/components/fields';
import { Button, KpiCard, ProgressBar, SectionCard, StatusBadge } from '@/components/ui';
import { cn } from '@/lib/cn';
import { createRng } from '@/lib/random';
import { useRows } from '@/mock/store';
import { toast } from '@/mock/toast';

type Result = 'Pass' | 'Fail' | 'NA' | '';

export function ChecklistView({ view }: { r: Resolved; view: Extract<ViewSpec, { type: 'checklist' }> }) {
  const subjectEntity = view.subject && hasEntity(view.subject) ? getEntity(view.subject) : undefined;
  const subjects = useRows(view.subject ?? 'project');
  const [subject, setSubject] = useState(subjects[0]?.id ?? '');
  const seeded = useMemo(() => {
    const rng = createRng(`chk:${view.title}:${subject}`);
    const out: Record<string, Result> = {};
    view.groups.forEach((g) => g.items.forEach((it) => (out[`${g.title}|${it}`] = rng.chance(0.72) ? 'Pass' : rng.chance(0.5) ? 'Fail' : rng.chance(0.5) ? 'NA' : '')));
    return out;
  }, [view, subject]);
  const [edits, setEdits] = useState<Record<string, Result>>({});
  const [remarks, setRemarks] = useState<Record<string, string>>({});
  const res = (k: string) => (edits[`${subject}|${k}`] ?? seeded[k]) as Result;

  const keys = view.groups.flatMap((g) => g.items.map((it) => `${g.title}|${it}`));
  const pass = keys.filter((k) => res(k) === 'Pass').length;
  const fail = keys.filter((k) => res(k) === 'Fail').length;
  const na = keys.filter((k) => res(k) === 'NA').length;
  const open = keys.length - pass - fail - na;
  const score = Math.round((pass / Math.max(1, keys.length - na)) * 100);
  const verdict = open ? 'In Progress' : fail ? (score >= 70 ? 'Conditionally Compliant' : 'Non-Compliant') : 'Compliant';

  return (
    <div className="flex flex-col gap-3">
      <div className="hair flex flex-wrap items-end gap-3 rounded-md border-line bg-bg-2 px-3.5 py-2.5">
        <div className="w-80">
          <div className="field-label mb-1">{subjectEntity?.label ?? 'Project'}</div>
          <SelectInput value={subject} onChange={(e) => setSubject(e.target.value)} options={subjects.map((s) => ({ value: s.id, label: `${s.id} — ${String(s[subjectEntity?.titleField ?? 'name'] ?? s.id)}` }))} />
        </div>
        <div className="flex-1" />
        <Button icon="ti-printer" onClick={() => toast.info('Checklist sent to printer')}>
          Print
        </Button>
        <Button variant="primary" icon="ti-device-floppy" onClick={() => toast.success('Checklist saved', `${view.title} · ${pass} passed, ${fail} failed`)}>
          Save {view.title}
        </Button>
      </div>
      <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-5">
        <KpiCard label={view.scored ? 'Score' : 'Compliance'} value={`${score}%`} progress={score} icon="ti-gauge" />
        <KpiCard label="Passed" value={pass} icon="ti-circle-check" />
        <KpiCard label="Failed" value={fail} icon="ti-circle-x" />
        <KpiCard label="Not applicable" value={na} icon="ti-circle-minus" />
        <div className="hair flex flex-col justify-center gap-1 rounded-md border-line bg-bg px-3 py-2.5">
          <span className="text-xs text-ink-2">Overall result</span>
          <StatusBadge value={verdict} />
        </div>
      </div>
      {view.groups.map((g) => {
        const gk = g.items.map((it) => `${g.title}|${it}`);
        const gp = gk.filter((k) => res(k) === 'Pass').length;
        return (
          <SectionCard key={g.title} title={g.title} icon="ti-list-check" actions={<span className="flex w-40 items-center gap-2 text-2xs text-ink-3"><ProgressBar value={(gp / gk.length) * 100} />{gp}/{gk.length}</span>}>
            <div className="hair overflow-hidden rounded-md border-line bg-bg">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr>
                    <th className="hair-b w-14 border-blue-line bg-blue-tint px-2.5 py-2 text-left font-semibold whitespace-nowrap text-blue-ink">Sr No</th>
                    <th className="hair-b border-blue-line bg-blue-tint px-2.5 py-2 text-left font-semibold text-blue-ink">Criteria</th>
                    <th className="hair-b w-[210px] border-blue-line bg-blue-tint px-2.5 py-2 text-left font-semibold text-blue-ink">Result*</th>
                    <th className="hair-b w-[32%] border-blue-line bg-blue-tint px-2.5 py-2 text-left font-semibold text-blue-ink">Remarks</th>
                  </tr>
                </thead>
                <tbody>
                  {g.items.map((it, i) => {
                    const k = `${g.title}|${it}`;
                    const v = res(k);
                    return (
                      <tr key={it} className="hover:bg-bg-2">
                        <td className="hair-b border-line px-2.5 py-1.5 text-ink-2">{i + 1}</td>
                        <td className="hair-b border-line px-2.5 py-1.5 text-ink">{it}</td>
                        <td className="hair-b border-line px-2.5 py-1.5">
                          <div className="hair inline-flex overflow-hidden rounded-md border-line-2">
                            {(['Pass', 'Fail', 'NA'] as Result[]).map((opt, oi) => (
                              <button
                                key={opt}
                                type="button"
                                onClick={() => setEdits((e) => ({ ...e, [`${subject}|${k}`]: opt }))}
                                className={cn(
                                  'h-6 px-3 text-xs',
                                  oi < 2 && 'hair-r border-line-2',
                                  v === opt ? (opt === 'Pass' ? 'bg-ok text-white' : opt === 'Fail' ? 'bg-bad text-white' : 'bg-ink-3 text-white') : 'bg-bg text-ink-2 hover:bg-bg-2',
                                )}
                              >
                                {opt}
                              </button>
                            ))}
                          </div>
                        </td>
                        <td className="hair-b border-line px-2.5 py-1">
                          <TextInput className="h-7" value={remarks[`${subject}|${k}`] ?? ''} onChange={(e) => setRemarks((s) => ({ ...s, [`${subject}|${k}`]: e.target.value }))} placeholder={v === 'Fail' ? 'Describe the deviation…' : 'Optional'} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </SectionCard>
        );
      })}
    </div>
  );
}
