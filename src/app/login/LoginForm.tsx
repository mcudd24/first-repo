"use client";

import { FormEvent, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Lock, Sparkles } from "lucide-react";
import { Button, GlassCard, Input } from "@/components/ui";

export function LoginForm({ demoPassword }: { demoPassword?: string }) {
  const searchParams = useSearchParams();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    }).catch(() => null);
    if (res?.ok) {
      // Full navigation (not router.push) so the middleware sees the new
      // session cookie on every request.
      const next = searchParams.get("next");
      window.location.href = next && next.startsWith("/") ? next : "/";
    } else {
      setError(res ? "Incorrect password — try again." : "Network error — try again.");
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-dvh items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-gradient-to-br from-accent-400 to-accent-600 text-white shadow-[0_8px_24px_rgb(10_132_255/0.45)]">
            <Sparkles size={26} />
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold">
              Zinzino Connect <span className="text-accent-500">AI</span>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Sign in to continue
            </p>
          </div>
        </div>

        <GlassCard>
          <form onSubmit={submit} className="flex flex-col gap-3">
            <label className="text-sm font-medium" htmlFor="password">
              Password
            </label>
            <Input
              id="password"
              type="password"
              autoFocus
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
            />
            {error && (
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            )}
            <Button type="submit" disabled={busy || !password}>
              <Lock size={15} />
              {busy ? "Signing in…" : "Sign in"}
            </Button>
          </form>
        </GlassCard>

        {demoPassword && (
          <p className="mt-4 text-center text-xs text-slate-500 dark:text-slate-400">
            Demo password: <span className="font-mono font-semibold">{demoPassword}</span>
            <br />
            Set the <span className="font-mono">APP_PASSWORD</span> environment
            variable to choose your own.
          </p>
        )}
      </div>
    </div>
  );
}
