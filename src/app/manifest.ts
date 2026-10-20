import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Updated Rojgar",
    short_name: "Updated Rojgar",
    description: "सरकारी नौकरी और करियर अपडेट",
    start_url: "/",
    display: "standalone",
    background_color: "#f5f7fb",
    theme_color: "#155eef",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "maskable",
      },
    ],
  };
}
