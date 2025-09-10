"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useUser } from "@/context/UserContext";

export default function Home() {
  const router = useRouter();
  const { logout } = useUser();

  // Function to handle starting onboarding
  const handleStartOnboarding = () => {
    // Clear any existing user data
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('userId');

    // Clear user context
    logout();

    console.log('Cleared existing user data before starting onboarding');

    // Navigate to onboarding
    router.push('/onboarding/account-creation');
  };
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8 bg-background">
      <main className="max-w-4xl w-full bg-card rounded-xl shadow-md p-8 my-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary mb-4">
            ArcherReview Dynamic AI NCLEX Calendar
          </h1>
          <p className="text-foreground max-w-2xl mx-auto">
            An AI-powered adaptive study calendar for NCLEX preparation that personalizes your learning journey.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          <div className="bg-card p-6 rounded-lg border border-border">
            <h2 className="text-xl font-semibold text-primary mb-4">Key Features</h2>
            <ul className="space-y-2 text-foreground">
              <li className="flex items-start">
                <svg className="h-5 w-5 text-primary mr-2 mt-0.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Dynamic AI-powered study plan</span>
              </li>
              <li className="flex items-start">
                <svg className="h-5 w-5 text-primary mr-2 mt-0.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Optional diagnostic assessment</span>
              </li>
              <li className="flex items-start">
                <svg className="h-5 w-5 text-primary mr-2 mt-0.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Interactive calendar with drag-and-drop</span>
              </li>
              <li className="flex items-start">
                <svg className="h-5 w-5 text-primary mr-2 mt-0.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>AI tutor for contextual help</span>
              </li>
              <li className="flex items-start">
                <svg className="h-5 w-5 text-primary mr-2 mt-0.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Predictive readiness scoring</span>
              </li>
            </ul>
          </div>

          <div className="bg-card p-6 rounded-lg border border-border">
            <h2 className="text-xl font-semibold text-primary mb-4">How It Works</h2>
            <ol className="space-y-2 text-foreground list-decimal list-inside">
              <li>Set your NCLEX exam date</li>
              <li>Take an optional diagnostic assessment</li>
              <li>Define your study availability</li>
              <li>Get a personalized study plan</li>
              <li>Track your progress and adapt as you learn</li>
              <li>Receive AI-powered insights and remediation</li>
              <li>Achieve NCLEX readiness with confidence</li>
            </ol>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={handleStartOnboarding}
            className="bg-primary text-white font-medium py-3 px-6 rounded-lg text-center transition-all duration-300 shadow-md group relative"
          >
            <span className="relative z-10 group-hover:translate-y-[-2px] transition-transform duration-300">Start Onboarding</span>
            <div className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-300 bg-transparent border-2 border-archer-bright-teal/30 shadow-[0_0_15px_rgba(0,169,157,0.5)] -m-1"></div>
          </button>
          <Link
            href="/auth/login"
            className="bg-background text-primary border border-primary font-medium py-3 px-6 rounded-lg text-center transition-all duration-300 shadow-md group relative"
          >
            <span className="relative z-10 group-hover:translate-y-[-2px] transition-transform duration-300">Sign In</span>
            <div className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-300 bg-transparent border-2 border-archer-bright-teal/30 shadow-[0_0_15px_rgba(0,169,157,0.5)] -m-1"></div>
          </Link>
          <Link
            href="/demo-dashboard"
            className="bg-primary text-white font-medium py-3 px-6 rounded-lg text-center transition-all duration-300 shadow-md group relative"
          >
            <span className="relative z-10 group-hover:translate-y-[-2px] transition-transform duration-300">View Demo Dashboard</span>
            <div className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-300 bg-transparent border-2 border-archer-bright-teal/30 shadow-[0_0_15px_rgba(0,169,157,0.5)] -m-1"></div>
          </Link>
        </div>
      </main>

      <footer className="text-center text-foreground/70 text-sm mb-8">
        <p>© 2024 ArcherReview. This is a prototype for demonstration purposes.</p>
      </footer>
    </div>
  );
}
