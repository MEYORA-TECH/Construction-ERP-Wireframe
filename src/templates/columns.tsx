import type { Column } from '@/components/DataTable';
import { fieldText, FieldValue } from '@/components/fields';
import type { MenuItem } from '@/components/overlays';
import { CodeChip } from '@/components/ui';
import { listFields, statusFieldOf } from '@/config/registry';
import type { EntityDef, Row } from '@/config/types';
import { useData } from '@/mock/store';
import { toast } from '@/mock/toast';

export function entityColumns(entity: EntityDef, highlight?: string): Column<Row>[] {
  const fields = listFields(entity);
  const hf = highlight && highlight !== 'code' ? entity.fields.find((f) => f.key === highlight) : undefined;
  const shown = hf && !fields.includes(hf) ? [fields[0], hf, ...fields.slice(1, 7)].filter(Boolean) : fields;
  const cols: Column<Row>[] = [
    {
      key: 'code',
      label: entity.fields.find((f) => f.key === 'code')?.label ?? `${entity.label} No.`,
      render: (r) => <CodeChip>{r.id}</CodeChip>,
      value: (r) => r.id,
      highlight: highlight === 'code',
    },
  ];
  for (const f of shown) {
    cols.push({
      key: f.key,
      label: f.label,
      required: f.required,
      highlight: f.key === highlight,
      align: f.type === 'currency' || f.type === 'number' ? 'right' : 'left',
      render: (r) => <FieldValue field={f} value={r[f.key]} />,
      value: (r) => {
        const v = r[f.key];
        return typeof v === 'number' ? v : fieldText(f, v);
      },
      filterOptions: f.type === 'select' || f.type === 'status' ? f.options : undefined,
    });
  }
  return cols;
}

export function useRowMenu(entity: EntityDef) {
  const update = useData((s) => s.update);
  const create = useData((s) => s.create);
  const st = statusFieldOf(entity);
  return (row: Row): MenuItem[] => [
    ...(st?.options ?? [])
      .filter((o) => o !== row[st!.key])
      .slice(0, 6)
      .map((o) => ({
        label: `Mark as ${o}`,
        icon: 'ti-circle-dot',
        onSelect: () => {
          update(entity.id, row.id, { [st!.key]: o }, 'Status changed');
          toast.success('Status updated', `${row.id} → ${o}`);
        },
      })),
    ...(st?.options?.length ? [{ separator: true, label: '' }] : []),
    {
      label: 'Duplicate',
      icon: 'ti-copy',
      onSelect: () => {
        const { id: _id, code: _code, ...rest } = row;
        const copy = create(entity.id, rest);
        toast.success(`${entity.label} duplicated`, `${copy.id} created from ${row.id}`);
      },
    },
    { label: 'Print', icon: 'ti-printer', onSelect: () => toast.info('Sent to printer', `${entity.label} ${row.id}`) },
  ];
}
