"use client";

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
              <div className="mb-2 text-sm font-medium text-muted-foreground">{day.label}</div>
              <button
                onClick={() => toggleDay(day.id)}
                className={`w-full h-12 rounded-lg transition-colors flex items-center justify-center font-bold text-lg border ${
                  isSelected
                    ? 'bg-primary border-primary text-primary-foreground shadow-sm'
                    : 'bg-card border-border text-muted-foreground hover:bg-secondary hover:text-foreground'
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
                ) : <div className="w-2 h-2 rounded-full bg-muted-foreground/30"></div>}
              </button>
            </div>
          );
        })}
      </div>
      <div className="mt-4 text-sm text-muted-foreground text-center">
        Click on days to select when you're available to study
      </div>
    </div>
  );
}
