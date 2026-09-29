import { useState } from 'react';
import { cn } from '@/lib/cn';
import { formatDate } from '@/lib/format';
import { toast } from '@/mock/toast';
import { toneOf, TONE_DOT } from '@/theme/status';
import { Radio } from './fields';
import { Avatar, Button, Icon, InfoBar, StatusBadge } from './ui';

/** The sample's Excel import panel: download templates, pick a target, choose a file. */
export function ImportPanel({ targets }: { targets: string[] }) {
  const [target, setTarget] = useState<string>('');
  const [file, setFile] = useState<string>('');
  return (
    <div className="flex flex-col gap-2.5">
      <InfoBar>Select a radio button before uploading the Excel file.</InfoBar>
      <div className="hair grid grid-cols-1 items-center gap-2.5 rounded-md border-line bg-bg-2 px-3.5 py-2.5 md:grid-cols-[1fr_1fr_auto]">
        <div>
          <div className="mb-1 text-xs font-semibold text-ink-2">Download template for</div>
          <div className="flex flex-wrap gap-3.5">
            {targets.map((t) => (
              <span key={t} className="text-sm">
                {t}{' '}
                <button type="button" className="text-blue underline" onClick={() => toast.info('Template downloaded', `${t}_Template.xlsx`)}>
                  <Icon name="ti-download" className="text-[12px]" /> click here
                </button>
              </span>
            ))}
          </div>
        </div>
        <div>
          <div className="mb-1 text-xs font-semibold text-ink-2">Upload Excel for</div>
          <div className="flex flex-wrap gap-4">
            {targets.map((t) => (
              <Radio key={t} checked={target === t} onChange={() => setTarget(t)} label={`Upload ${t}`} />
            ))}
          </div>
        </div>
        <button
          type="button"
          className="hair h-8 rounded-md border-line-2 bg-bg px-2.5 text-xs whitespace-nowrap text-ink hover:bg-bg-3"
          onClick={() => {
            if (!target) {
              toast.error('Select an upload type', 'Choose what the Excel file contains first.');
              return;
            }
            const name = `${target.replace(/\s+/g, '_')}_Sep2026.xlsx`;
            setFile(name);
            toast.success('File validated', `${name} · 24 rows ready to import`);
          }}
        >
          <Icon name="ti-upload" className="mr-1 text-[12px]" /> Choose File &nbsp; <span className="text-2xs text-ink-3">{file || 'No file chosen'}</span>
        </button>
      </div>
    </div>
  );
}

export interface TimelineItem {
  date: string;
  title: string;
  actor?: string;
  text?: string;
  status?: string;
  meta?: string;
}

export function Timeline({ items, dense }: { items: TimelineItem[]; dense?: boolean }) {
  return (
    <ol className="relative flex flex-col">
      {items.map((it, i) => (
        <li key={i} className="relative flex gap-3 pb-4 last:pb-0">
          {i < items.length - 1 && <span className="absolute top-4 bottom-0 left-[5px] w-px bg-line" />}
          <span className={cn('relative mt-1 h-[11px] w-[11px] shrink-0 rounded-full border-2 border-bg ring-1 ring-line-2', it.status ? TONE_DOT[toneOf(it.status)] : 'bg-blue')} />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-medium text-ink">{it.title}</span>
              {it.status && <StatusBadge value={it.status} />}
              <span className="ml-auto text-2xs whitespace-nowrap text-ink-3">{/^\d{4}-\d{2}-\d{2}/.test(it.date) ? formatDate(it.date.slice(0, 10)) : it.date}</span>
            </div>
            {(it.actor || it.meta) && (
              <div className="mt-0.5 flex items-center gap-1.5 text-xs text-ink-2">
                {it.actor && <Avatar name={it.actor} size={16} />}
                {it.actor}
                {it.meta && <span className="text-ink-3">· {it.meta}</span>}
              </div>
            )}
            {it.text && !dense && <p className="mt-1 text-xs text-ink-2">{it.text}</p>}
          </div>
        </li>
      ))}
    </ol>
  );
}

export type StageState = 'done' | 'current' | 'pending' | 'rejected';

export function ApprovalStepper({ stages, current, rejected }: { stages: { label: string; by?: string; date?: string }[]; current: number; rejected?: boolean }) {
  return (
    <div className="flex items-start">
      {stages.map((s, i) => {
        const state: StageState = i < current ? 'done' : i === current ? (rejected ? 'rejected' : 'current') : 'pending';
        return (
          <div key={s.label} className="flex min-w-0 flex-1 flex-col items-center text-center">
            <div className="flex w-full items-center">
              <div className={cn('h-px flex-1', i === 0 ? 'bg-transparent' : i <= current ? 'bg-navy' : 'bg-line-2')} />
              <span
                className={cn(
                  'flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-2xs font-bold',
                  state === 'done' && 'bg-navy text-white',
                  state === 'current' && 'border-2 border-navy bg-bg text-navy',
                  state === 'rejected' && 'bg-bad text-white',
                  state === 'pending' && 'hair border-line-2 bg-bg text-ink-3',
                )}
              >
                {state === 'done' ? <Icon name="ti-check" className="text-[12px]" /> : state === 'rejected' ? <Icon name="ti-x" className="text-[12px]" /> : i + 1}
              </span>
              <div className={cn('h-px flex-1', i === stages.length - 1 ? 'bg-transparent' : i < current ? 'bg-navy' : 'bg-line-2')} />
            </div>
            <div className={cn('mt-1.5 px-1 text-xs font-medium', state === 'pending' ? 'text-ink-3' : 'text-ink')}>{s.label}</div>
            {s.by && <div className="text-2xs text-ink-3">{s.by}</div>}
            {s.date && <div className="text-2xs text-ink-3">{s.date}</div>}
          </div>
        );
      })}
    </div>
  );
}

/** Numbered navy step header (the sample's "screen-num" badge). */
export function StepNum({ n, active, done }: { n: number; active?: boolean; done?: boolean }) {
  return (
    <span className={cn('flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full text-2xs font-bold', active || done ? 'bg-navy text-white' : 'bg-bg-3 text-ink-3')}>
      {done ? <Icon name="ti-check" className="text-[10px]" /> : n}
    </span>
  );
}

export function PhotoTile({ title, sub, date, seed = 0, onClick }: { title: string; sub?: string; date?: string; seed?: number; onClick?: () => void }) {
  const variants = ['ti-building-skyscraper', 'ti-crane', 'ti-building-factory-2', 'ti-bulldozer', 'ti-wall', 'ti-building'];
  return (
    <button type="button" onClick={onClick} className="hair group flex min-w-0 gap-2.5 rounded-md border-line bg-bg p-2 text-left hover:border-blue-line">
      <span className="relative flex h-16 w-20 shrink-0 items-center justify-center overflow-hidden rounded-sm bg-bg-3">
        <span className="absolute inset-0" style={{ background: `repeating-linear-gradient(135deg, #E3E7ED 0 6px, #EEF1F5 6px 12px)` }} />
        <Icon name={variants[seed % variants.length]} className="relative text-[26px] text-ink-3" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium text-ink">{title}</span>
        {sub && <span className="block truncate text-xs text-ink-2">{sub}</span>}
        {date && <span className="mt-1.5 block text-2xs text-ink-3">{date}</span>}
      </span>
    </button>
  );
}

export function ActionBar({ children }: { children: React.ReactNode }) {
  return <div className="hair-t sticky bottom-0 z-10 -mx-4 mt-2 flex items-center justify-end gap-2 border-line bg-bg px-4 py-2.5">{children}</div>;
}

export function SaveRow({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <div className="flex justify-center pt-2">
      <Button variant="primary" size="lg" icon="ti-device-floppy" onClick={onClick}>
        {label}
      </Button>
    </div>
  );
}
