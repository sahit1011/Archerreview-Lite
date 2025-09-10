"use client";

import MainNav from '../navigation/MainNav';
import PageTransition from './PageTransition';

interface AppLayoutProps {
  children: React.ReactNode;
  light?: boolean;
}

export default function AppLayout({ children, light = false }: AppLayoutProps) {
  return (
    <div className={light ? "min-h-screen bg-white" : "min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800"}>
      <MainNav />
      <PageTransition>
        <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 relative z-10">
          {children}
        </main>
      </PageTransition>
      <footer className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 text-center border-t border-white/10 relative z-10">
        <div className="flex flex-col items-center justify-center">
          <div className="flex items-center mb-4">
            <span className="text-indigo-400 font-bold text-xl mr-1">Archer</span>
            <span className="text-teal-400 font-bold text-xl">Review</span>
          </div>
          <p className="text-gray-400 text-sm">© 2024 ArcherReview. This is a prototype for demonstration purposes.</p>
        </div>
      </footer>
    </div>
  );
}
