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
  };

  // Handle slider release
  const handleSliderRelease = () => {
    onChange(localValue);
    setIsDragging(false);
  };

  // Calculate the percentage for styling
  const percentage = ((localValue - min) / (max - min)) * 100;

  // Format the display value
  const displayValue = localValue % 1 === 0 ? localValue.toString() : localValue.toFixed(1);

  return (
    <div className="w-full">
      <div className="flex items-center mb-2">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={localValue}
          onChange={handleSliderChange}
          onMouseDown={() => setIsDragging(true)}
          onMouseUp={handleSliderRelease}
          onTouchStart={() => setIsDragging(true)}
          onTouchEnd={handleSliderRelease}
          className="w-full h-2 bg-archer-dark-teal/30 rounded-lg appearance-none cursor-pointer"
          style={{
            background: `linear-gradient(to right, #00A99D 0%, #00A99D ${percentage}%, rgba(0, 169, 157, 0.2) ${percentage}%, rgba(0, 169, 157, 0.2) 100%)`
          }}
        />
        <motion.div
          className="ml-4 min-w-[3rem] text-center font-medium text-archer-bright-teal bg-archer-dark-teal/30 px-2 py-1 rounded-md shadow-card"
          animate={{ scale: isDragging ? 1.1 : 1 }}
          transition={{ duration: 0.2 }}
        >
          {displayValue} {localValue === 1 ? 'hour' : 'hours'}
        </motion.div>
      </div>
      <div className="flex justify-between text-xs text-archer-light-text/70 px-1">
        <span>{min} hour</span>
        <span>{max} hours</span>
      </div>
    </div>
  );
}
