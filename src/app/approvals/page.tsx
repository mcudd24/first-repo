"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Check, X, Pencil, MailCheck, Sparkles } from "lucide-react";
import {
  Avatar,
  Badge,
  Button,
  EmptyState,
  GlassCard,
  Spinner,
  Textarea,
  Input,
} from "@/components/ui";
import { api } from "@/lib/api";
import { formatDateTime } from "@/lib/dates";

interface PendingMessage {
  id: string;
  channel: string;
  subject: string | null;
  body: string;
  source: string | null;
  aiGenerated: boolean;
  createdAt: string;
  contact: { id: string; firstName: string; lastName: string; email: string | null; phone: string | null };
}

const SOURCE_LABELS: Record<string, string> = {
  BIRTHDAY: "Birthday automation",
  FOLLOW_UP_30: "30-day follow-up",
  FOLLOW_UP_60: "60-day follow-up",
  FOLLOW_UP_90: "90-day follow-up",
  BALANCE_TEST_6M: "BalanceTest reminder",
  REORDER: "Reorder reminder",
  INACTIVE: "Inactive customer",
  LEAD_NURTURE: "Lead nurture",
  copilot: "AI Copilot",
  manual: "Manual request",
};

export default function ApprovalsPage() {
  const [messages, setMessages] = useState<PendingMessage[] | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const [editBody, setEditBody] = useState("");
  const [editSubject, setEditSubject] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    () => api<PendingMessage[]>("/api/messages?status=PENDING_APPROVAL").then(setMessages),
    []
  );
  useEffect(() => {
    load();
  }, [load]);

  const act = async (id: string, action: "approve" | "reject") => {
    setBusy(id);
    setError(null);
    try {
      await api(`/api/messages/${id}`, { method: "PATCH", body: JSON.stringify({ action }) });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Action failed");
    } finally {
      setBusy(null);
    }
  };

  const saveEdit = async (id: string) => {
    setBusy(id);
    setError(null);
    try {
      await api(`/api/messages/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ action: "edit", body: editBody, subject: editSubject || null }),
      });
      setEditing(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-5">
      <header className="animate-fade-up">
        <h1 className="text-2xl font-bold tracking-tight">Approvals</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Every AI-generated message waits here. Nothing is sent without your sign-off.
        </p>
      </header>

      {error && (
        <GlassCard className="border-red-300/60 text-sm text-red-600 dark:text-red-400 animate-scale-in">
          {error}
        </GlassCard>
      )}

      {!messages ? (
        <div className="flex h-48 items-center justify-center">
          <Spinner className="h-6 w-6" />
        </div>
      ) : messages.length === 0 ? (
        <GlassCard className="animate-fade-up">
          <EmptyState
            icon={<MailCheck size={32} />}
            title="All caught up"
            subtitle="Run automations from the dashboard or generate a message from a contact profile to create drafts."
          />
        </GlassCard>
      ) : (
        <div className="stagger space-y-4">
          {messages.map((m) => (
            <GlassCard key={m.id}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Link
                  href={`/contacts/${m.contact.id}`}
                  className="flex items-center gap-3 hover:opacity-80"
                >
                  <Avatar name={`${m.contact.firstName} ${m.contact.lastName}`} size="sm" />
                  <div>
                    <div className="text-sm font-medium">
                      {m.contact.firstName} {m.contact.lastName}
                    </div>
                    <div className="text-xs text-slate-400">
                      {m.channel === "EMAIL" ? m.contact.email : m.contact.phone} · {formatDateTime(m.createdAt)}
                    </div>
                  </div>
                </Link>
                <div className="flex items-center gap-2">
                  {m.aiGenerated && (
                    <Badge color="purple">
                      <Sparkles size={11} className="mr-1" /> AI
                    </Badge>
                  )}
                  <Badge color="blue">{m.channel.toLowerCase()}</Badge>
                  {m.source && <Badge color="gray">{SOURCE_LABELS[m.source] ?? m.source}</Badge>}
                </div>
              </div>

              {editing === m.id ? (
                <div className="mt-3 space-y-2 animate-fade-in">
                  {m.channel === "EMAIL" && (
                    <Input
                      value={editSubject}
                      onChange={(e) => setEditSubject(e.target.value)}
                      placeholder="Subject"
                    />
                  )}
                  <Textarea rows={4} value={editBody} onChange={(e) => setEditBody(e.target.value)} />
                  <div className="flex gap-2">
                    <Button onClick={() => saveEdit(m.id)} disabled={busy === m.id}>
                      Save
                    </Button>
                    <Button variant="secondary" onClick={() => setEditing(null)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="mt-3 rounded-xl bg-white/60 p-4 text-sm dark:bg-white/5">
                  {m.subject && <div className="mb-1 font-medium">{m.subject}</div>}
                  <p className="whitespace-pre-wrap text-slate-600 dark:text-slate-300">{m.body}</p>
                </div>
              )}

              {editing !== m.id && (
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button variant="success" onClick={() => act(m.id, "approve")} disabled={busy === m.id}>
                    {busy === m.id ? <Spinner className="border-white/40 border-t-white" /> : <Check size={15} />}
                    Approve & send
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setEditing(m.id);
                      setEditBody(m.body);
                      setEditSubject(m.subject ?? "");
                    }}
                  >
                    <Pencil size={14} /> Edit
                  </Button>
                  <Button variant="danger" onClick={() => act(m.id, "reject")} disabled={busy === m.id}>
                    <X size={15} /> Reject
                  </Button>
                </div>
              )}
            </GlassCard>
          ))}
        </div>
      )}
    </div>
  );
}
