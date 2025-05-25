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

  return (
    <div className="bg-card-background-dark p-6 rounded-lg border border-white/10 shadow-card">
      <h2 className="text-xl font-semibold text-archer-white mb-4">Plan Overview</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div
          className="bg-card-background-lighter p-4 rounded-lg shadow-card border border-white/5"
          whileHover={{ y: -5, boxShadow: "0 12px 24px rgba(0, 0, 0, 0.25), 0 6px 12px rgba(0, 0, 0, 0.15)" }}
          transition={{ duration: 0.2 }}
        >
          <div className="text-archer-white/80 text-sm">Study Duration</div>
          <div className="text-2xl font-bold text-archer-bright-teal">{weeksUntilExam} Weeks</div>
          <div className="text-archer-white/70 text-xs mt-1">{daysUntilExam} days until exam</div>
        </motion.div>
        <motion.div
          className="bg-card-background-lighter p-4 rounded-lg shadow-card border border-white/5"
          whileHover={{ y: -5, boxShadow: "0 12px 24px rgba(0, 0, 0, 0.25), 0 6px 12px rgba(0, 0, 0, 0.15)" }}
          transition={{ duration: 0.2 }}
        >
          <div className="text-archer-white/80 text-sm">Daily Study Time</div>
          <div className="text-2xl font-bold text-archer-bright-teal">{studyHoursPerDay} Hours</div>
          <div className="text-archer-white/70 text-xs mt-1">{availableDays.length} days per week</div>
        </motion.div>
        <motion.div
          className="bg-card-background-lighter p-4 rounded-lg shadow-card border border-white/5"
          whileHover={{ y: -5, boxShadow: "0 12px 24px rgba(0, 0, 0, 0.25), 0 6px 12px rgba(0, 0, 0, 0.15)" }}
          transition={{ duration: 0.2 }}
        >
          <div className="text-archer-white/80 text-sm">Total Study Hours</div>
          <div className="text-2xl font-bold text-archer-bright-teal">{totalStudyHours} Hours</div>
          <div className="text-archer-white/70 text-xs mt-1">Across {totalStudyDays} study days</div>
        </motion.div>
      </div>
    </div>
  );
}
