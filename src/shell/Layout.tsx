import { Fragment, type ReactNode } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { pathOf, type Resolved } from '@/config/registry';
import type { AppConfig } from '@/config/types';
import { cn } from '@/lib/cn';
import { Toasts } from '@/components/overlays';
import { Icon } from '@/components/ui';
import { useUi } from '@/mock/ui';
import { Header } from './Header';
import { Sidebar } from './Sidebar';

export interface Crumb {
  label: string;
  to?: string;
}

/** Breadcrumb strip (sample style): secondary band, current item in blue. */
export function Breadcrumbs({ items }: { items: Crumb[] }) {
  return (
    <div className="hair-b flex h-8 shrink-0 items-center gap-1.5 border-line bg-bg-2 px-4 text-xs text-ink-3">
      <Link to="/" className="flex items-center hover:text-blue" aria-label="Home">
        <Icon name="ti-home" className="text-[12px]" />
      </Link>
      {items.map((c, i) => (
        <Fragment key={i}>
          <span>›</span>
          {c.to && i < items.length - 1 ? (
            <Link to={c.to} className="hover:text-blue hover:underline">
              {c.label}
            </Link>
          ) : (
            <span className={cn(i === items.length - 1 ? 'text-blue' : '')}>{c.label}</span>
          )}
        </Fragment>
      ))}
    </div>
  );
}

/** Sibling child menus as underline tabs (the sample's nav-tabs). */
export function SiblingTabs({ r }: { r: Resolved }) {
  if (!r.menu?.children || r.menu.children.length < 2) return null;
  return (
    <div className="hair-b flex shrink-0 overflow-x-auto border-line bg-bg px-4" role="tablist">
      {r.menu.children.map((c) => (
        <NavLink
          key={c.id}
          to={pathOf(r.app.id, r.menu!.id, c.id)}
          className={() =>
            cn(
              '-mb-px shrink-0 border-b-2 px-3.5 py-2.5 text-sm whitespace-nowrap',
              r.child?.id === c.id ? 'border-navy font-semibold text-navy' : 'border-transparent text-ink-2 hover:text-ink',
            )
          }
        >
          {c.label}
        </NavLink>
      ))}
    </div>
  );
}

export function crumbsFor(r: Resolved, recordLabel?: string): Crumb[] {
  const out: Crumb[] = [{ label: r.app.name, to: `/${r.app.id}` }];
  if (r.menu) out.push({ label: r.menu.label, to: pathOf(r.app.id, r.menu.id, r.menu.children?.[0]?.id) });
  if (r.child) out.push({ label: r.child.label, to: r.base });
  if (!r.menu) out.push({ label: 'Dashboard' });
  if (recordLabel) out.push({ label: recordLabel });
  return out;
}

export function Shell({ app, activeMenu, activeChild, children }: { app?: AppConfig; activeMenu?: string; activeChild?: string; children: ReactNode }) {
  const { sidebarCollapsed, toggleSidebar } = useUi();
  return (
    <div className="flex h-full flex-col">
      <Header activeApp={app?.id} onToggleSidebar={toggleSidebar} />
      <div className="flex min-h-0 flex-1">
        <Sidebar app={app} collapsed={sidebarCollapsed} activeMenu={activeMenu} activeChild={activeChild} />
        <main className="flex min-w-0 flex-1 flex-col overflow-hidden">{children}</main>
      </div>
      <Toasts />
    </div>
  );
}

/** Scrolling page body with the standard padding. */
export function PageBody({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className="min-h-0 flex-1 overflow-y-auto">
      <div className={cn('mx-auto flex max-w-[1680px] flex-col gap-3.5 p-4', className)}>{children}</div>
    </div>
  );
}
