import type { Metadata, Viewport } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";
import { Shell } from "@/components/Shell";

export const metadata: Metadata = {
  title: "Zinzino Connect AI",
  description:
    "AI-powered CRM and customer engagement for independent Zinzino Partners.",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Zinzino AI",
  },
  icons: {
    apple: "/apple-touch-icon.png",
  },
};

// Every route is behind Clerk auth and renders per-user data, so nothing
// should be statically prerendered at build time. Forcing dynamic rendering
// also means the Clerk publishable key is only needed at runtime (not during
// `next build`), which keeps Vercel builds from failing before env vars are
// fully wired up.
export const dynamic = "force-dynamic";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f2f4f8" },
    { media: "(prefers-color-scheme: dark)", color: "#0b0f17" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider
      signInUrl="/sign-in"
      signUpUrl="/sign-up"
      signInFallbackRedirectUrl="/"
      signUpFallbackRedirectUrl="/"
    >
      <html lang="en" suppressHydrationWarning>
        <body>
          <Shell>{children}</Shell>
        </body>
      </html>
    </ClerkProvider>
  );
}
