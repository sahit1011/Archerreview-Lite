"use client";

import { useState, FormEvent, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useUser } from '@/context/UserContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { GraduationCap, Mail, Lock, ArrowRight, AlertCircle } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { login, isAuthenticated } = useUser();
  const router = useRouter();

  // Clear any existing authentication data when the login page loads
  useEffect(() => {
    // Clear localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('userId');

    console.log('Cleared authentication data on login page load');
  }, []);

  // Redirect if authenticated after login
  useEffect(() => {
    const checkUserStudyPlan = async () => {
      if (isAuthenticated) {
        try {
          // Get the user ID from localStorage
          const userId = localStorage.getItem('userId');
          if (!userId) {
            console.log('No userId found in localStorage, staying on login page');
            return;
          }

          console.log('User is authenticated, checking for study plan...');

          // Check if the user has a study plan
          const studyPlanResponse = await fetch(`/api/study-plans?userId=${userId}`);
          const studyPlanData = await studyPlanResponse.json();

          if (studyPlanData.success && studyPlanData.studyPlan) {
            // User has a study plan, redirect to dashboard with userId parameter
            console.log('User has a study plan, redirecting to dashboard with userId');
            router.push(`/dashboard?userId=${userId}`);
          } else {
            // User doesn't have a study plan, redirect to onboarding
            console.log('User does not have a study plan, redirecting to onboarding');
            router.push('/onboarding/welcome');
          }
        } catch (error) {
          console.error('Error checking study plan:', error);
          // If we can't check the study plan, stay on login page
          // This is safer than automatically redirecting
        }
      }
    };

    checkUserStudyPlan();
  }, [isAuthenticated, router]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      setError('Email and password are required');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const result = await login(email, password);

      if (result.success) {
        // Get the user ID from localStorage after successful login
        const userId = localStorage.getItem('userId');

        if (result.hasStudyPlan) {
          // User has a study plan, redirect to dashboard with userId parameter
          console.log('Login successful, redirecting to dashboard with userId:', userId);
          router.push(`/dashboard?userId=${userId}`);
        } else {
          // User doesn't have a study plan, redirect to onboarding
          console.log('Login successful, user needs onboarding');
          router.push('/onboarding/welcome');
        }
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError('An error occurred during login');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center px-6 py-12 aurora-bg">
      <div aria-hidden className="pointer-events-none absolute inset-0 grid-pattern opacity-60" />

      <div className="relative z-10 w-full max-w-md">
        {/* Brand */}
        <Link href="/" className="mb-8 flex items-center justify-center gap-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl brand-gradient text-white shadow-button">
            <GraduationCap className="h-5 w-5" />
          </div>
          <span className="font-display text-xl font-bold tracking-tight">StudyArc</span>
        </Link>

        <div className="mb-7 text-center">
          <h1 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
            Welcome back
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            New here?{" "}
            <Link href="/onboarding/account-creation" className="font-semibold text-primary hover:underline">
              Create a free account
            </Link>
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-7 shadow-lg shadow-primary/5">
          {error && (
            <div
              className="mb-5 flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
              role="alert"
            >
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <p>{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
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
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Link href="/auth/forgot-password" className="text-xs font-medium text-primary hover:underline">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="pl-9"
                />
              </div>
            </div>

            <label htmlFor="remember-me" className="flex items-center gap-2 text-sm text-muted-foreground">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                className="h-4 w-4 rounded border-input text-primary focus:ring-ring"
              />
              Remember me
            </label>

            <Button type="submit" variant="brand" size="lg" disabled={isLoading} className="shine w-full">
              {isLoading ? "Signing in…" : "Sign in"}
              {!isLoading && <ArrowRight className="h-4 w-4" />}
            </Button>
          </form>
        </div>

        <div className="mt-6 text-center">
          <Link href="/" className="text-sm font-medium text-muted-foreground hover:text-foreground">
            ← Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}
