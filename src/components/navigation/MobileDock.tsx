"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  CalendarDays,
  Sparkles,
  NotebookPen,
  TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";

const DOCK_ITEMS = [
  { name: "Home", icon: LayoutDashboard, path: "/dashboard" },
  { name: "Calendar", icon: CalendarDays, path: "/calendar" },
  { name: "Tutor", icon: Sparkles, path: "/tutor" },
  { name: "Notes", icon: NotebookPen, path: "/notes" },
  { name: "Progress", icon: TrendingUp, path: "/progress" },
];

/**
 * Floating bottom dock — primary navigation on phones (≤5 items, thumb-reachable).
 * Glass pill with a sliding active indicator; the active item shows its label.
 * Desktop keeps the sidebar; this renders lg:hidden. Settings stays in the drawer.
 */
export default function MobileDock() {
  const pathname = usePathname();
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    setUserId(localStorage.getItem("userId"));
  }, []);

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 flex justify-center px-4 pb-[max(env(safe-area-inset-bottom),0.75rem)] lg:hidden"
      aria-label="Primary"
    >
      <div className="flex items-center gap-1 rounded-2xl border border-border bg-card/85 p-1.5 shadow-[0_8px_30px_-8px_rgba(15,23,42,0.25)] backdrop-blur-xl dark:shadow-[0_8px_30px_-6px_rgba(0,0,0,0.6)]">
        {DOCK_ITEMS.map((item) => {
          const active = pathname.startsWith(item.path);
          const href = userId ? `${item.path}?userId=${userId}` : item.path;
          return (
            <Link
              key={item.name}
              href={href}
              className={cn(
                "press relative flex h-11 min-w-11 items-center justify-center gap-1.5 rounded-xl px-3 text-sm font-medium transition-colors",
                active ? "text-primary" : "text-muted-foreground hover:text-foreground"
              )}
              aria-current={active ? "page" : undefined}
              aria-label={item.name}
            >
              {active && (
                <motion.span
                  layoutId="dock-active"
                  className="absolute inset-0 rounded-xl bg-primary/12"
                  transition={{ type: "spring", stiffness: 380, damping: 32 }}
                />
              )}
              <item.icon className="relative z-10 h-5 w-5" />
              {active && <span className="relative z-10 text-xs font-semibold">{item.name}</span>}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
