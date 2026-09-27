"use client";

import { useState } from "react";

export function CopyBlock({ children }: { children: string }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    await navigator.clipboard.writeText(children);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1200);
  }
  return <div className="code-block"><button className="copy-button" onClick={copy}>{copied ? "Copied" : "Copy"}</button>{children}</div>;
}
