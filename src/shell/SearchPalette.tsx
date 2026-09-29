import * as Dialog from '@radix-ui/react-dialog';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { allPages, APPS, getEntity, registerPathFor } from '@/config/registry';
import { cn } from '@/lib/cn';
import { Icon } from '@/components/ui';
import { useData } from '@/mock/store';

interface Hit {
  group: string;
  title: string;
  sub: string;
  icon: string;
  path: string;
}

const RECORD_GROUPS: [string, string, string][] = [
  ['project', 'Projects', 'ti-building-skyscraper'],
  ['client', 'Clients', 'ti-building-community'],
  ['vendor', 'Vendors', 'ti-truck-delivery'],
  ['subcontractor', 'Subcontractors', 'ti-users-group'],
  ['employee', 'Employees', 'ti-id-badge-2'],
  ['site', 'Sites', 'ti-map-pin'],
  ['item', 'Materials', 'ti-package'],
  ['equipment', 'Equipment', 'ti-bulldozer'],
];

export function SearchTrigger() {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen(true);
      }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, []);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex h-8 w-full max-w-[520px] items-center gap-2 rounded-md bg-white px-2.5 text-left text-sm text-ink-3 hover:ring-2 hover:ring-blue-line"
      >
        <Icon name="ti-search" className="text-[14px]" />
        <span className="flex-1 truncate">Search projects, documents, vendors, or anything...</span>
        <kbd className="hair rounded-sm border-line-2 bg-bg-2 px-1.5 text-2xs text-ink-2">Ctrl + K</kbd>
      </button>
      <SearchPalette open={open} onOpenChange={setOpen} />
    </>
  );
}

function SearchPalette({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const [q, setQ] = useState('');
  const [active, setActive] = useState(0);
  const navigate = useNavigate();
  const rows = useData((s) => s.rows);

  const hits = useMemo<Hit[]>(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) {
      return [
        { group: 'Quick links', title: 'Enterprise Dashboard', sub: 'Home', icon: 'ti-home', path: '/' },
        ...APPS.filter((a) => ['project', 'procurement', 'site', 'billing', 'finance'].includes(a.id)).map((a) => ({
          group: 'Quick links',
          title: `${a.name} Dashboard`,
          sub: a.description,
          icon: a.icon,
          path: `/${a.id}`,
        })),
      ];
    }
    const out: Hit[] = [];
    for (const a of APPS) if (a.name.toLowerCase().includes(needle)) out.push({ group: 'Applications', title: a.name, sub: a.description, icon: a.icon, path: `/${a.id}` });
    for (const [entityId, group, icon] of RECORD_GROUPS) {
      const e = getEntity(entityId);
      const base = registerPathFor(entityId);
      if (!base) continue;
      for (const r of rows[entityId] ?? []) {
        const title = String(r[e.titleField] ?? '');
        if (title.toLowerCase().includes(needle) || r.id.toLowerCase().includes(needle)) out.push({ group, title, sub: r.id, icon, path: `${base}/${r.id}` });
      }
    }
    for (const p of allPages()) {
      const hay = `${p.app.name} ${p.menu.label} ${p.label}`.toLowerCase();
      if (hay.includes(needle)) out.push({ group: 'Pages', title: p.label, sub: `${p.app.name} › ${p.menu.label}`, icon: p.menu.icon, path: p.path });
    }
    if (/doc|drawing|report|certificate|pdf/.test(needle)) {
      ['GA_Drawing_Rev3.pdf — Skyline Apartments', 'Structural_Design_Basis_Report.pdf — Metro Office Tower', 'Completion_Certificate_Draft.pdf — Orbit Tech Park Phase II'].forEach((t, i) =>
        out.push({ group: 'Documents', title: t, sub: 'Document Library', icon: 'ti-file-text', path: ['/project/project-master/project-name', '/tender/tender-documents/drawings', '/handover/completion/completion-certificate'][i] }),
      );
    }
    return out.slice(0, 40);
  }, [q, rows]);

  const go = (h: Hit) => {
    onOpenChange(false);
    setQ('');
    navigate(h.path);
  };

  const grouped = hits.reduce<Record<string, Hit[]>>((acc, h) => {
    (acc[h.group] ??= []).push(h);
    return acc;
  }, {});
  let idx = -1;

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-overlay" />
        <Dialog.Content aria-describedby={undefined} className="hair fixed top-[10vh] left-1/2 z-50 w-[min(640px,calc(100vw-32px))] -translate-x-1/2 overflow-hidden rounded-md border-line-2 bg-bg shadow-[0_12px_40px_rgb(0_0_0/0.2)]">
          <Dialog.Title className="sr-only">Global search</Dialog.Title>
          <div className="hair-b flex items-center gap-2 border-line px-3.5">
            <Icon name="ti-search" className="text-[16px] text-ink-3" />
            <input
              autoFocus
              value={q}
              onChange={(e) => { setQ(e.target.value); setActive(0); }}
              onKeyDown={(e) => {
                if (e.key === 'ArrowDown') { e.preventDefault(); setActive((a) => Math.min(hits.length - 1, a + 1)); }
                if (e.key === 'ArrowUp') { e.preventDefault(); setActive((a) => Math.max(0, a - 1)); }
                if (e.key === 'Enter' && hits[active]) go(hits[active]);
              }}
              placeholder="Search projects, documents, vendors, or anything..."
              className="h-12 flex-1 bg-transparent text-base text-ink outline-none placeholder:text-ink-3"
            />
            <kbd className="hair rounded-sm border-line-2 bg-bg-2 px-1.5 text-2xs text-ink-2">Esc</kbd>
          </div>
          <div className="max-h-[60vh] overflow-y-auto py-1.5">
            {Object.entries(grouped).map(([group, list]) => (
              <div key={group} className="py-1">
                <div className="px-3.5 py-1 text-2xs font-semibold tracking-wide text-ink-3 uppercase">{group}</div>
                {list.map((h) => {
                  idx += 1;
                  const i = idx;
                  return (
                    <button
                      key={`${group}-${h.path}-${h.title}`}
                      type="button"
                      onMouseEnter={() => setActive(i)}
                      onClick={() => go(h)}
                      className={cn('flex w-full items-center gap-2.5 px-3.5 py-1.5 text-left', i === active ? 'bg-blue-tint' : 'hover:bg-bg-2')}
                    >
                      <Icon name={h.icon} className="text-[15px] text-blue" />
                      <span className="min-w-0 flex-1 truncate text-sm text-ink">{h.title}</span>
                      <span className="max-w-[45%] truncate text-xs text-ink-3">{h.sub}</span>
                    </button>
                  );
                })}
              </div>
            ))}
            {!hits.length && <div className="px-4 py-8 text-center text-sm text-ink-3 italic">No results for “{q}”.</div>}
          </div>
          <div className="hair-t flex items-center gap-4 border-line bg-bg-2 px-3.5 py-1.5 text-2xs text-ink-3">
            <span>↑↓ navigate</span>
            <span>↵ open</span>
            <span className="ml-auto">Searching all 19 applications</span>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
