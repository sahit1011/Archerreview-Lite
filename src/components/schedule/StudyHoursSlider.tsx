"use client";

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface StudyHoursSliderProps {
  value: number;
  onChange: (hours: number) => void;
  min?: number;
  max?: number;
  step?: number;
}

export default function StudyHoursSlider({
  value,
  onChange,
  min = 1,
  max = 8,
  step = 0.5
}: StudyHoursSliderProps) {
  const [localValue, setLocalValue] = useState(value);
  const [isDragging, setIsDragging] = useState(false);

  // Update local value when prop changes
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  // Handle slider change
  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseFloat(e.target.value);
    setLocalValue(newValue);
    onChange(newValue); // Update parent state immediately for smoother feedback
  };

  // Calculate the percentage for styling
  const percentage = ((localValue - min) / (max - min)) * 100;

  // Format the display value
  const displayValue = localValue % 1 === 0 ? localValue.toString() : localValue.toFixed(1);

  return (
    <div className="w-full">
      <div className="flex items-center">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={localValue}
          onChange={handleSliderChange}
          onMouseDown={() => setIsDragging(true)}
          onMouseUp={() => setIsDragging(false)}
          onTouchStart={() => setIsDragging(true)}
          onTouchEnd={() => setIsDragging(false)}
          className="w-full h-3 appearance-none cursor-pointer rounded-full bg-white/10"
          style={{
            background: `linear-gradient(to right, #0D9488 0%, #059669 ${percentage}%, rgba(255, 255, 255, 0.1) ${percentage}%, rgba(255, 255, 255, 0.1) 100%)`
          }}
        />
        <motion.div
          className="ml-4 min-w-[4rem] text-center font-bold text-white bg-gradient-to-br from-teal-500 to-green-600 px-3 py-2 rounded-lg shadow-lg shadow-teal-500/30"
          animate={{ scale: isDragging ? 1.1 : 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
        >
          {displayValue}
        </motion.div>
      </div>
      <div className="flex justify-between text-xs text-white/50 px-1 mt-2">
        <span>{min} hour</span>
        <span>{max} hours</span>
      </div>
    </div>
  );
}
