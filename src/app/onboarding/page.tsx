"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function OnboardingPage() {
  const router = useRouter();

  // Redirect to the welcome page
  useEffect(() => {
    router.replace('/onboarding/welcome');
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="inline-block h-9 w-9 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
        <p className="mt-4 text-sm font-medium text-muted-foreground">Redirecting…</p>
      </div>
    </div>
  );
}
