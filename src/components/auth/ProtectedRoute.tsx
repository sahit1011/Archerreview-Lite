"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/context/UserContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  adminOnly?: boolean;
}

export default function ProtectedRoute({ children, adminOnly = false }: ProtectedRouteProps) {
  const { user, isLoading, isAuthenticated } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        // Check if we have a userId in localStorage
        // This handles the case where a user just completed onboarding
        const userId = localStorage.getItem('userId');
        const fromOnboarding = window.location.href.includes('fromOnboarding=true');

        if (userId && fromOnboarding) {
          console.log('User coming from onboarding with userId, allowing access');
          // Allow access to the dashboard even if not fully authenticated
          // The dashboard will load the user data based on the userId
        } else {
          console.log('User not authenticated, redirecting to login');
          router.push('/auth/login');
        }
      } else if (adminOnly && user?.role !== 'admin') {
        router.push('/dashboard');
      }
    }
  }, [isLoading, isAuthenticated, user, router, adminOnly]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Check if we have a userId in localStorage and are coming from onboarding
    const userId = localStorage.getItem('userId');
    const fromOnboarding = window.location.href.includes('fromOnboarding=true');

    if (userId && fromOnboarding) {
      // Allow access to the dashboard
      console.log('Allowing access to protected route for user from onboarding');
    } else {
      return null;
    }
  }

  if (adminOnly && user?.role !== 'admin') {
    return null;
  }

  return <>{children}</>;
}
