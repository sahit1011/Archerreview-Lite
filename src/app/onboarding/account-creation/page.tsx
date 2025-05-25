"use client";

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import OnboardingLayout from '@/components/layouts/OnboardingLayout';
import { useOnboarding } from '@/context/OnboardingContext';
import { useUser } from '@/context/UserContext';

export default function AccountCreationPage() {
  const router = useRouter();
  const { logout } = useUser();
  const {
    name,
    email,
    password,
    setName,
    setEmail,
    setPassword,
    registerUser,
    goToNextStep
  } = useOnboarding();

  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Clear any existing user data when starting a new registration
  useEffect(() => {
    // Clear localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('userId');

    // Clear user context
    logout();

    console.log('Cleared existing user data for new registration');
  }, [logout]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form
    if (!name || !email || !password || !confirmPassword) {
      setError('All fields are required');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Register the user
      await registerUser();

      // Go to the next step
      goToNextStep();
    } catch (err) {
      console.error('Error during registration:', err);
      setError(err instanceof Error ? err.message : 'An error occurred during registration');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <OnboardingLayout>
      {/* @ts-ignore Framer Motion type issue with className */}
      <motion.div
        className="text-center mb-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <h1 className="text-3xl font-bold text-primary mb-4">
          Step 1: Create Your Account
        </h1>
        <p className="text-foreground/80 max-w-2xl mx-auto">
          Let's start by creating your account. This is the first step in setting up your personalized NCLEX study plan.
        </p>
        <div className="flex justify-center mt-4">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-bold">1</div>
            <div className="w-16 h-1 bg-border"></div>
            <div className="w-8 h-8 rounded-full bg-card text-foreground/60 flex items-center justify-center font-bold">2</div>
            <div className="w-16 h-1 bg-border"></div>
            <div className="w-8 h-8 rounded-full bg-card text-foreground/60 flex items-center justify-center font-bold">3</div>
            <div className="w-16 h-1 bg-border"></div>
            <div className="w-8 h-8 rounded-full bg-card text-foreground/60 flex items-center justify-center font-bold">4</div>
          </div>
        </div>
      </motion.div>

      {/* @ts-ignore Framer Motion type issue with className */}
      <motion.div
        className="max-w-md mx-auto"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        {error && (
          <div className="mb-4 bg-red-500/10 border border-red-500/30 text-red-600 px-4 py-3 rounded-md" role="alert">
            <p>{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-foreground text-sm font-medium mb-2">
              Full Name
            </label>
            <input
              id="name"
              name="name"
              type="text"
              autoComplete="name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="appearance-none border border-border rounded-md w-full py-2 px-3 text-foreground leading-tight focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="John Doe"
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-foreground text-sm font-medium mb-2">
              Email Address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="appearance-none border border-border rounded-md w-full py-2 px-3 text-foreground leading-tight focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-foreground text-sm font-medium mb-2">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="appearance-none border border-border rounded-md w-full py-2 px-3 text-foreground leading-tight focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="••••••••"
            />
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-foreground text-sm font-medium mb-2">
              Confirm Password
            </label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="appearance-none border border-border rounded-md w-full py-2 px-3 text-foreground leading-tight focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="••••••••"
            />
          </div>

          <div className="pt-4">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50"
            >
              {isLoading ? 'Creating account...' : 'Continue'}
            </button>
          </div>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-foreground/80">
            Already have an account?{' '}
            <Link href="/auth/login" className="font-medium text-primary hover:text-primary/90">
              Sign in
            </Link>
          </p>
        </div>
      </motion.div>
    </OnboardingLayout>
  );
}
