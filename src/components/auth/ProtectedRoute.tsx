"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/context/UserContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  adminOnly?: boolean;
}

/**
 * A logged-in user is one who holds a JWT in localStorage. The UserContext verifies
 * that token against /api/auth/me and clears it if it's invalid, and every /api route
 * enforces auth server-side — so trusting the token's presence here is safe and keeps
 * navigation robust. Previously the gate keyed off the in-memory `isAuthenticated` flag
 * plus a `fromOnboarding=true` URL param; that param only lives on the post-onboarding
 * dashboard URL, so clicking any nav link (e.g. Notes) dropped it and bounced an already
 * logged-in user back to /auth/login. Keying off the token fixes that.
 */
function hasToken(): boolean {
  return typeof window !== 'undefined' && !!localStorage.getItem('token');
}

export default function ProtectedRoute({ children, adminOnly = false }: ProtectedRouteProps) {
  const { user, isLoading, isAuthenticated } = useUser();
  const router = useRouter();

  const allowed = isAuthenticated || hasToken();

  useEffect(() => {
    if (isLoading) return;
    if (!allowed) {
      router.push('/auth/login');
    } else if (adminOnly && user?.role !== 'admin') {
      router.push('/dashboard');
    }
  }, [isLoading, allowed, adminOnly, user, router]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-t-2 border-primary" />
      </div>
    );
  }

  if (!allowed) return null;
  if (adminOnly && user?.role !== 'admin') return null;

  return <>{children}</>;
}
