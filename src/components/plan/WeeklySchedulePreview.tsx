"use client";

import { motion } from 'framer-motion';

interface WeeklySchedulePreviewProps {
  availableDays: string[];
  studyHoursPerDay: number;
  preferredStudyTime: 'morning' | 'afternoon' | 'evening';
}

const daysOfWeek = [
  { id: 'Monday', label: 'Mon' },
  { id: 'Tuesday', label: 'Tue' },
  { id: 'Wednesday', label: 'Wed' },
  { id: 'Thursday', label: 'Thu' },
  { id: 'Friday', label: 'Fri' },
  { id: 'Saturday', label: 'Sat' },
  { id: 'Sunday', label: 'Sun' },
];

// Helper function to get time range based on preference
const getTimeRange = (preference: 'morning' | 'afternoon' | 'evening') => {
  switch (preference) {
    case 'morning':
      return '6:00 AM - 12:00 PM';
    case 'afternoon':
      return '12:00 PM - 6:00 PM';
    case 'evening':
      return '6:00 PM - 12:00 AM';
    default:
      return '';
  }
};

export default function WeeklySchedulePreview({
  availableDays,
  studyHoursPerDay,
  preferredStudyTime
}: WeeklySchedulePreviewProps) {
  // Get time range based on preference
  const timeRange = getTimeRange(preferredStudyTime);

  return (
    <div>
      <h2 className="text-xl font-semibold text-archer-white mb-4">Weekly Schedule</h2>
      <div className="grid grid-cols-7 gap-2 mb-4">
        {daysOfWeek.map((day, index) => {
          const isAvailable = availableDays.includes(day.id);
          return (
            <motion.div
              key={day.id}
              className="text-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * index }}
              whileHover={isAvailable ? { scale: 1.05 } : {}}
            >
              <div className="mb-2 text-sm font-medium text-archer-white">{day.label}</div>
              <div
                className={`h-24 rounded-md flex items-center justify-center shadow-card ${
                  isAvailable
                    ? 'bg-card-background-lighter border border-white/10'
                    : 'bg-card-background-dark border border-white/5'
                }`}
              >
                {isAvailable ? (
                  <div className="text-center p-2">
                    <div className="text-archer-bright-teal font-medium">{studyHoursPerDay} hrs</div>
                    <div className="text-archer-light-blue text-xs">{preferredStudyTime}</div>
                  </div>
                ) : (
                  <div className="text-archer-white/40 text-sm">Off</div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
      <div className="bg-card-background-lighter p-4 rounded-lg border border-white/10 text-sm text-archer-white shadow-card">
        <div className="flex items-center">
          <svg className="h-5 w-5 text-archer-bright-teal mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9z" clipRule="evenodd" />
          </svg>
          <span>
            Your preferred study time is during the <span className="font-medium text-archer-bright-teal">{preferredStudyTime}</span> ({timeRange}).
          </span>
        </div>
      </div>
    </div>
  );
}
