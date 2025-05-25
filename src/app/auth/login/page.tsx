"use client";

import { useState, FormEvent, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useUser } from '@/context/UserContext';

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
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6 py-12">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <h1 className="text-3xl font-bold text-primary">ArcherReview</h1>
          <h2 className="mt-2 text-2xl font-semibold text-foreground">Sign in to your account</h2>
          <p className="mt-2 text-sm text-foreground/80">
            Or{' '}
            <Link href="/onboarding/account-creation" className="font-medium text-primary hover:text-primary/90">
              create a new account
            </Link>
          </p>
        </div>

        <div className="bg-card shadow-md rounded-lg px-8 pt-6 pb-8 mb-4">
          {error && (
            <div className="mb-4 bg-red-500/10 border border-red-500/30 text-red-600 px-4 py-3 rounded-md" role="alert">
              <p>{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
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

            <div className="mb-6">
              <label htmlFor="password" className="block text-foreground text-sm font-medium mb-2">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="appearance-none border border-border rounded-md w-full py-2 px-3 text-foreground leading-tight focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="••••••••"
              />
            </div>

            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-primary focus:ring-primary border-border rounded"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-foreground">
                  Remember me
                </label>
              </div>

              <div className="text-sm">
                <Link href="/auth/forgot-password" className="font-medium text-primary hover:text-primary/90">
                  Forgot your password?
                </Link>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50"
              >
                {isLoading ? 'Signing in...' : 'Sign in'}
              </button>
            </div>
          </form>
        </div>

        <div className="text-center mt-4">
          <Link href="/" className="text-sm font-medium text-primary hover:text-primary/90">
            ← Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}
