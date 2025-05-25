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
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
        <path
          fillRule="evenodd"
          d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z"
          clipRule="evenodd"
        />
      </svg>
    ),
    description: '6:00 AM - 12:00 PM'
  },
  {
    id: 'afternoon',
    label: 'Afternoon',
    icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
        <path
          fillRule="evenodd"
          d="M10 2a8 8 0 100 16 8 8 0 000-16zm0 2a6 6 0 100 12A6 6 0 0010 4zm0 5a1 1 0 011 1v2a1 1 0 11-2 0v-2a1 1 0 011-1z"
          clipRule="evenodd"
        />
      </svg>
    ),
    description: '12:00 PM - 6:00 PM'
  },
  {
    id: 'evening',
    label: 'Evening',
    icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
        <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
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
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`border rounded-lg p-4 cursor-pointer transition-colors shadow-card ${
              isSelected
                ? 'border-archer-bright-teal bg-archer-dark-teal/30'
                : 'border-archer-dark-teal/30 hover:bg-archer-dark-teal/20'
            }`}
            onClick={() => onChange(option.id)}
          >
            <div className="flex items-center">
              <div className={`mr-3 ${isSelected ? 'text-archer-bright-teal' : 'text-archer-light-text/50'}`}>
                {option.icon}
              </div>
              <div>
                <div className={`font-medium ${isSelected ? 'text-archer-bright-teal' : 'text-archer-light-text'}`}>
                  {option.label}
                </div>
                <div className={`text-xs ${isSelected ? 'text-archer-bright-teal/80' : 'text-archer-light-text/70'}`}>
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
