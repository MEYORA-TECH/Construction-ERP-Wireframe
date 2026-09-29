import { useState, type ComponentType } from 'react';
import type { Resolved } from '@/config/registry';
import type { ChartSpec } from '@/config/types';
import { Chart } from '@/components/Chart';
import { Checkbox, FieldShell, SelectInput } from '@/components/fields';
import { Modal } from '@/components/overlays';
import { Button, Icon, SectionCard } from '@/components/ui';
import { StepNum } from '@/components/widgets';
import { cn } from '@/lib/cn';
import { toast } from '@/mock/toast';

/** Registry for bespoke views referenced by `{ type: 'custom', component }`. */
export const CUSTOM_VIEWS: Record<string, ComponentType<{ r: Resolved; props?: Record<string, unknown> }>> = {};

const MODULE_FIELDS: Record<string, string[]> = {
  Project: ['Project Code', 'Project Name', 'Client', 'Project Manager', 'Contract Value', 'Cost Incurred', 'Progress %', 'Status', 'Start Date', 'End Date'],
  Procurement: ['PO Number', 'Vendor', 'Project', 'Category', 'PO Value', 'Received Value', 'Delivery Date', 'Status'],
  Workforce: ['Employee ID', 'Employee', 'Department', 'Designation', 'Site', 'Attendance %', 'Overtime Hours', 'Labour Cost'],
  Finance: ['Account', 'Project', 'Debit', 'Credit', 'Balance', 'Period', 'Cost Head'],
  Billing: ['RA Bill No.', 'Project', 'Gross Amount', 'Deductions', 'Net Payable', 'Certified Date', 'Status'],
  'Quality & Safety': ['Inspection No.', 'Project', 'Type', 'Result', 'NCR Raised', 'Incident Type', 'Severity'],
};

const STEPS = ['Select Module', 'Select Fields', 'Add Filters', 'Group By', 'Chart / Table', 'Generate'];

export function ReportBuilder({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const [step, setStep] = useState(0);
  const [module, setModule] = useState('Project');
  const [fields, setFields] = useState<string[]>(['Project Name', 'Contract Value', 'Cost Incurred', 'Status']);
  const [filters, setFilters] = useState<{ field: string; op: string; value: string }[]>([{ field: 'Status', op: 'is not', value: 'Completed' }]);
  const [groupBy, setGroupBy] = useState('Client');
  const [viz, setViz] = useState<'table' | 'bar' | 'line' | 'donut' | 'kpi'>('bar');
  const all = MODULE_FIELDS[module];
  const spec: ChartSpec = {
    title: 'Preview',
    kind: viz === 'donut' ? 'donut' : viz === 'line' ? 'line' : 'bar',
    categories: ['ABC Builders', 'XYZ Developers', 'Greenfield Infra', 'Metro Constructions', 'Lakeview Estates', 'Orbit Tech Parks'],
    series: [
      { name: fields.find((f) => /value|amount|cost|payable/i.test(f)) ?? 'Count', data: [85, 42, 58, 64, 28, 18] },
      ...(viz !== 'donut' ? [{ name: 'Cost Incurred', data: [52, 22, 24, 40, 10, 17] }] : []),
    ],
    unit: '₹Cr',
    height: 240,
  };

  const reset = () => {
    setStep(0);
    onOpenChange(false);
  };

  return (
    <Modal
      open={open}
      onOpenChange={(v) => (v ? onOpenChange(v) : reset())}
      title="Report Builder"
      icon="ti-chart-dots-3"
      width={880}
      footer={
        <>
          <span className="mr-auto text-xs text-ink-3">
            Step {step + 1} of {STEPS.length}
          </span>
          {step > 0 && (
            <Button icon="ti-arrow-left" onClick={() => setStep(step - 1)}>
              Back
            </Button>
          )}
          {step < STEPS.length - 1 ? (
            <Button variant="primary" iconRight="ti-arrow-right" onClick={() => setStep(step + 1)} disabled={step === 1 && !fields.length}>
              Next
            </Button>
          ) : (
            <Button variant="primary" icon="ti-device-floppy" onClick={() => { toast.success('Report saved', `Custom ${module} report added to Custom Reports`); reset(); }}>
              Save Report
            </Button>
          )}
          <Button onClick={reset}>Close</Button>
        </>
      }
    >
      <div className="hair-b -mx-3.5 -mt-3.5 flex flex-wrap items-center gap-2 border-line bg-bg-2 px-3.5 py-2.5">
        {STEPS.map((s, i) => (
          <button key={s} type="button" onClick={() => setStep(i)} className="flex items-center gap-1.5">
            <StepNum n={i + 1} active={i === step} done={i < step} />
            <span className={cn('text-xs', i === step ? 'font-semibold text-navy' : 'text-ink-2')}>{s}</span>
            {i < STEPS.length - 1 && <Icon name="ti-chevron-right" className="text-[11px] text-ink-3" />}
          </button>
        ))}
      </div>

      {step === 0 && (
        <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
          {Object.keys(MODULE_FIELDS).map((m) => (
            <button key={m} type="button" onClick={() => { setModule(m); setFields(MODULE_FIELDS[m].slice(0, 4)); }} className={cn('hair flex items-center gap-2.5 rounded-md p-3 text-left', module === m ? 'border-navy bg-blue-tint' : 'border-line hover:bg-bg-2')}>
              <Icon name="ti-database" className="text-[18px] text-blue" />
              <span>
                <span className="block text-sm font-medium text-ink">{m}</span>
                <span className="block text-2xs text-ink-3">{MODULE_FIELDS[m].length} fields available</span>
              </span>
            </button>
          ))}
        </div>
      )}

      {step === 1 && (
        <SectionCard title={`${module} fields`} icon="ti-columns-3">
          <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
            {all.map((f) => (
              <Checkbox key={f} checked={fields.includes(f)} onChange={(c) => setFields((s) => (c ? [...s, f] : s.filter((x) => x !== f)))} label={f} />
            ))}
          </div>
        </SectionCard>
      )}

      {step === 2 && (
        <SectionCard title="Filters" icon="ti-filter" actions={<Button size="sm" icon="ti-plus" onClick={() => setFilters((f) => [...f, { field: all[0], op: 'is', value: '' }])}>Add filter</Button>}>
          <div className="flex flex-col gap-2">
            {filters.map((flt, i) => (
              <div key={i} className="grid grid-cols-[1fr_140px_1fr_32px] items-center gap-2">
                <SelectInput value={flt.field} onChange={(e) => setFilters((fs) => fs.map((x, j) => (j === i ? { ...x, field: e.target.value } : x)))} options={all.map((f) => ({ value: f, label: f }))} />
                <SelectInput value={flt.op} onChange={(e) => setFilters((fs) => fs.map((x, j) => (j === i ? { ...x, op: e.target.value } : x)))} options={['is', 'is not', 'greater than', 'less than', 'between', 'contains'].map((o) => ({ value: o, label: o }))} />
                <input value={flt.value} onChange={(e) => setFilters((fs) => fs.map((x, j) => (j === i ? { ...x, value: e.target.value } : x)))} placeholder="Value" className="hair h-8 rounded-md border-line-2 px-2 text-sm outline-none focus:border-blue" />
                <button type="button" aria-label="Remove filter" onClick={() => setFilters((fs) => fs.filter((_, j) => j !== i))} className="text-ink-3 hover:text-danger">
                  <Icon name="ti-trash" />
                </button>
              </div>
            ))}
            <FieldShell label="Date range">
              <SelectInput value="FY 2026-27 YTD" onChange={() => undefined} options={['FY 2026-27 YTD', 'Last Quarter', 'Custom'].map((x) => ({ value: x, label: x }))} />
            </FieldShell>
          </div>
        </SectionCard>
      )}

      {step === 3 && (
        <SectionCard title="Group By" icon="ti-stack-2">
          <div className="flex flex-wrap gap-2">
            {['Client', 'Project', 'Month', 'Quarter', 'Site', 'Status', 'Project Manager'].map((g) => (
              <button key={g} type="button" onClick={() => setGroupBy(g)} className={cn('hair rounded-[20px] px-3 py-1 text-xs', groupBy === g ? 'border-navy bg-navy text-white' : 'border-line-2 text-ink-2 hover:bg-bg-2')}>
                {g}
              </button>
            ))}
          </div>
        </SectionCard>
      )}

      {step === 4 && (
        <div className="grid grid-cols-5 gap-2">
          {([['table', 'ti-table', 'Table'], ['bar', 'ti-chart-bar', 'Bar Chart'], ['line', 'ti-chart-line', 'Line Chart'], ['donut', 'ti-chart-donut', 'Donut'], ['kpi', 'ti-number', 'KPI Cards']] as const).map(([v, icon, l]) => (
            <button key={v} type="button" onClick={() => setViz(v)} className={cn('hair flex flex-col items-center gap-1.5 rounded-md py-4', viz === v ? 'border-navy bg-blue-tint' : 'border-line hover:bg-bg-2')}>
              <Icon name={icon} className="text-[24px] text-blue" />
              <span className="text-xs text-ink">{l}</span>
            </button>
          ))}
        </div>
      )}

      {step === 5 && (
        <SectionCard title={`${module} report · grouped by ${groupBy}`} icon="ti-report-analytics" plain actions={<Button size="sm" icon="ti-download" onClick={() => toast.success('Report exported', 'Excel')}>Export</Button>}>
          {viz === 'table' || viz === 'kpi' ? (
            <div className={cn(viz === 'kpi' ? 'grid grid-cols-3 gap-2' : '')}>
              {viz === 'kpi' ? (
                ['Total Contract Value · ₹ 295 Cr', 'Cost Incurred · ₹ 165 Cr', 'Active Projects · 6'].map((k) => (
                  <div key={k} className="hair rounded-md border-line bg-bg-2 p-3 text-sm font-semibold">
                    {k}
                  </div>
                ))
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr>
                      {[groupBy, ...fields.slice(0, 4)].map((h) => (
                        <th key={h} className="hair-b border-blue-line bg-blue-tint px-2.5 py-2 text-left font-semibold text-blue-ink">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {spec.categories!.map((c, i) => (
                      <tr key={c}>
                        <td className="hair-b border-line px-2.5 py-1.5">{c}</td>
                        {fields.slice(0, 4).map((f, j) => (
                          <td key={f} className="hair-b border-line px-2.5 py-1.5 text-ink-2">
                            {/value|cost|amount/i.test(f) ? `₹ ${(spec.series[0].data[i] * (1 - j * 0.2)).toFixed(1)} Cr` : /status/i.test(f) ? 'Active' : `${f} ${i + 1}`}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          ) : (
            <Chart spec={spec} />
          )}
          <div className="mt-2 text-2xs text-ink-3">
            {fields.length} fields · {filters.length} filter(s) · generated from sample data
          </div>
        </SectionCard>
      )}
    </Modal>
  );
}
