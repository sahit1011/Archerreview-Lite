"use client";

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import OnboardingLayout from '@/components/layouts/OnboardingLayout';
import { useOnboarding } from '@/context/OnboardingContext';
import { useUser } from '@/context/UserContext';
import OnboardingProgressBar from '@/components/onboarding/OnboardingProgressBar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { User, Mail, Lock, ArrowRight, AlertCircle } from 'lucide-react';

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
        <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-3">Step 1 of 5</p>
        <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight text-foreground mb-4">
          Create your account
        </h1>
        <p className="text-base text-muted-foreground max-w-xl mx-auto mb-8">
          Let&apos;s get you set up. This is the first step toward your personalised NEET &amp; JEE study plan.
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
          <div className="mb-5 flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive" role="alert">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <p>{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="rounded-2xl border border-border bg-card p-7 shadow-lg shadow-primary/5 space-y-5">
          <div className="space-y-2">
            <Label htmlFor="name">Full name</Label>
            <div className="relative">
              <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="name"
                name="name"
                type="text"
                autoComplete="name"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Aarav Sharma"
                className="pl-9"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email address</Label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="pl-9"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="pl-9"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm password</Label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="pl-9"
              />
            </div>
          </div>

          <div className="pt-1">
            <Button type="submit" variant="brand" size="lg" disabled={isLoading} className="shine w-full">
              {isLoading ? 'Creating account…' : 'Continue'}
              {!isLoading && <ArrowRight className="h-4 w-4" />}
            </Button>
          </div>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link href="/auth/login" className="font-semibold text-primary hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </motion.div>
    </OnboardingLayout>
  );
}