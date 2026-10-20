import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Rojgar Sathi",
    short_name: "Rojgar Sathi",
    description: "सरकारी नौकरी, प्रवेश-पत्र, परिणाम और छात्रवृत्ति अपडेट",
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
