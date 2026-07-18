"use client";

interface StudyTimePreferenceProps {
  value: 'morning' | 'afternoon' | 'evening' | 'night';
  onChange: (preference: 'morning' | 'afternoon' | 'evening' | 'night') => void;
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
    description: '6:00 PM - 9:00 PM'
  },
  {
    id: 'night',
    label: 'Night',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
        <circle cx="17.5" cy="6.5" r="0.75" fill="currentColor" stroke="none" />
        <circle cx="20" cy="10" r="0.5" fill="currentColor" stroke="none" />
      </svg>
    ),
    description: '9:00 PM - 2:00 AM'
  }
] as const;

export default function StudyTimePreference({ value, onChange }: StudyTimePreferenceProps) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {timeOptions.map((option) => {
        const isSelected = value === option.id;
        return (
          <button
            key={option.id}
            type="button"
            aria-pressed={isSelected}
            onClick={() => onChange(option.id)}
            className={`rounded-xl border p-4 text-left transition-colors ${
              isSelected
                ? 'border-primary/40 bg-primary/[0.04]'
                : 'border-border bg-card hover:border-primary/30 hover:bg-primary/[0.02]'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`transition-colors ${isSelected ? 'text-primary' : 'text-muted-foreground'}`}>
                {option.icon}
              </div>
              <div>
                <div className="font-display text-base font-semibold text-foreground">
                  {option.label}
                </div>
                <div className="mt-0.5 font-mono text-[0.65rem] text-muted-foreground">
                  {option.description}
                </div>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
