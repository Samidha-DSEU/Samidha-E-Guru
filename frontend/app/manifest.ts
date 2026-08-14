import { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "SAMIDHA E-GURU | Production Educational Platform",
    short_name: "SAMIDHA E-GURU",
    description: "Minimalist, Ultra-Fast SaaS Educational Platform for School & College Students",
    start_url: "/",
    display: "standalone",
    background_color: "#09090b",
    theme_color: "#0284c7",
    orientation: "portrait",
    icons: [
      {
        src: "/logo.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any"
      },
      {
        src: "/logo.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable"
      }
    ]
  };
}
