import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getEntity, hasEntity, type Resolved } from '@/config/registry';
import type { ViewSpec } from '@/config/types';
import { Checkbox, FieldControl, FieldShell, FieldValue, FileUpload } from '@/components/fields';
import { Button, Icon, InfoBar, SectionCard } from '@/components/ui';
import { ActionBar, StepNum } from '@/components/widgets';
import { cn } from '@/lib/cn';
import { useData } from '@/mock/store';
import { toast } from '@/mock/toast';

/** Multi-step process form (tender creation, payroll run, ownership transfer …). */
export function WizardView({ r, view }: { r: Resolved; view: Extract<ViewSpec, { type: 'wizard' }> }) {
  const [step, setStep] = useState(0);
  const [values, setValues] = useState<Record<string, unknown>>({});
  const [checks, setChecks] = useState<Record<string, boolean>>({});
  const [uploads, setUploads] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [done, setDone] = useState<string | null>(null);
  const create = useData((s) => s.create);
  const navigate = useNavigate();
  const steps = [...view.steps, { title: 'Review & Submit', icon: 'ti-checklist' }];
  const cur = steps[step];
  const isReview = step === steps.length - 1;

  const validateStep = () => {
    const errs: Record<string, string> = {};
    for (const f of cur.fields ?? []) {
      const v = values[f.key];
      if (f.required && (v === undefined || v === '' || (Array.isArray(v) && !v.length))) errs[f.key] = `${f.label} is required`;
    }
    setErrors(errs);
    return !Object.keys(errs).length;
  };

  const submit = () => {
    let id = `${view.title.split(' ').map((w) => w[0]).join('').toUpperCase()}-${String(Date.now()).slice(-4)}`;
    if (view.entity && hasEntity(view.entity)) {
      const opts = getEntity(view.entity).fields.find((f) => f.key === 'status')?.options ?? [];
      const st = opts.find((o) => /submitted/i.test(o)) ?? opts.find((o) => /pending|review|new|open/i.test(o)) ?? opts[0];
      id = create(view.entity, { ...values, ...(st ? { status: st } : {}) }).id;
    }
    setDone(id);
    toast.success(`${view.title} submitted`, `Reference ${id} — routed for approval.`);
  };

  if (done) {
    return (
      <SectionCard plain>
        <div className="flex flex-col items-center gap-2 py-10 text-center">
          <Icon name="ti-circle-check" className="text-[40px] text-ok" />
          <div className="text-base font-semibold text-ink">{view.title} submitted successfully</div>
          <div className="text-sm text-ink-2">
            Reference number <strong className="font-semibold text-navy">{done}</strong> · routed to the approver.
          </div>
          <div className="mt-3 flex gap-2">
            <Button onClick={() => { setDone(null); setStep(0); setValues({}); setChecks({}); setUploads({}); }}>Start another</Button>
            {view.entity && (
              <Button variant="primary" onClick={() => navigate(`/${r.app.id}`)}>
                Back to {r.app.name} dashboard
              </Button>
            )}
          </div>
        </div>
      </SectionCard>
    );
  }

  return (
    <div className="flex flex-col gap-3.5">
      <div className="hair flex flex-wrap items-center gap-2 rounded-md border-line bg-bg px-3.5 py-2.5">
        {steps.map((s, i) => (
          <button key={s.title} type="button" onClick={() => i < step && setStep(i)} className="flex items-center gap-2">
            <StepNum n={i + 1} active={i === step} done={i < step} />
            <span className={cn('text-xs', i === step ? 'font-semibold text-navy' : i < step ? 'text-ink' : 'text-ink-3')}>{s.title}</span>
            {i < steps.length - 1 && <Icon name="ti-chevron-right" className="mx-1 text-[12px] text-ink-3" />}
          </button>
        ))}
      </div>

      {'note' in cur && cur.note && <InfoBar>{cur.note}</InfoBar>}

      {isReview ? (
        <div className="flex flex-col gap-3.5">
          {view.steps.map((s, i) => (
            <SectionCard key={s.title} title={s.title} icon={s.icon} actions={<Button variant="link" className="h-auto text-xs" onClick={() => setStep(i)}>Edit</Button>}>
              <div className="grid grid-cols-1 gap-x-4 gap-y-2.5 md:grid-cols-3">
                {(s.fields ?? []).map((f) => (
                  <div key={f.key}>
                    <div className="field-label mb-0.5">{f.label}</div>
                    <div className="text-sm">
                      <FieldValue field={f} value={values[f.key]} link={false} />
                    </div>
                  </div>
                ))}
                {s.checklist && (
                  <div className="text-sm text-ink-2 md:col-span-3">
                    Checklist: {s.checklist.filter((c) => checks[`${s.title}|${c}`]).length} of {s.checklist.length} items confirmed
                  </div>
                )}
                {s.upload && <div className="text-sm text-ink-2 md:col-span-3">Documents: {s.upload.filter((u) => uploads[u]).length} of {s.upload.length} uploaded</div>}
                {s.lines && <div className="text-sm text-ink-2 md:col-span-3">{s.lines.rows.length} line items</div>}
              </div>
            </SectionCard>
          ))}
          <SectionCard title="Declaration" icon="ti-signature">
            <Checkbox checked={!!checks._declare} onChange={(v) => setChecks((c) => ({ ...c, _declare: v }))} label="I confirm the information above is complete and correct." />
          </SectionCard>
        </div>
      ) : (
        <SectionCard title={cur.title} icon={cur.icon}>
          <div className="flex flex-col gap-4">
            {cur.fields && cur.fields.length > 0 && (
              <div className="grid grid-cols-1 gap-x-3.5 gap-y-2.5 md:grid-cols-2 xl:grid-cols-3">
                {cur.fields.map((f) => (
                  <FieldShell key={f.key} label={f.label} required={f.required} hint={f.hint} error={errors[f.key]} className={cn((f.type === 'textarea' || f.type === 'multiselect' || f.type === 'file') && 'md:col-span-2 xl:col-span-3')}>
                    <FieldControl field={f} value={values[f.key]} onChange={(v) => { setValues((s) => ({ ...s, [f.key]: v })); setErrors((e) => ({ ...e, [f.key]: '' })); }} invalid={!!errors[f.key]} />
                  </FieldShell>
                ))}
              </div>
            )}
            {'lines' in cur && cur.lines && (
              <div className="hair overflow-x-auto rounded-md border-line bg-bg">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr>
                      <th className="hair-b w-12 border-blue-line bg-blue-tint px-2.5 py-2 text-left font-semibold text-blue-ink">Sr No</th>
                      {cur.lines.columns.map((c, ci) => (
                        <th key={`${ci}-${c}`} className="hair-b border-blue-line bg-blue-tint px-2.5 py-2 text-left font-semibold whitespace-nowrap text-blue-ink">
                          {c}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {cur.lines.rows.map((row, i) => (
                      <tr key={i} className="hover:bg-bg-2">
                        <td className="hair-b border-line px-2.5 py-2 text-ink-2">{i + 1}</td>
                        {row.map((v, j) => (
                          <td key={j} className={cn('hair-b border-line px-2.5 py-2', typeof v === 'number' && 'text-right tabular-nums')}>
                            {typeof v === 'number' ? v.toLocaleString('en-IN') : v}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {'checklist' in cur && cur.checklist && (
              <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                {cur.checklist.map((c) => (
                  <div key={c} className="hair rounded-md border-line bg-bg px-3 py-2">
                    <Checkbox checked={!!checks[`${cur.title}|${c}`]} onChange={(v) => setChecks((s) => ({ ...s, [`${cur.title}|${c}`]: v }))} label={c} />
                  </div>
                ))}
              </div>
            )}
            {'upload' in cur && cur.upload && (
              <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2">
                {cur.upload.map((u) => (
                  <FieldShell key={u} label={u}>
                    <FileUpload value={uploads[u]} onChange={(v) => setUploads((s) => ({ ...s, [u]: v }))} />
                  </FieldShell>
                ))}
              </div>
            )}
          </div>
        </SectionCard>
      )}

      <ActionBar>
        <span className="mr-auto text-xs text-ink-3">
          Step {step + 1} of {steps.length}
        </span>
        <Button onClick={() => toast.success('Draft saved', `${view.title} saved as draft.`)}>Save Draft</Button>
        {step > 0 && (
          <Button icon="ti-arrow-left" onClick={() => setStep(step - 1)}>
            Back
          </Button>
        )}
        {isReview ? (
          <Button variant="primary" icon="ti-send" disabled={!checks._declare} onClick={submit}>
            {view.submitLabel ?? 'Submit'}
          </Button>
        ) : (
          <Button variant="primary" iconRight="ti-arrow-right" onClick={() => validateStep() ? setStep(step + 1) : toast.error('Complete the required fields to continue')}>
            Next
          </Button>
        )}
      </ActionBar>
    </div>
  );
}
