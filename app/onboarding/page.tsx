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
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-r from-archer-darker-teal to-archer-medium-teal">
      <div className="text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-archer-bright-teal border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
        <p className="mt-2 text-archer-light-text">Redirecting...</p>
      </div>
    </div>
  );
}
