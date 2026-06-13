"use client";

import { Sparkles } from "lucide-react";
import { CopilotChat } from "@/components/CopilotChat";

export default function CopilotPage() {
  return (
    <div className="mx-auto flex h-[calc(100dvh-8rem)] max-w-3xl flex-col md:h-[calc(100dvh-5rem)]">
      <header className="mb-4 animate-fade-up">
        <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
          <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-br from-accent-400 to-accent-600 text-white shadow-lg">
            <Sparkles size={17} />
          </span>
          AI Copilot
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Ask about your contacts or have me prepare follow-ups. I create drafts — you approve every send.
        </p>
      </header>
      <CopilotChat />
    </div>
  );
}
