import type { Metadata } from "next";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { site } from "@/lib/site";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(site.url), title: { default: site.name, template: `%s · ${site.name}` }, description: site.description,
  alternates: { canonical: "/" }, openGraph: { type: "website", siteName: site.name, title: site.name, description: site.description, url: site.url },
};

const themeScript = `(function(){try{var t=localStorage.getItem('theme');var d=t?t==='dark':matchMedia('(prefers-color-scheme: dark)').matches;document.documentElement.dataset.theme=d?'dark':'light'}catch(e){}})()`;

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en" suppressHydrationWarning data-scroll-behavior="smooth"><head><script dangerouslySetInnerHTML={{ __html: themeScript }} /></head><body><Header /><main>{children}</main><Footer /></body></html>;
}
