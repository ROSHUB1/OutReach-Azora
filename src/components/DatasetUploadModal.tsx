import React, { useState, useRef } from 'react';
import { Lead, LeadCategory } from '../types';
import { motion } from 'motion/react';
import { Upload, FileText, Check, AlertCircle, X, Download, FileSpreadsheet, Sparkles } from 'lucide-react';

interface DatasetUploadModalProps {
  onClose: () => void;
  onImportLeads: (leads: Partial<Lead>[]) => void;
}

export const DatasetUploadModal: React.FC<DatasetUploadModalProps> = ({ onClose, onImportLeads }) => {
  const [dragActive, setDragActive] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [parsedLeads, setParsedLeads] = useState<Partial<Lead>[]>([]);
  const [rawText, setRawText] = useState<string>('');
  const [defaultCategory, setDefaultCategory] = useState<LeadCategory>('PERSONAL_BRAND');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Parse CSV or JSON string into leads array
  const parseFileContent = (content: string, name: string) => {
    setFileName(name);
    setRawText(content);
    setErrorMsg(null);

    const trimmed = content.trim();
    let leads: Partial<Lead>[] = [];

    try {
      if (name.endsWith('.json') || trimmed.startsWith('[') || trimmed.startsWith('{')) {
        // Try JSON parse
        const parsed = JSON.parse(trimmed);
        const list = Array.isArray(parsed) ? parsed : [parsed];
        leads = list.map((item: any, i: number) => ({
          name: item.name || item.fullName || item.contactName || item.email?.split('@')[0] || `Lead #${i + 1}`,
          email: item.email || item.emailAddress || item.contactEmail || `lead_${i + 1}@gmail.com`,
          companyOrBrand: item.companyOrBrand || item.company || item.brand || item.name || 'Brand Target',
          category: (item.category as LeadCategory) || defaultCategory,
          instagramHandle: item.instagramHandle || item.instagram || item.ig || undefined,
          youtubeUrl: item.youtubeUrl || item.youtube || undefined,
          twitchOrKickUrl: item.twitchOrKickUrl || item.twitch || item.kick || undefined,
          websiteUrl: item.websiteUrl || item.website || undefined,
          notes: item.notes || `Imported from dataset file: ${name}`,
        }));
      } else {
        // CSV / TSV / Delimited TXT parsing
        const lines = trimmed.split('\n').filter((l) => l.trim().length > 0);
        if (lines.length === 0) {
          setErrorMsg('The uploaded file is empty.');
          return;
        }

        // Check header line
        const headerLine = lines[0].toLowerCase();
        const hasHeader = headerLine.includes('email') || headerLine.includes('name') || headerLine.includes('category');
        const dataLines = hasHeader ? lines.slice(1) : lines;

        leads = dataLines.map((line, idx) => {
          // split by comma or tab
          const parts = line.split(/,|\t/).map((p) => p.trim().replace(/^["']|["']$/g, ''));
          const email = parts.find((p) => p.includes('@')) || parts[1] || `lead_${idx + 1}@gmail.com`;
          const namePart = parts[0] && !parts[0].includes('@') ? parts[0] : email.split('@')[0];
          const company = parts[2] || namePart || 'Target Brand';
          const ig = parts.find((p) => p.startsWith('@') || p.includes('instagram.com')) || parts[3];

          return {
            name: namePart,
            email: email,
            companyOrBrand: company,
            category: defaultCategory,
            instagramHandle: ig ? (ig.startsWith('@') ? ig : `@${ig.split('/').pop()}`) : undefined,
            notes: `Imported from CSV: ${name}`,
          };
        });
      }

      setParsedLeads(leads);
    } catch (err: any) {
      console.error('Failed to parse file:', err);
      setErrorMsg(`Failed to parse file. Make sure it is valid CSV or JSON format. (${err.message})`);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (evt) => {
        const text = evt.target?.result as string;
        parseFileContent(text, file.name);
      };
      reader.readAsText(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (evt) => {
        const text = evt.target?.result as string;
        parseFileContent(text, file.name);
      };
      reader.readAsText(file);
    }
  };

  const handleImport = () => {
    if (parsedLeads.length > 0) {
      onImportLeads(parsedLeads);
      onClose();
    }
  };

  const handleDownloadSampleCsv = () => {
    const csvContent = `Name,Email,Company,Category,Instagram,YouTube,Website
Jane Doe,contact@creatorstudio.com,Creator Studio,PERSONAL_BRAND,@janedoe,https://youtube.com/@janedoe,https://janedoe.com
Partner Brand,partnerships@sportsplatform.com,Sports Platform,SPORTSBOOK,@sportsplatform,,https://sportsplatform.com`;

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'leads_import_template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 text-xs font-sans">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        className="flex h-full max-h-[85vh] w-full max-w-2xl flex-col rounded-2xl border border-white/10 bg-[#12141c]/95 backdrop-blur-md text-zinc-200 shadow-2xl overflow-hidden font-sans"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 bg-white/[0.03] px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="rounded-lg bg-emerald-500/20 p-2 border border-emerald-500/30">
              <FileSpreadsheet className="h-4 w-4 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white tracking-tight">Upload Full Lead Dataset (Auto-Fetch)</h2>
              <p className="text-xs text-zinc-400">Import custom CSV or JSON lead files directly into pipeline</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-zinc-400 hover:bg-white/10 hover:text-white transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Controls bar */}
          <div className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-black/40 p-3">
            <div className="flex items-center gap-2">
              <span className="text-zinc-400 font-semibold">Default Category:</span>
              <select
                value={defaultCategory}
                onChange={(e) => setDefaultCategory(e.target.value as LeadCategory)}
                className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-white focus:border-indigo-500 text-xs"
              >
                <option value="PERSONAL_BRAND">Personal Brand / Coach</option>
                <option value="STREAMER">Streamer (Twitch/Kick)</option>
                <option value="SPORTSBOOK">Sportsbook Operator</option>
                <option value="INDIE_LABEL">Indie Music Label</option>
              </select>
            </div>

            <button
              onClick={handleDownloadSampleCsv}
              className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1 text-xs text-amber-300 hover:bg-white/10 transition-all font-semibold"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Download Sample CSV</span>
            </button>
          </div>

          {/* Drag & Drop Zone */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragActive(true);
            }}
            onDragLeave={() => setDragActive(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`cursor-pointer rounded-2xl border-2 border-dashed p-8 text-center transition-all flex flex-col items-center justify-center space-y-3 ${
              dragActive
                ? 'border-emerald-400 bg-emerald-500/10'
                : 'border-white/15 bg-white/[0.02] hover:border-emerald-500/50 hover:bg-white/[0.04]'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.json,.txt"
              onChange={handleFileChange}
              className="hidden"
            />
            <div className="rounded-full bg-emerald-500/20 p-3.5 border border-emerald-500/30 text-emerald-400">
              <Upload className="h-6 w-6" />
            </div>
            <div>
              <p className="font-bold text-white text-sm">
                {fileName ? `Loaded: ${fileName}` : 'Click to Browse or Drag & Drop Dataset File'}
              </p>
              <p className="text-xs text-zinc-400 mt-1">Supports CSV, JSON, TSV, or comma-separated TXT lists</p>
            </div>
          </div>

          {/* Error display */}
          {errorMsg && (
            <div className="flex items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-rose-300 text-xs font-mono">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Parsed Leads Preview Table */}
          {parsedLeads.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-emerald-400 flex items-center gap-1.5">
                  <Check className="h-4 w-4" /> Parsed {parsedLeads.length} Lead Record(s) Ready
                </span>
                <span className="text-zinc-400 font-mono text-[11px]">{fileName}</span>
              </div>

              <div className="max-h-52 overflow-y-auto rounded-xl border border-white/10 bg-black/50 p-2 font-mono text-[11px]">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-white/10 text-zinc-400 text-[10px]">
                      <th className="p-2">Name</th>
                      <th className="p-2">Email</th>
                      <th className="p-2">Company / Brand</th>
                      <th className="p-2">Instagram</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parsedLeads.map((lead, i) => (
                      <tr key={i} className="border-b border-white/5 hover:bg-white/5 text-zinc-300">
                        <td className="p-2 font-semibold text-white">{lead.name}</td>
                        <td className="p-2 text-indigo-300">{lead.email}</td>
                        <td className="p-2">{lead.companyOrBrand}</td>
                        <td className="p-2 text-pink-300">{lead.instagramHandle || 'N/A'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-white/10 bg-black/40 p-4 flex items-center justify-between">
          <button
            onClick={onClose}
            className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-zinc-300 hover:bg-white/10 transition-all font-semibold"
          >
            Cancel
          </button>

          <button
            onClick={handleImport}
            disabled={parsedLeads.length === 0}
            className="flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 font-bold text-white hover:bg-emerald-500 transition-all shadow-lg shadow-emerald-600/30 disabled:opacity-40 text-xs"
          >
            <Sparkles className="h-4 w-4" />
            <span>Import {parsedLeads.length} Lead(s) into Pipeline</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
};
