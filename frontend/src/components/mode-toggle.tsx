"use client";

import { useSyncExternalStore } from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";

const subscribe = () => () => {};
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

export function ModeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const mounted = useSyncExternalStore(
    subscribe,
    getClientSnapshot,
    getServerSnapshot,
  );

  const isDark = mounted && resolvedTheme === "dark";

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className="relative"
      aria-label={
        mounted
          ? `Ativar tema ${isDark ? "claro" : "escuro"}`
          : "Alternar tema"
      }
      title={mounted ? `Ativar tema ${isDark ? "claro" : "escuro"}` : undefined}
      onClick={() => {
        if (mounted) setTheme(isDark ? "light" : "dark");
      }}
      disabled={!mounted}
    >
      <Sun
        className={`h-5 w-5 transition-transform duration-300 ${
          isDark ? "rotate-90 scale-0" : "rotate-0 scale-100"
        }`}
      />
      <Moon
        className={`absolute h-5 w-5 transition-transform duration-300 ${
          isDark ? "rotate-0 scale-100" : "-rotate-90 scale-0"
        }`}
      />
      <span className="sr-only">Alternar tema</span>
    </Button>
  );
}
