import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Cudd Realty CRM",
    short_name: "Cudd Realty",
    description:
      "AI-powered CRM and customer engagement for Cudd Realty.",
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
