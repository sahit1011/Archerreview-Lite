"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  CalendarDays,
  Sparkles,
  TrendingUp,
  Settings,
  GraduationCap,
  Menu,
  X,
  LogOut,
  Timer,
  ChevronDown,
  NotebookPen,
} from "lucide-react";
import { cn } from "@/lib/utils";
import ThemeToggle from "@/components/ThemeToggle";
import MobileDock from "@/components/navigation/MobileDock";
import { useUser } from "@/context/UserContext";

interface AppLayoutProps {
  children: React.ReactNode;
  light?: boolean;
}

const NAV = [
  { name: "Dashboard", icon: LayoutDashboard, path: "/dashboard" },
  { name: "Calendar", icon: CalendarDays, path: "/calendar" },
  { name: "AI Tutor", icon: Sparkles, path: "/tutor" },
  { name: "My Notes", icon: NotebookPen, path: "/notes" },
  { name: "Progress", icon: TrendingUp, path: "/progress" },
  { name: "Settings", icon: Settings, path: "/profile" },
];

function NavLinks({
  userId,
  pathname,
  onNavigate,
}: {
  userId: string | null;
  pathname: string;
  onNavigate?: () => void;
}) {
  return (
    <nav className="flex flex-col gap-1">
      {NAV.map((item) => {
        const active = pathname.startsWith(item.path);
        const href = userId ? `${item.path}?userId=${userId}` : item.path;
        return (
          <Link
            key={item.name}
            href={href}
            onClick={onNavigate}
            className={cn(
              "press group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
              active
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "text-muted-foreground hover:bg-secondary hover:text-foreground"
            )}
          >
            {active && (
              <motion.span
                layoutId="nav-active"
                className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full brand-gradient"
              />
            )}
            <item.icon
              className={cn(
                "h-[18px] w-[18px] transition-colors",
                active ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
              )}
            />
            {item.name}
          </Link>
        );
      })}
    </nav>
  );
}

function Brand() {
  return (
    <Link href="/" className="flex items-center gap-2.5">
      <div className="flex h-9 w-9 items-center justify-center rounded-xl brand-gradient text-white shadow-button">
        <GraduationCap className="h-5 w-5" />
      </div>
      <span className="font-display text-lg font-bold tracking-tight">StudyArc</span>
    </Link>
  );
}

export default function AppLayout({ children }: AppLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user: authUser, logout } = useUser();
  const [userId, setUserId] = useState<string | null>(null);
  const [userName, setUserName] = useState<string>("Student");
  const [userEmail, setUserEmail] = useState<string>("");
  const [examType, setExamType] = useState<string | null>(null);
  const [examDate, setExamDate] = useState<Date | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setUserId(localStorage.getItem("userId"));
    try {
      const u = JSON.parse(localStorage.getItem("user") || "{}");
      if (u?.name) setUserName(u.name);
      if (u?.email) setUserEmail(u.email);
      if (u?.examType) setExamType(u.examType);
      if (u?.examDate) setExamDate(new Date(u.examDate));
    } catch {
      /* ignore */
    }
  }, []);

  // Prefer live auth context when available
  useEffect(() => {
    if (authUser?.name) setUserName(authUser.name);
    if (authUser?.email) setUserEmail(authUser.email);
    if (authUser?.examType) setExamType(authUser.examType);
    if (authUser?.examDate) setExamDate(new Date(authUser.examDate));
  }, [authUser]);

  // Close the profile menu on outside click
  useEffect(() => {
    if (!menuOpen) return;
    const onClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [menuOpen]);

  const handleLogout = () => {
    setMenuOpen(false);
    logout();
    router.push("/auth/login");
  };

  const initial = userName?.trim()?.charAt(0)?.toUpperCase() || "S";
  const pageTitle = NAV.find((n) => pathname.startsWith(n.path))?.name ?? "";
  const daysToExam = examDate
    ? Math.max(0, Math.ceil((examDate.getTime() - Date.now()) / 86400000))
    : null;

  return (
    <div className="app-ambient min-h-screen bg-background text-foreground">
      {/* Desktop sidebar */}
      <aside className="sidebar-glass fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-sidebar-border bg-sidebar lg:flex">
        <div className="flex h-16 items-center border-b border-sidebar-border px-5">
          <Brand />
        </div>
        <div className="flex-1 overflow-y-auto px-3 py-5">
          <NavLinks userId={userId} pathname={pathname} />
        </div>
        <div className="space-y-2 border-t border-sidebar-border p-3">
          {daysToExam !== null && (
            <div
              className={cn(
                "flex items-center gap-2.5 rounded-xl border border-primary/20 bg-primary/5 px-3 py-2.5",
                daysToExam <= 30 && "glow-breathe border-primary/35"
              )}
            >
              <Timer className="h-4 w-4 shrink-0 text-primary" />
              <p className="text-xs font-medium text-muted-foreground">
                <span className="font-bold text-foreground">{daysToExam} days</span> to your exam
              </p>
            </div>
          )}
          <div className="flex items-center gap-2">
            <Link
              href={userId ? `/profile?userId=${userId}` : "/profile"}
              className="flex min-w-0 flex-1 items-center gap-3 rounded-xl bg-secondary/60 p-3 transition-colors hover:bg-secondary"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full brand-gradient text-sm font-semibold text-white">
                {initial}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{userName}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {examType ? `${examType} aspirant` : "Aspirant"}
                </p>
              </div>
            </Link>
            <button
              onClick={handleLogout}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
              title="Sign out"
              aria-label="Sign out"
            >
              <LogOut className="h-4.5 w-4.5" />
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              className="fixed inset-0 z-40 bg-foreground/40 backdrop-blur-sm lg:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              className="fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-sidebar-border bg-sidebar lg:hidden"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 320, damping: 34 }}
            >
              <div className="flex h-16 items-center justify-between border-b border-sidebar-border px-5">
                <Brand />
                <button
                  onClick={() => setMobileOpen(false)}
                  className="rounded-lg p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto px-3 py-5">
                <NavLinks userId={userId} pathname={pathname} onNavigate={() => setMobileOpen(false)} />
              </div>
              <div className="border-t border-sidebar-border p-3">
                <button
                  onClick={handleLogout}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                >
                  <LogOut className="h-[18px] w-[18px]" />
                  Sign out
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main column */}
      <div className="lg:pl-64">
        {/* Topbar */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b border-border bg-background/80 px-4 backdrop-blur-xl sm:px-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(true)}
              className="rounded-lg p-2 text-muted-foreground hover:bg-secondary hover:text-foreground lg:hidden"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="lg:hidden">
              <Brand />
            </div>
            {pageTitle && (
              <span className="hidden text-sm font-semibold text-muted-foreground lg:block">
                {pageTitle}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setMenuOpen((v) => !v)}
                className="flex items-center gap-1.5 rounded-full p-0.5 pr-1.5 transition-colors hover:bg-secondary"
                aria-label="Open profile menu"
                aria-expanded={menuOpen}
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-full brand-gradient text-sm font-semibold text-white shadow-button">
                  {initial}
                </span>
                <ChevronDown
                  className={cn("h-4 w-4 text-muted-foreground transition-transform", menuOpen && "rotate-180")}
                />
              </button>
              <AnimatePresence>
                {menuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -6, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -6, scale: 0.98 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-full z-50 mt-2 w-60 overflow-hidden rounded-xl border border-border bg-popover shadow-xl"
                  >
                    <div className="border-b border-border px-4 py-3">
                      <p className="truncate text-sm font-semibold text-foreground">{userName}</p>
                      {userEmail && <p className="truncate text-xs text-muted-foreground">{userEmail}</p>}
                    </div>
                    <div className="p-1.5">
                      <Link
                        href={userId ? `/profile?userId=${userId}` : "/profile"}
                        onClick={() => setMenuOpen(false)}
                        className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-foreground transition-colors hover:bg-secondary"
                      >
                        <Settings className="h-4 w-4 text-muted-foreground" />
                        Profile &amp; settings
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-destructive transition-colors hover:bg-destructive/10"
                      >
                        <LogOut className="h-4 w-4" />
                        Sign out
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        {/* pb clears the mobile dock; resets on desktop where the dock is hidden */}
        <main className="mx-auto max-w-7xl px-4 py-7 pb-28 sm:px-6 lg:px-8 lg:pb-7">{children}</main>
      </div>

      <MobileDock />
    </div>
  );
}
