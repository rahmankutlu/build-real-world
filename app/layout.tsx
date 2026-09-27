import type { Metadata } from "next";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { absoluteUrl, site, withBasePath } from "@/lib/site";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: { default: `${site.name} — Production-grade System Design`, template: `%s | ${site.name}` },
  description: site.description,
  applicationName: site.name,
  authors: [{ name: site.author, url: site.github }],
  creator: site.author,
  publisher: site.name,
  category: "technology",
  keywords: ["system design", "software architecture", "distributed systems", "database design", "API design", "backend engineering"],
  alternates: { canonical: absoluteUrl("/") },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1, "max-video-preview": -1 } },
  openGraph: { type: "website", siteName: site.name, title: `${site.name} — Production-grade System Design`, description: site.description, url: absoluteUrl("/"), images: [{ url: absoluteUrl("/social-preview.png"), width: 1200, height: 630, alt: "Build Real World — production-grade system design" }] },
  twitter: { card: "summary_large_image", title: `${site.name} — Production-grade System Design`, description: site.description, images: [absoluteUrl("/social-preview.png")] },
  icons: { icon: [{ url: withBasePath("/icon.svg"), type: "image/svg+xml" }] },
  manifest: withBasePath("/manifest.webmanifest"),
};

const themeScript = `(function(){try{var t=localStorage.getItem('theme');var d=t?t==='dark':matchMedia('(prefers-color-scheme: dark)').matches;document.documentElement.dataset.theme=d?'dark':'light'}catch(e){}})()`;

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en" suppressHydrationWarning data-scroll-behavior="smooth"><head><script dangerouslySetInnerHTML={{ __html: themeScript }} /></head><body><Header /><main>{children}</main><Footer /></body></html>;
}
