import { useState } from 'react';
import { DataTable } from '@/components/DataTable';
import { AffixInput, Checkbox, FieldShell, FileUpload, MultiSelect, PillGroup, Radio, SelectInput, TextArea, TextInput } from '@/components/fields';
import { Modal } from '@/components/overlays';
import { Button, CodeChip, InfoBar, KpiCard, MetaStrip, PageTitle, SectionCard, SegToggle, StatusBadge, Tabs } from '@/components/ui';
import { ApprovalStepper, ImportPanel, SaveRow, StepNum, Timeline } from '@/components/widgets';
import { toast } from '@/mock/toast';
import { Breadcrumbs, PageBody, Shell } from '@/shell/Layout';

const TOKENS: [string, string][] = [
  ['navy', '#0C3B6E'],
  ['blue', '#185FA5'],
  ['blue-ink', '#0C447C'],
  ['blue-tint', '#E6F1FB'],
  ['blue-line', '#B5D4F4'],
  ['danger', '#E24B4A'],
  ['bg-2', '#F5F7FA'],
  ['ink', '#1B2430'],
  ['ink-2', '#4A5563'],
  ['ink-3', '#7B8594'],
  ['line', '#E3E7ED'],
  ['line-2', '#C9D1DB'],
];

/** Style-conformance page: every primitive side by side, for comparison with the sample wireframe. */
export function ComponentGallery() {
  const [open, setOpen] = useState(false);
  const [seg, setSeg] = useState<'a' | 'b'>('a');
  const [tab, setTab] = useState('topics');
  const [pills, setPills] = useState(['Lecture']);
  const [multi, setMulti] = useState<string[]>(['Tower A']);
  const [radio, setRadio] = useState('x');
  const [chk, setChk] = useState(true);
  const [file, setFile] = useState('');
  return (
    <Shell>
      <Breadcrumbs items={[{ label: 'Design System', to: '/gallery' }, { label: 'Component Gallery' }]} />
      <PageBody>
        <PageTitle icon="ti-palette" title="Component Gallery" subtitle="Tokens and components from the sample wireframe — used by all 19 applications" />
        <SectionCard title="Colour tokens" icon="ti-color-swatch">
          <div className="grid grid-cols-3 gap-2 md:grid-cols-6">
            {TOKENS.map(([n, hex]) => (
              <div key={n} className="hair overflow-hidden rounded-md border-line bg-bg">
                <div className="h-10" style={{ background: hex }} />
                <div className="px-2 py-1.5 text-xs">
                  <div className="font-semibold text-ink">{n}</div>
                  <div className="text-ink-3">{hex}</div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {['Active', 'Completed', 'Pending', 'Delayed', 'Draft', 'On Track', 'At Risk', 'Rejected', 'Approved', 'Inactive'].map((s) => (
              <StatusBadge key={s} value={s} />
            ))}
            <CodeChip>PRJ-001</CodeChip>
            <CodeChip>CO1</CodeChip>
          </div>
        </SectionCard>
        <SectionCard title="Buttons, tabs & toggles" icon="ti-click">
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="primary" icon="ti-plus">Add Topic</Button>
            <Button variant="danger" icon="ti-trash">Delete Selected</Button>
            <Button>Replicate</Button>
            <Button>Show All</Button>
            <Button variant="ghost" icon="ti-dots">More</Button>
            <Button variant="link">Link action</Button>
            <SegToggle value={seg} onChange={setSeg} options={[{ value: 'a', label: 'Topic Details' }, { value: 'b', label: 'Sub-Topic Details' }]} />
            <StepNum n={1} active />
            <StepNum n={2} />
          </div>
          <Tabs className="mt-3" value={tab} onChange={setTab} tabs={[{ value: 'overview', label: 'Overview' }, { value: 'topics', label: 'Topics / Sub-topics' }, { value: 'eval', label: 'Evaluation Parameters' }, { value: 'plan', label: 'Session Plan', count: 4 }]} />
        </SectionCard>
        <MetaStrip items={[{ label: 'Programme', value: 'B.E. / B.Tech' }, { label: 'Department', value: 'Civil Engineering' }, { label: 'Semester', value: 'IV — 2024–2028' }, { label: 'Academic Year', value: '2025 – 2026' }]} />
        <InfoBar icon="ti-info-circle">Info bar — instructions and context messages use the light-blue tint.</InfoBar>
        <ImportPanel targets={['Topics', 'Sub-Topics']} />
        <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
          <KpiCard label="Active Projects" value="8" delta="+14%" progress={40} icon="ti-folder" />
          <KpiCard label="Total Contract Value" value="₹ 320 Cr" delta="+8%" progress={60} icon="ti-file-text" />
          <KpiCard label="Total Cost Incurred" value="₹ 186 Cr" delta="+12%" good={false} progress={58} icon="ti-database" />
          <KpiCard label="Overall Progress" value="56%" delta="+6%" progress={56} icon="ti-chart-line" />
        </div>
        <SectionCard title="Form controls" icon="ti-forms">
          <div className="grid grid-cols-1 gap-3.5 md:grid-cols-[1fr_1px_1fr]">
            <div className="flex flex-col gap-2.5">
              <FieldShell label="Unit No." required hint="Numeric values only">
                <TextInput placeholder="e.g., 1, 2, 0.3" />
              </FieldShell>
              <FieldShell label="Topic Name" required error="Topic Name is required">
                <TextInput invalid />
              </FieldShell>
              <FieldShell label="Contract Value">
                <AffixInput prefix="₹" placeholder="0.00" />
              </FieldShell>
              <FieldShell label="Parent topic" required hint="Dropdown — auto-populated">
                <SelectInput options={[{ value: '1', label: 'Introduction' }]} placeholder="Select parent topic…" />
              </FieldShell>
              <FieldShell label="Brief Outline of Deliverables">
                <TextArea />
              </FieldShell>
            </div>
            <div className="hidden bg-line md:block" />
            <div className="flex flex-col gap-2.5">
              <FieldShell label="Pedagogy Methods" hint="pick up to 3">
                <PillGroup options={['Lecture', 'Discussion', 'Case Study', 'Problem Solving', 'Demonstration']} value={pills} onChange={setPills} max={3} />
              </FieldShell>
              <FieldShell label="Towers (multi-select)" hint="auto-filtered · multi-select">
                <MultiSelect options={['Tower A', 'Tower B', 'Tower C', 'Podium'].map((x) => ({ value: x, label: x }))} value={multi} onChange={setMulti} />
              </FieldShell>
              <FieldShell label="Start Date">
                <TextInput type="date" defaultValue="2026-09-29" />
              </FieldShell>
              <div className="flex gap-4">
                <Radio checked={radio === 'x'} onChange={() => setRadio('x')} label="Upload Topics" />
                <Radio checked={radio === 'y'} onChange={() => setRadio('y')} label="Upload Sub-Topics" />
                <Checkbox checked={chk} onChange={setChk} label="Checkbox" />
              </div>
              <FieldShell label="Attachment">
                <FileUpload value={file} onChange={setFile} />
              </FieldShell>
            </div>
          </div>
          <SaveRow label="Save Session Plan" onClick={() => toast.success('Saved')} />
        </SectionCard>
        <SectionCard title="Enterprise table" icon="ti-table" plain>
          <DataTable
            rows={[
              { id: 'PRJ-001', name: 'Skyline Apartments', client: 'ABC Builders', progress: 68, status: 'On Track' },
              { id: 'PRJ-003', name: 'Greenfield Township', client: 'Greenfield Infra', progress: 32, status: 'Delayed' },
              { id: 'PRJ-005', name: 'Lakeview Residency', client: 'Lakeview Estates', progress: 28, status: 'At Risk' },
            ]}
            getId={(r) => r.id}
            addLabel="Add Project"
            onAdd={() => setOpen(true)}
            onEdit={() => setOpen(true)}
            onDelete={() => toast.success('Deleted')}
            columns={[
              { key: 'id', label: 'Code', required: true, render: (r) => <CodeChip>{r.id}</CodeChip> },
              { key: 'name', label: 'Project Name', required: true },
              { key: 'client', label: 'Client', filterOptions: ['ABC Builders', 'Greenfield Infra', 'Lakeview Estates'] },
              { key: 'progress', label: 'Progress', align: 'right', render: (r) => `${r.progress}%` },
              { key: 'status', label: 'Status', render: (r) => <StatusBadge value={r.status} /> },
            ]}
          />
        </SectionCard>
        <div className="grid grid-cols-1 gap-3.5 lg:grid-cols-2">
          <SectionCard title="Approval stepper" icon="ti-route" plain>
            <ApprovalStepper stages={[{ label: 'Prepared', by: 'Sneha P' }, { label: 'Reviewed', by: 'Harish V' }, { label: 'Approved' }, { label: 'Released' }]} current={2} />
          </SectionCard>
          <SectionCard title="Timeline" icon="ti-timeline" plain>
            <Timeline items={[{ date: '2026-09-28', title: 'RA bill certified', actor: 'Anitha G', status: 'Certified' }, { date: '2026-09-24', title: 'Measurement recorded', actor: 'Priya M', text: 'Joint measurement with client engineer.' }]} />
          </SectionCard>
        </div>
      </PageBody>
      <Modal open={open} onOpenChange={setOpen} title="Add / Edit Topic" onSave={() => { toast.success('Saved'); setOpen(false); }}>
        <FieldShell label="Unit No." required hint="Numeric values only">
          <TextInput placeholder="e.g., 1, 2, 0.3" />
        </FieldShell>
        <FieldShell label="Topic Name" required>
          <TextArea />
        </FieldShell>
        <FieldShell label="Book Reference">
          <TextArea />
        </FieldShell>
      </Modal>
    </Shell>
  );
}
