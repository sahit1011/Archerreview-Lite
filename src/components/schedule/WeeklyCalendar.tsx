"use client";

import { useState } from 'react';
import { motion } from 'framer-motion';

interface WeeklyCalendarProps {
  selectedDays: string[];
  onChange: (days: string[]) => void;
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

export default function WeeklyCalendar({ selectedDays, onChange }: WeeklyCalendarProps) {
  // Toggle a day's selection
  const toggleDay = (day: string) => {
    if (selectedDays.includes(day)) {
      // Remove day if already selected
      onChange(selectedDays.filter(d => d !== day));
    } else {
      // Add day if not selected
      onChange([...selectedDays, day]);
    }
  };

  return (
    <div className="w-full">
      <div className="grid grid-cols-7 gap-2">
        {daysOfWeek.map((day) => {
          const isSelected = selectedDays.includes(day.id);
          return (
            <div key={day.id} className="text-center">
              <div className="mb-2 text-sm font-medium text-white/70">{day.label}</div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => toggleDay(day.id)}
                className={`w-full h-12 rounded-lg transition-all duration-300 flex items-center justify-center font-bold text-lg ${
                  isSelected
                    ? 'bg-gradient-to-br from-teal-500 to-green-600 text-white shadow-lg shadow-teal-500/30'
                    : 'bg-white/5 text-white/70 hover:bg-white/10 hover:text-white'
                }`}
                aria-label={`Toggle ${day.id}`}
                aria-pressed={isSelected}
              >
                {isSelected ? (
                  <svg className="w-5 h-5 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                ) : <div className="w-2 h-2 rounded-full bg-white/20"></div>}
              </motion.button>
            </div>
          );
        })}
      </div>
      <div className="mt-4 text-sm text-white/50 text-center">
        Click on days to select when you're available to study
      </div>
    </div>
  );
}
