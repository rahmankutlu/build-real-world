import Link from "next/link";
import { Search } from "lucide-react";
import { ThemeToggle } from "./theme-toggle";

export function Header() {
  return <header className="site-header"><div className="shell header-inner">
    <Link className="brand" href="/"><span className="brand-mark">BR</span><span>Build Real World</span></Link>
    <nav className="nav" aria-label="Main navigation"><Link href="/#projects">Projects</Link><Link href="/patterns/">Patterns</Link><Link href="/edge-cases/">Edge cases</Link><Link href="/learn/">Paths</Link><Link href="/compare/">Compare</Link></nav>
    <div className="header-actions"><Link className="search-link" href="/search/"><Search size={15} /><span>Search</span></Link><ThemeToggle /></div>
  </div></header>;
}
