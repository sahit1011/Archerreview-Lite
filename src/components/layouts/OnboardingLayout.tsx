"use client";

import { ReactNode } from 'react';
import ProgressIndicator from '../onboarding/ProgressIndicator';
import { motion } from 'framer-motion';

interface OnboardingLayoutProps {
  children: ReactNode;
  showProgress?: boolean;
}

export default function OnboardingLayout({
  children,
  showProgress = true
}: OnboardingLayoutProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8 bg-background">
      <motion.main
        className="max-w-4xl w-full bg-card-background-dark rounded-xl shadow-md border border-border-color-dark p-8 my-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {showProgress && <ProgressIndicator />}

        {children}
      </motion.main>

      <footer className="text-center text-archer-light-text/70 text-sm mb-8">
        <p>© 2024 ArcherReview. This is a prototype for demonstration purposes.</p>
      </footer>
    </div>
  );
}
