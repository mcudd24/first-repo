import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Zinzino Connect AI",
    short_name: "Zinzino AI",
    description:
      "AI-powered CRM and customer engagement for independent Zinzino Partners.",
    start_url: "/",
    display: "standalone",
    background_color: "#f2f4f8",
    theme_color: "#0a84ff",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
