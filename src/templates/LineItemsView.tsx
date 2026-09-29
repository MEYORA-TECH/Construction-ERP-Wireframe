import { Fragment, useMemo, useState } from 'react';
import { getEntity, type Resolved } from '@/config/registry';
import type { Row, ViewSpec } from '@/config/types';
import { Checkbox, FieldValue, SelectInput } from '@/components/fields';
import { Menu } from '@/components/overlays';
import { Button, CodeChip, IconButton, InfoBar, KpiCard } from '@/components/ui';
import { ImportPanel } from '@/components/widgets';
import { cn } from '@/lib/cn';
import { formatINR, formatINRCompact, formatNumber } from '@/lib/format';
import { useData, useRows } from '@/mock/store';
import { toast } from '@/mock/toast';

/**
 * Spreadsheet-like line-item grid (BOQ, measurements, rate build-up, payroll lines …).
 * Entity convention: `description`, `unit`, `qty`, `rate`, optional `section`; amount = qty × rate.
 */
export function LineItemsView({ view }: { r: Resolved; view: Extract<ViewSpec, { type: 'lineitems' }> }) {
  const entity = getEntity(view.entity);
  const rows = useRows(entity.id);
  const { update, create, remove } = useData();
  const [selected, setSelected] = useState<string[]>([]);
  const [version, setVersion] = useState('R2');
  const [showImport, setShowImport] = useState(false);
  const descKey = entity.fields.some((f) => f.key === 'description') ? 'description' : entity.titleField;
  const hasSection = entity.fields.some((f) => f.key === 'section');
  const extra = (view.extra ?? []).map((k) => entity.fields.find((f) => f.key === k)).filter((f): f is NonNullable<typeof f> => !!f);
  const qtyLabel = entity.fields.find((f) => f.key === 'qty')?.label ?? 'Quantity';
  const rateLabel = entity.fields.find((f) => f.key === 'rate')?.label ?? 'Rate';

  const groups = useMemo(() => {
    const m = new Map<string, Row[]>();
    for (const r of rows) {
      const k = hasSection ? String(r.section ?? 'General') : 'Items';
      (m.get(k) ?? m.set(k, []).get(k)!).push(r);
    }
    return [...m.entries()];
  }, [rows, hasSection]);

  const amount = (r: Row) => (Number(r.qty) || 0) * (Number(r.rate) || 0);
  const total = rows.reduce((a, r) => a + amount(r), 0);
  const taxPct = view.tax ?? 18;
  const gst = total * (taxPct / 100);

  const cellInput = (r: Row, key: 'qty' | 'rate') => (
    <input
      type="number"
      value={String(r[key] ?? '')}
      onChange={(e) => update(entity.id, r.id, { [key]: e.target.value === '' ? '' : Number(e.target.value) }, 'Line edited')}
      className="hair h-7 w-full min-w-[80px] rounded-sm border-transparent bg-transparent px-1.5 text-right text-sm tabular-nums outline-none hover:border-line-2 focus:border-blue focus:bg-bg"
    />
  );

  let sr = 0;
  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
        <KpiCard label="Line items" value={formatNumber(rows.length)} icon="ti-list-numbers" sub={`${groups.length} section${groups.length === 1 ? '' : 's'}`} />
        <KpiCard label="Sub-total" value={formatINRCompact(total)} icon="ti-sum" />
        {taxPct > 0 ? <KpiCard label={`GST @ ${taxPct}%`} value={formatINRCompact(gst)} icon="ti-receipt-tax" /> : <KpiCard label="Average per line" value={formatINRCompact(total / Math.max(1, rows.length))} icon="ti-divide" />}
        <KpiCard label={taxPct > 0 ? 'Grand total' : 'Total'} value={formatINRCompact(total + gst)} icon="ti-currency-rupee" sub={`Version ${version}`} />
      </div>
      <InfoBar icon="ti-table">Quantities and rates are editable inline — amounts and totals recalculate instantly (display only).</InfoBar>
      {showImport && <ImportPanel targets={[entity.plural]} />}
      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant="primary"
          icon="ti-plus"
          onClick={() => {
            create(entity.id, { [descKey]: 'New line item', unit: 'Nos', qty: 1, rate: 0, section: groups[groups.length - 1]?.[0] });
            toast.success('Line added');
          }}
        >
          Add Line
        </Button>
        <Button variant="danger" icon="ti-trash" disabled={!selected.length} onClick={() => { remove(entity.id, selected); setSelected([]); toast.success(`${selected.length} line(s) deleted`); }}>
          Delete Selected
        </Button>
        <div className="flex-1" />
        <span className="text-xs text-ink-3">Version</span>
        <div className="w-24">
          <SelectInput value={version} onChange={(e) => setVersion(e.target.value || 'R2')} options={['R0', 'R1', 'R2'].map((v) => ({ value: v, label: v }))} placeholder="R2" />
        </div>
        <Button icon="ti-file-import" onClick={() => setShowImport((s) => !s)}>
          Import
        </Button>
        <Button icon="ti-copy" onClick={() => { setVersion('R3'); toast.success('New version created', 'R3 copied from R2'); }}>
          Replicate
        </Button>
        <Menu trigger={<Button icon="ti-download" iconRight="ti-chevron-down">Export</Button>} items={['Excel (.xlsx)', 'PDF'].map((x) => ({ label: x, onSelect: () => toast.success('Export started', `${entity.plural} · ${x}`) }))} />
      </div>
      <div className="hair overflow-x-auto rounded-md border-line bg-bg">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="text-left text-blue-ink">
              <th className="hair-b w-8 border-blue-line bg-blue-tint px-2.5 py-2">
                <Checkbox checked={!!rows.length && selected.length === rows.length} onChange={(c) => setSelected(c ? rows.map((r) => r.id) : [])} />
              </th>
              <th className="hair-b w-12 border-blue-line bg-blue-tint px-2.5 py-2 font-semibold whitespace-nowrap">Sr No</th>
              <th className="hair-b border-blue-line bg-blue-tint px-2.5 py-2 font-semibold whitespace-nowrap">Item No.*</th>
              <th className="hair-b min-w-[280px] border-blue-line bg-blue-tint px-2.5 py-2 font-semibold">Description*</th>
              {extra.map((f) => (
                <th key={f.key} className="hair-b border-blue-line bg-blue-tint px-2.5 py-2 font-semibold">
                  {f.label}
                </th>
              ))}
              <th className="hair-b border-blue-line bg-blue-tint px-2.5 py-2 font-semibold">Unit*</th>
              <th className="hair-b border-blue-line bg-blue-tint px-2.5 py-2 text-right font-semibold">{qtyLabel}*</th>
              <th className="hair-b border-blue-line bg-blue-tint px-2.5 py-2 text-right font-semibold">{rateLabel} (₹)*</th>
              <th className="hair-b border-blue-line bg-blue-tint px-2.5 py-2 text-right font-semibold">Amount (₹)</th>
              <th className="hair-b w-10 border-blue-line bg-blue-tint px-2.5 py-2" />
            </tr>
          </thead>
          <tbody>
            {groups.map(([g, list]) => {
              const sub = list.reduce((a, r) => a + amount(r), 0);
              return (
                <Fragment key={g}>
                  {hasSection && (
                    <tr>
                      <td colSpan={8 + extra.length} className="hair-b border-line bg-bg-2 px-2.5 py-1.5 text-xs font-semibold tracking-wide text-navy uppercase">
                        {g}
                      </td>
                      <td className="hair-b border-line bg-bg-2" />
                    </tr>
                  )}
                  {list.map((r) => {
                    sr += 1;
                    const sel = selected.includes(r.id);
                    return (
                      <tr key={r.id} className={cn(sel ? 'bg-blue-tint/50' : 'hover:bg-bg-2')}>
                        <td className="hair-b border-line px-2.5 py-1">
                          <Checkbox checked={sel} onChange={(c) => setSelected((s) => (c ? [...s, r.id] : s.filter((x) => x !== r.id)))} />
                        </td>
                        <td className="hair-b border-line px-2.5 py-1 text-ink-2 tabular-nums">{sr}</td>
                        <td className="hair-b border-line px-2.5 py-1">
                          <CodeChip>{r.id}</CodeChip>
                        </td>
                        <td className="hair-b border-line px-2.5 py-1 text-ink">
                          <input
                            value={String(r[descKey] ?? '')}
                            onChange={(e) => update(entity.id, r.id, { [descKey]: e.target.value }, 'Line edited')}
                            className="hair h-7 w-full rounded-sm border-transparent bg-transparent px-1.5 text-sm outline-none hover:border-line-2 focus:border-blue focus:bg-bg"
                          />
                        </td>
                        {extra.map((f) => (
                          <td key={f.key} className="hair-b border-line px-2.5 py-1 whitespace-nowrap">
                            <FieldValue field={f} value={r[f.key]} />
                          </td>
                        ))}
                        <td className="hair-b border-line px-2.5 py-1 text-ink-2">{String(r.unit ?? '')}</td>
                        <td className="hair-b border-line px-1 py-1">{cellInput(r, 'qty')}</td>
                        <td className="hair-b border-line px-1 py-1">{cellInput(r, 'rate')}</td>
                        <td className="hair-b border-line px-2.5 py-1 text-right font-medium text-ink tabular-nums">{formatINR(amount(r))}</td>
                        <td className="hair-b border-line px-1 py-1">
                          <IconButton icon="ti-trash" label="Delete line" onClick={() => remove(entity.id, [r.id])} />
                        </td>
                      </tr>
                    );
                  })}
                  {hasSection && (
                    <tr>
                      <td colSpan={7 + extra.length} className="hair-b border-line px-2.5 py-1.5 text-right text-xs font-semibold text-ink-2">
                        Sub-total — {g}
                      </td>
                      <td className="hair-b border-line px-2.5 py-1.5 text-right text-sm font-semibold text-ink tabular-nums">{formatINR(sub)}</td>
                      <td className="hair-b border-line" />
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
          <tfoot>
            {(taxPct > 0
              ? [
                  ['Total (excl. GST)', total],
                  [`GST @ ${taxPct}%`, gst],
                  ['Grand Total', total + gst],
                ]
              : [['Total', total]]
            ).map(([l, v], i, arr) => (
              <tr key={String(l)} className={i === arr.length - 1 ? 'bg-blue-tint' : 'bg-bg-2'}>
                <td colSpan={7 + extra.length} className={cn('px-2.5 py-2 text-right text-sm', i === arr.length - 1 ? 'font-semibold text-navy' : 'text-ink-2')}>
                  {l}
                </td>
                <td className={cn('px-2.5 py-2 text-right tabular-nums', i === arr.length - 1 ? 'text-base font-semibold text-navy' : 'font-medium text-ink')}>{formatINR(v)}</td>
                <td />
              </tr>
            ))}
          </tfoot>
        </table>
      </div>
    </div>
  );
}
