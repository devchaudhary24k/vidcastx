import { useEffect, useState } from "react";

export type ThemeMode = "light" | "dark" | "auto";

const STORAGE_KEY = "theme";
const DEFAULT_MODE: ThemeMode = "dark";

function readStoredMode(): ThemeMode {
  if (typeof window === "undefined") return DEFAULT_MODE;
  const stored = globalThis.localStorage.getItem(STORAGE_KEY);
  if (stored === "light" || stored === "dark" || stored === "auto") return stored;
  return DEFAULT_MODE;
}

function applyMode(mode: ThemeMode) {
  if (typeof window === "undefined") return;
  const prefersDark = globalThis.matchMedia("(prefers-color-scheme: dark)").matches;
  const resolved = mode === "auto" ? (prefersDark ? "dark" : "light") : mode;
  const root = document.documentElement;
  root.classList.remove("light", "dark");
  root.classList.add(resolved);
  if (mode === "auto") {
    delete root.dataset.theme;
  } else {
    root.dataset.theme = mode;
  }
  root.style.colorScheme = resolved;
}

export function useTheme() {
  const [mode, setMode] = useState<ThemeMode>(DEFAULT_MODE);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setMode(readStoredMode());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (mode !== "auto") return;
    const media = globalThis.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => {
      applyMode("auto");
    };
    media.addEventListener("change", onChange);
    return () => {
      media.removeEventListener("change", onChange);
    };
  }, [mode]);

  function setTheme(next: ThemeMode) {
    setMode(next);
    applyMode(next);
    if (typeof window !== "undefined") {
      globalThis.localStorage.setItem(STORAGE_KEY, next);
    }
  }

  return { mode, setTheme, hydrated };
}
