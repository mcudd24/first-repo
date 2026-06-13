import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  DEFAULT_PASSWORD,
  SESSION_COOKIE,
  isValidSession,
  usingDefaultPassword,
} from "@/lib/auth";
import { LoginForm } from "./LoginForm";

export const metadata = { title: "Sign in — Zinzino Connect AI" };

export default async function LoginPage() {
  const store = await cookies();
  if (await isValidSession(store.get(SESSION_COOKIE)?.value)) redirect("/");

  return (
    <LoginForm
      demoPassword={usingDefaultPassword() ? DEFAULT_PASSWORD : undefined}
    />
  );
}
