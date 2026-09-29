import * as Dialog from '@radix-ui/react-dialog';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import * as Popover from '@radix-ui/react-popover';
import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { useToasts } from '@/mock/toast';
import { Button, Icon } from './ui';

/** Sample-style modal: navy header, scrolling body, right-aligned Save / Close footer. */
export function Modal({
  open,
  onOpenChange,
  title,
  icon = 'ti-file-plus',
  children,
  footer,
  width = 460,
  onSave,
  saveLabel = 'Save',
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  title: string;
  icon?: string;
  children: ReactNode;
  footer?: ReactNode;
  width?: number;
  onSave?: () => void;
  saveLabel?: string;
}) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-overlay" />
        <Dialog.Content
          className="hair fixed top-[8vh] left-1/2 z-50 flex max-h-[84vh] -translate-x-1/2 flex-col overflow-hidden rounded-md border-line-2 bg-bg shadow-[0_12px_40px_rgb(0_0_0/0.18)]"
          style={{ width: `min(${width}px, calc(100vw - 32px))` }}
          aria-describedby={undefined}
        >
          <div className="flex shrink-0 items-center justify-between bg-navy px-3.5 py-2.5">
            <Dialog.Title className="flex items-center gap-2 text-md font-semibold text-white">
              <Icon name={icon} className="text-[15px]" />
              {title}
            </Dialog.Title>
            <Dialog.Close className="text-[20px] leading-none text-blue-line hover:text-white" aria-label="Close">
              ×
            </Dialog.Close>
          </div>
          <div className="flex min-h-0 flex-1 flex-col gap-2.5 overflow-y-auto p-3.5">{children}</div>
          <div className="hair-t flex shrink-0 justify-end gap-2 border-line px-3.5 py-2.5">
            {footer ?? (
              <>
                {onSave && (
                  <Button variant="primary" icon="ti-device-floppy" onClick={onSave}>
                    {saveLabel}
                  </Button>
                )}
                <Dialog.Close asChild>
                  <Button variant="outline">Close</Button>
                </Dialog.Close>
              </>
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

/** Right-side drawer (notifications, help, quick views). */
export function Drawer({ open, onOpenChange, title, icon, children, width = 400 }: { open: boolean; onOpenChange: (v: boolean) => void; title: string; icon?: string; children: ReactNode; width?: number }) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-overlay" />
        <Dialog.Content className="hair-l fixed top-0 right-0 z-50 flex h-full flex-col border-line bg-bg" style={{ width: `min(${width}px, 100vw)` }} aria-describedby={undefined}>
          <div className="flex h-12 shrink-0 items-center justify-between bg-navy px-4">
            <Dialog.Title className="flex items-center gap-2 text-md font-semibold text-white">
              {icon && <Icon name={icon} className="text-[15px]" />}
              {title}
            </Dialog.Title>
            <Dialog.Close className="text-[20px] leading-none text-blue-line hover:text-white" aria-label="Close">
              ×
            </Dialog.Close>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export interface MenuItem {
  label: string;
  icon?: string;
  onSelect?: () => void;
  danger?: boolean;
  separator?: boolean;
  checked?: boolean;
  disabled?: boolean;
}

export function Menu({ trigger, items, align = 'end', label }: { trigger: ReactNode; items: MenuItem[]; align?: 'start' | 'end'; label?: string }) {
  return (
    <DropdownMenu.Root modal={false}>
      <DropdownMenu.Trigger asChild>{trigger}</DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content align={align} sideOffset={4} className="hair z-50 min-w-[180px] rounded-md border-line-2 bg-bg py-1 shadow-[0_8px_24px_rgb(0_0_0/0.12)]">
          {label && <DropdownMenu.Label className="px-3 py-1 text-2xs font-semibold tracking-wide text-ink-3 uppercase">{label}</DropdownMenu.Label>}
          {items.map((it, i) =>
            it.separator ? (
              <DropdownMenu.Separator key={i} className="hair-t my-1 border-line" />
            ) : (
              <DropdownMenu.Item
                key={i}
                disabled={it.disabled}
                onSelect={it.onSelect}
                className={cn(
                  'flex cursor-pointer items-center gap-2 px-3 py-1.5 text-sm outline-none data-[disabled]:opacity-40 data-[highlighted]:bg-blue-tint',
                  it.danger ? 'text-danger' : 'text-ink',
                )}
              >
                {it.checked !== undefined ? (
                  <Icon name={it.checked ? 'ti-square-check' : 'ti-square'} className={cn('text-[14px]', it.checked ? 'text-navy' : 'text-ink-3')} />
                ) : (
                  it.icon && <Icon name={it.icon} className="text-[14px] text-ink-2" />
                )}
                {it.label}
              </DropdownMenu.Item>
            ),
          )}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}

export function Pop({ trigger, children, align = 'end', width = 280, open, onOpenChange }: { trigger: ReactNode; children: ReactNode; align?: 'start' | 'center' | 'end'; width?: number; open?: boolean; onOpenChange?: (v: boolean) => void }) {
  return (
    <Popover.Root open={open} onOpenChange={onOpenChange}>
      <Popover.Trigger asChild>{trigger}</Popover.Trigger>
      <Popover.Portal>
        <Popover.Content align={align} sideOffset={6} className="hair z-50 rounded-md border-line-2 bg-bg shadow-[0_8px_28px_rgb(0_0_0/0.14)] outline-none" style={{ width }}>
          {children}
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  text,
  confirmLabel = 'Confirm',
  danger,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  title: string;
  text: string;
  confirmLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
}) {
  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      icon={danger ? 'ti-alert-triangle' : 'ti-help-circle'}
      width={400}
      footer={
        <>
          <Button
            variant={danger ? 'danger' : 'primary'}
            onClick={() => {
              onConfirm();
              onOpenChange(false);
            }}
          >
            {confirmLabel}
          </Button>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
        </>
      }
    >
      <p className="text-sm text-ink-2">{text}</p>
    </Modal>
  );
}

export function Toasts() {
  const { toasts, dismiss } = useToasts();
  return (
    <div className="pointer-events-none fixed right-4 bottom-4 z-[60] flex w-[340px] flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className="hair pointer-events-auto flex items-start gap-2.5 rounded-md border-line-2 bg-bg px-3 py-2.5 shadow-[0_8px_24px_rgb(0_0_0/0.14)]"
          style={{ animation: 'toast-in 160ms ease-out' }}
          role="status"
        >
          <Icon
            name={t.kind === 'success' ? 'ti-circle-check' : t.kind === 'error' ? 'ti-alert-circle' : 'ti-info-circle'}
            className={cn('mt-px text-[16px]', t.kind === 'success' ? 'text-ok' : t.kind === 'error' ? 'text-bad' : 'text-blue')}
          />
          <div className="min-w-0 flex-1">
            <div className="text-sm font-semibold text-ink">{t.title}</div>
            {t.text && <div className="mt-0.5 text-xs text-ink-2">{t.text}</div>}
          </div>
          <button type="button" className="text-ink-3 hover:text-ink" onClick={() => dismiss(t.id)} aria-label="Dismiss">
            <Icon name="ti-x" className="text-[13px]" />
          </button>
        </div>
      ))}
    </div>
  );
}
