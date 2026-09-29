import { Fragment } from 'react';
import type { Resolved } from '@/config/registry';
import type { ViewSpec } from '@/config/types';
import { InfoBar } from '@/components/ui';
import { cn } from '@/lib/cn';
import { formatNumber } from '@/lib/format';
import { useUi, COMPANIES } from '@/mock/ui';
import { FilterBar } from './AnalysisView';

/** Formatted financial statement (P&L, Balance Sheet, Cash Flow). Values in ₹ lakhs. */
export function StatementView({ view }: { r: Resolved; view: Extract<ViewSpec, { type: 'statement' }> }) {
  const company = useUi((s) => s.company);
  const org = COMPANIES.find((c) => c.id === company) ?? COMPANIES[0];
  const fmt = (v: number) => (v < 0 ? `(${formatNumber(Math.abs(v), 2)})` : formatNumber(v, 2));
  const variance = (vals: number[]) => (vals.length >= 2 && vals[1] ? `${(((vals[0] - vals[1]) / Math.abs(vals[1])) * 100).toFixed(1)}%` : '—');
  return (
    <div className="flex flex-col gap-3.5">
      <FilterBar />
      <InfoBar icon="ti-report-money">All figures in ₹ lakhs. Negative values are shown in brackets.</InfoBar>
      <div className="hair overflow-x-auto rounded-md border-line bg-bg">
        <div className="hair-b border-line px-5 py-4 text-center">
          <div className="text-base font-semibold text-ink">{org.name}</div>
          <div className="text-md font-semibold text-navy uppercase">{view.title}</div>
          <div className="text-xs text-ink-3">For the period ending 30 September 2026 · Consolidated (all projects)</div>
        </div>
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr>
              <th className="hair-b border-blue-line bg-blue-tint px-4 py-2 text-left font-semibold text-blue-ink">Particulars</th>
              {view.periods.map((p) => (
                <th key={p} className="hair-b border-blue-line bg-blue-tint px-4 py-2 text-right font-semibold whitespace-nowrap text-blue-ink">
                  {p}
                </th>
              ))}
              {view.periods.length >= 2 && <th className="hair-b border-blue-line bg-blue-tint px-4 py-2 text-right font-semibold text-blue-ink">Variance</th>}
            </tr>
          </thead>
          <tbody>
            {view.sections.map((s) => (
              <Fragment key={s.title}>
                <tr>
                  <td colSpan={view.periods.length + 2} className="hair-b border-line bg-bg-2 px-4 py-1.5 text-xs font-semibold tracking-wide text-navy uppercase">
                    {s.title}
                  </td>
                </tr>
                {s.lines.map((l) => (
                  <tr key={l.label} className="hover:bg-bg-2">
                    <td className={cn('hair-b border-line px-4 py-1.5', l.bold ? 'font-semibold text-ink' : 'text-ink-2')} style={{ paddingLeft: 16 + (l.indent ?? 1) * 14 }}>
                      {l.label}
                    </td>
                    {l.values.map((v, i) => (
                      <td key={i} className={cn('hair-b border-line px-4 py-1.5 text-right tabular-nums', l.bold ? 'font-semibold' : '')}>
                        {fmt(v)}
                      </td>
                    ))}
                    {view.periods.length >= 2 && <td className="hair-b border-line px-4 py-1.5 text-right text-xs text-ink-3 tabular-nums">{variance(l.values)}</td>}
                  </tr>
                ))}
                {s.total && (
                  <tr className="bg-bg-2">
                    <td className="hair-b border-line px-4 py-2 font-semibold text-ink">{s.total.label}</td>
                    {s.total.values.map((v, i) => (
                      <td key={i} className="hair-b border-line px-4 py-2 text-right font-semibold tabular-nums">
                        {fmt(v)}
                      </td>
                    ))}
                    {view.periods.length >= 2 && <td className="hair-b border-line px-4 py-2 text-right text-xs text-ink-3">{variance(s.total.values)}</td>}
                  </tr>
                )}
              </Fragment>
            ))}
          </tbody>
          {view.net && (
            <tfoot>
              <tr className="bg-blue-tint">
                <td className="px-4 py-2.5 text-md font-semibold text-navy">{view.net.label}</td>
                {view.net.values.map((v, i) => (
                  <td key={i} className="px-4 py-2.5 text-right text-md font-semibold text-navy tabular-nums">
                    {fmt(v)}
                  </td>
                ))}
                {view.periods.length >= 2 && <td className="px-4 py-2.5 text-right text-xs text-navy">{variance(view.net.values)}</td>}
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
}
