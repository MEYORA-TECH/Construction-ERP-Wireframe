import { useNavigate } from 'react-router-dom';
import { Button, EmptyState } from '@/components/ui';
import { Breadcrumbs, PageBody, Shell } from '@/shell/Layout';

export function NotFound() {
  const navigate = useNavigate();
  return (
    <Shell>
      <Breadcrumbs items={[{ label: 'Page not found' }]} />
      <PageBody>
        <div className="hair rounded-md border-line bg-bg">
          <EmptyState icon="ti-map-off" title="This page does not exist" text="The link may be outdated. Use the 9-dot switcher to open an application." action={<Button variant="primary" onClick={() => navigate('/')}>Go to Enterprise Dashboard</Button>} />
        </div>
      </PageBody>
    </Shell>
  );
}
