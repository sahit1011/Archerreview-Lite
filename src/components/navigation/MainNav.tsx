"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { fadeIn, fadeInDown, staggerContainer } from '@/utils/animationUtils';

export default function MainNav() {
  const pathname = usePathname();

  // Get userId from localStorage to include in navigation links
  const [userId, setUserId] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    // Get userId from localStorage
    const storedUserId = localStorage.getItem('userId');
    if (storedUserId) {
      setUserId(storedUserId);
    }
  }, []);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  // Create navigation items with userId parameter if available
  const navItems = [
    {
      name: 'Dashboard',
      href: userId ? `/dashboard?userId=${userId}` : '/dashboard'
    },
    {
      name: 'Calendar',
      href: userId ? `/calendar?userId=${userId}` : '/calendar'
    },
    {
      name: 'AI Tutor',
      href: userId ? `/tutor?userId=${userId}` : '/tutor'
    },
    {
      name: 'Progress',
      href: userId ? `/progress?userId=${userId}` : '/progress'
    },
    {
      name: 'Settings',
      href: userId ? `/profile?userId=${userId}` : '/profile'
    },
  ];

  return (
    <nav className="bg-gradient-to-r from-archer-bright-teal to-archer-light-blue text-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="flex-shrink-0 font-bold text-xl flex items-center">
              <span className="text-white mr-1">Archer</span>
              <span className="text-white">Review</span>
            </Link>
            <div className="hidden md:block">
              {/* @ts-ignore Framer Motion type issue with className */}
              <motion.div
                className="ml-10 flex items-baseline space-x-4"
                initial="hidden"
                animate="visible"
                variants={staggerContainer}
              >
                {navItems.map((item, index) => {
                  const isActive = pathname === item.href;
                  return (
                    <motion.div
                      key={item.name}
                      variants={fadeIn}
                      transition={{ delay: 0.05 * index }}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Link
                        href={item.href}
                        className={`px-4 py-2 rounded-md text-sm font-medium shadow-button ${
                          isActive
                            ? 'bg-white text-archer-bright-teal'
                            : 'bg-white/20 text-white backdrop-blur-sm hover:bg-white/30'
                        }`}
                      >
                        {item.name}
                      </Link>
                    </motion.div>
                  );
                })}
              </motion.div>
            </div>
          </div>
          <div className="hidden md:block">
            <div className="ml-4 flex items-center md:ml-6">
              <button
                type="button"
                className="p-2 rounded-full bg-archer-bright-teal/20 text-archer-bright-teal hover:bg-archer-bright-teal/30 focus:outline-none shadow-button"
              >
                <span className="sr-only">View notifications</span>
                <svg
                  className="h-5 w-5"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                  />
                </svg>
              </button>

              {/* Profile dropdown */}
              <div className="ml-3 relative">
                <div>
                  <button
                    type="button"
                    className="bg-archer-bright-teal text-white rounded-full flex items-center text-sm focus:outline-none shadow-button hover:bg-archer-bright-teal/90"
                  >
                    <span className="sr-only">Open user menu</span>
                    <div className="h-9 w-9 rounded-full flex items-center justify-center text-white font-semibold">
                      U {/* Placeholder, ideally user initials */}
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div className="-mr-2 flex md:hidden">
            {/* Mobile menu button */}
            {/* @ts-ignore Framer Motion type issue with type and className */}
            <motion.button
              type="button"
              className="bg-archer-bright-teal/20 inline-flex items-center justify-center p-2 rounded-md text-archer-bright-teal hover:bg-archer-bright-teal/30 focus:outline-none shadow-button"
              onClick={toggleMobileMenu}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <span className="sr-only">Open main menu</span>
              <svg
                className="block h-6 w-6"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </motion.button>
          </div>
        </div>
      </div>

      {/* Mobile menu, show/hide based on menu state */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          // @ts-ignore Framer Motion type issue with className
          <motion.div
            className="md:hidden"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            {/* @ts-ignore Framer Motion type issue with className */}
            <motion.div
              className="px-2 pt-2 pb-3 space-y-2 sm:px-3 bg-white backdrop-blur-sm shadow-lg"
              variants={fadeInDown}
              initial="hidden"
              animate="visible"
            >
              {navItems.map((item, index) => {
                const isActive = pathname === item.href;
                return (
                  <motion.div
                    key={item.name}
                    variants={fadeIn}
                    transition={{ delay: 0.05 * index }}
                  >
                    <Link
                      href={item.href}
                      className={`block px-4 py-2 rounded-md text-base font-medium shadow-button ${
                        isActive
                          ? 'bg-archer-bright-teal text-white'
                          : 'bg-light-bg-secondary text-archer-dark-text hover:bg-light-bg-gradient-end'
                      }`}
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      {item.name}
                    </Link>
                  </motion.div>
                );
              })}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
