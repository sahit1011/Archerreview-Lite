import MainNav from '@/components/navigation/MainNav';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'AI Tutor - ArcherReview',
  description: 'Get personalized help with your NCLEX preparation',
};

export default function TutorLayout({
  children,
}: {
  children: React.ReactNode;
}) 
{
  return <div className="min-h-screen bg-gray-900">{children}</div>;
}
