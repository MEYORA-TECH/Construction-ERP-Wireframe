import { useMemo, useState, type ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { toast } from '@/mock/toast';
import { Checkbox, SearchInput, SelectInput } from './fields';
import { ConfirmDialog, Menu, Pop, type MenuItem } from './overlays';
import { Button, EmptyState, Icon, IconButton } from './ui';

export interface Column<T> {
  key: string;
  label: string;
  render?: (row: T) => ReactNode;
  /** value used for search, sort and filter */
  value?: (row: T) => string | number;
  align?: 'left' | 'right' | 'center';
  required?: boolean;
  /** highlighted column (Field-focus view) */
  highlight?: boolean;
  /** offered in the Filter popover */
  filterOptions?: string[];
  hidden?: boolean;
  width?: number | string;
}

export interface DataTableProps<T> {
  rows: T[];
  columns: Column<T>[];
  getId: (row: T) => string;
  onRowClick?: (row: T) => void;
  onView?: (row: T) => void;
  onEdit?: (row: T) => void;
  onDelete?: (ids: string[]) => void;
  rowMenu?: (row: T) => MenuItem[];
  /** primary "Add …" action */
  addLabel?: string;
  onAdd?: () => void;
  toolbarExtra?: ReactNode;
  exportName?: string;
  pageSize?: number;
  selectable?: boolean;
  compact?: boolean;
  /** hide the toolbar entirely (e.g. dashboard snippets) */
  bare?: boolean;
  emptyText?: string;
  initialSort?: { key: string; dir: 'asc' | 'desc' };
  srNo?: boolean;
}

export function DataTable<T>({
  rows,
  columns,
  getId,
  onRowClick,
  onView,
  onEdit,
  onDelete,
  rowMenu,
  addLabel,
  onAdd,
  toolbarExtra,
  exportName = 'Register',
  pageSize: initialPageSize = 10,
  selectable = true,
  bare,
  emptyText,
  initialSort,
  srNo = true,
}: DataTableProps<T>) {
  const [q, setQ] = useState('');
  const [sort, setSort] = useState<{ key: string; dir: 'asc' | 'desc' } | undefined>(initialSort);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(initialPageSize);
  const [selected, setSelected] = useState<string[]>([]);
  const [hidden, setHidden] = useState<string[]>(() => columns.filter((c) => c.hidden).map((c) => c.key));
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [confirm, setConfirm] = useState<string[] | null>(null);

  const valueOf = (c: Column<T>, r: T): string | number => {
    if (c.value) return c.value(r);
    const v = (r as Record<string, unknown>)[c.key];
    return typeof v === 'number' ? v : Array.isArray(v) ? v.join(', ') : String(v ?? '');
  };

  const visibleCols = columns.filter((c) => !hidden.includes(c.key));

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    let out = rows.filter((r) => {
      for (const [k, v] of Object.entries(filters)) {
        if (!v) continue;
        const col = columns.find((c) => c.key === k);
        if (col && String(valueOf(col, r)) !== v) return false;
      }
      if (!needle) return true;
      return [getId(r), ...columns.map((c) => valueOf(c, r))].some((v) => String(v).toLowerCase().includes(needle));
    });
    if (sort) {
      const col = columns.find((c) => c.key === sort.key);
      if (col) {
        out = [...out].sort((a, b) => {
          const va = valueOf(col, a);
          const vb = valueOf(col, b);
          const cmp = typeof va === 'number' && typeof vb === 'number' ? va - vb : String(va).localeCompare(String(vb), 'en-IN', { numeric: true });
          return sort.dir === 'asc' ? cmp : -cmp;
        });
      }
    }
    return out;
  }, [rows, q, sort, filters, columns]);

  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const cur = Math.min(page, pages - 1);
  const pageRows = filtered.slice(cur * pageSize, cur * pageSize + pageSize);
  const allOnPage = pageRows.length > 0 && pageRows.every((r) => selected.includes(getId(r)));
  const filterCols = columns.filter((c) => c.filterOptions?.length);
  const activeFilters = Object.values(filters).filter(Boolean).length;
  const hasActions = !!(onView || onEdit || onDelete || rowMenu);

  const toggleSort = (key: string) =>
    setSort((s) => (s?.key === key ? (s.dir === 'asc' ? { key, dir: 'desc' } : undefined) : { key, dir: 'asc' }));

  return (
    <div className="flex min-w-0 flex-col gap-2.5">
      {!bare && (
        <div className="flex flex-wrap items-center gap-2">
          {onAdd && (
            <Button variant="primary" icon="ti-plus" onClick={onAdd}>
              {addLabel ?? 'Add'}
            </Button>
          )}
          {onDelete && selectable && (
            <Button variant="danger" icon="ti-trash" disabled={!selected.length} onClick={() => setConfirm(selected)}>
              Delete Selected{selected.length ? ` (${selected.length})` : ''}
            </Button>
          )}
          {toolbarExtra}
          <div className="flex-1" />
          <SearchInput value={q} onChange={(v) => { setQ(v); setPage(0); }} placeholder="Search in register…" className="w-56" />
          {filterCols.length > 0 && (
            <Pop
              width={260}
              trigger={
                <Button icon="ti-filter">
                  Filter{activeFilters ? ` (${activeFilters})` : ''}
                </Button>
              }
            >
              <div className="flex flex-col gap-2.5 p-3">
                {filterCols.map((c) => (
                  <div key={c.key} className="flex flex-col gap-1">
                    <span className="field-label">{c.label}</span>
                    <SelectInput
                      value={filters[c.key] ?? ''}
                      onChange={(e) => { setFilters((f) => ({ ...f, [c.key]: e.target.value })); setPage(0); }}
                      options={(c.filterOptions ?? []).map((o) => ({ value: o, label: o }))}
                      placeholder="All"
                    />
                  </div>
                ))}
                <Button variant="link" className="self-start text-xs" onClick={() => setFilters({})}>
                  Clear filters
                </Button>
              </div>
            </Pop>
          )}
          <Menu
            label="Visible columns"
            trigger={<Button icon="ti-columns-3">Columns</Button>}
            items={columns.map((c) => ({
              label: c.label,
              checked: !hidden.includes(c.key),
              onSelect: () => setHidden((h) => (h.includes(c.key) ? h.filter((k) => k !== c.key) : [...h, c.key])),
            }))}
          />
          <Menu
            trigger={<Button icon="ti-download" iconRight="ti-chevron-down">Export</Button>}
            items={['Excel (.xlsx)', 'PDF', 'CSV'].map((fmt) => ({
              label: fmt,
              icon: fmt.startsWith('Excel') ? 'ti-file-spreadsheet' : fmt === 'PDF' ? 'ti-file-type-pdf' : 'ti-file-text',
              onSelect: () => toast.success('Export started', `${exportName} · ${filtered.length} rows · ${fmt}`),
            }))}
          />
          <Button onClick={() => { setPageSize((s) => (s >= 1000 ? initialPageSize : 1000)); setPage(0); }}>{pageSize >= 1000 ? 'Paginate' : 'Show All'}</Button>
        </div>
      )}

      <div className="hair overflow-x-auto rounded-md border-line bg-bg">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr>
              {selectable && !bare && (
                <th className="hair-b w-8 border-blue-line bg-blue-tint px-2.5 py-2 text-left">
                  <Checkbox
                    checked={allOnPage}
                    indeterminate={!allOnPage && pageRows.some((r) => selected.includes(getId(r)))}
                    onChange={(c) => setSelected((s) => (c ? [...new Set([...s, ...pageRows.map(getId)])] : s.filter((id) => !pageRows.some((r) => getId(r) === id))))}
                  />
                </th>
              )}
              {srNo && <th className="hair-b w-12 border-blue-line bg-blue-tint px-2.5 py-2 text-left font-semibold whitespace-nowrap text-blue-ink">Sr No</th>}
              {visibleCols.map((c) => (
                <th
                  key={c.key}
                  onClick={() => toggleSort(c.key)}
                  style={{ width: c.width }}
                  className={cn(
                    'hair-b cursor-pointer border-blue-line px-2.5 py-2 font-semibold whitespace-nowrap text-blue-ink select-none',
                    c.highlight ? 'bg-blue-line' : 'bg-blue-tint',
                    c.align === 'right' ? 'text-right' : c.align === 'center' ? 'text-center' : 'text-left',
                  )}
                >
                  <span className="inline-flex items-center gap-1">
                    {c.label}
                    {c.required && <span>*</span>}
                    <Icon
                      name={sort?.key === c.key ? (sort.dir === 'asc' ? 'ti-arrow-up' : 'ti-arrow-down') : 'ti-arrows-sort'}
                      className={cn('text-[11px]', sort?.key === c.key ? 'text-navy' : 'text-blue-line')}
                    />
                  </span>
                </th>
              ))}
              {hasActions && <th className="hair-b w-24 border-blue-line bg-blue-tint px-2.5 py-2 text-left font-semibold text-blue-ink">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {pageRows.map((r, i) => {
              const id = getId(r);
              const sel = selected.includes(id);
              return (
                <tr
                  key={id}
                  onClick={() => onRowClick?.(r)}
                  className={cn('group', onRowClick && 'cursor-pointer', sel ? 'bg-blue-tint/50' : 'hover:bg-bg-2')}
                >
                  {selectable && !bare && (
                    <td className="hair-b border-line px-2.5 py-2" onClick={(e) => e.stopPropagation()}>
                      <Checkbox checked={sel} onChange={(c) => setSelected((s) => (c ? [...s, id] : s.filter((x) => x !== id)))} />
                    </td>
                  )}
                  {srNo && <td className="hair-b border-line px-2.5 py-2 text-ink-2 tabular-nums">{cur * pageSize + i + 1}</td>}
                  {visibleCols.map((c) => (
                    <td
                      key={c.key}
                      className={cn(
                        'hair-b max-w-[220px] border-line px-2.5 py-2 text-ink',
                        c.highlight && 'bg-blue-tint/60 font-medium',
                        c.align === 'right' ? 'text-right' : c.align === 'center' ? 'text-center' : 'text-left',
                      )}
                    >
                      <div className="truncate">{c.render ? c.render(r) : String((r as Record<string, unknown>)[c.key] ?? '—')}</div>
                    </td>
                  ))}
                  {hasActions && (
                    <td className="hair-b border-line px-1.5 py-1" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center">
                        {onView && <IconButton icon="ti-eye" label="View" onClick={() => onView(r)} />}
                        {onEdit && <IconButton icon="ti-edit" label="Edit" onClick={() => onEdit(r)} />}
                        {onDelete && <IconButton icon="ti-trash" label="Delete" onClick={() => setConfirm([id])} />}
                        {rowMenu && (
                          <Menu trigger={<IconButton icon="ti-dots-vertical" label="More actions" />} items={rowMenu(r)} />
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
        {!pageRows.length && <EmptyState title="No records to display" text={emptyText ?? (q || activeFilters ? 'Try changing the search or filters.' : 'Use “Add” to create the first record.')} />}
      </div>

      {!bare && filtered.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 text-xs text-ink-2">
          <span>
            Showing {cur * pageSize + 1}–{Math.min(filtered.length, cur * pageSize + pageSize)} of {filtered.length}
            {filtered.length !== rows.length && ` (filtered from ${rows.length})`}
          </span>
          <div className="flex-1" />
          <span>Rows per page</span>
          <div className="w-[72px]">
            <SelectInput value={String(pageSize >= 1000 ? 10 : pageSize)} onChange={(e) => { setPageSize(Number(e.target.value) || 10); setPage(0); }} options={[10, 25, 50].map((n) => ({ value: String(n), label: String(n) }))} placeholder="10" />
          </div>
          <div className="flex items-center gap-1">
            <IconButton icon="ti-chevrons-left" label="First page" disabled={cur === 0} onClick={() => setPage(0)} className="disabled:opacity-30" />
            <IconButton icon="ti-chevron-left" label="Previous page" disabled={cur === 0} onClick={() => setPage(cur - 1)} className="disabled:opacity-30" />
            <span className="px-1.5 tabular-nums">
              Page {cur + 1} of {pages}
            </span>
            <IconButton icon="ti-chevron-right" label="Next page" disabled={cur >= pages - 1} onClick={() => setPage(cur + 1)} className="disabled:opacity-30" />
            <IconButton icon="ti-chevrons-right" label="Last page" disabled={cur >= pages - 1} onClick={() => setPage(pages - 1)} className="disabled:opacity-30" />
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!confirm}
        onOpenChange={(v) => !v && setConfirm(null)}
        title="Delete records"
        text={`Archive ${confirm?.length ?? 0} selected record(s)? They will be removed from the register for this demo session.`}
        confirmLabel="Delete"
        danger
        onConfirm={() => {
          if (confirm && onDelete) onDelete(confirm);
          setSelected([]);
        }}
      />
    </div>
  );
}
