import Link from "next/link";
import { site } from "@/lib/site";

export function Footer() {
  return <footer className="site-footer"><div className="shell footer-inner"><span>Build Real World · Software under MIT, content under CC BY 4.0.</span><div className="footer-links"><Link href="/about/">About</Link><Link href="/feed.xml">Feed</Link><a href={site.github}>GitHub</a></div></div></footer>;
}
