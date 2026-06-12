"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Search, UserPlus } from "lucide-react";
import { Avatar, Badge, EmptyState, GlassCard, Input, Spinner } from "@/components/ui";
import { api } from "@/lib/api";

interface ContactRow {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  status: string;
  daysSinceContact: number | null;
  products: string[];
}

const STATUS_FILTERS = ["ALL", "CUSTOMER", "LEAD", "INACTIVE"] as const;

function contactFreshness(days: number | null): { color: "green" | "amber" | "red"; label: string } {
  if (days === null) return { color: "red", label: "never contacted" };
  if (days <= 30) return { color: "green", label: `${days}d ago` };
  if (days <= 60) return { color: "amber", label: `${days}d ago` };
  return { color: "red", label: `${days}d ago` };
}

export default function ContactsPage() {
  const [contacts, setContacts] = useState<ContactRow[] | null>(null);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<(typeof STATUS_FILTERS)[number]>("ALL");

  useEffect(() => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (status !== "ALL") params.set("status", status);
    const t = setTimeout(
      () => api<ContactRow[]>(`/api/contacts?${params}`).then(setContacts),
      search ? 250 : 0
    );
    return () => clearTimeout(t);
  }, [search, status]);

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-center justify-between gap-3 animate-fade-up">
        <h1 className="text-2xl font-bold tracking-tight">Contacts</h1>
        <Link
          href="/import"
          className="inline-flex items-center gap-1.5 rounded-full bg-accent-500 px-4 py-2 text-sm font-medium text-white shadow-[0_4px_14px_rgb(10_132_255/0.35)] transition-all hover:bg-accent-600 active:scale-[0.97]"
        >
          <UserPlus size={15} /> Add contacts
        </Link>
      </header>

      <div className="flex flex-wrap items-center gap-2 animate-fade-up">
        <div className="relative min-w-56 flex-1">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, or phone…"
            className="pl-9"
          />
        </div>
        <div className="flex gap-1 rounded-full bg-white/60 p-1 dark:bg-white/5">
          {STATUS_FILTERS.map((s) => (
            <button
              key={s}
              onClick={() => setStatus(s)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium capitalize transition-colors ${
                status === s
                  ? "bg-accent-500 text-white"
                  : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
              }`}
            >
              {s.toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      {!contacts ? (
        <div className="flex h-48 items-center justify-center">
          <Spinner className="h-6 w-6" />
        </div>
      ) : contacts.length === 0 ? (
        <GlassCard>
          <EmptyState
            title="No contacts found"
            subtitle="Try a different search, or import contacts from a form, photo, or email."
          />
        </GlassCard>
      ) : (
        <GlassCard className="divide-y divide-slate-100 p-0 dark:divide-white/5 animate-fade-up">
          {contacts.map((c) => {
            const freshness = contactFreshness(c.daysSinceContact);
            return (
              <Link
                key={c.id}
                href={`/contacts/${c.id}`}
                className="flex items-center gap-4 px-5 py-3.5 transition-colors hover:bg-white/50 dark:hover:bg-white/5"
              >
                <Avatar name={`${c.firstName} ${c.lastName}`} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate font-medium">
                      {c.firstName} {c.lastName}
                    </span>
                    <Badge color={c.status === "CUSTOMER" ? "green" : c.status === "LEAD" ? "purple" : "gray"}>
                      {c.status.toLowerCase()}
                    </Badge>
                  </div>
                  <div className="truncate text-xs text-slate-400">
                    {c.products.length > 0 ? c.products.join(" · ") : c.email ?? c.phone ?? "no details"}
                  </div>
                </div>
                <Badge color={freshness.color}>{freshness.label}</Badge>
              </Link>
            );
          })}
        </GlassCard>
      )}
    </div>
  );
}
