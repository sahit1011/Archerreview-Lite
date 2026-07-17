"use client";

import { ReactNode } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { GraduationCap } from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";

interface OnboardingLayoutProps {
  children: ReactNode;
}

export default function OnboardingLayout({ children }: OnboardingLayoutProps) {
  return (
    <div className="relative flex min-h-screen flex-col aurora-bg">
      {/* subtle animated backdrop, consistent with the landing */}
      <div aria-hidden className="pointer-events-none absolute inset-0 grid-pattern opacity-60" />

      {/* Brand bar */}
      <header className="relative z-10 flex items-center justify-between px-5 py-4 sm:px-8">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl brand-gradient text-white shadow-button">
            <GraduationCap className="h-5 w-5" />
          </div>
          <span className="font-display text-lg font-bold tracking-tight">StudyArc</span>
        </Link>
        <ThemeToggle />
      </header>

      {/* Centered content */}
      <motion.main
        className="relative z-10 mx-auto w-full max-w-4xl flex-1 px-5 py-8 sm:px-8"
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.2, 0.8, 0.2, 1] }}
      >
        {children}
      </motion.main>

      <footer className="relative z-10 px-5 py-6 text-center text-sm text-muted-foreground">
        <p>© 2026 StudyArc — AI-adaptive NEET &amp; JEE preparation.</p>
      </footer>
    </div>
  );
}
