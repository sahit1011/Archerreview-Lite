"use client";

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import OnboardingLayout from '@/components/layouts/OnboardingLayout';
import { useOnboarding } from '@/context/OnboardingContext';
import { useUser } from '@/context/UserContext';
import OnboardingProgressBar from '@/components/onboarding/OnboardingProgressBar';

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
        <h1 className="text-5xl font-bold gradient-text mb-6">
          Step 1: Create Your Account
        </h1>
        <p className="text-xl text-white/80 max-w-2xl mx-auto mb-8 glassmorphic p-4 rounded-xl backdrop-blur-xl">
          Let's start by creating your account. This is the first step in setting up your personalized NCLEX study plan.
        </p>
        
        <OnboardingProgressBar currentStep="account" />

      </motion.div>

      {/* @ts-ignore Framer Motion type issue with className */}
      <motion.div
        className="max-w-md w-full mx-auto"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        {error && (
          <div className="mb-6 glassmorphic bg-red-500/5 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl backdrop-blur-xl" role="alert">
            <p>{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="glassmorphic p-8 rounded-xl space-y-6">
          <div>
            <label htmlFor="name" className="block text-white/90 text-sm font-medium mb-2">
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
              className="appearance-none bg-white/5 border border-white/10 rounded-xl w-full py-3 px-4 text-white placeholder-white/40 leading-tight focus:outline-none focus:ring-2 focus:ring-[#00A99D] focus:border-transparent transition-all duration-200"
              placeholder="John Doe"
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-white/90 text-sm font-medium mb-2">
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
              className="appearance-none bg-white/5 border border-white/10 rounded-xl w-full py-3 px-4 text-white placeholder-white/40 leading-tight focus:outline-none focus:ring-2 focus:ring-[#00A99D] focus:border-transparent transition-all duration-200"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-white/90 text-sm font-medium mb-2">
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
              className="appearance-none bg-white/5 border border-white/10 rounded-xl w-full py-3 px-4 text-white placeholder-white/40 leading-tight focus:outline-none focus:ring-2 focus:ring-[#00A99D] focus:border-transparent transition-all duration-200"
              placeholder="••••••••"
            />
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-white/90 text-sm font-medium mb-2">
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
              className="appearance-none bg-white/5 border border-white/10 rounded-xl w-full py-3 px-4 text-white placeholder-white/40 leading-tight focus:outline-none focus:ring-2 focus:ring-[#00A99D] focus:border-transparent transition-all duration-200"
              placeholder="••••••••"
            />
          </div>

          <div className="pt-4">
            <button
              type="submit"
              disabled={isLoading}
              className="modern-button w-full py-3 text-lg font-semibold hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100"
            >
              {isLoading ? 'Creating account...' : 'Continue'}
            </button>
          </div>
        </form>

        <div className="mt-8 text-center glassmorphic py-4 px-6 rounded-xl">
          <p className="text-white/80">
            Already have an account?{' '}
            <Link href="/auth/login" className="text-[#00A99D] hover:text-[#42B0E8] font-medium transition-colors duration-200">
              Sign in
            </Link>
          </p>
        </div>
      </motion.div>
    </OnboardingLayout>
  );
}