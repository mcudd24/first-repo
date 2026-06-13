"use client";

import { useEffect, useState } from "react";
import { Bot, Save, UserCircle2 } from "lucide-react";
import { Badge, Button, GlassCard, Input, SectionTitle, Spinner, Textarea } from "@/components/ui";
import { api } from "@/lib/api";

interface Settings {
  partnerName: string;
  emailSignature: string;
  aiProvider: "claude" | "mock";
  aiModel: string | null;
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [partnerName, setPartnerName] = useState("");
  const [emailSignature, setEmailSignature] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    api<Settings>("/api/settings").then((s) => {
      setSettings(s);
      setPartnerName(s.partnerName);
      setEmailSignature(s.emailSignature);
    });
  }, []);

  const save = async () => {
    setSaving(true);
    setSaved(false);
    try {
      await api("/api/settings", {
        method: "PATCH",
        body: JSON.stringify({ partnerName, emailSignature }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } finally {
      setSaving(false);
    }
  };

  if (!settings) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Spinner className="h-6 w-6" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <header className="animate-fade-up">
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Your identity flows into every AI-generated message.
        </p>
      </header>

      <section className="animate-fade-up">
        <SectionTitle>Your profile</SectionTitle>
        <GlassCard className="space-y-4">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-accent-500/10 text-accent-500">
              <UserCircle2 size={20} />
            </span>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              The AI signs messages with your name, and your signature is appended to emails.
            </p>
          </div>
          <label className="block">
            <span className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-slate-400">
              Your name
            </span>
            <Input
              value={partnerName}
              onChange={(e) => setPartnerName(e.target.value)}
              placeholder="e.g. Michael Cudd"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-slate-400">
              Email signature
            </span>
            <Textarea
              rows={3}
              value={emailSignature}
              onChange={(e) => setEmailSignature(e.target.value)}
              placeholder={"Warm regards,\nMichael · Independent Zinzino Partner"}
            />
          </label>
          <div className="flex items-center gap-3">
            <Button onClick={save} disabled={saving}>
              {saving ? <Spinner className="border-white/40 border-t-white" /> : <Save size={15} />}
              Save
            </Button>
            {saved && (
              <span className="text-sm text-emerald-600 dark:text-emerald-400 animate-fade-in">
                Saved
              </span>
            )}
          </div>
        </GlassCard>
      </section>

      <section className="animate-fade-up">
        <SectionTitle>AI engine</SectionTitle>
        <GlassCard className="flex items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-accent-500/10 text-accent-500">
            <Bot size={20} />
          </span>
          <div className="flex-1 text-sm">
            {settings.aiProvider === "claude" ? (
              <>
                <span className="font-medium">Claude connected</span>
                <p className="text-slate-500 dark:text-slate-400">
                  Extraction, drafting, and the copilot are powered by {settings.aiModel}.
                </p>
              </>
            ) : (
              <>
                <span className="font-medium">Demo mode</span>
                <p className="text-slate-500 dark:text-slate-400">
                  Running on the built-in offline provider. Set{" "}
                  <code className="rounded bg-slate-100 px-1 dark:bg-white/10">ANTHROPIC_API_KEY</code>{" "}
                  in <code className="rounded bg-slate-100 px-1 dark:bg-white/10">.env</code> to enable
                  Claude for real extraction and drafting.
                </p>
              </>
            )}
          </div>
          <Badge color={settings.aiProvider === "claude" ? "green" : "amber"}>
            {settings.aiProvider}
          </Badge>
        </GlassCard>
      </section>
    </div>
  );
}
