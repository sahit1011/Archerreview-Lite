import type { Metadata } from "next";
import { Poppins, Montserrat, Roboto_Mono } from "next/font/google";
import "./globals.css";
import "./modern-theme.css";
import ClientThemeProvider from "@/components/ClientThemeProvider";
import { UserProvider } from "@/context/UserContext";
import { OnboardingProvider } from "@/context/OnboardingContext";
import { ThemeProvider } from "@/context/ThemeContext";
// Import agent initializer (this will run on the server side only)
import "@/utils/agentInitializer";

const poppins = Poppins({
  weight: ['400', '500', '600', '700'],
  variable: "--font-poppins",
  subsets: ["latin"],
});

const montserrat = Montserrat({
  weight: ['400', '500', '600', '700'],
  variable: "--font-montserrat",
  subsets: ["latin"],
});

const robotoMono = Roboto_Mono({
  weight: ['400', '500'],
  variable: "--font-roboto-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ArcherReview Dynamic AI NCLEX Calendar",
  description: "AI-powered adaptive study calendar for NCLEX preparation",
  keywords: ["NCLEX", "study plan", "AI", "adaptive learning", "nursing", "education"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${poppins.variable} ${montserrat.variable} ${robotoMono.variable} antialiased bg-background text-foreground`}
      >
        <ThemeProvider>
          <UserProvider>
            <OnboardingProvider>
              <ClientThemeProvider>
                {children}
              </ClientThemeProvider>
            </OnboardingProvider>
          </UserProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
