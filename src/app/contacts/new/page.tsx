"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, UserPlus } from "lucide-react";
import { Button, GlassCard, Input, Spinner, Textarea } from "@/components/ui";
import { api } from "@/lib/api";

export default function NewContactPage() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    birthday: "",
    status: "LEAD",
    commPreference: "",
    interests: "",
    notes: "",
  });

  const set = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.firstName.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const contact = await api<{ id: string }>("/api/contacts", {
        method: "POST",
        body: JSON.stringify({
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim() || undefined,
          email: form.email.trim() || null,
          phone: form.phone.trim() || null,
          address: form.address.trim() || null,
          birthday: form.birthday || null,
          status: form.status,
          commPreference: form.commPreference || null,
          interests: form.interests.split(",").map((s) => s.trim()).filter(Boolean),
          notes: form.notes.trim() || null,
        }),
      });
      router.push(`/contacts/${contact.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create contact");
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Link
        href="/contacts"
        className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-accent-500 animate-fade-in"
      >
        <ArrowLeft size={15} /> Contacts
      </Link>

      <header className="animate-fade-up">
        <h1 className="text-2xl font-bold tracking-tight">New contact</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Or save time —{" "}
          <Link href="/import" className="font-medium text-accent-500 hover:underline">
            import with AI
          </Link>{" "}
          from a photo, PDF, or email.
        </p>
      </header>

      <form onSubmit={submit}>
        <GlassCard className="space-y-4 animate-fade-up">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="First name *">
              <Input value={form.firstName} onChange={set("firstName")} required autoFocus />
            </Field>
            <Field label="Last name">
              <Input value={form.lastName} onChange={set("lastName")} />
            </Field>
            <Field label="Email">
              <Input type="email" value={form.email} onChange={set("email")} />
            </Field>
            <Field label="Phone">
              <Input value={form.phone} onChange={set("phone")} />
            </Field>
            <Field label="Birthday">
              <Input type="date" value={form.birthday} onChange={set("birthday")} />
            </Field>
            <Field label="Status">
              <select
                value={form.status}
                onChange={set("status")}
                className="w-full rounded-xl border border-slate-200/80 bg-white/80 px-3.5 py-2 text-sm focus:border-accent-400 focus:outline-none dark:border-white/10 dark:bg-white/5 dark:text-slate-100"
              >
                <option value="LEAD">Lead</option>
                <option value="CUSTOMER">Customer</option>
                <option value="INACTIVE">Inactive</option>
              </select>
            </Field>
            <Field label="Preferred channel">
              <select
                value={form.commPreference}
                onChange={set("commPreference")}
                className="w-full rounded-xl border border-slate-200/80 bg-white/80 px-3.5 py-2 text-sm focus:border-accent-400 focus:outline-none dark:border-white/10 dark:bg-white/5 dark:text-slate-100"
              >
                <option value="">No preference</option>
                <option value="SMS">SMS</option>
                <option value="EMAIL">Email</option>
                <option value="WHATSAPP">WhatsApp</option>
              </select>
            </Field>
            <Field label="Interests (comma-separated)">
              <Input value={form.interests} onChange={set("interests")} placeholder="yoga, running" />
            </Field>
          </div>
          <Field label="Address">
            <Input value={form.address} onChange={set("address")} />
          </Field>
          <Field label="Notes">
            <Textarea rows={3} value={form.notes} onChange={set("notes")} />
          </Field>

          <div className="flex items-center gap-3">
            <Button type="submit" disabled={busy || !form.firstName.trim()}>
              {busy ? <Spinner className="border-white/40 border-t-white" /> : <UserPlus size={15} />}
              Create contact
            </Button>
            {error && <span className="text-sm text-red-500">{error}</span>}
          </div>
        </GlassCard>
      </form>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-slate-400">
        {label}
      </span>
      {children}
    </label>
  );
}
