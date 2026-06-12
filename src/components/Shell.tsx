"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReactNode, useEffect, useState } from "react";
import {
  LayoutDashboard,
  Users,
  Upload,
  CheckCircle2,
  Zap,
  Sparkles,
  Moon,
  Sun,
  Settings,
  X,
} from "lucide-react";
import { CopilotChat } from "./CopilotChat";

const NAV = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/contacts", label: "Contacts", icon: Users },
  { href: "/import", label: "Import", icon: Upload },
  { href: "/approvals", label: "Approvals", icon: CheckCircle2 },
  { href: "/automations", label: "Automations", icon: Zap },
  { href: "/copilot", label: "Copilot", icon: Sparkles },
  { href: "/settings", label: "Settings", icon: Settings },
];

// iOS keeps tab bars to five items; Automations and Settings move to the
// mobile top bar.
const MOBILE_NAV = NAV.filter((n) =>
  ["/", "/contacts", "/import", "/approvals", "/copilot"].includes(n.href)
);

function useDarkMode() {
  const [dark, setDark] = useState(false);
  useEffect(() => {
    const stored = localStorage.getItem("theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const initial = stored ? stored === "dark" : prefersDark;
    setDark(initial);
    document.documentElement.classList.toggle("dark", initial);
  }, []);
  const toggle = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("theme", next ? "dark" : "light");
  };
  return { dark, toggle };
}

export function Shell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { dark, toggle } = useDarkMode();
  const [copilotOpen, setCopilotOpen] = useState(false);

  // The panel duplicates the /copilot page — keep it closed there.
  useEffect(() => {
    if (pathname.startsWith("/copilot")) setCopilotOpen(false);
  }, [pathname]);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <div className="mx-auto flex min-h-dvh max-w-7xl">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col gap-1 p-4 md:flex">
        <div className="mb-6 flex items-center gap-2.5 px-2 pt-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-br from-accent-400 to-accent-600 text-white shadow-lg">
            <Sparkles size={18} />
          </div>
          <div>
            <div className="text-sm font-semibold leading-tight">Zinzino Connect</div>
            <div className="text-[11px] font-medium text-accent-500">AI</div>
          </div>
        </div>

        {NAV.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
              isActive(href)
                ? "bg-accent-500 text-white shadow-[0_4px_14px_rgb(10_132_255/0.35)]"
                : "text-slate-600 hover:bg-white/70 dark:text-slate-300 dark:hover:bg-white/10"
            }`}
          >
            <Icon size={18} />
            {label}
          </Link>
        ))}

        <button
          onClick={toggle}
          className="mt-auto flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-500 transition-colors hover:bg-white/70 dark:text-slate-400 dark:hover:bg-white/10"
        >
          {dark ? <Sun size={18} /> : <Moon size={18} />}
          {dark ? "Light mode" : "Dark mode"}
        </button>
      </aside>

      {/* Main content */}
      <main className="min-w-0 flex-1 px-4 pb-24 pt-2 md:px-8 md:pb-10 md:pt-6">
        {/* Mobile top bar */}
        <div className="mb-4 flex items-center justify-between pt-[max(0.25rem,env(safe-area-inset-top))] md:hidden">
          <Link href="/" className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-accent-400 to-accent-600 text-white shadow">
              <Sparkles size={15} />
            </span>
            <span className="text-sm font-semibold">
              Zinzino Connect <span className="text-accent-500">AI</span>
            </span>
          </Link>
          <div className="flex items-center gap-1">
            <Link
              href="/automations"
              className={`rounded-full p-2 transition-colors ${
                isActive("/automations")
                  ? "text-accent-500"
                  : "text-slate-500 hover:text-accent-500 dark:text-slate-400"
              }`}
              title="Automations"
            >
              <Zap size={19} />
            </Link>
            <Link
              href="/settings"
              className={`rounded-full p-2 transition-colors ${
                isActive("/settings")
                  ? "text-accent-500"
                  : "text-slate-500 hover:text-accent-500 dark:text-slate-400"
              }`}
              title="Settings"
            >
              <Settings size={19} />
            </Link>
            <button
              onClick={toggle}
              className="rounded-full p-2 text-slate-500 transition-colors hover:text-accent-500 dark:text-slate-400"
              title={dark ? "Light mode" : "Dark mode"}
            >
              {dark ? <Sun size={19} /> : <Moon size={19} />}
            </button>
          </div>
        </div>
        {children}
      </main>

      {/* Global copilot: floating button + slide-over panel (desktop) */}
      {!pathname.startsWith("/copilot") && (
        <button
          onClick={() => setCopilotOpen(true)}
          className="fixed bottom-6 right-6 z-40 hidden h-13 w-13 items-center justify-center rounded-full bg-gradient-to-br from-accent-400 to-accent-600 p-3.5 text-white shadow-[0_8px_24px_rgb(10_132_255/0.45)] transition-transform hover:scale-105 active:scale-95 md:flex"
          title="Ask the AI Copilot"
        >
          <Sparkles size={22} />
        </button>
      )}
      {copilotOpen && (
        <div className="fixed inset-0 z-50 hidden md:block">
          <div
            className="absolute inset-0 bg-black/20 backdrop-blur-sm animate-fade-in"
            onClick={() => setCopilotOpen(false)}
          />
          <aside className="glass absolute bottom-4 right-4 top-4 flex w-[26rem] flex-col rounded-3xl p-4 animate-scale-in">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2 font-semibold">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-accent-400 to-accent-600 text-white">
                  <Sparkles size={15} />
                </span>
                Copilot
              </div>
              <button
                onClick={() => setCopilotOpen(false)}
                className="rounded-full p-2 text-slate-400 transition-colors hover:bg-white/60 hover:text-slate-700 dark:hover:bg-white/10 dark:hover:text-slate-200"
              >
                <X size={18} />
              </button>
            </div>
            <div className="min-h-0 flex-1">
              <CopilotChat compact />
            </div>
          </aside>
        </div>
      )}

      {/* Mobile bottom tab bar */}
      <nav className="glass fixed inset-x-3 bottom-3 z-50 flex justify-around px-2 py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] md:hidden">
        {MOBILE_NAV.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={`flex flex-col items-center gap-0.5 rounded-xl px-2 py-1 text-[10px] font-medium transition-colors ${
              isActive(href) ? "text-accent-500" : "text-slate-500 dark:text-slate-400"
            }`}
          >
            <Icon size={20} />
            {label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
