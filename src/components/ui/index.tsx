"use client";

// Zinzino Connect AI design-system primitives. Tailwind-only, no deps beyond
// lucide icons. Apple-HIG flavored: glass surfaces, rounded-2xl, blue accent.

import { ReactNode, ButtonHTMLAttributes, InputHTMLAttributes, TextareaHTMLAttributes } from "react";

function cx(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

export function GlassCard({
  children,
  className,
  ...rest
}: { children: ReactNode; className?: string } & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cx("glass p-5", className)} {...rest}>
      {children}
    </div>
  );
}

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "success";

const buttonStyles: Record<ButtonVariant, string> = {
  primary:
    "bg-accent-500 text-white hover:bg-accent-600 shadow-[0_4px_14px_rgb(10_132_255/0.35)]",
  secondary:
    "bg-white/70 dark:bg-white/10 text-slate-800 dark:text-slate-100 border border-slate-200/70 dark:border-white/10 hover:bg-white dark:hover:bg-white/15",
  ghost: "text-accent-500 hover:bg-accent-50 dark:hover:bg-accent-500/10",
  danger: "bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-500/20",
  success: "bg-emerald-500 text-white hover:bg-emerald-600",
};

export function Button({
  variant = "primary",
  className,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant }) {
  return (
    <button
      className={cx(
        "inline-flex items-center justify-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium",
        "transition-all duration-200 active:scale-[0.97] disabled:opacity-40 disabled:pointer-events-none",
        buttonStyles[variant],
        className
      )}
      {...rest}
    />
  );
}

const badgeColors: Record<string, string> = {
  blue: "bg-accent-500/10 text-accent-600 dark:text-accent-300",
  green: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-300",
  amber: "bg-amber-500/10 text-amber-600 dark:text-amber-300",
  red: "bg-red-500/10 text-red-600 dark:text-red-300",
  gray: "bg-slate-500/10 text-slate-600 dark:text-slate-300",
  purple: "bg-purple-500/10 text-purple-600 dark:text-purple-300",
};

export function Badge({
  children,
  color = "blue",
  className,
}: {
  children: ReactNode;
  color?: keyof typeof badgeColors;
  className?: string;
}) {
  return (
    <span
      className={cx(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        badgeColors[color],
        className
      )}
    >
      {children}
    </span>
  );
}

export function Avatar({
  name,
  src,
  size = "md",
}: {
  name: string;
  src?: string | null;
  size?: "sm" | "md" | "lg" | "xl";
}) {
  const sizes = {
    sm: "h-8 w-8 text-xs",
    md: "h-10 w-10 text-sm",
    lg: "h-14 w-14 text-lg",
    xl: "h-20 w-20 text-2xl",
  };
  const initials = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase())
    .join("");
  if (src) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={name} className={cx(sizes[size], "rounded-full object-cover")} />;
  }
  return (
    <div
      className={cx(
        sizes[size],
        "flex items-center justify-center rounded-full font-semibold text-white",
        "bg-gradient-to-br from-accent-400 to-accent-600 shadow-inner"
      )}
    >
      {initials || "?"}
    </div>
  );
}

export function Input({ className, ...rest }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cx(
        "w-full rounded-xl border border-slate-200/80 bg-white/80 px-3.5 py-2 text-sm",
        "placeholder:text-slate-400 focus:border-accent-400 focus:outline-none focus:ring-2 focus:ring-accent-500/20",
        "dark:border-white/10 dark:bg-white/5 dark:text-slate-100 transition-colors",
        className
      )}
      {...rest}
    />
  );
}

export function Textarea({ className, ...rest }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cx(
        "w-full rounded-xl border border-slate-200/80 bg-white/80 px-3.5 py-2 text-sm",
        "placeholder:text-slate-400 focus:border-accent-400 focus:outline-none focus:ring-2 focus:ring-accent-500/20",
        "dark:border-white/10 dark:bg-white/5 dark:text-slate-100 transition-colors",
        className
      )}
      {...rest}
    />
  );
}

/** iOS-style toggle switch. */
export function Toggle({
  checked,
  onChange,
  disabled,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cx(
        "relative h-7 w-12 rounded-full transition-colors duration-200 disabled:opacity-40",
        checked ? "bg-emerald-500" : "bg-slate-300 dark:bg-slate-600"
      )}
    >
      <span
        className={cx(
          "absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform duration-200",
          checked ? "translate-x-5" : "translate-x-0.5"
        )}
      />
    </button>
  );
}

export function StatCard({
  label,
  value,
  icon,
  tint = "blue",
}: {
  label: string;
  value: string | number;
  icon?: ReactNode;
  tint?: keyof typeof badgeColors;
}) {
  return (
    <GlassCard className="flex items-center gap-4">
      {icon && (
        <div className={cx("flex h-11 w-11 items-center justify-center rounded-2xl", badgeColors[tint])}>
          {icon}
        </div>
      )}
      <div>
        <div className="text-2xl font-semibold tracking-tight">{value}</div>
        <div className="text-xs text-slate-500 dark:text-slate-400">{label}</div>
      </div>
    </GlassCard>
  );
}

export function EmptyState({
  icon,
  title,
  subtitle,
  action,
}: {
  icon?: ReactNode;
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-12 text-center animate-fade-in">
      {icon && <div className="text-slate-300 dark:text-slate-600">{icon}</div>}
      <div className="font-medium text-slate-600 dark:text-slate-300">{title}</div>
      {subtitle && <div className="max-w-sm text-sm text-slate-400">{subtitle}</div>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

export function SectionTitle({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="mb-3 flex items-center justify-between">
      <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
        {children}
      </h2>
      {action}
    </div>
  );
}

export function Spinner({ className }: { className?: string }) {
  return (
    <span
      className={cx(
        "inline-block h-4 w-4 animate-spin rounded-full border-2 border-accent-500/30 border-t-accent-500",
        className
      )}
    />
  );
}
