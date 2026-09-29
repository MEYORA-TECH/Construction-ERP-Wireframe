import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getEntity, resolvePath } from '@/config/registry';
import { Button, PageTitle } from '@/components/ui';
import { findRow } from '@/mock/store';
import { useUi } from '@/mock/ui';
import { Breadcrumbs, crumbsFor, PageBody, Shell, SiblingTabs } from '@/shell/Layout';
import { ReportBuilder } from '@/templates/custom';
import { AppDashboard } from '@/templates/Dashboard';
import { viewEntity, ViewRenderer } from '@/templates/ViewRenderer';
import { NotFound } from './NotFound';

export function AppPage() {
  const { appId = '', '*': splat = '' } = useParams();
  const rest = splat.split('/').filter(Boolean);
  const r = resolvePath(appId, rest);
  const touch = useUi((s) => s.touchApp);
  const [builder, setBuilder] = useState(false);
  useEffect(() => {
    if (r?.app) touch(r.app.id);
  }, [r?.app, touch]);

  if (!r) return <NotFound />;

  const entityId = r.view ? viewEntity(r.view) : undefined;
  let recordLabel: string | undefined;
  if (r.recordId && entityId) {
    if (r.recordId === 'new') recordLabel = `New ${getEntity(entityId).label}`;
    else {
      const row = findRow(entityId, r.recordId);
      recordLabel = r.edit ? `Edit ${r.recordId}` : row ? `${r.recordId}` : r.recordId;
    }
  }
  const isRecord = !!(r.recordId && entityId);
  const title = r.child?.label ?? r.menu?.label ?? '';

  return (
    <Shell app={r.app} activeMenu={r.menu?.id} activeChild={r.child?.id}>
      <Breadcrumbs items={crumbsFor(r, recordLabel)} />
      {r.view && !isRecord && <SiblingTabs r={r} />}
      <PageBody>
        {!r.view ? (
          <AppDashboard app={r.app} />
        ) : (
          <>
            {!isRecord && (
              <PageTitle
                title={title}
                subtitle={`${r.app.name} › ${r.menu!.label}${r.child ? ` › ${r.child.label}` : ''}`}
                actions={
                  r.app.id === 'reporting' ? (
                    <Button variant="primary" icon="ti-plus" onClick={() => setBuilder(true)}>
                      Custom Report
                    </Button>
                  ) : undefined
                }
              />
            )}
            {isRecord && (r.recordId === 'new' || r.edit) && <PageTitle title={recordLabel ?? ''} subtitle={`${r.app.name} › ${r.menu!.label}${r.child ? ` › ${r.child.label}` : ''}`} icon={r.edit ? 'ti-edit' : 'ti-file-plus'} />}
            <ViewRenderer r={r} />
          </>
        )}
      </PageBody>
      <ReportBuilder open={builder} onOpenChange={setBuilder} />
    </Shell>
  );
}
