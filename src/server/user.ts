// Resolves the authenticated Clerk user into our internal `User` row,
// auto-creating it (and seeding their starter data) on first sign-in.

import { auth, currentUser } from "@clerk/nextjs/server";
import { db } from "@/server/db";
import { seedNewUser } from "@/server/seedUser";

/**
 * Returns the internal user id for the current request, creating the row on
 * first call. Throws when no Clerk session is present — the middleware
 * normally redirects before that, but API handlers should defend anyway.
 */
export async function requireUserId(): Promise<string> {
  const { userId: clerkId } = await auth();
  if (!clerkId) throw new Response("Unauthorized", { status: 401 });

  const existing = await db.user.findUnique({
    where: { clerkId },
    select: { id: true },
  });
  if (existing) return existing.id;

  // First sign-in for this Clerk user: create our row + seed starter data.
  // currentUser() (vs auth()) is the only way to read the email here.
  const profile = await currentUser().catch(() => null);
  const email =
    profile?.primaryEmailAddress?.emailAddress ??
    profile?.emailAddresses?.[0]?.emailAddress ??
    null;

  const created = await db.user.create({
    data: { clerkId, email },
    select: { id: true },
  });
  await seedNewUser(created.id).catch((err) => {
    // Seeding is best-effort — if it fails the user can still use the app.
    console.error("Failed to seed new user", err);
  });
  return created.id;
}
