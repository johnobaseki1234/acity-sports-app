"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";

export default function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch by waiting until mounted on client.
  useEffect(() => setMounted(true), []);
  if (!mounted) return <div className="h-10 w-10" />;

  const isDark = resolvedTheme === "dark";

  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label="Toggle theme"
      className="relative grid place-items-center h-10 w-10 rounded-xl text-zinc-600 dark:text-zinc-300 hover:bg-black/5 dark:hover:bg-white/5 transition active:scale-95 overflow-hidden"
    >
      <Sun
        className={`h-5 w-5 absolute transition-all duration-500 ${
          isDark ? "rotate-90 scale-0 opacity-0" : "rotate-0 scale-100 opacity-100"
        }`}
      />
      <Moon
        className={`h-5 w-5 absolute transition-all duration-500 ${
          isDark ? "rotate-0 scale-100 opacity-100" : "-rotate-90 scale-0 opacity-0"
        }`}
      />
    </button>
  );
}
