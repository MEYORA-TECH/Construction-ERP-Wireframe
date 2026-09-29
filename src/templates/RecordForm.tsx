import { useMemo, useState } from 'react';
import type { EntityDef, FieldDef, Row } from '@/config/types';
import { cn } from '@/lib/cn';
import { FieldControl, FieldShell, FieldValue, FileUpload, SelectInput, TextArea } from '@/components/fields';
import { Modal } from '@/components/overlays';
import { Button, Icon, SectionCard } from '@/components/ui';
import { ActionBar, StepNum } from '@/components/widgets';
import { useData, useRows } from '@/mock/store';
import { toast } from '@/mock/toast';

export function formMode(e: EntityDef): 'modal' | 'page' | 'wizard' {
  return e.form ?? (e.fields.length <= 8 ? 'modal' : 'page');
}

interface Section {
  id: string;
  title: string;
  icon?: string;
  fields: FieldDef[];
}

function sectionsOf(e: EntityDef): Section[] {
  const defs = e.sections ?? [];
  const out: Section[] = defs.map((s) => ({ ...s, fields: e.fields.filter((f) => f.section === s.id) }));
  const rest = e.fields.filter((f) => !f.section || !defs.some((d) => d.id === f.section));
  if (rest.length) out.push({ id: '_details', title: defs.length ? 'Other Details' : `${e.label} Details`, icon: 'ti-list-details', fields: rest });
  return out.filter((s) => s.fields.length);
}

function validate(fields: FieldDef[], values: Record<string, unknown>): Record<string, string> {
  const errs: Record<string, string> = {};
  for (const f of fields) {
    const v = values[f.key];
    if (f.required && (v === undefined || v === null || v === '' || (Array.isArray(v) && !v.length))) errs[f.key] = `${f.label} is required`;
    if (f.type === 'email' && v && !/^\S+@\S+\.\S+$/.test(String(v))) errs[f.key] = 'Enter a valid email address';
    if ((f.type === 'number' || f.type === 'currency') && v !== '' && v !== undefined && Number(v) < 0) errs[f.key] = 'Value cannot be negative';
  }
  return errs;
}

function FieldGrid({ fields, values, errors, onChange, cols = 2 }: { fields: FieldDef[]; values: Record<string, unknown>; errors: Record<string, string>; onChange: (k: string, v: unknown) => void; cols?: number }) {
  return (
    <div className={cn('grid gap-x-3.5 gap-y-2.5', cols === 1 ? 'grid-cols-1' : cols === 2 ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3')}>
      {fields.map((f) => (
        <FieldShell key={f.key} label={f.label} required={f.required} hint={f.hint} error={errors[f.key]} className={cn((f.type === 'textarea' || f.type === 'file' || f.type === 'multiselect') && 'md:col-span-2', f.type === 'textarea' && cols === 3 && 'xl:col-span-3')}>
          <FieldControl field={f} value={values[f.key]} onChange={(v) => onChange(f.key, v)} invalid={!!errors[f.key]} />
        </FieldShell>
      ))}
    </div>
  );
}

function ApprovalCard({ values, onChange }: { values: Record<string, unknown>; onChange: (k: string, v: unknown) => void }) {
  const employees = useRows('employee');
  return (
    <SectionCard title="Approval & Attachments" icon="ti-signature">
      <div className="grid grid-cols-1 gap-3.5 md:grid-cols-[1fr_1px_1fr]">
        <div className="flex flex-col gap-2.5">
          <FieldShell label="Submit for approval to" hint="Approval workflow configured for this document type">
            <SelectInput value={String(values._approver ?? '')} onChange={(e) => onChange('_approver', e.target.value)} options={employees.slice(0, 12).map((e) => ({ value: e.id, label: `${e.name} — ${e.designation}` }))} placeholder="Select approver…" />
          </FieldShell>
          <FieldShell label="Remarks">
            <TextArea value={String(values._remarks ?? '')} onChange={(e) => onChange('_remarks', e.target.value)} placeholder="Notes for the approver…" />
          </FieldShell>
        </div>
        <div className="hidden bg-line md:block" />
        <FieldShell label="Attachments" hint="Drawings, quotations, photographs or signed copies">
          <FileUpload value={values._file ? String(values._file) : undefined} onChange={(v) => onChange('_file', v)} />
        </FieldShell>
      </div>
    </SectionCard>
  );
}

function useFormState(entity: EntityDef, initial?: Row, prefill?: Record<string, unknown>) {
  const [values, setValues] = useState<Record<string, unknown>>(() => {
    if (initial) return { ...initial };
    const v: Record<string, unknown> = { ...prefill };
    const st = entity.fields.find((f) => f.type === 'status');
    if (st && st.options && v[st.key] === undefined) v[st.key] = st.options.find((o) => /draft|new|open|planned|pending/i.test(o)) ?? st.options[0];
    return v;
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const set = (k: string, v: unknown) => {
    setValues((s) => ({ ...s, [k]: v }));
    setErrors((e) => {
      if (!e[k]) return e;
      const { [k]: _, ...rest } = e;
      return rest;
    });
  };
  return { values, errors, setErrors, set };
}

function strip(values: Record<string, unknown>) {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(values)) if (!k.startsWith('_')) out[k] = v;
  return out;
}

/** Modal form (simple entities) — the sample's Add / Edit modal. */
export function RecordModal({ entity, open, onOpenChange, initial, prefill, onSaved }: { entity: EntityDef; open: boolean; onOpenChange: (v: boolean) => void; initial?: Row; prefill?: Record<string, unknown>; onSaved?: (row: Row) => void }) {
  return open ? <RecordModalInner key={initial?.id ?? 'new'} entity={entity} onOpenChange={onOpenChange} initial={initial} prefill={prefill} onSaved={onSaved} /> : null;
}

function RecordModalInner({ entity, onOpenChange, initial, prefill, onSaved }: { entity: EntityDef; onOpenChange: (v: boolean) => void; initial?: Row; prefill?: Record<string, unknown>; onSaved?: (row: Row) => void }) {
  const { values, errors, setErrors, set } = useFormState(entity, initial, prefill);
  const { create, update } = useData();
  const fields = entity.fields.filter((f) => f.key !== 'code');
  const save = () => {
    const errs = validate(fields, values);
    setErrors(errs);
    if (Object.keys(errs).length) {
      toast.error('Please correct the highlighted fields', `${Object.keys(errs).length} field(s) need attention.`);
      return;
    }
    if (initial) {
      update(entity.id, initial.id, strip(values));
      toast.success(`${entity.label} updated`, `${initial.id} saved successfully.`);
      onSaved?.({ ...initial, ...strip(values) } as Row);
    } else {
      const row = create(entity.id, strip(values));
      toast.success(`${entity.label} created`, `${row.id} added to the register.`);
      onSaved?.(row);
    }
    onOpenChange(false);
  };
  return (
    <Modal open onOpenChange={onOpenChange} title={`${initial ? 'Edit' : 'Add'} ${entity.label}`} icon={initial ? 'ti-edit' : 'ti-file-plus'} onSave={save} width={fields.length > 6 ? 620 : 460}>
      <FieldGrid fields={fields} values={values} errors={errors} onChange={set} cols={fields.length > 6 ? 2 : 1} />
    </Modal>
  );
}

/** Full-page form: section cards, or one step per section in wizard mode. */
export function RecordPageForm({ entity, initial, prefill, onDone, onCancel }: { entity: EntityDef; initial?: Row; prefill?: Record<string, unknown>; onDone: (row: Row) => void; onCancel: () => void }) {
  const { values, errors, setErrors, set } = useFormState(entity, initial, prefill);
  const { create, update } = useData();
  const sections = useMemo(() => sectionsOf({ ...entity, fields: entity.fields.filter((f) => f.key !== 'code' || !!initial) }), [entity, initial]);
  const wizard = formMode(entity) === 'wizard' && !initial;
  const steps = wizard ? [...sections, { id: '_review', title: 'Review & Submit', icon: 'ti-checklist', fields: [] as FieldDef[] }] : sections;
  const [step, setStep] = useState(0);

  const submit = () => {
    const allFields = sections.flatMap((s) => s.fields);
    const errs = validate(allFields, values);
    setErrors(errs);
    if (Object.keys(errs).length) {
      toast.error('Please correct the highlighted fields', `${Object.keys(errs).length} field(s) need attention.`);
      if (wizard) {
        const first = sections.findIndex((s) => s.fields.some((f) => errs[f.key]));
        if (first >= 0) setStep(first);
      }
      return;
    }
    if (initial) {
      update(entity.id, initial.id, strip(values));
      toast.success(`${entity.label} updated`, `${initial.id} saved successfully.`);
      onDone({ ...initial, ...strip(values) } as Row);
    } else {
      const row = create(entity.id, strip(values));
      toast.success(`${entity.label} created`, values._approver ? `${row.id} submitted for approval.` : `${row.id} saved as ${String(values.status ?? 'draft')}.`);
      onDone(row);
    }
  };

  const next = () => {
    const cur = steps[step];
    const errs = validate(cur.fields, values);
    setErrors(errs);
    if (Object.keys(errs).length) {
      toast.error('Complete the required fields to continue');
      return;
    }
    setStep((s) => Math.min(steps.length - 1, s + 1));
  };

  if (wizard) {
    const cur = steps[step];
    return (
      <div className="flex flex-col gap-3.5">
        <div className="hair flex flex-wrap items-center gap-2 rounded-md border-line bg-bg px-3.5 py-2.5">
          {steps.map((s, i) => (
            <button key={s.id} type="button" onClick={() => i < step && setStep(i)} className="flex items-center gap-2">
              <StepNum n={i + 1} active={i === step} done={i < step} />
              <span className={cn('text-xs', i === step ? 'font-semibold text-navy' : i < step ? 'text-ink' : 'text-ink-3')}>{s.title}</span>
              {i < steps.length - 1 && <Icon name="ti-chevron-right" className="mx-1 text-[12px] text-ink-3" />}
            </button>
          ))}
        </div>
        {cur.id === '_review' ? (
          <>
            {sections.map((s) => (
              <SectionCard key={s.id} title={s.title} icon={s.icon} actions={<Button variant="link" className="h-auto text-xs" onClick={() => setStep(sections.indexOf(s))}>Edit</Button>}>
                <div className="grid grid-cols-1 gap-x-4 gap-y-2.5 md:grid-cols-3">
                  {s.fields.map((f) => (
                    <div key={f.key}>
                      <div className="field-label mb-0.5">{f.label}</div>
                      <div className="text-sm">
                        <FieldValue field={f} value={values[f.key]} link={false} />
                      </div>
                    </div>
                  ))}
                </div>
              </SectionCard>
            ))}
            <ApprovalCard values={values} onChange={set} />
          </>
        ) : (
          <SectionCard title={cur.title} icon={cur.icon}>
            <FieldGrid fields={cur.fields} values={values} errors={errors} onChange={set} cols={3} />
          </SectionCard>
        )}
        <ActionBar>
          <span className="mr-auto text-xs text-ink-3">
            Step {step + 1} of {steps.length}
          </span>
          <Button onClick={onCancel}>Cancel</Button>
          <Button onClick={() => toast.success('Draft saved', 'You can resume this form later.')}>Save Draft</Button>
          {step > 0 && (
            <Button icon="ti-arrow-left" onClick={() => setStep(step - 1)}>
              Back
            </Button>
          )}
          {step < steps.length - 1 ? (
            <Button variant="primary" iconRight="ti-arrow-right" onClick={next}>
              Next
            </Button>
          ) : (
            <Button variant="primary" icon="ti-send" onClick={submit}>
              Submit {entity.label}
            </Button>
          )}
        </ActionBar>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3.5">
      {sections.map((s) => (
        <SectionCard key={s.id} title={s.title} icon={s.icon}>
          <FieldGrid fields={s.fields} values={values} errors={errors} onChange={set} cols={3} />
        </SectionCard>
      ))}
      <ApprovalCard values={values} onChange={set} />
      <ActionBar>
        <span className="mr-auto text-xs text-ink-3">
          Fields marked <span className="text-danger">*</span> are mandatory
        </span>
        <Button onClick={onCancel}>Cancel</Button>
        <Button variant="primary" icon="ti-device-floppy" onClick={submit}>
          Save {entity.label}
        </Button>
      </ActionBar>
    </div>
  );
}
