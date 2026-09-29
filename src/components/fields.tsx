import { useState, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react';
import { Link } from 'react-router-dom';
import { getEntity, hasEntity, registerPathFor } from '@/config/registry';
import type { FieldDef } from '@/config/types';
import { cn } from '@/lib/cn';
import { daysFromToday, formatDate, formatINR, formatNumber } from '@/lib/format';
import { refLabel, useRows } from '@/mock/store';
import { Pop } from './overlays';
import { CodeChip, Icon, ProgressBar, StatusBadge } from './ui';

const BOX = 'hair w-full rounded-md border-line-2 bg-bg text-sm text-ink placeholder:text-ink-3 outline-none focus:border-blue focus:ring-2 focus:ring-blue-tint disabled:bg-bg-2 disabled:text-ink-2';

export function FieldShell({ label, required, hint, error, children, className }: { label?: string; required?: boolean; hint?: string; error?: string; children: ReactNode; className?: string }) {
  return (
    <div className={cn('flex min-w-0 flex-col gap-[3px]', className)}>
      {label && (
        <label className="field-label">
          {label}
          {required && <span className="ml-0.5 text-danger">*</span>}
        </label>
      )}
      {children}
      {error ? <div className="text-2xs text-danger">{error}</div> : hint ? <div className="text-2xs text-ink-3">{hint}</div> : null}
    </div>
  );
}

export function TextInput({ className, invalid, ...rest }: InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean }) {
  return <input className={cn(BOX, 'h-8 px-2', invalid && 'border-danger', className)} {...rest} />;
}

export function TextArea({ className, invalid, ...rest }: TextareaHTMLAttributes<HTMLTextAreaElement> & { invalid?: boolean }) {
  return <textarea className={cn(BOX, 'min-h-14 resize-y px-2 py-1.5', invalid && 'border-danger', className)} {...rest} />;
}

export function SelectInput({ className, invalid, options, placeholder = 'Select…', ...rest }: SelectHTMLAttributes<HTMLSelectElement> & { invalid?: boolean; options: { value: string; label: string }[]; placeholder?: string }) {
  return (
    <div className="relative">
      <select className={cn(BOX, 'h-8 appearance-none pr-7 pl-2', invalid && 'border-danger', className)} {...rest}>
        <option value="">{placeholder}</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <Icon name="ti-chevron-down" className="pointer-events-none absolute top-1/2 right-2 -translate-y-1/2 text-[13px] text-ink-3" />
    </div>
  );
}

export function AffixInput({ prefix, suffix, invalid, className, ...rest }: InputHTMLAttributes<HTMLInputElement> & { prefix?: string; suffix?: string; invalid?: boolean }) {
  return (
    <div className={cn('hair flex h-8 items-center overflow-hidden rounded-md border-line-2 bg-bg focus-within:border-blue focus-within:ring-2 focus-within:ring-blue-tint', invalid && 'border-danger', className)}>
      {prefix && <span className="hair-r flex h-full items-center border-line bg-bg-2 px-2 text-sm text-ink-2">{prefix}</span>}
      <input className="h-full min-w-0 flex-1 bg-transparent px-2 text-sm text-ink outline-none placeholder:text-ink-3" {...rest} />
      {suffix && <span className="hair-l flex h-full items-center border-line bg-bg-2 px-2 text-xs text-ink-2">{suffix}</span>}
    </div>
  );
}

export function SearchInput({ value, onChange, placeholder = 'Search…', className }: { value: string; onChange: (v: string) => void; placeholder?: string; className?: string }) {
  return (
    <div className={cn('relative', className)}>
      <Icon name="ti-search" className="pointer-events-none absolute top-1/2 left-2 -translate-y-1/2 text-[13px] text-ink-3" />
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className={cn(BOX, 'h-8 pr-2 pl-7')} />
    </div>
  );
}

export function Checkbox({ checked, onChange, label, indeterminate }: { checked: boolean; onChange: (v: boolean) => void; label?: ReactNode; indeterminate?: boolean }) {
  return (
    <label className="inline-flex cursor-pointer items-center gap-1.5 text-sm text-ink select-none">
      <span
        role="checkbox"
        aria-checked={indeterminate ? 'mixed' : checked}
        tabIndex={0}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onChange(!checked);
        }}
        onKeyDown={(e) => {
          if (e.key === ' ' || e.key === 'Enter') {
            e.preventDefault();
            onChange(!checked);
          }
        }}
        className={cn('flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-[3px] border-[1.5px]', checked || indeterminate ? 'border-navy bg-navy text-white' : 'border-line-2 bg-bg')}
      >
        {checked && <Icon name="ti-check" className="text-[10px]" />}
        {!checked && indeterminate && <span className="h-[1.5px] w-2 bg-white" />}
      </span>
      {label}
    </label>
  );
}

export function Radio({ checked, onChange, label }: { checked: boolean; onChange: () => void; label: ReactNode }) {
  return (
    <label className="inline-flex cursor-pointer items-center gap-1.5 text-sm text-ink select-none" onClick={onChange}>
      <span className={cn('flex h-3 w-3 shrink-0 items-center justify-center rounded-full border-[1.5px]', checked ? 'border-navy' : 'border-line-2')}>
        {checked && <span className="h-1.5 w-1.5 rounded-full bg-navy" />}
      </span>
      {label}
    </label>
  );
}

/** Pill choice chips (navy when active) — for small enumerations. */
export function PillGroup({ options, value, onChange, max }: { options: string[]; value: string[]; onChange: (v: string[]) => void; max?: number }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((o) => {
        const on = value.includes(o);
        return (
          <button
            key={o}
            type="button"
            onClick={() => {
              if (on) onChange(value.filter((v) => v !== o));
              else if (!max || value.length < max) onChange([...value, o]);
              else if (max === 1) onChange([o]);
            }}
            className={cn('hair rounded-[20px] px-2.5 py-1 text-xs', on ? 'border-navy bg-navy text-white' : 'border-line-2 bg-bg text-ink-2 hover:bg-bg-2')}
          >
            {o}
          </button>
        );
      })}
    </div>
  );
}

export function MultiSelect({ options, value, onChange, placeholder = 'Select…', invalid }: { options: { value: string; label: string }[]; value: string[]; onChange: (v: string[]) => void; placeholder?: string; invalid?: boolean }) {
  const [q, setQ] = useState('');
  const labelOf = (v: string) => options.find((o) => o.value === v)?.label ?? v;
  return (
    <Pop
      align="start"
      width={300}
      trigger={
        <button type="button" className={cn(BOX, 'flex min-h-8 flex-wrap items-center gap-1 px-2 py-1 text-left', invalid && 'border-danger')}>
          {value.length ? (
            value.map((v) => (
              <span key={v} className="rounded-sm bg-blue-tint px-1.5 py-px text-xs text-blue-ink">
                {labelOf(v)}
              </span>
            ))
          ) : (
            <span className="text-ink-3">{placeholder}</span>
          )}
          <Icon name="ti-chevron-down" className="ml-auto text-[13px] text-ink-3" />
        </button>
      }
    >
      <div className="hair-b border-line p-2">
        <SearchInput value={q} onChange={setQ} placeholder="Filter options…" />
      </div>
      <div className="max-h-60 overflow-y-auto py-1">
        {options
          .filter((o) => o.label.toLowerCase().includes(q.toLowerCase()))
          .map((o) => (
            <div key={o.value} className="px-3 py-1 hover:bg-bg-2">
              <Checkbox checked={value.includes(o.value)} onChange={(c) => onChange(c ? [...value, o.value] : value.filter((v) => v !== o.value))} label={o.label} />
            </div>
          ))}
      </div>
    </Pop>
  );
}

/** Drag-and-drop style upload box with a fake progress bar. */
export function FileUpload({ value, onChange, accept = 'PDF, DWG, XLSX, JPG — max 25 MB' }: { value?: string; onChange: (name: string) => void; accept?: string }) {
  const [busy, setBusy] = useState(false);
  const pick = () => {
    const names = ['Drawing_GA_Rev3.pdf', 'Site_Report_Sep.pdf', 'BOQ_Revised.xlsx', 'Photo_Level5.jpg', 'Test_Report.pdf'];
    setBusy(true);
    setTimeout(() => {
      setBusy(false);
      onChange(names[Math.floor(Math.random() * names.length)]);
    }, 900);
  };
  return (
    <div className="hair flex items-center gap-3 rounded-md border-dashed border-line-2 bg-bg-2 px-3 py-2.5">
      <Icon name="ti-cloud-upload" className="text-[20px] text-blue" />
      <div className="min-w-0 flex-1">
        {busy ? (
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-bg-3">
            <div className="h-full bg-navy" style={{ animation: 'fake-progress 900ms linear' }} />
          </div>
        ) : value ? (
          <div className="flex items-center gap-1.5 text-sm text-ink">
            <Icon name="ti-file-check" className="text-[14px] text-ok" />
            {value}
          </div>
        ) : (
          <div className="text-xs text-ink-3">
            Drag & drop or choose a file · <span className="text-ink-3">{accept}</span>
          </div>
        )}
      </div>
      <button type="button" onClick={pick} className="hair h-7 rounded-md border-line-2 bg-bg px-2.5 text-xs text-ink hover:bg-bg-2">
        <Icon name="ti-upload" className="mr-1 text-[12px]" />
        Choose File
      </button>
    </div>
  );
}

function RefSelect({ field, value, onChange, invalid }: { field: FieldDef; value: unknown; onChange: (v: unknown) => void; invalid?: boolean }) {
  const rows = useRows(field.ref ?? '');
  const title = field.ref && hasEntity(field.ref) ? getEntity(field.ref).titleField : 'name';
  return (
    <SelectInput
      invalid={invalid}
      value={String(value ?? '')}
      onChange={(e) => onChange(e.target.value)}
      options={rows.map((r) => ({ value: r.id, label: `${String(r[title] ?? r.id)}` }))}
      placeholder={`Select ${field.label.toLowerCase()}…`}
    />
  );
}

/** Editable control for a FieldDef. */
export function FieldControl({ field, value, onChange, invalid }: { field: FieldDef; value: unknown; onChange: (v: unknown) => void; invalid?: boolean }) {
  const ph = field.placeholder;
  switch (field.type) {
    case 'textarea':
      return <TextArea invalid={invalid} value={String(value ?? '')} placeholder={ph} onChange={(e) => onChange(e.target.value)} />;
    case 'number':
    case 'rating':
      return <AffixInput invalid={invalid} type="number" suffix={field.unit} value={value === undefined || value === null ? '' : String(value)} placeholder={ph ?? '0'} onChange={(e) => onChange(e.target.value === '' ? '' : Number(e.target.value))} />;
    case 'percent':
      return <AffixInput invalid={invalid} type="number" suffix="%" value={value === undefined || value === null ? '' : String(value)} placeholder="0" onChange={(e) => onChange(e.target.value === '' ? '' : Number(e.target.value))} />;
    case 'currency':
      return <AffixInput invalid={invalid} type="number" prefix="₹" value={value === undefined || value === null ? '' : String(value)} placeholder="0.00" onChange={(e) => onChange(e.target.value === '' ? '' : Number(e.target.value))} />;
    case 'date':
      return <TextInput invalid={invalid} type="date" value={String(value ?? '')} onChange={(e) => onChange(e.target.value)} />;
    case 'select':
    case 'status':
      if ((field.options?.length ?? 0) <= 4 && field.type === 'select')
        return <PillGroup options={field.options ?? []} value={value ? [String(value)] : []} onChange={(v) => onChange(v[v.length - 1] ?? '')} max={1} />;
      return <SelectInput invalid={invalid} value={String(value ?? '')} onChange={(e) => onChange(e.target.value)} options={(field.options ?? []).map((o) => ({ value: o, label: o }))} />;
    case 'multiselect':
      return <MultiSelect invalid={invalid} options={(field.options ?? []).map((o) => ({ value: o, label: o }))} value={Array.isArray(value) ? (value as string[]) : []} onChange={onChange} />;
    case 'ref':
      return <RefSelect field={field} value={value} onChange={onChange} invalid={invalid} />;
    case 'boolean':
      return <Checkbox checked={!!value} onChange={onChange} label="Yes" />;
    case 'file':
      return <FileUpload value={value ? String(value) : undefined} onChange={onChange} />;
    case 'email':
      return <TextInput invalid={invalid} type="email" value={String(value ?? '')} placeholder={ph ?? 'name@company.in'} onChange={(e) => onChange(e.target.value)} />;
    case 'phone':
      return <TextInput invalid={invalid} type="tel" value={String(value ?? '')} placeholder={ph ?? '+91 98xxx xxxxx'} onChange={(e) => onChange(e.target.value)} />;
    default:
      return <TextInput invalid={invalid} value={String(value ?? '')} placeholder={ph} onChange={(e) => onChange(e.target.value)} />;
  }
}

/** Read-only display for a FieldDef value (tables, detail pages). */
export function FieldValue({ field, value, link = true }: { field: FieldDef; value: unknown; link?: boolean }) {
  if (value === undefined || value === null || value === '' || (Array.isArray(value) && !value.length)) return <span className="text-ink-3">—</span>;
  switch (field.type) {
    case 'status':
      return <StatusBadge value={value} />;
    case 'currency':
      return <span className="whitespace-nowrap tabular-nums">{formatINR(value)}</span>;
    case 'number':
      return (
        <span className="whitespace-nowrap tabular-nums">
          {formatNumber(value, Number.isInteger(Number(value)) ? 0 : 1)}
          {field.unit && <span className="ml-0.5 text-ink-3">{field.unit}</span>}
        </span>
      );
    case 'percent':
      return (
        <span className="flex min-w-[90px] items-center gap-2">
          <ProgressBar value={Number(value)} className="w-14" tone={Number(value) >= 100 ? 'ok' : 'blue'} />
          <span className="tabular-nums">{Number(value)}%</span>
        </span>
      );
    case 'rating':
      return (
        <span className="whitespace-nowrap text-blue" title={`${value} / 5`}>
          {Array.from({ length: 5 }, (_, i) => (
            <Icon key={i} name="ti-star" className={i < Number(value) ? 'text-[11px] text-blue' : 'text-[11px] text-line-2'} />
          ))}
        </span>
      );
    case 'date': {
      const d = daysFromToday(String(value));
      return <span className={cn('whitespace-nowrap', d < 0 && /due|deadline|expiry|valid/i.test(field.key) && 'text-bad')}>{formatDate(value)}</span>;
    }
    case 'multiselect':
      return (
        <span className="flex flex-wrap gap-1">
          {(value as string[]).map((v) => (
            <span key={v} className="rounded-sm bg-bg-3 px-1.5 py-px text-xs text-ink-2">
              {v}
            </span>
          ))}
        </span>
      );
    case 'ref': {
      const label = refLabel(field.ref, value);
      const base = field.ref ? registerPathFor(field.ref) : undefined;
      return link && base ? (
        <Link to={`${base}/${String(value)}`} className="text-blue hover:underline" onClick={(e) => e.stopPropagation()}>
          {label}
        </Link>
      ) : (
        <span>{label}</span>
      );
    }
    case 'boolean':
      return <span>{value ? 'Yes' : 'No'}</span>;
    case 'file':
      return (
        <span className="inline-flex items-center gap-1 text-blue">
          <Icon name="ti-paperclip" className="text-[12px]" />
          {String(value)}
        </span>
      );
    default:
      if (field.key === 'code') return <CodeChip>{String(value)}</CodeChip>;
      return <span>{String(value)}</span>;
  }
}

/** Plain-text version for search / export. */
export function fieldText(field: FieldDef, value: unknown): string {
  if (value === undefined || value === null) return '';
  if (field.type === 'ref') return refLabel(field.ref, value);
  if (Array.isArray(value)) return value.join(', ');
  return String(value);
}
