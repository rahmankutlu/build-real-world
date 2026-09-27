"use client";

import { Moon } from "lucide-react";

export function ThemeToggle() {
  function toggle() {
    const root = document.documentElement;
    const next = root.dataset.theme === "dark" ? "light" : "dark";
    root.dataset.theme = next;
    window.localStorage.setItem("theme", next);
    window.dispatchEvent(new Event("themechange"));
  }
  return <button className="icon-button" onClick={toggle} aria-label="Toggle color theme"><Moon size={16} /></button>;
}
