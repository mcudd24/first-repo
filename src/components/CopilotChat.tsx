"use client";

// Shared copilot chat UI — used full-page at /copilot and inside the global
// slide-over panel. Keeps its own conversation state per mount.

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Send, MailCheck, BellPlus } from "lucide-react";
import { Button, Input, Spinner } from "@/components/ui";
import { api } from "@/lib/api";

interface CopilotAction {
  type: "drafts_created" | "reminder_created";
  count: number;
  description: string;
}

interface ChatMessage {
  role: "user" | "assistant";
  text: string;
  actions?: CopilotAction[];
}

const SUGGESTIONS = [
  "Who hasn't heard from me in 90 days?",
  "Show everyone with birthdays this month.",
  "Generate follow-ups for all BalanceOil customers.",
  "Find customers that need another BalanceTest.",
];

export function CopilotChat({ compact = false }: { compact?: boolean }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, thinking]);

  const send = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || thinking) return;
    const history = [...messages, { role: "user" as const, text: trimmed }];
    setMessages(history);
    setInput("");
    setThinking(true);
    try {
      const result = await api<{ reply: string; actions: CopilotAction[] }>("/api/copilot", {
        method: "POST",
        body: JSON.stringify({
          history: history.map(({ role, text }) => ({ role, text })).slice(-20),
        }),
      });
      setMessages((prev) => [
        ...prev,
        { role: "assistant", text: result.reply, actions: result.actions },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: err instanceof Error ? err.message : "Something went wrong — please try again.",
        },
      ]);
    } finally {
      setThinking(false);
    }
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex-1 space-y-3 overflow-y-auto pb-4">
        {messages.length === 0 && (
          <div className={`stagger grid gap-2 pt-4 ${compact ? "" : "sm:grid-cols-2"}`}>
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => send(s)}
                className="glass p-3.5 text-left text-sm text-slate-600 transition-all hover:scale-[1.02] hover:text-accent-500 dark:text-slate-300"
              >
                “{s}”
              </button>
            ))}
          </div>
        )}

        {messages.map((m, i) =>
          m.role === "user" ? (
            <div key={i} className="flex justify-end animate-fade-up">
              <div className="max-w-[85%] rounded-3xl rounded-br-lg bg-accent-500 px-4 py-2.5 text-sm text-white shadow-[0_4px_14px_rgb(10_132_255/0.3)]">
                {m.text}
              </div>
            </div>
          ) : (
            <div key={i} className="flex justify-start animate-fade-up">
              <div className="glass max-w-[85%] rounded-3xl rounded-bl-lg px-4 py-2.5">
                <p className="whitespace-pre-wrap text-sm text-slate-700 dark:text-slate-200">{m.text}</p>
                {m.actions && m.actions.length > 0 && (
                  <div className="mt-3 space-y-2 border-t border-slate-100 pt-3 dark:border-white/10">
                    {m.actions.map((a, j) => (
                      <Link
                        key={j}
                        href={a.type === "drafts_created" ? "/approvals" : "/"}
                        className="flex items-center gap-2 rounded-xl bg-accent-500/10 px-3 py-2 text-xs font-medium text-accent-600 transition-colors hover:bg-accent-500/20 dark:text-accent-300"
                      >
                        {a.type === "drafts_created" ? <MailCheck size={14} /> : <BellPlus size={14} />}
                        {a.description}
                        {a.type === "drafts_created" && <span className="ml-auto">Review →</span>}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )
        )}

        {thinking && (
          <div className="flex justify-start animate-fade-in">
            <div className="glass flex items-center gap-2 rounded-3xl rounded-bl-lg px-4 py-3">
              <Spinner />
              <span className="text-sm text-slate-400">Thinking…</span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
        className="glass flex items-center gap-2 p-2"
      >
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask anything about your customers…"
          className="border-0 bg-transparent focus:ring-0 dark:bg-transparent"
        />
        <Button type="submit" disabled={!input.trim() || thinking} className="shrink-0 !px-3">
          <Send size={16} />
        </Button>
      </form>
    </div>
  );
}
