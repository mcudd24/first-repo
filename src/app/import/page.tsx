"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Upload, FileText, Check, X, Sparkles } from "lucide-react";
import {
  Badge,
  Button,
  EmptyState,
  GlassCard,
  Input,
  SectionTitle,
  Spinner,
  Textarea,
} from "@/components/ui";
import { api } from "@/lib/api";
import { formatDateTime } from "@/lib/dates";

interface Extracted {
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  birthday: string | null;
  products: string[];
  balanceTestDate: string | null;
  notes: string | null;
  interests: string[];
  commPreference: string | null;
}

interface ImportJob {
  id: string;
  source: string;
  fileName: string | null;
  status: string;
  error: string | null;
  createdAt: string;
  extracted: Extracted[];
}

export default function ImportPage() {
  const [jobs, setJobs] = useState<ImportJob[] | null>(null);
  const [text, setText] = useState("");
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  // Per-job editable copies of the extraction, keyed by job id.
  const [edits, setEdits] = useState<Record<string, Extracted[]>>({});
  const [resolving, setResolving] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    const data = await api<ImportJob[]>("/api/imports");
    setJobs(data);
    setEdits((prev) => {
      const next = { ...prev };
      for (const job of data) {
        if (job.status === "PENDING_REVIEW" && !next[job.id]) next[job.id] = job.extracted;
      }
      return next;
    });
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const submit = async () => {
    if (!text.trim() && pendingFiles.length === 0) return;
    setSubmitting(true);
    setError(null);
    try {
      const form = new FormData();
      if (text.trim()) form.set("text", text);
      const source =
        pendingFiles.length === 0
          ? "TEXT"
          : pendingFiles[0].type === "application/pdf"
            ? "PDF"
            : "PHOTO";
      form.set("source", source);
      for (const f of pendingFiles) form.append("files", f);
      await api("/api/imports", { method: "POST", body: form });
      setText("");
      setPendingFiles([]);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Import failed");
    } finally {
      setSubmitting(false);
    }
  };

  const resolve = async (id: string, action: "approve" | "reject") => {
    setResolving(id);
    setError(null);
    try {
      await api(`/api/imports/${id}`, {
        method: "POST",
        body: JSON.stringify(
          action === "approve" ? { action, contacts: edits[id] ?? [] } : { action }
        ),
      });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Action failed");
    } finally {
      setResolving(null);
    }
  };

  const updateField = (jobId: string, idx: number, field: keyof Extracted, value: string) => {
    setEdits((prev) => {
      const rows = [...(prev[jobId] ?? [])];
      const row = { ...rows[idx] };
      if (field === "products" || field === "interests") {
        row[field] = value.split(",").map((s) => s.trim()).filter(Boolean);
      } else {
        (row[field] as string | null) = value || null;
      }
      rows[idx] = row;
      return { ...prev, [jobId]: rows };
    });
  };

  const pendingJobs = jobs?.filter((j) => j.status === "PENDING_REVIEW") ?? [];
  const pastJobs = jobs?.filter((j) => j.status !== "PENDING_REVIEW") ?? [];

  return (
    <div className="space-y-6">
      <header className="animate-fade-up">
        <h1 className="text-2xl font-bold tracking-tight">AI Contact Import</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Scan forms, upload photos, PDFs, or screenshots, or paste a forwarded email. AI extracts
          the contacts; you approve before anything is saved.
        </p>
      </header>

      {/* Drop zone + text input */}
      <GlassCard
        className={`animate-fade-up transition-colors ${dragging ? "border-accent-400 bg-accent-50/50" : ""}`}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          setPendingFiles((prev) => [...prev, ...Array.from(e.dataTransfer.files)]);
        }}
      >
        <button
          onClick={() => fileInput.current?.click()}
          className="flex w-full flex-col items-center gap-2 rounded-xl border-2 border-dashed border-slate-200 py-8 text-slate-400 transition-colors hover:border-accent-300 hover:text-accent-500 dark:border-white/10"
        >
          <Upload size={28} />
          <span className="text-sm font-medium">
            Drop files here or click to upload
          </span>
          <span className="text-xs">Photos, screenshots, scans, PDFs · max 10 MB each</span>
        </button>
        <input
          ref={fileInput}
          type="file"
          multiple
          accept="image/jpeg,image/png,image/gif,image/webp,application/pdf"
          className="hidden"
          onChange={(e) => {
            setPendingFiles((prev) => [...prev, ...Array.from(e.target.files ?? [])]);
            e.target.value = "";
          }}
        />

        {pendingFiles.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2 animate-fade-in">
            {pendingFiles.map((f, i) => (
              <span
                key={`${f.name}-${i}`}
                className="inline-flex items-center gap-1.5 rounded-full bg-accent-500/10 px-3 py-1 text-xs font-medium text-accent-600 dark:text-accent-300"
              >
                <FileText size={12} /> {f.name}
                <button
                  onClick={() => setPendingFiles((prev) => prev.filter((_, j) => j !== i))}
                  className="hover:text-red-500"
                >
                  <X size={12} />
                </button>
              </span>
            ))}
          </div>
        )}

        <div className="mt-4">
          <Textarea
            rows={4}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={
              "…or paste text here (forwarded email, notes from an event, etc.)\n\nExample:\nSarah Johnson\nsarah.j@example.com\n+1 555 0123\nOrdered BalanceOil+ — BalanceTest 2026-04-02"
            }
          />
        </div>

        <div className="mt-3 flex items-center gap-3">
          <Button onClick={submit} disabled={submitting || (!text.trim() && pendingFiles.length === 0)}>
            {submitting ? <Spinner className="border-white/40 border-t-white" /> : <Sparkles size={15} />}
            Extract contacts
          </Button>
          {error && <span className="text-sm text-red-500">{error}</span>}
        </div>
      </GlassCard>

      {/* Pending reviews */}
      {pendingJobs.length > 0 && (
        <section className="animate-fade-up">
          <SectionTitle>Waiting for your approval</SectionTitle>
          <div className="space-y-4">
            {pendingJobs.map((job) => (
              <GlassCard key={job.id} className="animate-scale-in">
                <div className="mb-3 flex items-center justify-between">
                  <div className="text-sm font-medium">
                    {job.fileName ?? `${job.source.toLowerCase()} import`}
                    <span className="ml-2 text-xs font-normal text-slate-400">
                      {formatDateTime(job.createdAt)}
                    </span>
                  </div>
                  <Badge color="amber">needs review</Badge>
                </div>

                <div className="space-y-4">
                  {(edits[job.id] ?? []).map((c, idx) => (
                    <div
                      key={idx}
                      className="grid gap-2 rounded-xl bg-white/50 p-3 sm:grid-cols-2 lg:grid-cols-3 dark:bg-white/5"
                    >
                      <Field label="First name" value={c.firstName} onChange={(v) => updateField(job.id, idx, "firstName", v)} />
                      <Field label="Last name" value={c.lastName} onChange={(v) => updateField(job.id, idx, "lastName", v)} />
                      <Field label="Email" value={c.email ?? ""} onChange={(v) => updateField(job.id, idx, "email", v)} />
                      <Field label="Phone" value={c.phone ?? ""} onChange={(v) => updateField(job.id, idx, "phone", v)} />
                      <Field label="Birthday (YYYY-MM-DD)" value={c.birthday ?? ""} onChange={(v) => updateField(job.id, idx, "birthday", v)} />
                      <Field label="BalanceTest (YYYY-MM-DD)" value={c.balanceTestDate ?? ""} onChange={(v) => updateField(job.id, idx, "balanceTestDate", v)} />
                      <Field label="Products (comma-separated)" value={c.products.join(", ")} onChange={(v) => updateField(job.id, idx, "products", v)} />
                      <Field label="Interests (comma-separated)" value={c.interests.join(", ")} onChange={(v) => updateField(job.id, idx, "interests", v)} />
                      <Field label="Notes" value={c.notes ?? ""} onChange={(v) => updateField(job.id, idx, "notes", v)} />
                    </div>
                  ))}
                </div>

                <div className="mt-4 flex gap-2">
                  <Button
                    variant="success"
                    onClick={() => resolve(job.id, "approve")}
                    disabled={resolving === job.id || (edits[job.id] ?? []).length === 0}
                  >
                    <Check size={15} /> Approve & save{" "}
                    {(edits[job.id] ?? []).length > 1 ? `${(edits[job.id] ?? []).length} contacts` : "contact"}
                  </Button>
                  <Button variant="danger" onClick={() => resolve(job.id, "reject")} disabled={resolving === job.id}>
                    <X size={15} /> Reject
                  </Button>
                </div>
              </GlassCard>
            ))}
          </div>
        </section>
      )}

      {/* History */}
      <section className="animate-fade-up">
        <SectionTitle>Import history</SectionTitle>
        <GlassCard className="divide-y divide-slate-100 p-0 dark:divide-white/5">
          {!jobs ? (
            <div className="flex h-24 items-center justify-center">
              <Spinner />
            </div>
          ) : pastJobs.length === 0 ? (
            <EmptyState title="No completed imports yet" />
          ) : (
            pastJobs.map((j) => (
              <div key={j.id} className="flex items-center justify-between px-5 py-3.5">
                <div>
                  <div className="text-sm font-medium">
                    {j.fileName ?? `${j.source.toLowerCase()} import`}
                  </div>
                  <div className="text-xs text-slate-400">
                    {formatDateTime(j.createdAt)}
                    {j.error && <span className="ml-2 text-red-400">{j.error}</span>}
                  </div>
                </div>
                <Badge color={j.status === "APPROVED" ? "green" : "red"}>
                  {j.status.toLowerCase()}
                </Badge>
              </div>
            ))
          )}
        </GlassCard>
      </section>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-slate-400">
        {label}
      </span>
      <Input value={value} onChange={(e) => onChange(e.target.value)} />
    </label>
  );
}
