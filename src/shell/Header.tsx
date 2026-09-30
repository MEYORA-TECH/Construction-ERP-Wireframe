import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/cn';
import { Drawer, Menu } from '@/components/overlays';
import { Avatar, Button, Icon, StatusBadge, Tabs } from '@/components/ui';
import { useData } from '@/mock/store';
import { toast } from '@/mock/toast';
import { COMPANIES, ROLES, useUi } from '@/mock/ui';
import { AppSwitcher } from './AppSwitcher';
import { SearchTrigger } from './SearchPalette';

const NOTIFICATIONS = [
  { kind: 'approvals', icon: 'ti-file-invoice', title: 'RA Bill RA-07 awaiting your approval', sub: 'Skyline Apartments · ₹ 2.84 Cr', time: '12 min ago', path: '/billing/bill-certification', status: 'Pending Approval' },
  { kind: 'approvals', icon: 'ti-shopping-cart', title: 'PO-014 submitted for approval', sub: 'Shree Balaji Steel Traders · ₹ 48.6 L', time: '40 min ago', path: '/procurement/purchase-order/po', status: 'Pending Approval' },
  { kind: 'alerts', icon: 'ti-alert-triangle', title: 'Greenfield Township schedule slipped 18 days', sub: 'Planning & Control · Delays', time: '1 hour ago', path: '/project/planning-and-control/delays', status: 'Delayed' },
  { kind: 'alerts', icon: 'ti-package', title: '3 materials below reorder level', sub: 'TMT Bar 8mm, M-Sand, RMC M25', time: '2 hours ago', path: '/store/inventory/stock', status: 'Low Stock' },
  { kind: 'approvals', icon: 'ti-arrows-exchange', title: 'Variation VO-005 needs client approval', sub: 'Metro Office Tower · Design change', time: '3 hours ago', path: '/variations/approval', status: 'Under Review' },
  { kind: 'alerts', icon: 'ti-first-aid-kit', title: 'Near-miss reported at Lakeview Residency', sub: 'Quality & Safety · Incident', time: '5 hours ago', path: '/quality-and-safety/safety/incident', status: 'Open' },
  { kind: 'alerts', icon: 'ti-certificate', title: 'Performance guarantee expires in 21 days', sub: 'CON-003 · Greenfield Township', time: 'Yesterday', path: '/contracts/commercial-terms/performance-guarantee', status: 'Expiring Soon' },
  { kind: 'approvals', icon: 'ti-calendar-off', title: 'Leave request from Vignesh B', sub: '3 days · Casual leave', time: 'Yesterday', path: '/workforce/attendance/leave', status: 'Pending' },
];

function Notifications() {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<'all' | 'approvals' | 'alerts'>('all');
  const [read, setRead] = useState(false);
  const navigate = useNavigate();
  const list = NOTIFICATIONS.filter((n) => tab === 'all' || n.kind === tab);
  return (
    <>
      <button type="button" aria-label="Notifications" title="Notifications" onClick={() => setOpen(true)} className="relative flex h-8 w-8 items-center justify-center rounded-md text-white hover:bg-white/10">
        <Icon name="ti-bell" className="text-[19px]" />
        {!read && <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-danger ring-2 ring-navy" />}
      </button>
      <Drawer open={open} onOpenChange={setOpen} title="Notifications" icon="ti-bell" width={420}>
        <div className="flex items-center px-4 pt-1">
          <Tabs
            className="flex-1"
            value={tab}
            onChange={setTab}
            tabs={[
              { value: 'all', label: 'All', count: NOTIFICATIONS.length },
              { value: 'approvals', label: 'Approvals', count: NOTIFICATIONS.filter((n) => n.kind === 'approvals').length },
              { value: 'alerts', label: 'Alerts', count: NOTIFICATIONS.filter((n) => n.kind === 'alerts').length },
            ]}
          />
        </div>
        <div className="flex items-center justify-between px-4 py-2 text-xs">
          <span className="text-ink-3">{read ? 'All caught up' : `${NOTIFICATIONS.length} unread`}</span>
          <Button variant="link" className="h-auto text-xs" onClick={() => setRead(true)}>
            Mark all as read
          </Button>
        </div>
        <ul>
          {list.map((n) => (
            <li key={n.title}>
              <button
                type="button"
                onClick={() => { setOpen(false); navigate(n.path); }}
                className="hair-b flex w-full gap-3 border-line px-4 py-3 text-left hover:bg-bg-2"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-blue-tint">
                  <Icon name={n.icon} className="text-[15px] text-blue" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className={cn('block text-sm text-ink', !read && 'font-semibold')}>{n.title}</span>
                  <span className="block truncate text-xs text-ink-2">{n.sub}</span>
                  <span className="mt-1 flex items-center gap-2">
                    <StatusBadge value={n.status} />
                    <span className="text-2xs text-ink-3">{n.time}</span>
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      </Drawer>
    </>
  );
}

function Help() {
  const [open, setOpen] = useState(false);
  const reset = useData((s) => s.reset);
  const shortcuts = [
    ['Ctrl + K', 'Global search'],
    ['↑ ↓ ↵', 'Navigate search results'],
    ['Esc', 'Close dialog / drawer'],
  ];
  const guides = ['Getting started with Construction ERP', 'Setting up a new project (WBS, budget, schedule)', 'Raising a purchase request to PO', 'Preparing and certifying an RA bill', 'Recording a DPR from site', 'Building a custom report'];
  return (
    <>
      <button type="button" aria-label="Help" title="Help" onClick={() => setOpen(true)} className="flex h-8 w-8 items-center justify-center rounded-md text-white hover:bg-white/10">
        <Icon name="ti-help-circle" className="text-[19px]" />
      </button>
      <Drawer open={open} onOpenChange={setOpen} title="Help & Support" icon="ti-help-circle">
        <div className="flex flex-col gap-4 p-4">
          <section>
            <h4 className="mb-2 text-xs font-semibold tracking-[0.05em] text-navy uppercase">Keyboard shortcuts</h4>
            <div className="hair divide-y divide-line rounded-md border-line">
              {shortcuts.map(([k, v]) => (
                <div key={k} className="flex items-center justify-between px-3 py-2 text-sm">
                  <span className="text-ink-2">{v}</span>
                  <kbd className="hair rounded-sm border-line-2 bg-bg-2 px-1.5 text-2xs text-ink-2">{k}</kbd>
                </div>
              ))}
            </div>
          </section>
          <section>
            <h4 className="mb-2 text-xs font-semibold tracking-[0.05em] text-navy uppercase">Guides</h4>
            <ul className="flex flex-col gap-1.5">
              {guides.map((g) => (
                <li key={g}>
                  <button type="button" className="flex items-center gap-2 text-sm text-blue hover:underline" onClick={() => toast.info('Guide opened', g)}>
                    <Icon name="ti-book" className="text-[13px]" />
                    {g}
                  </button>
                </li>
              ))}
            </ul>
          </section>
          <section className="hair rounded-md border-blue-line bg-blue-tint p-3 text-xs text-blue-ink">
            <div className="mb-1 font-semibold">About this demo</div>
            This wireframe is the property of <strong className="font-semibold">Meyora</strong>, prepared for client presentation only. All data is sample data held in your browser session. Nothing is sent to a server.
            <div className="mt-2.5">
              <Button size="sm" icon="ti-refresh" onClick={() => { reset(); toast.success('Demo data reset', 'All registers restored to the original sample data.'); }}>
                Reset demo data
              </Button>
            </div>
          </section>
        </div>
      </Drawer>
    </>
  );
}

function Profile() {
  const { role, setRole } = useUi();
  const reset = useData((s) => s.reset);
  return (
    <Menu
      label="Signed in as Arun S"
      trigger={
        <button type="button" className="flex h-9 items-center gap-2 rounded-md px-1.5 text-left hover:bg-white/10">
          <Avatar name="Arun S" size={30} tone="white" />
          <span className="hidden leading-tight whitespace-nowrap xl:block">
            <span className="block text-sm font-semibold text-white">Arun S</span>
            <span className="block text-2xs text-blue-line">{role}</span>
          </span>
          <Icon name="ti-chevron-down" className="text-[13px] text-blue-line" />
        </button>
      }
      items={[
        { label: 'My Profile', icon: 'ti-user', onSelect: () => toast.info('My Profile', 'Profile page is out of scope for this wireframe.') },
        { separator: true, label: '' },
        ...ROLES.map((r) => ({ label: `View as ${r}`, checked: r === role, onSelect: () => { setRole(r); toast.success('Role switched', `Now viewing as ${r}`); } })),
        { separator: true, label: '' },
        { label: 'Settings', icon: 'ti-settings', onSelect: () => toast.info('Settings', 'Organisation settings are out of scope for this wireframe.') },
        { label: 'Reset demo data', icon: 'ti-refresh', onSelect: () => { reset(); toast.success('Demo data reset'); } },
        { label: 'Sign out', icon: 'ti-logout', danger: true, onSelect: () => toast.info('Demo mode', 'Sign-out is disabled in the wireframe.') },
      ]}
    />
  );
}

function CompanySelector() {
  const { company, setCompany } = useUi();
  const cur = COMPANIES.find((c) => c.id === company) ?? COMPANIES[0];
  return (
    <Menu
      align="start"
      label="Organisation"
      trigger={
        <button type="button" className="flex max-w-[260px] items-center gap-1 text-left text-2xs whitespace-nowrap text-blue-line hover:text-white">
          <span className="truncate">
            {cur.name} · {cur.city}
          </span>
          <Icon name="ti-chevron-down" className="text-[11px]" />
        </button>
      }
      items={COMPANIES.map((c) => ({ label: `${c.name} — ${c.city}`, checked: c.id === company, onSelect: () => { setCompany(c.id); toast.success('Organisation switched', c.name); } }))}
    />
  );
}

export function Header({ activeApp, onToggleSidebar }: { activeApp?: string; onToggleSidebar: () => void }) {
  return (
    <header className="flex h-[52px] shrink-0 items-center gap-3 bg-navy px-3">
      <button type="button" onClick={onToggleSidebar} aria-label="Toggle sidebar" className="flex h-8 w-8 items-center justify-center rounded-md text-blue-line hover:bg-white/10 hover:text-white">
        <Icon name="ti-layout-sidebar" className="text-[18px]" />
      </button>
      <div className="flex min-w-0 items-center gap-2.5">
        <Link to="/" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white" aria-label="Enterprise Dashboard">
          <Icon name="ti-building-skyscraper" className="text-[19px] text-navy" />
        </Link>
        <div className="min-w-0 leading-tight">
          <Link to="/" className="block text-md font-semibold text-white">
            Construction ERP
          </Link>
          <CompanySelector />
        </div>
      </div>
      <div className="flex flex-1 justify-center px-4">
        <SearchTrigger />
      </div>
      <div className="flex items-center gap-1">
        <AppSwitcher activeApp={activeApp} />
        <Notifications />
        <Help />
        <div className="mx-1.5 h-6 w-px bg-white/20" />
        <Profile />
      </div>
    </header>
  );
}
