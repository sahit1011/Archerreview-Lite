"use client";

import MainNav from '../navigation/MainNav';
import PageTransition from './PageTransition';

interface AppLayoutProps {
  children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-gradient-to-r from-light-bg-gradient-start to-light-bg-gradient-end">
      <MainNav />
      <PageTransition>
        <main className="max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
          {children}
        </main>
      </PageTransition>
      <footer className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 text-center border-t border-archer-bright-teal/20">
        <div className="flex flex-col items-center justify-center">
          <div className="flex items-center mb-4">
            <span className="text-archer-bright-teal font-bold text-xl mr-1">Archer</span>
            <span className="text-archer-light-blue font-bold text-xl">Review</span>
          </div>
          <p className="text-archer-light-text/70 text-sm">© 2024 ArcherReview. This is a prototype for demonstration purposes.</p>
        </div>
      </footer>
    </div>
  );
}
