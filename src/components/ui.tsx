/**
 * Base UI kit — every visual primitive from the sample wireframe lives here,
 * so pages only compose components plus layout utilities.
 */
import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { initials } from '@/lib/format';
import { toneOf, TONE_CLASSES, TONE_DOT, type Tone } from '@/theme/status';

export function Icon({ name, className }: { name: string; className?: string }) {
  const n = name.startsWith('ti-') ? name : `ti-${name}`;
  return <i className={cn('ti', n, 'leading-none', className)} aria-hidden="true" />;
}

type BtnVariant = 'primary' | 'danger' | 'outline' | 'ghost' | 'link';
const BTN: Record<BtnVariant, string> = {
  primary: 'bg-navy text-white hover:bg-navy-hover border border-navy',
  danger: 'bg-transparent text-danger border border-danger hover:bg-bad-bg',
  outline: 'bg-bg text-ink border border-line-2 hover:bg-bg-2',
  ghost: 'bg-transparent text-ink-2 border border-transparent hover:bg-bg-2',
  link: 'bg-transparent text-blue border border-transparent hover:underline px-0',
};

export function Button({
  variant = 'outline',
  size = 'md',
  icon,
  iconRight,
  className,
  children,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: BtnVariant; size?: 'sm' | 'md' | 'lg'; icon?: string; iconRight?: string }) {
  return (
    <button
      type="button"
      className={cn(
        'inline-flex items-center justify-center gap-1.5 rounded-md whitespace-nowrap font-normal transition-colors disabled:opacity-50',
        size === 'sm' && 'h-7 px-2.5 text-xs',
        size === 'md' && 'h-8 px-3 text-sm',
        size === 'lg' && 'h-9 px-7 text-md',
        BTN[variant],
        className,
      )}
      {...rest}
    >
      {icon && <Icon name={icon} className="text-[14px]" />}
      {children}
      {iconRight && <Icon name={iconRight} className="text-[14px]" />}
    </button>
  );
}

export function IconButton({ icon, label, className, ...rest }: ButtonHTMLAttributes<HTMLButtonElement> & { icon: string; label: string }) {
  return (
    <button type="button" aria-label={label} title={label} className={cn('inline-flex h-7 w-7 items-center justify-center rounded-md text-blue hover:bg-blue-tint', className)} {...rest}>
      <Icon name={icon} className="text-[15px]" />
    </button>
  );
}

export function StatusBadge({ value, tone }: { value: unknown; tone?: Tone }) {
  if (value === undefined || value === null || value === '') return <span className="text-ink-3">—</span>;
  const t = tone ?? toneOf(value);
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-sm px-1.5 py-0.5 text-xs font-medium whitespace-nowrap', TONE_CLASSES[t])}>
      {t === 'blue' && <span className={cn('h-1.5 w-1.5 rounded-full', TONE_DOT[t])} />}
      {String(value)}
    </span>
  );
}

export function CodeChip({ children }: { children: ReactNode }) {
  return <span className="inline-block rounded-sm bg-blue-tint px-1.5 py-0.5 text-xs font-medium whitespace-nowrap text-blue-ink">{children}</span>;
}

export function SectionCard({
  title,
  icon,
  actions,
  children,
  className,
  plain,
  bodyClass,
}: {
  title?: ReactNode;
  icon?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  /** white background instead of the secondary tint */
  plain?: boolean;
  bodyClass?: string;
}) {
  return (
    <section className={cn('hair rounded-md border-line p-3.5', plain ? 'bg-bg' : 'bg-bg-2', className)}>
      {title && (
        <div className="mb-2.5 flex items-center gap-2 border-b border-blue-line pb-1.5">
          <h3 className="flex items-center gap-1.5 text-xs font-semibold tracking-[0.05em] text-navy uppercase">
            {icon && <Icon name={icon} className="text-[14px]" />}
            {title}
          </h3>
          <div className="ml-auto flex items-center gap-2">{actions}</div>
        </div>
      )}
      <div className={bodyClass}>{children}</div>
    </section>
  );
}

/** White operational panel (dashboards, tables). */
export function Panel({ title, actions, children, className, bodyClass }: { title?: ReactNode; actions?: ReactNode; children: ReactNode; className?: string; bodyClass?: string }) {
  return (
    <section className={cn('hair flex min-w-0 flex-col rounded-md border-line bg-bg', className)}>
      {title && (
        <div className="hair-b flex h-10 shrink-0 items-center gap-2 border-line px-3.5">
          <h3 className="text-md font-semibold text-ink">{title}</h3>
          <div className="ml-auto flex items-center gap-2 text-xs">{actions}</div>
        </div>
      )}
      <div className={cn('min-h-0 flex-1', bodyClass ?? 'p-3.5')}>{children}</div>
    </section>
  );
}

export function MetaStrip({ items, cols = 4 }: { items: { label: string; value: ReactNode }[]; cols?: number }) {
  return (
    <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${Math.min(cols, items.length || 1)}, minmax(0, 1fr))` }}>
      {items.map((it) => (
        <div key={it.label} className="hair min-w-0 rounded-md border-line bg-bg-2 px-2.5 py-2">
          <div className="mb-0.5 text-2xs text-ink-3">{it.label}</div>
          <div className="truncate text-sm font-medium text-ink">{it.value}</div>
        </div>
      ))}
    </div>
  );
}

export function InfoBar({ children, icon = 'ti-info-circle' }: { children: ReactNode; icon?: string }) {
  return (
    <div className="hair flex items-center gap-1.5 rounded-md border-blue-line bg-blue-tint px-3 py-1.5 text-sm text-blue-ink">
      <Icon name={icon} className="text-[14px]" />
      <span>{children}</span>
    </div>
  );
}

export function SegToggle<T extends string>({ options, value, onChange }: { options: { value: T; label: string; icon?: string }[]; value: T; onChange: (v: T) => void }) {
  return (
    <div className="hair inline-flex w-fit overflow-hidden rounded-md border-line-2" role="tablist">
      {options.map((o, i) => (
        <button
          key={o.value}
          type="button"
          role="tab"
          aria-selected={o.value === value}
          onClick={() => onChange(o.value)}
          className={cn(
            'flex h-7 items-center gap-1.5 px-3.5 text-sm',
            i < options.length - 1 && 'hair-r border-line-2',
            o.value === value ? 'bg-navy font-medium text-white' : 'bg-bg text-ink-2 hover:bg-bg-2',
          )}
        >
          {o.icon && <Icon name={o.icon} className="text-[13px]" />}
          {o.label}
        </button>
      ))}
    </div>
  );
}

/** Underline tabs (the sample's nav-tabs). */
export function Tabs<T extends string>({
  tabs,
  value,
  onChange,
  className,
}: {
  tabs: { value: T; label: string; count?: number; icon?: string }[];
  value: T;
  onChange: (v: T) => void;
  className?: string;
}) {
  return (
    <div className={cn('hair-b flex overflow-x-auto border-line', className)} role="tablist">
      {tabs.map((t) => (
        <button
          key={t.value}
          type="button"
          role="tab"
          aria-selected={t.value === value}
          onClick={() => onChange(t.value)}
          className={cn(
            '-mb-px flex shrink-0 items-center gap-1.5 border-b-2 px-3.5 py-2.5 text-sm whitespace-nowrap',
            t.value === value ? 'border-navy font-semibold text-navy' : 'border-transparent text-ink-2 hover:text-ink',
          )}
        >
          {t.icon && <Icon name={t.icon} className="text-[14px]" />}
          {t.label}
          {t.count !== undefined && (
            <span className={cn('rounded-sm px-1 text-2xs font-medium', t.value === value ? 'bg-navy text-white' : 'bg-bg-3 text-ink-2')}>{t.count}</span>
          )}
        </button>
      ))}
    </div>
  );
}

export function ProgressBar({ value, tone = 'navy', className }: { value: number; tone?: 'navy' | 'blue' | 'ok' | 'warn' | 'bad'; className?: string }) {
  const color = { navy: 'bg-navy', blue: 'bg-blue', ok: 'bg-ok', warn: 'bg-warn', bad: 'bg-bad' }[tone];
  return (
    <div className={cn('h-1.5 w-full overflow-hidden rounded-full bg-bg-3', className)}>
      <div className={cn('h-full rounded-full', color)} style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
    </div>
  );
}

export function KpiCard({
  label,
  value,
  delta,
  up = true,
  good,
  progress,
  icon,
  sub,
  onClick,
}: {
  label: string;
  value: ReactNode;
  delta?: string;
  up?: boolean;
  good?: boolean;
  progress?: number;
  icon?: string;
  sub?: string;
  onClick?: () => void;
}) {
  const isGood = good ?? up;
  return (
    <div
      onClick={onClick}
      className={cn('hair flex min-w-0 flex-col gap-1.5 rounded-md border-line bg-bg px-3 py-2.5', onClick && 'cursor-pointer hover:border-blue-line')}
    >
      <div className="flex items-center gap-1.5">
        <span className="truncate text-xs text-ink-2">{label}</span>
        {icon && <Icon name={icon} className="ml-auto text-[15px] text-blue" />}
      </div>
      <div className="flex flex-wrap items-baseline gap-x-2">
        <span className="text-[20px] leading-6 font-semibold whitespace-nowrap text-ink">{value}</span>
        {delta && (
          <span className={cn('ml-auto flex items-center text-xs font-medium whitespace-nowrap', isGood ? 'text-ok' : 'text-bad')}>
            <Icon name={up ? 'ti-arrow-up-right' : 'ti-arrow-down-right'} className="text-[12px]" />
            {delta}
          </span>
        )}
      </div>
      {progress !== undefined && <ProgressBar value={progress} className="h-1" />}
      {sub && <div className="truncate text-2xs text-ink-3">{sub}</div>}
    </div>
  );
}

export function EmptyState({ title = 'No records found', text, icon = 'ti-database-off', action }: { title?: string; text?: string; icon?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center gap-1.5 bg-bg-2 px-6 py-10 text-center">
      <Icon name={icon} className="text-[26px] text-ink-3" />
      <div className="text-sm font-medium text-ink-2">{title}</div>
      {text && <div className="text-xs text-ink-3 italic">{text}</div>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

export function Avatar({ name, size = 28, tone = 'tint' }: { name: string; size?: number; tone?: 'tint' | 'navy' | 'white' }) {
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-full font-semibold',
        tone === 'tint' && 'bg-blue-tint text-blue-ink',
        tone === 'navy' && 'bg-navy text-white',
        tone === 'white' && 'bg-white text-navy',
      )}
      style={{ width: size, height: size, fontSize: Math.max(9, size * 0.38) }}
    >
      {initials(name)}
    </span>
  );
}

export function PageTitle({ title, subtitle, actions, icon }: { title: string; subtitle?: string; actions?: ReactNode; icon?: string }) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="min-w-0">
        <h1 className="flex items-center gap-2 text-[17px] font-semibold text-ink">
          {icon && <Icon name={icon} className="text-[18px] text-navy" />}
          {title}
        </h1>
        {subtitle && <p className="mt-0.5 text-xs text-ink-3">{subtitle}</p>}
      </div>
      {actions && <div className="ml-auto flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function Spacer() {
  return <div className="flex-1" />;
}

export function Divider({ vertical }: { vertical?: boolean }) {
  return vertical ? <div className="hair-l mx-1 self-stretch border-line" /> : <div className="hair-t my-3 border-line" />;
}

export function Kv({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="min-w-0">
      <div className="field-label mb-0.5">{label}</div>
      <div className="text-sm break-words text-ink">{value}</div>
    </div>
  );
}
