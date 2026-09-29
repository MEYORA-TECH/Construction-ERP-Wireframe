import { Fragment, useState, type ReactElement } from 'react';
import type { Resolved } from '@/config/registry';
import type { TreeNode, ViewSpec } from '@/config/types';
import { Button, CodeChip, Icon, StatusBadge } from '@/components/ui';
import { cn } from '@/lib/cn';
import { formatINR, formatNumber } from '@/lib/format';
import { toast } from '@/mock/toast';

type Col = Extract<ViewSpec, { type: 'tree' }>['columns'][number];

function cell(c: Col, v: string | number | undefined) {
  if (v === undefined || v === '') return <span className="text-ink-3">—</span>;
  if (c.type === 'currency') return formatINR(v);
  if (c.type === 'number') return formatNumber(v);
  if (c.type === 'percent') return `${v}%`;
  if (c.type === 'status') return <StatusBadge value={v} />;
  return String(v);
}

function pathKey(p: number[]) {
  return p.join('.');
}

export function TreeView({ view }: { r: Resolved; view: Extract<ViewSpec, { type: 'tree' }> }) {
  const [open, setOpen] = useState<Record<string, boolean>>(() => {
    const o: Record<string, boolean> = {};
    view.nodes.forEach((_, i) => (o[String(i)] = true));
    return o;
  });
  const setAll = (v: boolean) => {
    const o: Record<string, boolean> = {};
    const walk = (nodes: TreeNode[], p: number[]) => nodes.forEach((n, i) => { const k = [...p, i]; o[pathKey(k)] = v; if (n.children) walk(n.children, k); });
    walk(view.nodes, []);
    setOpen(o);
  };
  const render = (nodes: TreeNode[], depth: number, path: number[]): ReactElement[] =>
    nodes.map((n, i) => {
      const p = [...path, i];
      const k = pathKey(p);
      const has = !!n.children?.length;
      const isOpen = !!open[k];
      return (
        <Fragment key={k}>
          <tr className={cn('hover:bg-bg-2', depth === 0 && 'bg-bg-2')}>
            <td className="hair-b border-line px-2.5 py-1.5" style={{ paddingLeft: 10 + depth * 20 }}>
              <span className="flex items-center gap-1.5">
                {has ? (
                  <button type="button" onClick={() => setOpen((o) => ({ ...o, [k]: !o[k] }))} aria-label={isOpen ? 'Collapse' : 'Expand'} className="flex h-4 w-4 items-center justify-center">
                    <Icon name={isOpen ? 'ti-chevron-down' : 'ti-chevron-right'} className="text-[12px] text-ink-3" />
                  </button>
                ) : (
                  <span className="w-4" />
                )}
                <Icon name={has ? (isOpen ? 'ti-folder-open' : 'ti-folder') : 'ti-point'} className={cn('text-[14px]', has ? 'text-blue' : 'text-ink-3')} />
                {n.code && <CodeChip>{n.code}</CodeChip>}
                <span className={cn('text-sm', depth === 0 ? 'font-semibold text-ink' : 'text-ink')}>{n.label}</span>
              </span>
            </td>
            {view.columns.map((c) => (
              <td key={c.key} className={cn('hair-b border-line px-2.5 py-1.5 text-sm tabular-nums', c.type === 'currency' || c.type === 'number' || c.type === 'percent' ? 'text-right' : '', depth === 0 && 'font-semibold')}>
                {cell(c, n.values?.[c.key])}
              </td>
            ))}
          </tr>
          {has && isOpen && render(n.children!, depth + 1, p)}
        </Fragment>
      );
    });

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="primary" icon="ti-plus" onClick={() => toast.success('Node added', 'New child node created under the selected item')}>
          Add Node
        </Button>
        <Button icon="ti-arrows-maximize" onClick={() => setAll(true)}>
          Expand All
        </Button>
        <Button icon="ti-arrows-minimize" onClick={() => setAll(false)}>
          Collapse All
        </Button>
        <div className="flex-1" />
        <Button icon="ti-file-import" onClick={() => toast.success('Structure imported', 'Excel template validated')}>
          Import
        </Button>
        <Button icon="ti-download" onClick={() => toast.success('Exported', `${view.title}.xlsx`)}>
          Export
        </Button>
      </div>
      <div className="hair overflow-x-auto rounded-md border-line bg-bg">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="hair-b min-w-[360px] border-blue-line bg-blue-tint px-2.5 py-2 text-left text-sm font-semibold text-blue-ink">{view.title}</th>
              {view.columns.map((c) => (
                <th key={c.key} className={cn('hair-b border-blue-line bg-blue-tint px-2.5 py-2 text-sm font-semibold whitespace-nowrap text-blue-ink', c.type === 'currency' || c.type === 'number' || c.type === 'percent' ? 'text-right' : 'text-left')}>
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>{render(view.nodes, 0, [])}</tbody>
        </table>
      </div>
    </div>
  );
}
