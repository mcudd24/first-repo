import { SignIn } from "@clerk/nextjs";
import { Sparkles } from "lucide-react";

export const metadata = { title: "Sign in — Zinzino Connect AI" };

export default function SignInPage() {
  return (
    <div className="flex min-h-dvh items-center justify-center px-4">
      <div className="flex flex-col items-center gap-6">
        <div className="flex flex-col items-center gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-gradient-to-br from-accent-400 to-accent-600 text-white shadow-[0_8px_24px_rgb(10_132_255/0.45)]">
            <Sparkles size={26} />
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold">
              Zinzino Connect <span className="text-accent-500">AI</span>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Sign in to your account
            </p>
          </div>
        </div>
        <SignIn />
      </div>
    </div>
  );
}
