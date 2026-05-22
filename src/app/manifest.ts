import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Mibarberia",
    short_name: "Mibarberia",
    description: "El sistema de gestión para tu barbería",
    start_url: "/dashboard",
    display: "standalone",
    orientation: "portrait",
    background_color: "#000000",
    theme_color: "#CA8A04",
    categories: ["business", "productivity"],
    icons: [
      {
        src: "/api/pwa/icon?size=192",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/api/pwa/icon?size=512",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    screenshots: [],
  };
}
