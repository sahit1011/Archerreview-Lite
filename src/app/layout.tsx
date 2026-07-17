import type { Metadata } from "next";
import { Suspense } from "react";
import { Inter, Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import ClientThemeProvider from "@/components/ClientThemeProvider";
import { UserProvider } from "@/context/UserContext";
import { OnboardingProvider } from "@/context/OnboardingContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { Toaster } from "sonner";
// Import agent initializer (this will run on the server side only)
import "@/utils/agentInitializer";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const jakarta = Plus_Jakarta_Sans({
  weight: ["500", "600", "700", "800"],
  subsets: ["latin"],
  variable: "--font-jakarta",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono-code",
  display: "swap",
});

export const metadata: Metadata = {
  title: "StudyArc — AI Study Planner for NEET & JEE",
  description:
    "AI-powered adaptive study planner for India's NEET & JEE aspirants — a personalized calendar, diagnostics, and an AI tutor that adapt to your progress.",
  keywords: ["NEET", "JEE", "study plan", "AI tutor", "adaptive learning", "exam preparation", "India"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} ${jakarta.variable} ${jetbrainsMono.variable} antialiased bg-background text-foreground`}
      >
        <ThemeProvider>
          <UserProvider>
            <OnboardingProvider>
              <ClientThemeProvider>
                {/* Catches the CSR bailout from pages using useSearchParams() during
                    static prerender (Next 15 requirement). */}
                <Suspense
                  fallback={
                    <div className="flex items-center justify-center min-h-screen bg-background">
                      <div className="animate-spin rounded-full h-10 w-10 border-2 border-muted border-t-primary" />
                    </div>
                  }
                >
                  {children}
                </Suspense>
                <Toaster position="bottom-right" richColors closeButton />
              </ClientThemeProvider>
            </OnboardingProvider>
          </UserProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
