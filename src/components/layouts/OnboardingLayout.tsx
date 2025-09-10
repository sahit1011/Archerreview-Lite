"use client";

import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import ThemeToggle from '@/components/ThemeToggle';

interface OnboardingLayoutProps {
  children: ReactNode;
}

export default function OnboardingLayout({
  children
}: OnboardingLayoutProps) {
  return (
    <div style={{background: 'var(--bg-main)'}} className="flex flex-col items-center justify-center min-h-screen p-8 transition-colors duration-300">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(0,169,157,0.1),transparent_50%)]"></div>
      <div className="absolute top-4 right-4 z-20">
        <ThemeToggle />
      </div>
      <motion.main
        className="relative z-10 max-w-4xl w-full p-8 my-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >

        {children}
      </motion.main>

      <footer className="text-center text-white/60 text-sm mb-8">
        <p>© 2024 ArcherReview. This is a prototype for demonstration purposes.</p>
      </footer>
    </div>
  );
}