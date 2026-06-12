"use client";

import { use, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  Phone,
  MessageSquare,
  Mail,
  BellPlus,
  Sparkles,
  Cake,
  ArrowLeft,
  FlaskConical,
  Package,
  StickyNote,
  Pencil,
  Check,
  X,
  Plus,
} from "lucide-react";
import {
  Avatar,
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
import { formatDate, formatDateTime } from "@/lib/dates";

interface Profile {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  birthday: string | null;
  photoUrl: string | null;
  status: string;
  interests: string[];
  commPreference: string | null;
  notes: string | null;
  daysSinceContact: number | null;
  aiSuggestion: string;
  purchases: { id: string; purchasedAt: string; product: { name: string } }[];
  balanceTests: { id: string; testDate: string; notes: string | null }[];
  messages: { id: string; channel: string; direction: string; body: string; status: string; createdAt: string }[];
  reminders: { id: string; title: string; dueDate: string; type: string }[];
  timeline: { id: string; type: string; title: string; description: string | null; occurredAt: string }[];
}

const TIMELINE_ICONS: Record<string, React.ReactNode> = {
  PURCHASE: <Package size={14} />,
  BALANCE_TEST: <FlaskConical size={14} />,
  NOTE: <StickyNote size={14} />,
  MESSAGE_SENT: <MessageSquare size={14} />,
  MESSAGE_RECEIVED: <MessageSquare size={14} />,
  AI_SUGGESTION: <Sparkles size={14} />,
};

export default function ContactProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [reminderTitle, setReminderTitle] = useState("");
  const [reminderDate, setReminderDate] = useState("");
  const [showReminderForm, setShowReminderForm] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState<Record<string, string>>({});
  const [orderProduct, setOrderProduct] = useState("");
  const [showOrderForm, setShowOrderForm] = useState(false);
  const [testDate, setTestDate] = useState("");
  const [showTestForm, setShowTestForm] = useState(false);
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyChannel, setReplyChannel] = useState("SMS");
  const [replyBody, setReplyBody] = useState("");

  const load = useCallback(() => api<Profile>(`/api/contacts/${id}`).then(setProfile), [id]);
  useEffect(() => {
    load();
  }, [load]);

  if (!profile) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Spinner className="h-6 w-6" />
      </div>
    );
  }

  const fullName = `${profile.firstName} ${profile.lastName}`.trim();

  const generateMessage = async () => {
    setBusy("message");
    setFeedback(null);
    try {
      await api("/api/messages", {
        method: "POST",
        body: JSON.stringify({ contactId: id, purpose: "friendly check-in" }),
      });
      setFeedback("Draft created — review it in Approvals.");
    } catch (err) {
      setFeedback(err instanceof Error ? err.message : "Failed to generate draft");
    } finally {
      setBusy(null);
    }
  };

  const addNote = async () => {
    if (!note.trim()) return;
    setBusy("note");
    try {
      await api(`/api/contacts/${id}/notes`, { method: "POST", body: JSON.stringify({ note }) });
      setNote("");
      await load();
    } finally {
      setBusy(null);
    }
  };

  const startEdit = () => {
    setEditForm({
      firstName: profile.firstName,
      lastName: profile.lastName,
      email: profile.email ?? "",
      phone: profile.phone ?? "",
      address: profile.address ?? "",
      birthday: profile.birthday ? profile.birthday.slice(0, 10) : "",
      status: profile.status,
      commPreference: profile.commPreference ?? "",
      interests: profile.interests.join(", "),
      notes: profile.notes ?? "",
    });
    setEditing(true);
  };

  const saveEdit = async () => {
    setBusy("edit");
    try {
      await api(`/api/contacts/${id}`, {
        method: "PATCH",
        body: JSON.stringify({
          firstName: editForm.firstName,
          lastName: editForm.lastName,
          email: editForm.email || null,
          phone: editForm.phone || null,
          address: editForm.address || null,
          birthday: editForm.birthday || null,
          status: editForm.status,
          commPreference: editForm.commPreference || null,
          interests: editForm.interests.split(",").map((s) => s.trim()).filter(Boolean),
          notes: editForm.notes || null,
        }),
      });
      setEditing(false);
      await load();
    } finally {
      setBusy(null);
    }
  };

  const logOrder = async () => {
    if (!orderProduct.trim()) return;
    setBusy("order");
    try {
      await api(`/api/contacts/${id}/purchases`, {
        method: "POST",
        body: JSON.stringify({ productName: orderProduct.trim() }),
      });
      setOrderProduct("");
      setShowOrderForm(false);
      await load();
    } finally {
      setBusy(null);
    }
  };

  const recordTest = async () => {
    if (!testDate) return;
    setBusy("test");
    try {
      await api(`/api/contacts/${id}/balance-tests`, {
        method: "POST",
        body: JSON.stringify({ testDate }),
      });
      setTestDate("");
      setShowTestForm(false);
      await load();
    } finally {
      setBusy(null);
    }
  };

  const logReply = async () => {
    if (!replyBody.trim()) return;
    setBusy("reply");
    setFeedback(null);
    try {
      const result = await api<{ flagged: boolean }>(`/api/contacts/${id}/inbound`, {
        method: "POST",
        body: JSON.stringify({ channel: replyChannel, body: replyBody }),
      });
      setReplyBody("");
      setShowReplyForm(false);
      if (result.flagged) {
        setFeedback(
          "Heads up: this looks like a medical question. It's been flagged for your review and a compliant reply draft is waiting in Approvals."
        );
      }
      await load();
    } finally {
      setBusy(null);
    }
  };

  const resolveReminder = async (reminderId: string, status: "DONE" | "DISMISSED") => {
    await api("/api/reminders", {
      method: "PATCH",
      body: JSON.stringify({ id: reminderId, status }),
    });
    await load();
  };

  const createReminder = async () => {
    if (!reminderTitle.trim() || !reminderDate) return;
    setBusy("reminder");
    try {
      await api("/api/reminders", {
        method: "POST",
        body: JSON.stringify({ contactId: id, title: reminderTitle, dueDate: reminderDate }),
      });
      setReminderTitle("");
      setReminderDate("");
      setShowReminderForm(false);
      await load();
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-6">
      <Link
        href="/contacts"
        className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-accent-500 animate-fade-in"
      >
        <ArrowLeft size={15} /> Contacts
      </Link>

      {/* Header card */}
      <GlassCard className="animate-fade-up">
        <div className="flex flex-wrap items-center gap-5">
          <Avatar name={fullName} src={profile.photoUrl} size="xl" />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight">{fullName}</h1>
              <Badge color={profile.status === "CUSTOMER" ? "green" : profile.status === "LEAD" ? "purple" : "gray"}>
                {profile.status.toLowerCase()}
              </Badge>
              <button
                onClick={editing ? () => setEditing(false) : startEdit}
                className="ml-1 rounded-full p-1.5 text-slate-400 transition-colors hover:bg-white/60 hover:text-accent-500 dark:hover:bg-white/10"
                title={editing ? "Cancel editing" : "Edit contact"}
              >
                {editing ? <X size={16} /> : <Pencil size={16} />}
              </button>
            </div>
            <div className="mt-1 flex flex-wrap gap-x-4 gap-y-0.5 text-sm text-slate-500 dark:text-slate-400">
              {profile.email && <span>{profile.email}</span>}
              {profile.phone && <span>{profile.phone}</span>}
              {profile.birthday && (
                <span className="inline-flex items-center gap-1">
                  <Cake size={13} /> {formatDate(profile.birthday)}
                </span>
              )}
            </div>
            {profile.interests.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {profile.interests.map((i) => (
                  <Badge key={i} color="gray">{i}</Badge>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Inline edit form */}
        {editing && (
          <div className="mt-5 space-y-3 rounded-xl bg-white/50 p-4 animate-scale-in dark:bg-white/5">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <EditField label="First name" value={editForm.firstName} onChange={(v) => setEditForm((f) => ({ ...f, firstName: v }))} />
              <EditField label="Last name" value={editForm.lastName} onChange={(v) => setEditForm((f) => ({ ...f, lastName: v }))} />
              <EditField label="Email" value={editForm.email} onChange={(v) => setEditForm((f) => ({ ...f, email: v }))} />
              <EditField label="Phone" value={editForm.phone} onChange={(v) => setEditForm((f) => ({ ...f, phone: v }))} />
              <EditField label="Birthday" type="date" value={editForm.birthday} onChange={(v) => setEditForm((f) => ({ ...f, birthday: v }))} />
              <label className="block">
                <span className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-slate-400">Status</span>
                <select
                  value={editForm.status}
                  onChange={(e) => setEditForm((f) => ({ ...f, status: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200/80 bg-white/80 px-3.5 py-2 text-sm focus:border-accent-400 focus:outline-none dark:border-white/10 dark:bg-white/5 dark:text-slate-100"
                >
                  <option value="LEAD">Lead</option>
                  <option value="CUSTOMER">Customer</option>
                  <option value="INACTIVE">Inactive</option>
                </select>
              </label>
              <EditField label="Address" value={editForm.address} onChange={(v) => setEditForm((f) => ({ ...f, address: v }))} />
              <EditField label="Interests (comma-separated)" value={editForm.interests} onChange={(v) => setEditForm((f) => ({ ...f, interests: v }))} />
              <EditField label="Notes" value={editForm.notes} onChange={(v) => setEditForm((f) => ({ ...f, notes: v }))} />
            </div>
            <Button onClick={saveEdit} disabled={busy === "edit" || !editForm.firstName?.trim()}>
              {busy === "edit" ? <Spinner className="border-white/40 border-t-white" /> : <Check size={15} />}
              Save changes
            </Button>
          </div>
        )}

        {/* Quick actions */}
        <div className="mt-5 flex flex-wrap gap-2">
          <a href={profile.phone ? `tel:${profile.phone}` : undefined}>
            <Button variant="secondary" disabled={!profile.phone}>
              <Phone size={15} /> Call
            </Button>
          </a>
          <a href={profile.phone ? `sms:${profile.phone}` : undefined}>
            <Button variant="secondary" disabled={!profile.phone}>
              <MessageSquare size={15} /> Text
            </Button>
          </a>
          <a href={profile.email ? `mailto:${profile.email}` : undefined}>
            <Button variant="secondary" disabled={!profile.email}>
              <Mail size={15} /> Email
            </Button>
          </a>
          <Button variant="secondary" onClick={() => setShowReminderForm((v) => !v)}>
            <BellPlus size={15} /> Reminder
          </Button>
          <Button variant="secondary" onClick={() => setShowReplyForm((v) => !v)}>
            <MessageSquare size={15} /> Log reply
          </Button>
          <Button onClick={generateMessage} disabled={busy === "message"}>
            {busy === "message" ? <Spinner className="border-white/40 border-t-white" /> : <Sparkles size={15} />}
            Generate message
          </Button>
        </div>

        {showReminderForm && (
          <div className="mt-4 flex flex-wrap items-end gap-2 animate-scale-in">
            <div className="min-w-48 flex-1">
              <Input
                value={reminderTitle}
                onChange={(e) => setReminderTitle(e.target.value)}
                placeholder="Reminder title"
              />
            </div>
            <Input
              type="date"
              value={reminderDate}
              onChange={(e) => setReminderDate(e.target.value)}
              className="w-44"
            />
            <Button onClick={createReminder} disabled={busy === "reminder"}>
              Save
            </Button>
          </div>
        )}

        {showReplyForm && (
          <div className="mt-4 space-y-2 animate-scale-in">
            <div className="flex gap-2">
              <select
                value={replyChannel}
                onChange={(e) => setReplyChannel(e.target.value)}
                className="rounded-xl border border-slate-200/80 bg-white/80 px-3 py-2 text-sm focus:border-accent-400 focus:outline-none dark:border-white/10 dark:bg-white/5 dark:text-slate-100"
              >
                <option value="SMS">SMS</option>
                <option value="EMAIL">Email</option>
                <option value="WHATSAPP">WhatsApp</option>
              </select>
              <span className="self-center text-xs text-slate-400">
                Paste what {profile.firstName} sent you — it joins the timeline.
              </span>
            </div>
            <Textarea
              rows={2}
              value={replyBody}
              onChange={(e) => setReplyBody(e.target.value)}
              placeholder={`e.g. "Thanks! Feeling great so far — when should I re-test?"`}
            />
            <Button onClick={logReply} disabled={!replyBody.trim() || busy === "reply"}>
              {busy === "reply" ? <Spinner className="border-white/40 border-t-white" /> : <Check size={15} />}
              Save reply
            </Button>
          </div>
        )}

        {feedback && (
          <p className="mt-3 text-sm text-accent-600 dark:text-accent-300 animate-fade-in">
            {feedback}{" "}
            <Link href="/approvals" className="font-medium underline">
              Open approvals
            </Link>
          </p>
        )}
      </GlassCard>

      {/* AI suggestion */}
      <GlassCard className="border-accent-200/60 animate-fade-up">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-accent-500/10 text-accent-500">
            <Sparkles size={16} />
          </div>
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-accent-500">
              AI suggestion
            </div>
            <p className="mt-0.5 text-sm text-slate-600 dark:text-slate-300">{profile.aiSuggestion}</p>
          </div>
        </div>
      </GlassCard>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Timeline */}
        <section className="lg:col-span-2 animate-fade-up">
          <SectionTitle>Timeline</SectionTitle>
          <GlassCard>
            {profile.timeline.length === 0 ? (
              <EmptyState title="No history yet" />
            ) : (
              <ol className="relative ml-2 space-y-5 border-l border-slate-200 pl-5 dark:border-white/10">
                {profile.timeline.map((e) => (
                  <li key={e.id} className="relative">
                    <span className="absolute -left-[27px] flex h-4 w-4 items-center justify-center rounded-full bg-accent-500/15 text-accent-500 ring-4 ring-[#f2f4f8] dark:ring-[#0b0f17]">
                      {TIMELINE_ICONS[e.type] ?? <span className="h-1.5 w-1.5 rounded-full bg-accent-500" />}
                    </span>
                    <div className="text-sm font-medium">{e.title}</div>
                    {e.description && (
                      <div className="text-sm text-slate-500 dark:text-slate-400">{e.description}</div>
                    )}
                    <div className="text-xs text-slate-400">{formatDateTime(e.occurredAt)}</div>
                  </li>
                ))}
              </ol>
            )}
          </GlassCard>

          <div className="mt-4">
            <SectionTitle>Add note</SectionTitle>
            <GlassCard className="space-y-2">
              <Textarea
                rows={2}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Jot something down about this contact…"
              />
              <Button variant="secondary" onClick={addNote} disabled={!note.trim() || busy === "note"}>
                Save note
              </Button>
            </GlassCard>
          </div>
        </section>

        {/* Side column */}
        <div className="space-y-6">
          <section className="animate-fade-up">
            <SectionTitle
              action={
                <button
                  onClick={() => setShowOrderForm((v) => !v)}
                  className="inline-flex items-center gap-1 text-xs font-medium text-accent-500 hover:underline"
                >
                  <Plus size={12} /> Log order
                </button>
              }
            >
              Products
            </SectionTitle>
            <GlassCard className="divide-y divide-slate-100 p-0 dark:divide-white/5">
              {showOrderForm && (
                <div className="flex gap-2 p-3 animate-scale-in">
                  <Input
                    value={orderProduct}
                    onChange={(e) => setOrderProduct(e.target.value)}
                    placeholder="e.g. BalanceOil+"
                    list="zinzino-products"
                  />
                  <datalist id="zinzino-products">
                    <option value="BalanceOil+" />
                    <option value="ZinoBiotic+" />
                    <option value="Xtend" />
                    <option value="Protect+" />
                    <option value="Viva+" />
                  </datalist>
                  <Button onClick={logOrder} disabled={!orderProduct.trim() || busy === "order"} className="shrink-0">
                    Save
                  </Button>
                </div>
              )}
              {profile.purchases.length === 0 && !showOrderForm ? (
                <EmptyState title="No orders yet" />
              ) : (
                profile.purchases.map((p) => (
                  <div key={p.id} className="flex items-center justify-between px-5 py-3">
                    <span className="text-sm font-medium">{p.product.name}</span>
                    <span className="text-xs text-slate-400">{formatDate(p.purchasedAt)}</span>
                  </div>
                ))
              )}
            </GlassCard>
          </section>

          <section className="animate-fade-up">
            <SectionTitle
              action={
                <button
                  onClick={() => setShowTestForm((v) => !v)}
                  className="inline-flex items-center gap-1 text-xs font-medium text-accent-500 hover:underline"
                >
                  <Plus size={12} /> Record test
                </button>
              }
            >
              BalanceTests
            </SectionTitle>
            <GlassCard className="divide-y divide-slate-100 p-0 dark:divide-white/5">
              {showTestForm && (
                <div className="flex gap-2 p-3 animate-scale-in">
                  <Input type="date" value={testDate} onChange={(e) => setTestDate(e.target.value)} />
                  <Button onClick={recordTest} disabled={!testDate || busy === "test"} className="shrink-0">
                    Save
                  </Button>
                </div>
              )}
              {profile.balanceTests.length === 0 && !showTestForm ? (
                <EmptyState title="No tests on record" />
              ) : (
                profile.balanceTests.map((t) => (
                  <div key={t.id} className="px-5 py-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">BalanceTest</span>
                      <span className="text-xs text-slate-400">{formatDate(t.testDate)}</span>
                    </div>
                    {t.notes && <p className="text-xs text-slate-400">{t.notes}</p>}
                  </div>
                ))
              )}
            </GlassCard>
          </section>

          <section className="animate-fade-up">
            <SectionTitle>Upcoming reminders</SectionTitle>
            <GlassCard className="divide-y divide-slate-100 p-0 dark:divide-white/5">
              {profile.reminders.length === 0 ? (
                <EmptyState title="No reminders" />
              ) : (
                profile.reminders.map((r) => (
                  <div key={r.id} className="flex items-center justify-between gap-2 px-5 py-3">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium">{r.title}</div>
                      <div className="text-xs text-slate-400">due {formatDate(r.dueDate)}</div>
                    </div>
                    <div className="flex shrink-0 gap-1">
                      <button
                        onClick={() => resolveReminder(r.id, "DONE")}
                        className="rounded-full p-1.5 text-emerald-500 transition-colors hover:bg-emerald-500/10"
                        title="Mark done"
                      >
                        <Check size={15} />
                      </button>
                      <button
                        onClick={() => resolveReminder(r.id, "DISMISSED")}
                        className="rounded-full p-1.5 text-slate-400 transition-colors hover:bg-red-500/10 hover:text-red-500"
                        title="Dismiss"
                      >
                        <X size={15} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </GlassCard>
          </section>

          <section className="animate-fade-up">
            <SectionTitle>Recent messages</SectionTitle>
            <GlassCard className="divide-y divide-slate-100 p-0 dark:divide-white/5">
              {profile.messages.length === 0 ? (
                <EmptyState title="No messages yet" />
              ) : (
                profile.messages.slice(0, 5).map((m) => (
                  <div key={m.id} className="px-5 py-3">
                    <div className="flex items-center justify-between">
                      <Badge
                        color={
                          m.direction === "INBOUND"
                            ? "purple"
                            : m.status === "SENT"
                              ? "green"
                              : m.status === "REJECTED"
                                ? "red"
                                : "amber"
                        }
                      >
                        {m.direction === "INBOUND"
                          ? `${m.channel.toLowerCase()} · received`
                          : `${m.channel.toLowerCase()} · ${m.status.replace("_", " ").toLowerCase()}`}
                      </Badge>
                      <span className="text-xs text-slate-400">{formatDate(m.createdAt)}</span>
                    </div>
                    <p className="mt-1 line-clamp-2 text-sm text-slate-500 dark:text-slate-400">{m.body}</p>
                  </div>
                ))
              )}
            </GlassCard>
          </section>
        </div>
      </div>
    </div>
  );
}

function EditField({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-slate-400">
        {label}
      </span>
      <Input type={type} value={value} onChange={(e) => onChange(e.target.value)} />
    </label>
  );
}
