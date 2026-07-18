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
const getTimeRange = (preference: 'morning' | 'afternoon' | 'evening' | 'night') => {
  switch (preference) {
    case 'morning':
      return '6:00 AM - 12:00 PM';
    case 'afternoon':
      return '12:00 PM - 6:00 PM';
    case 'evening':
      return '6:00 PM - 9:00 PM';
    case 'night':
      return '9:00 PM - 2:00 AM';
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
      <h2 className="text-2xl font-semibold text-foreground mb-4 flex items-center gap-3">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <span>Weekly Schedule Preview</span>
      </h2>
      <div className="grid grid-cols-7 gap-2 mb-4">
        {daysOfWeek.map((day, index) => {
          const isAvailable = availableDays.includes(day.id);
          return (
            <motion.div
              key={day.id}
              className="text-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 + index * 0.05 }}
            >
              <div className="mb-2 text-sm font-medium text-muted-foreground">{day.label}</div>
              <div
                className={`h-28 rounded-xl flex items-center justify-center border ${
                  isAvailable
                    ? 'bg-primary/10 border-primary/20'
                    : 'bg-secondary border-border'
                }`}
              >
                {isAvailable ? (
                  <div className="text-center p-2">
                    <div className="text-primary font-bold text-xl">{studyHoursPerDay}h</div>
                    <div className="text-muted-foreground text-xs capitalize">{preferredStudyTime}</div>
                  </div>
                ) : (
                  <div className="text-muted-foreground text-sm">Off</div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
      <div className="bg-card p-4 rounded-xl border border-border text-sm text-muted-foreground shadow-sm">
        <div className="flex items-center">
          <svg className="h-5 w-5 text-primary mr-3" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9z" clipRule="evenodd" />
          </svg>
          <span>
            Your preferred study time is during the <span className="font-medium text-primary capitalize">{preferredStudyTime}</span> ({timeRange}).
          </span>
        </div>
      </div>
    </div>
  );
}
