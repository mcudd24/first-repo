"use client";

import { useEffect, useState } from "react";
import { Cake, BellRing, FlaskConical, Package, Moon, Heart, ShieldCheck } from "lucide-react";
import { GlassCard, SectionTitle, Spinner, Toggle } from "@/components/ui";
import { api } from "@/lib/api";
import { formatDateTime } from "@/lib/dates";

interface Automation {
  id: string;
  type: string;
  name: string;
  description: string;
  enabled: boolean;
  config: { days?: number };
  lastRunAt: string | null;
}

const ICONS: Record<string, React.ReactNode> = {
  BIRTHDAY: <Cake size={18} />,
  FOLLOW_UP_30: <BellRing size={18} />,
  FOLLOW_UP_60: <BellRing size={18} />,
  FOLLOW_UP_90: <BellRing size={18} />,
  BALANCE_TEST_6M: <FlaskConical size={18} />,
  REORDER: <Package size={18} />,
  INACTIVE: <Moon size={18} />,
  LEAD_NURTURE: <Heart size={18} />,
};

export default function AutomationsPage() {
  const [automations, setAutomations] = useState<Automation[] | null>(null);

  useEffect(() => {
    api<Automation[]>("/api/automations").then(setAutomations);
  }, []);

  const toggle = async (a: Automation) => {
    // Optimistic flip; revert on failure.
    setAutomations((prev) =>
      prev?.map((x) => (x.id === a.id ? { ...x, enabled: !a.enabled } : x)) ?? null
    );
    try {
      await api("/api/automations", {
        method: "PATCH",
        body: JSON.stringify({ id: a.id, enabled: !a.enabled }),
      });
    } catch {
      setAutomations((prev) =>
        prev?.map((x) => (x.id === a.id ? { ...x, enabled: a.enabled } : x)) ?? null
      );
    }
  };

  const updateDays = async (a: Automation, days: number) => {
    if (!Number.isFinite(days) || days < 1) return;
    setAutomations((prev) =>
      prev?.map((x) => (x.id === a.id ? { ...x, config: { ...x.config, days } } : x)) ?? null
    );
    await api("/api/automations", {
      method: "PATCH",
      body: JSON.stringify({ id: a.id, config: { ...a.config, days } }),
    });
  };

  return (
    <div className="space-y-5">
      <header className="animate-fade-up">
        <h1 className="text-2xl font-bold tracking-tight">Automations</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Rules that draft messages and create reminders for you.
        </p>
      </header>

      <GlassCard className="flex items-center gap-3 border-emerald-300/50 text-sm animate-fade-up">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500">
          <ShieldCheck size={18} />
        </span>
        <p className="text-slate-600 dark:text-slate-300">
          <span className="font-medium">Approval mode is on.</span> Automations only create drafts
          and reminders — nothing is ever sent without your explicit approval.
        </p>
      </GlassCard>

      <SectionTitle>Rules</SectionTitle>
      {!automations ? (
        <div className="flex h-48 items-center justify-center">
          <Spinner className="h-6 w-6" />
        </div>
      ) : (
        <div className="stagger grid gap-4 sm:grid-cols-2">
          {automations.map((a) => (
            <GlassCard key={a.id} className={a.enabled ? "" : "opacity-60"}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-accent-500/10 text-accent-500">
                    {ICONS[a.type] ?? <BellRing size={18} />}
                  </span>
                  <div>
                    <div className="font-medium">{a.name}</div>
                    <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">{a.description}</p>
                  </div>
                </div>
                <Toggle checked={a.enabled} onChange={() => toggle(a)} />
              </div>

              <div className="mt-4 flex items-center justify-between text-xs text-slate-400">
                {a.config.days !== undefined ? (
                  <label className="flex items-center gap-2">
                    Trigger after
                    <input
                      type="number"
                      min={1}
                      defaultValue={a.config.days}
                      onBlur={(e) => updateDays(a, Number(e.target.value))}
                      className="w-16 rounded-lg border border-slate-200/80 bg-white/80 px-2 py-1 text-center text-xs focus:border-accent-400 focus:outline-none dark:border-white/10 dark:bg-white/5"
                    />
                    days
                  </label>
                ) : (
                  <span>Triggers on the day</span>
                )}
                <span>{a.lastRunAt ? `Last run ${formatDateTime(a.lastRunAt)}` : "Never run"}</span>
              </div>
            </GlassCard>
          ))}
        </div>
      )}
    </div>
  );
}
