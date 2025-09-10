"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useUser } from "@/context/UserContext";
import ThemeToggle from "@/components/ThemeToggle";

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
    <div style={{background: 'var(--bg-main)'}}
         className="dark flex flex-col items-center justify-center min-h-screen relative transition-colors duration-300">
      <div className="absolute top-4 right-4 z-20">
        <ThemeToggle />
      </div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(0,169,157,0.1),transparent_50%)]"></div>
      <main className="max-w-5xl w-full p-8 my-8 relative z-10">
        <div className="text-center mb-12">
          <h1 className="text-6xl font-bold gradient-text mb-6 leading-tight">
            ArcherReview Dynamic AI <br/> NCLEX Calendar
          </h1>
          <p className="text-xl text-white/90 max-w-2xl mx-auto glassmorphic p-6 rounded-2xl backdrop-blur-xl">
            An AI-powered adaptive study calendar for NCLEX preparation that personalizes your learning journey.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          <div className="glassmorphic p-8 rounded-xl hover-card">
            <h2 className="text-3xl font-semibold gradient-text mb-8">Key Features</h2>
            <ul className="space-y-4 text-white/90">
              <li className="glassmorphic p-4 rounded-lg transition-all duration-300 hover:scale-105 hover:bg-white/5 cursor-default">
                <div className="flex items-start">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#00A99D] to-[#42B0E8] flex items-center justify-center mr-4 flex-shrink-0">
                    <svg className="h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-medium mb-1">Dynamic AI Study Plan</h3>
                    <p className="text-sm text-white/70">Personalized learning paths that adapt to your progress and needs</p>
                  </div>
                </div>
              </li>
              <li className="glassmorphic p-4 rounded-lg transition-all duration-300 hover:scale-105 hover:bg-white/5 cursor-default">
                <div className="flex items-start">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#00A99D] to-[#42B0E8] flex items-center justify-center mr-4 flex-shrink-0">
                    <svg className="h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                      <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-medium mb-1">Smart Assessment</h3>
                    <p className="text-sm text-white/70">Comprehensive diagnostic tests to identify your strengths and areas for improvement</p>
                  </div>
                </div>
              </li>
              <li className="glassmorphic p-4 rounded-lg transition-all duration-300 hover:scale-105 hover:bg-white/5 cursor-default">
                <div className="flex items-start">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#00A99D] to-[#42B0E8] flex items-center justify-center mr-4 flex-shrink-0">
                    <svg className="h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-medium mb-1">Interactive Calendar</h3>
                    <p className="text-sm text-white/70">Flexible scheduling with drag-and-drop functionality to manage your study time</p>
                  </div>
                </div>
              </li>
              <li className="glassmorphic p-4 rounded-lg transition-all duration-300 hover:scale-105 hover:bg-white/5 cursor-default">
                <div className="flex items-start">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#00A99D] to-[#42B0E8] flex items-center justify-center mr-4 flex-shrink-0">
                    <svg className="h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M10 3.5a1.5 1.5 0 013 0V4a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-.5a1.5 1.5 0 000 3h.5a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-.5a1.5 1.5 0 00-3 0v.5a1 1 0 01-1 1H6a1 1 0 01-1-1v-3a1 1 0 00-1-1h-.5a1.5 1.5 0 010-3H4a1 1 0 001-1V6a1 1 0 011-1h3a1 1 0 001-1v-.5z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-medium mb-1">AI-Powered Tutor</h3>
                    <p className="text-sm text-white/70">24/7 access to contextual help and personalized explanations</p>
                  </div>
                </div>
              </li>
            </ul>
          </div>

          <div className="glassmorphic p-8 rounded-xl hover-card">
            <h2 className="text-3xl font-semibold gradient-text mb-8">How It Works</h2>
            <ol className="space-y-4 text-white/90">
              <li className="glassmorphic p-4 rounded-lg transition-all duration-300 hover:scale-105 hover:bg-white/5 cursor-default">
                <div className="flex items-start">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#00A99D] to-[#42B0E8] flex items-center justify-center mr-4 flex-shrink-0">
                    <span className="text-white font-bold">1</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-medium mb-1">Set Your Goal</h3>
                    <p className="text-sm text-white/70">Choose your NCLEX exam date and let us plan backwards</p>
                  </div>
                </div>
              </li>
              <li className="glassmorphic p-4 rounded-lg transition-all duration-300 hover:scale-105 hover:bg-white/5 cursor-default">
                <div className="flex items-start">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#00A99D] to-[#42B0E8] flex items-center justify-center mr-4 flex-shrink-0">
                    <span className="text-white font-bold">2</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-medium mb-1">Initial Assessment</h3>
                    <p className="text-sm text-white/70">Complete a diagnostic test to identify your strengths and weaknesses</p>
                  </div>
                </div>
              </li>
              <li className="glassmorphic p-4 rounded-lg transition-all duration-300 hover:scale-105 hover:bg-white/5 cursor-default">
                <div className="flex items-start">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#00A99D] to-[#42B0E8] flex items-center justify-center mr-4 flex-shrink-0">
                    <span className="text-white font-bold">3</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-medium mb-1">Customize Schedule</h3>
                    <p className="text-sm text-white/70">Tell us your availability and preferred study times</p>
                  </div>
                </div>
              </li>
              <li className="glassmorphic p-4 rounded-lg transition-all duration-300 hover:scale-105 hover:bg-white/5 cursor-default">
                <div className="flex items-start">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#00A99D] to-[#42B0E8] flex items-center justify-center mr-4 flex-shrink-0">
                    <span className="text-white font-bold">4</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-medium mb-1">Start Learning</h3>
                    <p className="text-sm text-white/70">Follow your personalized study plan with AI-powered guidance</p>
                  </div>
                </div>
              </li>
              <li className="glassmorphic p-4 rounded-lg transition-all duration-300 hover:scale-105 hover:bg-white/5 cursor-default">
                <div className="flex items-start">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#00A99D] to-[#42B0E8] flex items-center justify-center mr-4 flex-shrink-0">
                    <span className="text-white font-bold">5</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-medium mb-1">Track Progress</h3>
                    <p className="text-sm text-white/70">Monitor your improvement with real-time analytics and adjustments</p>
                  </div>
                </div>
              </li>
            </ol>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center mt-12">
          <button
            onClick={handleStartOnboarding}
            className="modern-button"
          >
            Start Onboarding
          </button>
          <Link
            href="/auth/login"
            className="modern-button secondary"
          >
            Sign In
          </Link>
          <Link
            href="/demo-dashboard"
            className="modern-button"
          >
            View Demo Dashboard
          </Link>
        </div>
      </main>

      <footer className="text-center text-foreground/70 text-sm mb-8">
        <p>© 2024 ArcherReview. This is a prototype for demonstration purposes.</p>
      </footer>
    </div>
  );
}
