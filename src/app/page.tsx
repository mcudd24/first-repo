"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  Users,
  Cake,
  BellRing,
  MailCheck,
  Upload,
  AlertTriangle,
  Play,
  Sparkles,
} from "lucide-react";
import {
  Badge,
  Button,
  EmptyState,
  GlassCard,
  SectionTitle,
  Spinner,
  StatCard,
} from "@/components/ui";
import { api } from "@/lib/api";
import { formatDate, formatDateTime } from "@/lib/dates";

interface Dashboard {
  totals: {
    customers: number;
    leads: number;
    birthdaysToday: number;
    followUpsDue: number;
    pendingMessages: number;
  };
  birthdaysToday: { id: string; name: string }[];
  recentImports: { id: string; source: string; fileName: string | null; status: string; createdAt: string }[];
  upcomingReminders: {
    id: string;
    title: string;
    dueDate: string;
    type: string;
    contact: { id: string; firstName: string; lastName: string };
  }[];
  openReviewTasks: { id: string; reason: string; details: string; createdAt: string }[];
  recentMessages: {
    id: string;
    channel: string;
    body: string;
    sentAt: string;
    contact: { firstName: string; lastName: string };
  }[];
}

export default function DashboardPage() {
  const [data, setData] = useState<Dashboard | null>(null);
  const [running, setRunning] = useState(false);
  const [runResult, setRunResult] = useState<string | null>(null);

  const load = useCallback(() => api<Dashboard>("/api/dashboard").then(setData), []);
  useEffect(() => {
    load();
  }, [load]);

  const runAutomations = async () => {
    setRunning(true);
    setRunResult(null);
    try {
      const result = await api<{ draftsCreated: number; remindersCreated: number }>(
        "/api/automations/run",
        { method: "POST" }
      );
      setRunResult(
        `${result.draftsCreated} draft${result.draftsCreated === 1 ? "" : "s"} and ` +
          `${result.remindersCreated} reminder${result.remindersCreated === 1 ? "" : "s"} created — review in Approvals.`
      );
      await load();
    } catch (err) {
      setRunResult(err instanceof Error ? err.message : "Automation run failed");
    } finally {
      setRunning(false);
    }
  };

  if (!data) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Spinner className="h-6 w-6" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-center justify-between gap-3 animate-fade-up">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Good {greeting()}</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Here&apos;s what&apos;s happening with your customers.
          </p>
        </div>
        <Button onClick={runAutomations} disabled={running}>
          {running ? <Spinner className="border-white/40 border-t-white" /> : <Play size={15} />}
          Run automations
        </Button>
      </header>

      {runResult && (
        <GlassCard className="animate-scale-in border-accent-200/60 text-sm">
          <span className="mr-2 inline-flex text-accent-500">
            <Sparkles size={16} />
          </span>
          {runResult}{" "}
          <Link href="/approvals" className="font-medium text-accent-500 hover:underline">
            Open approvals →
          </Link>
        </GlassCard>
      )}

      <div className="stagger grid grid-cols-2 gap-4 lg:grid-cols-5">
        <StatCard label="Customers" value={data.totals.customers} tint="blue" icon={<Users size={20} />} />
        <StatCard label="Leads" value={data.totals.leads} tint="purple" icon={<Users size={20} />} />
        <StatCard label="Birthdays today" value={data.totals.birthdaysToday} tint="amber" icon={<Cake size={20} />} />
        <StatCard label="Follow-ups due" value={data.totals.followUpsDue} tint="red" icon={<BellRing size={20} />} />
        <StatCard label="Awaiting approval" value={data.totals.pendingMessages} tint="green" icon={<MailCheck size={20} />} />
      </div>

      {data.openReviewTasks.length > 0 && (
        <GlassCard className="border-amber-300/50 animate-fade-up">
          <div className="mb-2 flex items-center gap-2 font-medium text-amber-600 dark:text-amber-400">
            <AlertTriangle size={18} /> Needs your review
          </div>
          <ul className="space-y-2 text-sm">
            {data.openReviewTasks.map((t) => (
              <li key={t.id} className="text-slate-600 dark:text-slate-300">
                <Badge color="amber" className="mr-2">
                  {t.reason.replace("_", " ").toLowerCase()}
                </Badge>
                {t.details}
              </li>
            ))}
          </ul>
        </GlassCard>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="animate-fade-up">
          <SectionTitle>Upcoming reminders</SectionTitle>
          <GlassCard className="divide-y divide-slate-100 p-0 dark:divide-white/5">
            {data.upcomingReminders.length === 0 ? (
              <EmptyState title="Nothing due this week" subtitle="Run automations to generate reminders." />
            ) : (
              data.upcomingReminders.map((r) => (
                <Link
                  key={r.id}
                  href={`/contacts/${r.contact.id}`}
                  className="flex items-center justify-between gap-3 px-5 py-3.5 transition-colors hover:bg-white/50 dark:hover:bg-white/5"
                >
                  <div>
                    <div className="text-sm font-medium">{r.title}</div>
                    <div className="text-xs text-slate-400">due {formatDate(r.dueDate)}</div>
                  </div>
                  <Badge color={r.type === "BIRTHDAY" ? "amber" : r.type === "BALANCE_TEST" ? "purple" : "blue"}>
                    {r.type.replace("_", " ").toLowerCase()}
                  </Badge>
                </Link>
              ))
            )}
          </GlassCard>
        </section>

        <section className="animate-fade-up">
          <SectionTitle
            action={
              <Link href="/import" className="text-xs font-medium text-accent-500 hover:underline">
                New import
              </Link>
            }
          >
            Recent imports
          </SectionTitle>
          <GlassCard className="divide-y divide-slate-100 p-0 dark:divide-white/5">
            {data.recentImports.length === 0 ? (
              <EmptyState
                icon={<Upload size={28} />}
                title="No imports yet"
                subtitle="Scan a form, upload a photo or PDF, or paste an email to add contacts with AI."
              />
            ) : (
              data.recentImports.map((j) => (
                <div key={j.id} className="flex items-center justify-between gap-3 px-5 py-3.5">
                  <div>
                    <div className="text-sm font-medium">{j.fileName ?? `${j.source.toLowerCase()} import`}</div>
                    <div className="text-xs text-slate-400">{formatDateTime(j.createdAt)}</div>
                  </div>
                  <Badge color={j.status === "APPROVED" ? "green" : j.status === "REJECTED" ? "red" : "amber"}>
                    {j.status.replace("_", " ").toLowerCase()}
                  </Badge>
                </div>
              ))
            )}
          </GlassCard>
        </section>
      </div>

      <section className="animate-fade-up">
        <SectionTitle>Recent activity</SectionTitle>
        <GlassCard className="divide-y divide-slate-100 p-0 dark:divide-white/5">
          {data.recentMessages.length === 0 ? (
            <EmptyState title="No messages sent yet" subtitle="Approved messages will appear here." />
          ) : (
            data.recentMessages.map((m) => (
              <div key={m.id} className="px-5 py-3.5">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">
                    {m.contact.firstName} {m.contact.lastName}
                  </span>
                  <span className="text-xs text-slate-400">{formatDateTime(m.sentAt)}</span>
                </div>
                <p className="mt-0.5 line-clamp-1 text-sm text-slate-500 dark:text-slate-400">{m.body}</p>
              </div>
            ))
          )}
        </GlassCard>
      </section>
    </div>
  );
}

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? "morning" : h < 18 ? "afternoon" : "evening";
}
