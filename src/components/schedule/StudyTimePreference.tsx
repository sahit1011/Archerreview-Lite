"use client";

import { motion } from 'framer-motion';

interface StudyTimePreferenceProps {
  value: 'morning' | 'afternoon' | 'evening';
  onChange: (preference: 'morning' | 'afternoon' | 'evening') => void;
}

const timeOptions = [
  {
    id: 'morning',
    label: 'Morning',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    ),
    description: '6:00 AM - 12:00 PM'
  },
  {
    id: 'afternoon',
    label: 'Afternoon',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    description: '12:00 PM - 6:00 PM'
  },
  {
    id: 'evening',
    label: 'Evening',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
      </svg>
    ),
    description: '6:00 PM - 12:00 AM'
  }
] as const;

export default function StudyTimePreference({ value, onChange }: StudyTimePreferenceProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {timeOptions.map((option) => {
        const isSelected = value === option.id;
        return (
          <motion.div
            key={option.id}
            whileHover={{ y: -5, transition: { type: 'spring', stiffness: 300 } }}
            whileTap={{ scale: 0.95 }}
            className={`rounded-xl p-4 cursor-pointer transition-all duration-300 shadow-lg ${
              isSelected
                ? 'bg-gradient-to-br from-teal-500 to-green-600 text-white'
                : 'bg-white/5 hover:bg-white/10'
            }`}
            onClick={() => onChange(option.id)}
          >
            <div className="flex items-center">
              <div className={`mr-4 transition-colors ${isSelected ? 'text-white' : 'text-white/50'}`}>
                {option.icon}
              </div>
              <div>
                <div className={`font-semibold text-lg transition-colors ${isSelected ? 'text-white' : 'text-white/90'}`}>
                  {option.label}
                </div>
                <div className={`text-sm transition-colors ${isSelected ? 'text-white/90' : 'text-white/70'}`}>
                  {option.description}
                </div>
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
