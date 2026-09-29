import { useMemo, useState } from 'react';
import type { Resolved } from '@/config/registry';
import type { ViewSpec } from '@/config/types';
import { DataTable } from '@/components/DataTable';
import { FieldShell, FileUpload, SelectInput } from '@/components/fields';
import { Modal } from '@/components/overlays';
import { Button, Icon, KpiCard, SectionCard, StatusBadge } from '@/components/ui';
import { Timeline } from '@/components/widgets';
import { cn } from '@/lib/cn';
import { addDays, DEMO_TODAY, formatDate, toISO } from '@/lib/format';
import { createRng } from '@/lib/random';
import { useRows } from '@/mock/store';
import { toast } from '@/mock/toast';

interface Doc {
  id: string;
  name: string;
  folder: string;
  project: string;
  type: string;
  version: string;
  size: string;
  by: string;
  date: string;
  status: string;
}

const EXT = ['PDF', 'PDF', 'PDF', 'DWG', 'XLSX', 'DOCX', 'JPG'];

/** Realistic document titles by folder keyword; falls back to "<folder> — <project>". */
const NAME_BANK: [RegExp, string[], string][] = [
  [/drawing|as-built|design/i, ['GA Plan — Typical Floor', 'Structural Drawing S-102 — Raft Layout', 'Architectural Elevation — North', 'Column Schedule — Tower A', 'MEP Coordination Drawing — L5', 'Section A-A — Basement', 'Staircase Details'], 'DWG'],
  [/spec/i, ['Technical Specifications — Civil Works', 'Specification — Waterproofing Systems', 'MEP Specifications Vol. II', 'Finishes Schedule & Specification', 'Specification — Structural Steel'], 'PDF'],
  [/notice|nit/i, ['Notice Inviting Tender', 'Corrigendum No. 1', 'Pre-bid Meeting Notice', 'Tender Extension Notice'], 'PDF'],
  [/boq|quantit/i, ['Bill of Quantities — Civil', 'BOQ — MEP Works', 'Priced BOQ — Rev 2', 'Quantity Summary'], 'XLSX'],
  [/term|condition|contract|agreement|amend/i, ['General Conditions of Contract', 'Special Conditions of Contract', 'Letter of Acceptance', 'Contract Agreement — Signed', 'Amendment No. 2'], 'PDF'],
  [/manual|o&m/i, ['O&M Manual — HVAC', 'O&M Manual — Lifts', 'O&M Manual — DG Sets', 'Fire Alarm System Manual'], 'PDF'],
  [/certificate|test|report/i, ['Cube Test Report — 28 Day', 'Fire NOC', 'Lift Inspection Certificate', 'Occupancy Certificate', 'Structural Stability Certificate', 'Earth Pit Test Report'], 'PDF'],
  [/warrant/i, ['Waterproofing Warranty — 10 Years', 'Façade Glazing Warranty', 'Lift Warranty Certificate', 'Pump Warranty Card'], 'PDF'],
  [/photo|site record|progress/i, ['Site Photographs — Week 38', 'Progress Photos — Tower A', 'Daily Site Diary — Sep 2026', 'Hindrance Register Extract'], 'JPG'],
  [/correspond|letter/i, ['Letter to Client — EOT Request', 'Consultant Instruction CI-041', 'Minutes of Meeting — Progress Review', 'Notice of Delay Event'], 'PDF'],
  [/cost|invoice|bill/i, ['Cost Records — Sep 2026', 'Supplier Invoices — Steel', 'Labour Cost Statement', 'Equipment Hire Invoices'], 'XLSX'],
  [/title|deed|sale|encumbr|legal|land/i, ['Sale Deed — Survey No. 214/2', 'Encumbrance Certificate (30 years)', 'Patta & Chitta Extract', 'Legal Opinion — Title Search', 'FMB Sketch'], 'PDF'],
];
const PEOPLE = ['Divya T', 'Sneha P', 'Keerthana V', 'Priya M', 'Pooja Reddy', 'Arun S', 'Naveen P'];

function iconFor(t: string) {
  return t === 'PDF' ? 'ti-file-type-pdf' : t === 'XLSX' ? 'ti-file-spreadsheet' : t === 'DWG' ? 'ti-vector' : t === 'DOCX' ? 'ti-file-type-doc' : 'ti-photo';
}

export function DocumentsView({ r, view }: { r: Resolved; view: Extract<ViewSpec, { type: 'documents' }> }) {
  const projects = useRows('project');
  const [folder, setFolder] = useState<string>(view.folder ?? 'All');
  const [uploaded, setUploaded] = useState<Doc[]>([]);
  const [preview, setPreview] = useState<Doc | null>(null);
  const [upOpen, setUpOpen] = useState(false);
  const [upFile, setUpFile] = useState<string>('');
  const [upFolder, setUpFolder] = useState<string>(view.folder ?? view.folders[0]);

  const seeded = useMemo<Doc[]>(() => {
    const out: Doc[] = [];
    view.folders.forEach((f, fi) => {
      const rng = createRng(`docs:${r.app.id}:${f}`);
      const n = rng.int(4, 7);
      for (let i = 0; i < n; i++) {
        const p = projects[rng.int(0, Math.min(projects.length, 6) - 1)];
        const bank = NAME_BANK.find(([re]) => re.test(f));
        const t = bank && rng.chance(0.75) ? bank[2] : rng.pick(EXT);
        const title = bank ? bank[1][i % bank[1].length] : `${f}${i ? ` — Part ${i + 1}` : ''}`;
        out.push({
          id: `DOC-${String(fi * 10 + i + 1).padStart(3, '0')}`,
          name: `${title} — ${p?.name ?? 'General'}.${t.toLowerCase()}`,
          folder: f,
          project: p?.id ?? '',
          type: t,
          version: `R${rng.int(0, 4)}`,
          size: `${rng.int(80, 9600)} KB`,
          by: rng.pick(PEOPLE),
          date: toISO(addDays(DEMO_TODAY, -rng.int(1, 160))),
          status: rng.pick(['Approved', 'Approved', 'Approved', 'Under Review', 'Superseded', 'Draft']),
        });
      }
    });
    return out;
  }, [view.folders, r.app.id, projects]);

  const all = [...uploaded, ...seeded];
  const list = all.filter((d) => folder === 'All' || d.folder === folder);

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
        <KpiCard label="Documents" value={all.length} icon="ti-files" />
        <KpiCard label="Under review" value={all.filter((d) => d.status === 'Under Review').length} icon="ti-eye-check" />
        <KpiCard label="Uploaded this month" value={all.filter((d) => d.date >= toISO(addDays(DEMO_TODAY, -30))).length} icon="ti-cloud-upload" />
        <KpiCard label="Storage used" value="2.4 GB" icon="ti-database" progress={24} sub="of 10 GB" />
      </div>
      <div className="grid grid-cols-1 gap-3.5 lg:grid-cols-[230px_1fr]">
        <SectionCard title="Folders" icon="ti-folders" plain className="self-start">
          <ul className="-mx-1 flex flex-col gap-px">
            {['All', ...view.folders].map((f) => (
              <li key={f}>
                <button
                  type="button"
                  onClick={() => setFolder(f)}
                  className={cn('flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm', folder === f ? 'bg-blue-tint font-medium text-navy' : 'text-ink-2 hover:bg-bg-2')}
                >
                  <Icon name={folder === f ? 'ti-folder-open' : 'ti-folder'} className="text-[15px] text-blue" />
                  <span className="flex-1 truncate">{f === 'All' ? 'All documents' : f}</span>
                  <span className="text-2xs text-ink-3">{f === 'All' ? all.length : all.filter((d) => d.folder === f).length}</span>
                </button>
              </li>
            ))}
          </ul>
        </SectionCard>
        <DataTable
          key={folder}
          rows={list}
          getId={(d) => d.id}
          onRowClick={setPreview}
          onView={setPreview}
          onDelete={(ids) => { setUploaded((u) => u.filter((d) => !ids.includes(d.id))); toast.success('Documents archived', `${ids.length} file(s)`); }}
          addLabel="Upload Document"
          onAdd={() => setUpOpen(true)}
          exportName={view.title ?? 'Documents'}
          columns={[
            { key: 'name', label: 'Document Name', render: (d) => <span className="flex items-center gap-1.5"><Icon name={iconFor(d.type)} className="text-[15px] text-blue" />{d.name}</span> },
            { key: 'folder', label: 'Folder', filterOptions: view.folders },
            { key: 'version', label: 'Rev' },
            { key: 'size', label: 'Size', align: 'right' },
            { key: 'by', label: 'Uploaded By' },
            { key: 'date', label: 'Date', render: (d) => formatDate(d.date) },
            { key: 'status', label: 'Status', render: (d) => <StatusBadge value={d.status} />, filterOptions: ['Approved', 'Under Review', 'Superseded', 'Draft'] },
          ]}
          rowMenu={(d) => [
            { label: 'Download', icon: 'ti-download', onSelect: () => toast.success('Download started', d.name) },
            { label: 'Upload new revision', icon: 'ti-upload', onSelect: () => toast.success('New revision uploaded', `${d.name} → R${Number(d.version.slice(1)) + 1}`) },
            { label: 'Share link', icon: 'ti-share', onSelect: () => toast.info('Link copied', 'Valid for 7 days') },
          ]}
        />
      </div>

      <Modal open={!!preview} onOpenChange={(v) => !v && setPreview(null)} title={preview?.name ?? ''} icon={iconFor(preview?.type ?? 'PDF')} width={760}
        footer={<><Button icon="ti-download" variant="primary" onClick={() => toast.success('Download started', preview?.name)}>Download</Button><Button onClick={() => setPreview(null)}>Close</Button></>}>
        {preview && (
          <div className="grid grid-cols-1 gap-3.5 md:grid-cols-[1fr_240px]">
            <div className="hair flex h-[340px] flex-col items-center justify-center gap-2 rounded-md border-line bg-bg-3" style={{ background: 'repeating-linear-gradient(0deg,#EEF1F5 0 22px,#F5F7FA 22px 23px)' }}>
              <Icon name={iconFor(preview.type)} className="text-[44px] text-ink-3" />
              <span className="text-xs text-ink-3">Document preview · {preview.type}</span>
            </div>
            <div className="flex flex-col gap-2.5 text-sm">
              {[
                ['Folder', preview.folder],
                ['Revision', preview.version],
                ['Size', preview.size],
                ['Uploaded by', preview.by],
                ['Date', formatDate(preview.date)],
              ].map(([k, v]) => (
                <div key={k}>
                  <div className="field-label">{k}</div>
                  <div>{v}</div>
                </div>
              ))}
              <div>
                <div className="field-label mb-1">Revision history</div>
                <Timeline dense items={Array.from({ length: Number(preview.version.slice(1)) + 1 }, (_, i) => ({ date: toISO(addDays(DEMO_TODAY, -(40 - i * 9))), title: `R${i}${i === 0 ? ' — first issue' : ''}`, actor: PEOPLE[i % PEOPLE.length] })).reverse()} />
              </div>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        open={upOpen}
        onOpenChange={setUpOpen}
        title="Upload Document"
        icon="ti-cloud-upload"
        onSave={() => {
          if (!upFile) {
            toast.error('Choose a file to upload');
            return;
          }
          const t = upFile.split('.').pop()!.toUpperCase();
          setUploaded((u) => [{ id: `DOC-N${u.length + 1}`, name: upFile, folder: upFolder, project: 'PRJ-001', type: t, version: 'R0', size: '1,240 KB', by: 'Arun S', date: toISO(DEMO_TODAY), status: 'Under Review' }, ...u]);
          toast.success('Document uploaded', `${upFile} → ${upFolder}`);
          setUpOpen(false);
          setUpFile('');
        }}
        saveLabel="Upload"
      >
        <FieldShell label="Folder" required>
          <SelectInput value={upFolder} onChange={(e) => setUpFolder(e.target.value)} options={view.folders.map((f) => ({ value: f, label: f }))} />
        </FieldShell>
        <FieldShell label="File" required hint="PDF, DWG, XLSX, DOCX or images · max 25 MB">
          <FileUpload value={upFile} onChange={setUpFile} />
        </FieldShell>
      </Modal>
    </div>
  );
}
