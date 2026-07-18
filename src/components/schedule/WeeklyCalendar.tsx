"use client";

import { Check } from "lucide-react";

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
              <div className="mb-2 font-mono text-[0.6rem] uppercase tracking-[0.06em] text-muted-foreground">
                {day.label}
              </div>
              <button
                onClick={() => toggleDay(day.id)}
                className={`flex h-12 w-full items-center justify-center rounded-lg border transition-colors ${
                  isSelected
                    ? 'border-primary/40 bg-primary/[0.06] text-primary'
                    : 'border-border bg-card text-muted-foreground hover:border-primary/30 hover:bg-primary/[0.02]'
                }`}
                aria-label={`Toggle ${day.id}`}
                aria-pressed={isSelected}
              >
                {isSelected ? (
                  <Check className="h-5 w-5" strokeWidth={2.5} />
                ) : (
                  <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/30" />
                )}
              </button>
            </div>
          );
        })}
      </div>
      <p className="mt-4 text-center font-mono text-[0.7rem] text-muted-foreground">
        Tap days to set when you&apos;re available to study
      </p>
    </div>
  );
}
