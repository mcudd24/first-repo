import type { Metadata, Viewport } from "next";
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
    <html lang="en" suppressHydrationWarning>
      <body>
        <Shell>{children}</Shell>
      </body>
    </html>
  );
}
