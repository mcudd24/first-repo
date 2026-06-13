import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isPublic = createRouteMatcher([
  "/sign-in(.*)",
  "/sign-up(.*)",
  // PWA manifest + icons must be reachable without auth.
  "/manifest.webmanifest",
  "/apple-touch-icon.png",
  "/icon-192.png",
  "/icon-512.png",
]);

export default clerkMiddleware(async (auth, req) => {
  if (isPublic(req)) return;
  await auth.protect();
});

export const config = {
  // Run on everything except Next.js internals and static files (anything with
  // a file extension).
  matcher: ["/((?!_next|.*\\..*).*)", "/(api|trpc)(.*)"],
};
