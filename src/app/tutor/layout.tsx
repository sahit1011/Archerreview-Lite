import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'AI Tutor - StudyArc',
  description: 'Get personalized help with your NEET & JEE preparation',
};

export default function TutorLayout({
  children,
}: {
  children: React.ReactNode;
}) 
{
  return <div className="min-h-screen bg-background">{children}</div>;
}
