"use client";

import { ReactNode } from 'react';
import { motion } from 'framer-motion';

interface OnboardingLayoutProps {
  children: ReactNode;
}

export default function OnboardingLayout({
  children
}: OnboardingLayoutProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8 bg-background">
      <div className="max-w-4xl w-full bg-card-background-dark rounded-xl shadow-md border border-border-color-dark p-8 my-8">
        {children}
      </div>

      <footer className="text-center text-archer-light-text/70 text-sm mb-8">
        <p>© 2024 ArcherReview. This is a prototype for demonstration purposes.</p>
      </footer>
    </div>
  );
}
