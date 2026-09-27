import type { MetadataRoute } from "next";
import { absoluteUrl, site } from "@/lib/site";

export const dynamic = "force-static";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: site.name,
    short_name: "Build Real World",
    description: site.description,
    start_url: absoluteUrl("/"),
    display: "standalone",
    background_color: "#f7f7f5",
    theme_color: "#176b52",
    icons: [{ src: absoluteUrl("/icon.svg"), sizes: "any", type: "image/svg+xml" }],
  };
}
