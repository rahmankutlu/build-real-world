import Link from "next/link";
import { Menu } from "lucide-react";

export function MobileNav() {
  return <details className="mobile-nav"><summary aria-label="Open navigation"><Menu size={17} /></summary><nav aria-label="Mobile navigation"><Link href="/#projects">Projects</Link><Link href="/patterns/">Patterns</Link><Link href="/edge-cases/">Edge cases</Link><Link href="/learn/">Learning paths</Link><Link href="/compare/">Compare</Link><Link href="/about/">About</Link></nav></details>;
}
