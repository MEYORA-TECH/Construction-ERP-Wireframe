import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { APPS, getApp } from '@/config/registry';
import { cn } from '@/lib/cn';
import { Pop } from '@/components/overlays';
import { Icon } from '@/components/ui';
import { useUi } from '@/mock/ui';

export function AppSwitcher({ activeApp }: { activeApp?: string }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const navigate = useNavigate();
  const recent = useUi((s) => s.recentApps);
  const touch = useUi((s) => s.touchApp);
  const apps = APPS.filter((a) => a.name.toLowerCase().includes(q.toLowerCase()) || a.description.toLowerCase().includes(q.toLowerCase()));
  const go = (id: string) => {
    touch(id);
    setOpen(false);
    setQ('');
    navigate(`/${id}`);
  };

  return (
    <Pop
      open={open}
      onOpenChange={setOpen}
      width={520}
      trigger={
        <button
          type="button"
          aria-label="All applications"
          title="All applications"
          className={cn('flex h-8 w-8 items-center justify-center rounded-md text-white hover:bg-white/10', open && 'bg-white/15')}
        >
          <Icon name="ti-grid-dots" className="text-[19px]" />
        </button>
      }
    >
      <div className="flex items-center gap-3 rounded-t-md bg-navy px-3.5 py-2.5">
        <span className="text-md font-semibold text-white">All Applications</span>
        <div className="relative ml-auto w-52">
          <Icon name="ti-search" className="pointer-events-none absolute top-1/2 left-2 -translate-y-1/2 text-[12px] text-ink-3" />
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search apps…"
            className="h-7 w-full rounded-md bg-white pr-2 pl-6 text-xs text-ink outline-none placeholder:text-ink-3"
          />
        </div>
      </div>
      {!q && (
        <div className="hair-b border-line px-3.5 py-2.5">
          <div className="mb-1.5 text-2xs font-semibold tracking-wide text-ink-3 uppercase">Recent</div>
          <div className="flex flex-wrap gap-1.5">
            {recent
              .map((id) => getApp(id))
              .filter(Boolean)
              .map((a) => (
                <button key={a!.id} type="button" onClick={() => go(a!.id)} className="hair flex items-center gap-1.5 rounded-md border-line px-2 py-1 text-xs text-ink hover:border-blue-line hover:bg-blue-tint">
                  <Icon name={a!.icon} className="text-[13px] text-blue" />
                  {a!.name}
                </button>
              ))}
          </div>
        </div>
      )}
      <div className="grid grid-cols-5 gap-1.5 p-3">
        {apps.map((a) => (
          <button
            key={a.id}
            type="button"
            onClick={() => go(a.id)}
            title={a.description}
            className={cn(
              'hair flex h-[74px] flex-col items-center justify-center gap-1.5 rounded-md px-1 text-center',
              a.id === activeApp ? 'border-navy bg-blue-tint' : 'border-line hover:border-blue-line hover:bg-bg-2',
            )}
          >
            <Icon name={a.icon} className="text-[22px] text-blue" />
            <span className="text-xs leading-tight text-ink">{a.name}</span>
          </button>
        ))}
        {!apps.length && <div className="col-span-5 py-6 text-center text-xs text-ink-3 italic">No application matches “{q}”.</div>}
      </div>
      <div className="hair-t flex items-center border-line px-3.5 py-2">
        <button type="button" className="flex items-center gap-1.5 text-xs text-blue hover:underline" onClick={() => { setOpen(false); navigate('/'); }}>
          <Icon name="ti-home" className="text-[13px]" /> Enterprise Dashboard
        </button>
        <span className="ml-auto text-2xs text-ink-3">{APPS.length} applications</span>
      </div>
    </Pop>
  );
}
