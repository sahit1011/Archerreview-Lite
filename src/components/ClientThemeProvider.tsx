"use client";

import { useEffect, ReactNode } from 'react';
import { useTheme } from '@/context/ThemeContext';

interface ClientThemeProviderProps {
  children: ReactNode;
}

export default function ClientThemeProvider({ children }: ClientThemeProviderProps) {
  const { theme } = useTheme();

  useEffect(() => {
    // Ensure the theme is applied to the document element
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  return <>{children}</>;
}