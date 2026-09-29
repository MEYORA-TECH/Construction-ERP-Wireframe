import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getEntity, listFields, type Resolved } from '@/config/registry';
import type { EntityDef, Row, ViewSpec } from '@/config/types';
import { FieldValue } from '@/components/fields';
import { Button, CodeChip, InfoBar } from '@/components/ui';
import { cn } from '@/lib/cn';
import { useData, useRows } from '@/mock/store';
import { toast } from '@/mock/toast';
import { toneOf, TONE_DOT } from '@/theme/status';
import { formMode, RecordModal } from './RecordForm';

export function BoardBody({ entity, rows, field, columns, meta, onOpen }: { entity: EntityDef; rows: Row[]; field: string; columns?: string[]; meta?: string[]; onOpen: (row: Row) => void }) {
  const update = useData((s) => s.update);
  const [drag, setDrag] = useState<string | null>(null);
  const [over, setOver] = useState<string | null>(null);
  const fdef = entity.fields.find((f) => f.key === field);
  const cols = columns ?? fdef?.options ?? [...new Set(rows.map((r) => String(r[field])))];
  const metaFields = (meta ?? listFields(entity).map((f) => f.key))
    .map((k) => entity.fields.find((f) => f.key === k))
    .filter((f): f is NonNullable<typeof f> => !!f && f.key !== field && f.key !== entity.titleField)
    .slice(0, 3);

  return (
    <div className="flex gap-2.5 overflow-x-auto pb-2">
      {cols.map((c) => {
        const list = rows.filter((r) => String(r[field]) === c);
        return (
          <div
            key={c}
            onDragOver={(e) => { e.preventDefault(); setOver(c); }}
            onDragLeave={() => setOver((o) => (o === c ? null : o))}
            onDrop={() => {
              if (drag) {
                update(entity.id, drag, { [field]: c }, 'Moved on board');
                toast.success('Card moved', `${drag} → ${c}`);
              }
              setDrag(null);
              setOver(null);
            }}
            className={cn('hair flex w-[264px] shrink-0 flex-col rounded-md border-line bg-bg-2', over === c && 'border-blue bg-blue-tint/40')}
          >
            <div className="hair-b flex items-center gap-2 border-line px-3 py-2">
              <span className={cn('h-2 w-2 rounded-full', TONE_DOT[toneOf(c)])} />
              <span className="text-sm font-semibold text-ink">{c}</span>
              <span className="ml-auto rounded-sm bg-bg-3 px-1.5 text-2xs font-medium text-ink-2">{list.length}</span>
            </div>
            <div className="flex min-h-24 flex-col gap-2 p-2">
              {list.map((r) => (
                <div
                  key={r.id}
                  draggable
                  onDragStart={() => setDrag(r.id)}
                  onClick={() => onOpen(r)}
                  className={cn('hair cursor-grab rounded-md border-line bg-bg p-2.5 hover:border-blue-line active:cursor-grabbing', drag === r.id && 'opacity-50')}
                >
                  <div className="mb-1 flex items-center gap-2">
                    <CodeChip>{r.id}</CodeChip>
                  </div>
                  <div className="text-sm font-medium text-ink">{String(r[entity.titleField] ?? r.id)}</div>
                  <div className="mt-1.5 flex flex-col gap-0.5">
                    {metaFields.map((f) => (
                      <div key={f.key} className="flex items-center justify-between gap-2 text-xs text-ink-2">
                        <span className="text-ink-3">{f.label}</span>
                        <span className="truncate">
                          <FieldValue field={f} value={r[f.key]} link={false} />
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              {!list.length && <div className="py-4 text-center text-2xs text-ink-3 italic">Drop cards here</div>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function BoardView({ r, view }: { r: Resolved; view: Extract<ViewSpec, { type: 'board' }> }) {
  const entity = getEntity(view.entity);
  const rows = useRows(entity.id);
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <Button variant="primary" icon="ti-plus" onClick={() => (formMode(entity) === 'modal' ? setOpen(true) : navigate(`${r.base}/new`))}>
          Add {entity.label}
        </Button>
        <div className="flex-1" />
        <span className="text-xs text-ink-3">{rows.length} cards · drag a card to change its {entity.fields.find((f) => f.key === view.field)?.label.toLowerCase() ?? 'stage'}</span>
      </div>
      <InfoBar icon="ti-layout-kanban">Board view of {entity.plural.toLowerCase()} grouped by {entity.fields.find((f) => f.key === view.field)?.label ?? 'status'}. Click a card to open the record.</InfoBar>
      <BoardBody entity={entity} rows={rows} field={view.field} columns={view.columns} meta={view.meta} onOpen={(row) => navigate(`${r.base}/${row.id}`)} />
      <RecordModal entity={entity} open={open} onOpenChange={setOpen} />
    </div>
  );
}
