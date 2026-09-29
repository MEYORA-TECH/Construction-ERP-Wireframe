import { useEffect, useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { APPS, getApp, pathOf } from '@/config/registry';
import type { AppConfig } from '@/config/types';
import { cn } from '@/lib/cn';
import { Icon } from '@/components/ui';

export const LIFECYCLE: { title: string; apps: string[] }[] = [
  { title: 'Pre-Construction', apps: ['crm', 'tender', 'land', 'estimation'] },
  { title: 'Execution', apps: ['project', 'procurement', 'store', 'site', 'subcontract', 'equipment', 'workforce'] },
  { title: 'Commercial & Finance', apps: ['contracts', 'billing', 'finance', 'variations', 'claims'] },
  { title: 'Control & Close-out', apps: ['quality-and-safety', 'handover', 'reporting'] },
];

const item = (active: boolean) =>
  cn(
    'relative flex h-8 items-center gap-2 rounded-sm pr-2 text-sm',
    active ? 'bg-blue-tint font-medium text-navy before:absolute before:top-1 before:bottom-1 before:left-0 before:w-[3px] before:rounded-r before:bg-navy' : 'text-ink-2 hover:bg-bg-2 hover:text-ink',
  );

function AppNav({ app, collapsed, activeMenu, activeChild }: { app: AppConfig; collapsed: boolean; activeMenu?: string; activeChild?: string }) {
  const [open, setOpen] = useState<Record<string, boolean>>(() => (activeMenu ? { [activeMenu]: true } : {}));
  useEffect(() => {
    if (activeMenu) setOpen((o) => (o[activeMenu] ? o : { ...o, [activeMenu]: true }));
  }, [activeMenu]);

  if (collapsed) {
    return (
      <nav className="flex flex-col items-center gap-1 py-2">
        <Link to={`/${app.id}`} title={`${app.name} Dashboard`} className={cn('flex h-9 w-9 items-center justify-center rounded-md', !activeMenu ? 'bg-blue-tint text-navy' : 'text-ink-2 hover:bg-bg-2')}>
          <Icon name="ti-layout-dashboard" className="text-[17px]" />
        </Link>
        {app.menus.map((m) => (
          <Link
            key={m.id}
            to={pathOf(app.id, m.id, m.children?.[0]?.id)}
            title={m.label}
            className={cn('flex h-9 w-9 items-center justify-center rounded-md', activeMenu === m.id ? 'bg-blue-tint text-navy' : 'text-ink-2 hover:bg-bg-2')}
          >
            <Icon name={m.icon} className="text-[17px]" />
          </Link>
        ))}
      </nav>
    );
  }

  return (
    <nav className="flex flex-col gap-0.5 px-2 py-2" aria-label={`${app.name} navigation`}>
      {app.menus.map((m) => {
        if (!m.children) {
          return (
            <NavLink key={m.id} to={pathOf(app.id, m.id)} className={({ isActive }) => cn(item(isActive), 'pl-2.5')}>
              <Icon name={m.icon} className="w-4 text-[15px]" />
              <span className="truncate">{m.label}</span>
            </NavLink>
          );
        }
        const isOpen = !!open[m.id];
        const hasActive = activeMenu === m.id;
        return (
          <div key={m.id}>
            <button
              type="button"
              onClick={() => setOpen((o) => ({ ...o, [m.id]: !o[m.id] }))}
              aria-expanded={isOpen}
              className={cn('flex h-8 w-full items-center gap-2 rounded-sm pr-2 pl-2.5 text-left text-sm font-semibold hover:bg-bg-2', hasActive ? 'text-navy' : 'text-ink-2')}
            >
              <Icon name={m.icon} className="w-4 text-[15px]" />
              <span className="flex-1 truncate">{m.label}</span>
              <Icon name={isOpen ? 'ti-chevron-down' : 'ti-chevron-right'} className="text-[13px] text-ink-3" />
            </button>
            {isOpen && (
              <div className="mb-1 flex flex-col gap-px">
                {m.children.map((c) => (
                  <NavLink key={c.id} to={pathOf(app.id, m.id, c.id)} className={() => cn(item(activeMenu === m.id && activeChild === c.id), 'pl-9 text-sm')}>
                    <span className="truncate">{c.label}</span>
                  </NavLink>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </nav>
  );
}

function HomeNav({ collapsed }: { collapsed: boolean }) {
  if (collapsed) {
    return (
      <nav className="flex flex-col items-center gap-1 py-2">
        <Link to="/" title="Enterprise Dashboard" className="flex h-9 w-9 items-center justify-center rounded-md bg-blue-tint text-navy">
          <Icon name="ti-layout-dashboard" className="text-[17px]" />
        </Link>
        {APPS.map((a) => (
          <Link key={a.id} to={`/${a.id}`} title={a.name} className="flex h-9 w-9 items-center justify-center rounded-md text-ink-2 hover:bg-bg-2">
            <Icon name={a.icon} className="text-[17px]" />
          </Link>
        ))}
      </nav>
    );
  }
  return (
    <nav className="flex flex-col gap-0.5 px-2 py-2">
      <NavLink to="/" end className={({ isActive }) => cn(item(isActive), 'pl-2.5')}>
        <Icon name="ti-layout-dashboard" className="w-4 text-[15px]" />
        Enterprise Dashboard
      </NavLink>
      {LIFECYCLE.map((g) => (
        <div key={g.title} className="mt-2">
          <div className="px-2.5 pb-1 text-2xs font-semibold tracking-[0.05em] text-ink-3 uppercase">{g.title}</div>
          {g.apps.map((id) => {
            const a = getApp(id);
            if (!a) return null;
            return (
              <NavLink key={a.id} to={`/${a.id}`} className={({ isActive }) => cn(item(isActive), 'pl-2.5')}>
                <Icon name={a.icon} className="w-4 text-[15px]" />
                <span className="truncate">{a.name}</span>
              </NavLink>
            );
          })}
        </div>
      ))}
    </nav>
  );
}

export function Sidebar({ app, collapsed, activeMenu, activeChild }: { app?: AppConfig; collapsed: boolean; activeMenu?: string; activeChild?: string }) {
  return (
    <aside className={cn('hair-r flex shrink-0 flex-col border-line bg-bg transition-[width] duration-150', collapsed ? 'w-[56px]' : 'w-[248px]')}>
      {app ? (
        <Link
          to={`/${app.id}`}
          title={`${app.name} Dashboard`}
          className={cn('hair-b flex h-[52px] shrink-0 items-center gap-2.5 border-line hover:bg-bg-2', collapsed ? 'justify-center' : 'px-4', !activeMenu && 'bg-blue-tint/60')}
        >
          <Icon name={app.icon} className="text-[21px] text-navy" />
          {!collapsed && (
            <span className="min-w-0 leading-tight">
              <span className="block truncate text-base font-semibold text-ink">{app.name}</span>
              <span className="block text-2xs text-ink-3">Dashboard</span>
            </span>
          )}
        </Link>
      ) : (
        <div className={cn('hair-b flex h-[52px] shrink-0 items-center gap-2.5 border-line', collapsed ? 'justify-center' : 'px-4')}>
          <Icon name="ti-building-community" className="text-[21px] text-navy" />
          {!collapsed && <span className="text-base font-semibold text-ink">Enterprise</span>}
        </div>
      )}
      <div className="min-h-0 flex-1 overflow-y-auto">{app ? <AppNav key={app.id} app={app} collapsed={collapsed} activeMenu={activeMenu} activeChild={activeChild} /> : <HomeNav collapsed={collapsed} />}</div>
      {!collapsed && (
        <div className="hair-t flex items-center gap-2 border-line px-4 py-2 text-2xs text-ink-3">
          <Icon name="ti-shield-check" className="text-[13px]" />
          Wireframe v1.0 · Sample data
        </div>
      )}
    </aside>
  );
}
