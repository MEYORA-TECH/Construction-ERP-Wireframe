import { Fragment, useState } from 'react';
import type { Resolved } from '@/config/registry';
import type { CompareRow, ViewSpec } from '@/config/types';
import { ConfirmDialog } from '@/components/overlays';
import { Button, Icon, InfoBar, StatusBadge } from '@/components/ui';
import { cn } from '@/lib/cn';
import { formatINR, formatNumber } from '@/lib/format';
import { toast } from '@/mock/toast';

function show(row: CompareRow, v: string | number) {
  if (typeof v === 'string') return row.format === 'status' ? <StatusBadge value={v} /> : v;
  if (row.format === 'currency') return formatINR(v);
  if (row.format === 'percent') return `${v}%`;
  return formatNumber(v, Number.isInteger(v) ? 0 : 1);
}

/** Side-by-side comparison matrix (vendors, versions, book vs statement …). */
export function ComparisonView({ view }: { r: Resolved; view: Extract<ViewSpec, { type: 'comparison' }> }) {
  const [pick, setPick] = useState<number | null>(null);
  const [awarded, setAwarded] = useState<number | null>(null);
  const rec = view.recommend;
  let lastGroup: string | undefined;
  return (
    <div className="flex flex-col gap-3">
      {view.note && <InfoBar icon="ti-arrows-diff">{view.note}</InfoBar>}
      <div className="flex items-center gap-2">
        <span className="text-xs text-ink-3">
          <Icon name="ti-star" className="text-[11px] text-blue" /> Best value in each row is highlighted
        </span>
        <div className="flex-1" />
        <Button icon="ti-download" onClick={() => toast.success('Comparison exported', `${view.title}.xlsx`)}>
          Export
        </Button>
      </div>
      <div className="hair overflow-x-auto rounded-md border-line bg-bg">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr>
              <th className="hair-b sticky left-0 min-w-[220px] border-blue-line bg-blue-tint px-3 py-2 text-left font-semibold text-blue-ink">{view.subjectLabel ?? 'Criteria'}</th>
              {view.subjects.map((s, i) => (
                <th key={s} className={cn('hair-b min-w-[150px] border-blue-line px-3 py-2 text-right font-semibold text-blue-ink', i === rec ? 'bg-blue-line' : 'bg-blue-tint')}>
                  <div className="flex items-center justify-end gap-1.5">
                    {s}
                    {i === rec && <span className="rounded-sm bg-navy px-1 text-2xs font-medium text-white">Recommended</span>}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {view.rows.map((row) => {
              const nums = row.values.map((v) => (typeof v === 'number' ? v : NaN));
              const valid = nums.filter((n) => !Number.isNaN(n));
              const best = row.best && valid.length ? (row.best === 'min' ? Math.min(...valid) : Math.max(...valid)) : undefined;
              const header = row.group && row.group !== lastGroup;
              lastGroup = row.group ?? lastGroup;
              return (
                <Fragment key={row.label}>
                  {header && (
                    <tr>
                      <td colSpan={view.subjects.length + 1} className="hair-b border-line bg-bg-2 px-3 py-1.5 text-xs font-semibold tracking-wide text-navy uppercase">
                        {row.group}
                      </td>
                    </tr>
                  )}
                  <tr className="hover:bg-bg-2">
                    <td className="hair-b sticky left-0 border-line bg-bg px-3 py-2 text-ink-2">{row.label}</td>
                    {row.values.map((v, i) => (
                      <td key={i} className={cn('hair-b border-line px-3 py-2 text-right tabular-nums', i === rec && 'bg-blue-tint/40', best !== undefined && v === best && 'font-semibold text-navy')}>
                        {best !== undefined && v === best && <Icon name="ti-star" className="mr-1 text-[10px] text-blue" />}
                        {show(row, v)}
                      </td>
                    ))}
                  </tr>
                </Fragment>
              );
            })}
            <tr>
              <td className="sticky left-0 bg-bg px-3 py-2.5 text-xs font-semibold text-ink-2 uppercase">Decision</td>
              {view.subjects.map((s, i) => (
                <td key={s} className="px-3 py-2.5 text-right">
                  {awarded === i ? (
                    <StatusBadge value="Selected" tone="green" />
                  ) : (
                    <Button size="sm" variant={i === rec ? 'primary' : 'outline'} onClick={() => setPick(i)} disabled={awarded !== null}>
                      Select
                    </Button>
                  )}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
      <ConfirmDialog
        open={pick !== null}
        onOpenChange={(v) => !v && setPick(null)}
        title="Confirm selection"
        text={`Select “${pick !== null ? view.subjects[pick] : ''}” and route the comparison statement for approval?`}
        confirmLabel="Select & submit"
        onConfirm={() => {
          setAwarded(pick);
          toast.success('Selection submitted', `${view.subjects[pick!]} — comparison statement sent for approval.`);
        }}
      />
    </div>
  );
}
