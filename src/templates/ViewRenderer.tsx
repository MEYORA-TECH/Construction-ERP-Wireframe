import type { ComponentType } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getEntity, hasEntity, type Resolved } from '@/config/registry';
import type { ViewSpec } from '@/config/types';
import { InfoBar } from '@/components/ui';
import { useRows } from '@/mock/store';
import { AnalysisView } from './AnalysisView';
import { ApprovalView } from './ApprovalView';
import { BoardView } from './BoardView';
import { CalendarView } from './CalendarView';
import { ChecklistView } from './ChecklistView';
import { ComparisonView } from './ComparisonView';
import { CUSTOM_VIEWS } from './custom';
import { DocumentsView } from './DocumentsView';
import { GanttView } from './GanttView';
import { LineItemsView } from './LineItemsView';
import { RecordDetail } from './RecordDetail';
import { RecordPageForm } from './RecordForm';
import { RegisterView } from './RegisterView';
import { GalleryView, MapView, PrintView, SettingsView, TimelineView } from './SimpleViews';
import { StatementView } from './StatementView';
import { TreeView } from './TreeView';
import { WizardView } from './WizardView';

/** Entity behind a view — record routes (/new, /:id, /:id/edit) resolve against it. */
export function viewEntity(view: ViewSpec): string | undefined {
  if ('entity' in view && typeof view.entity === 'string' && hasEntity(view.entity)) return view.entity;
  if (view.type === 'calendar' && view.mode === 'grid') return undefined;
  return undefined;
}

function FormRoute({ entityId, recordId, prefill, onDone, onCancel }: { entityId: string; recordId?: string; prefill?: Record<string, unknown>; onDone: (id: string) => void; onCancel: () => void }) {
  const entity = getEntity(entityId);
  const rows = useRows(entityId);
  const initial = recordId ? rows.find((x) => x.id === recordId) : undefined;
  if (recordId && !initial) return <InfoBar icon="ti-alert-circle">{entity.label} {recordId} was not found.</InfoBar>;
  return <RecordPageForm entity={entity} initial={initial} prefill={prefill} onDone={(row) => onDone(row.id)} onCancel={onCancel} />;
}

export function ViewRenderer({ r }: { r: Resolved }) {
  const view = r.view!;
  const navigate = useNavigate();
  const location = useLocation();
  const entityId = viewEntity(view);

  if (r.recordId && entityId) {
    if (r.recordId === 'new' || r.edit) {
      const prefill = (location.state as { prefill?: Record<string, unknown> } | null)?.prefill;
      return (
        <FormRoute
          key={`${r.recordId}-${r.edit}`}
          entityId={entityId}
          recordId={r.edit ? r.recordId : undefined}
          prefill={prefill}
          onDone={(id) => navigate(`${r.base}/${id}`)}
          onCancel={() => navigate(r.edit ? `${r.base}/${r.recordId}` : r.base)}
        />
      );
    }
    return <RecordDetail key={r.recordId} r={r} entityId={entityId} />;
  }

  switch (view.type) {
    case 'register':
    case 'status':
    case 'field':
      return <RegisterView key={r.base} r={r} view={view} />;
    case 'board':
      return <BoardView r={r} view={view} />;
    case 'lineitems':
      return <LineItemsView r={r} view={view} />;
    case 'approval':
      return <ApprovalView r={r} view={view} />;
    case 'wizard':
      return <WizardView key={r.base} r={r} view={view} />;
    case 'documents':
      return <DocumentsView key={r.base} r={r} view={view} />;
    case 'checklist':
      return <ChecklistView key={r.base} r={r} view={view} />;
    case 'comparison':
      return <ComparisonView key={r.base} r={r} view={view} />;
    case 'tree':
      return <TreeView key={r.base} r={r} view={view} />;
    case 'gantt':
      return <GanttView key={r.base} r={r} view={view} />;
    case 'calendar':
      return <CalendarView key={r.base} r={r} view={view} />;
    case 'timeline':
      return <TimelineView key={r.base} r={r} view={view} />;
    case 'analysis':
      return <AnalysisView key={r.base} r={r} view={view} />;
    case 'statement':
      return <StatementView key={r.base} r={r} view={view} />;
    case 'gallery':
      return <GalleryView key={r.base} r={r} view={view} />;
    case 'print':
      return <PrintView key={r.base} r={r} view={view} />;
    case 'map':
      return <MapView key={r.base} r={r} view={view} />;
    case 'settings':
      return <SettingsView key={r.base} r={r} view={view} />;
    case 'custom': {
      const C = CUSTOM_VIEWS[view.component] as ComponentType<{ r: Resolved; props?: Record<string, unknown> }> | undefined;
      return C ? <C r={r} props={view.props} /> : <InfoBar>Custom view “{view.component}” is not registered.</InfoBar>;
    }
    default:
      return <InfoBar>Unsupported view.</InfoBar>;
  }
}
