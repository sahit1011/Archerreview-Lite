"use client";

import { motion } from 'framer-motion';

interface PlanOverviewProps {
  examDate: Date;
  studyHoursPerDay: number;
  availableDays: string[];
}

export default function PlanOverview({ examDate, studyHoursPerDay, availableDays }: PlanOverviewProps) {
  // Calculate days until exam
  const today = new Date();
  const daysUntilExam = Math.ceil((examDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  // Calculate weeks until exam
  const weeksUntilExam = Math.ceil(daysUntilExam / 7);

  // Calculate total study days
  const totalStudyDays = Math.floor(daysUntilExam * (availableDays.length / 7));

  // Calculate total study hours
  const totalStudyHours = totalStudyDays * studyHoursPerDay;

  const overviewItems = [
    {
      label: 'Study Duration',
      value: `${weeksUntilExam} Weeks`,
      subValue: `${daysUntilExam} days until exam`,
    },
    {
      label: 'Daily Study Time',
      value: `${studyHoursPerDay} Hours`,
      subValue: `${availableDays.length} days per week`,
    },
    {
      label: 'Total Study Hours',
      value: `${totalStudyHours} Hours`,
      subValue: `Across ${totalStudyDays} study days`,
    },
  ];

  return (
    <div>
      <h2 className="text-2xl font-semibold text-white/90 mb-4 flex items-center gap-3">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
        </svg>
        <span>Plan Overview</span>
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {overviewItems.map((item, index) => (
          <motion.div
            key={index}
            className="bg-white/5 p-4 rounded-xl shadow-lg border border-white/10 backdrop-blur-md"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 + index * 0.1 }}
            whileHover={{ y: -5, scale: 1.02, boxShadow: '0 10px 20px rgba(0,0,0,0.2)' }}
          >
            <div className="text-white/70 text-sm mb-1">{item.label}</div>
            <div className="text-3xl font-bold text-teal-400">{item.value}</div>
            <div className="text-white/60 text-xs mt-1">{item.subValue}</div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
