'use client';

import React from 'react';
import AppLayout from '@/components/layouts/AppLayout';

interface AppLayoutWrapperProps {
  children: React.ReactNode;
}

export default function AppLayoutWrapper({ children }: AppLayoutWrapperProps) {
  return <AppLayout>{children}</AppLayout>;
}