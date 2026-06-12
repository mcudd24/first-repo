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
} from "lucide-react";

const NAV = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/contacts", label: "Contacts", icon: Users },
  { href: "/import", label: "Import", icon: Upload },
  { href: "/approvals", label: "Approvals", icon: CheckCircle2 },
  { href: "/automations", label: "Automations", icon: Zap },
  { href: "/copilot", label: "Copilot", icon: Sparkles },
  { href: "/settings", label: "Settings", icon: Settings },
];

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
      <main className="min-w-0 flex-1 px-4 pb-24 pt-6 md:px-8 md:pb-10">{children}</main>

      {/* Mobile bottom tab bar */}
      <nav className="glass fixed inset-x-3 bottom-3 z-50 flex justify-around px-2 py-2 md:hidden">
        {NAV.map(({ href, label, icon: Icon }) => (
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
