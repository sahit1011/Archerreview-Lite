"use client"; // Add this for client-side hooks

import { useState, useEffect } from 'react';
import AppLayout from '@/components/layouts/AppLayout';
import { useUser } from '@/context/UserContext';
// Removed incorrect UserPreferences import

// Helper function to format date for input type="date"
const formatDateForInput = (date: Date | string | undefined): string => {
  if (!date) return '';
  try {
    const d = new Date(date);
    return d.toISOString().split('T')[0];
  } catch (e) {
    return '';
  }
};

// Define both abbreviated and full day names for mapping
const ALL_DAYS_ABBR = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const ALL_DAYS_FULL = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

// Map between abbreviated and full day names
const dayNameMap: Record<string, string> = {
  'Mon': 'Monday',
  'Tue': 'Tuesday',
  'Wed': 'Wednesday',
  'Thu': 'Thursday',
  'Fri': 'Friday',
  'Sat': 'Saturday',
  'Sun': 'Sunday'
};

export default function ProfilePage() {
  const { user, setUser, isLoading: userLoading } = useUser();

  // State for personal information
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [examDate, setExamDate] = useState('');

  // State for study preferences
  const [availableDays, setAvailableDays] = useState<string[]>([]);
  const [studyHours, setStudyHours] = useState(2);
  const [preferredTime, setPreferredTime] = useState('Morning'); // Default

  // Loading and message states
  const [isSavingInfo, setIsSavingInfo] = useState(false);
  const [infoMessage, setInfoMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isSavingPrefs, setIsSavingPrefs] = useState(false);
  const [prefsMessage, setPrefsMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isRegenerating, setIsRegenerating] = useState(false);


  // Effect to populate state when user data loads
  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setEmail(user.email || '');
      setExamDate(formatDateForInput(user.examDate));
      // Convert full day names from backend to abbreviated for UI
      const userDays = user.preferences?.availableDays || ALL_DAYS_FULL;
      const abbreviatedDays = userDays.map(fullDay =>
        Object.entries(dayNameMap).find(([_abbr, full]) => full === fullDay)?.[0] || fullDay
      );
      setAvailableDays(abbreviatedDays);
      setStudyHours(user.preferences?.studyHoursPerDay || 2); // Default to 2 hours
      setPreferredTime(user.preferences?.preferredStudyTime || 'Morning'); // Default to Morning
    }
  }, [user]);

  // --- Handlers ---

  const handleSaveChanges = async () => {
    if (!user) return;
    setIsSavingInfo(true);
    setInfoMessage(null);

    try {
      const response = await fetch(`/api/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, examDate }),
      });

      const data = await response.json();

      if (data.success) {
        setUser(data.user); // Update user context
        setInfoMessage({ type: 'success', text: 'Personal information updated successfully.' });
      } else {
        setInfoMessage({ type: 'error', text: data.message || 'Failed to update information.' });
      }
    } catch (error) {
      console.error("Error saving personal info:", error);
      setInfoMessage({ type: 'error', text: 'An error occurred while saving.' });
    } finally {
      setIsSavingInfo(false);
    }
  };

  const handleUpdatePreferences = async () => {
     if (!user) return;
     setIsSavingPrefs(true);
     setIsRegenerating(false); // Reset regeneration state
     setPrefsMessage(null);

     // Convert abbreviated day names to full day names for the backend
     const fullDayNames = availableDays.map(abbr => dayNameMap[abbr] || abbr);

     const preferencesPayload = {
       availableDays: fullDayNames,
       studyHoursPerDay: studyHours,
       preferredStudyTime: preferredTime.toLowerCase() as 'morning' | 'afternoon' | 'evening', // Ensure lowercase
       notifications: user.preferences?.notifications ?? true, // Preserve existing or default to true
     };

     try {
       // 1. Update user preferences
       const prefsResponse = await fetch(`/api/users/${user.id}`, {
         method: 'PATCH',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({ preferences: preferencesPayload }),
       });

       const prefsData = await prefsResponse.json();

       if (!prefsData.success) {
         throw new Error(prefsData.message || 'Failed to update preferences.');
       }

       // Update user context immediately after saving preferences
       setUser(prefsData.user);
       setPrefsMessage({ type: 'success', text: 'Preferences updated. Regenerating study plan...' });
       setIsRegenerating(true); // Indicate plan regeneration is starting

       // 2. Trigger study plan regeneration
       const planResponse = await fetch('/api/plan-generation', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({ userId: user.id }),
       });

       const planData = await planResponse.json();

       if (planData.success) {
         setPrefsMessage({ type: 'success', text: 'Preferences updated and study plan regenerated successfully!' });
       } else {
         // Preferences were saved, but plan regeneration failed
         setPrefsMessage({ type: 'error', text: `Preferences saved, but failed to regenerate plan: ${planData.message || 'Unknown error'}` });
       }

     } catch (error) {
       console.error("Error updating preferences or regenerating plan:", error);
       setPrefsMessage({ type: 'error', text: `An error occurred: ${error instanceof Error ? error.message : String(error)}` });
     } finally {
       setIsSavingPrefs(false);
       setIsRegenerating(false); // Ensure regeneration state is reset
     }
  };

  // Handler for resetting study plan
  const handleResetStudyPlan = async () => {
    if (!user) return;
    setIsRegenerating(true);
    setPrefsMessage({ type: 'success', text: 'Regenerating study plan...' });

    try {
      // Trigger study plan regeneration
      const planResponse = await fetch('/api/plan-generation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id }),
      });

      const planData = await planResponse.json();

      if (planData.success) {
        setPrefsMessage({ type: 'success', text: 'Study plan regenerated successfully!' });
      } else {
        setPrefsMessage({ type: 'error', text: `Failed to regenerate plan: ${planData.message || 'Unknown error'}` });
      }
    } catch (error) {
      console.error("Error regenerating plan:", error);
      setPrefsMessage({ type: 'error', text: `An error occurred: ${error instanceof Error ? error.message : String(error)}` });
    } finally {
      setIsRegenerating(false);
    }
  };

  if (userLoading) {
    return <AppLayout>
      <div className="flex items-center justify-center h-64">
        <div className="text-archer-light-text text-lg">
          <div className="animate-pulse flex items-center">
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-archer-bright-teal" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Loading profile...
          </div>
        </div>
      </div>
    </AppLayout>;
  }

  if (!user) {
    return <AppLayout>
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <div className="text-archer-light-text text-lg mb-4">
          Please log in to view your profile.
        </div>
        <a href="/login" className="bg-archer-bright-teal hover:bg-archer-bright-teal/90 text-archer-dark-teal font-medium py-2 px-6 rounded-lg text-center transition-colors">
          Go to Login
        </a>
      </div>
    </AppLayout>;
  }

  return (
    <AppLayout>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-archer-white">Profile & Settings</h1>
        <p className="text-archer-light-text/80">Manage your account and study preferences.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-card-background-dark rounded-xl shadow-md p-6 mb-6 border border-border-color-dark">
            <h2 className="text-xl font-semibold text-archer-white mb-6">Personal Information</h2>
             {infoMessage && (
              <div className={`mb-4 p-3 rounded-md text-sm ${infoMessage.type === 'success' ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'}`}>
                {infoMessage.text}
              </div>
            )}
            <div className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-archer-light-text mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  id="name"
                  className="w-full rounded-md bg-archer-dark-teal border-border-color-dark shadow-sm focus:border-archer-bright-teal focus:ring-archer-bright-teal text-archer-white"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={isSavingInfo}
                />
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-archer-light-text mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  className="w-full rounded-md bg-archer-dark-teal border-border-color-dark shadow-sm focus:border-archer-bright-teal focus:ring-archer-bright-teal text-archer-white"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isSavingInfo}
                />
              </div>
              <div>
                <label htmlFor="exam-date" className="block text-sm font-medium text-archer-light-text mb-1">
                  NCLEX Exam Date
                </label>
                <input
                  type="date"
                  id="exam-date"
                  className="w-full rounded-md bg-archer-dark-teal border-border-color-dark shadow-sm focus:border-archer-bright-teal focus:ring-archer-bright-teal text-archer-white"
                  value={examDate}
                  onChange={(e) => setExamDate(e.target.value)}
                  disabled={isSavingInfo}
                />
              </div>
              <div className="pt-4">
                <button
                  className="bg-blue-500 hover:border-blue-400 text-white font-medium py-3 px-6 rounded-lg text-center transition-all disabled:opacity-50 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 border-2 border-blue-600"
                  style={{
                    boxShadow: '0 4px 6px rgba(0, 169, 157, 0.2)',
                  }}
                  disabled={isSavingInfo || userLoading}
                  onClick={handleSaveChanges}
                >
                  {isSavingInfo ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>

          <div className="bg-card-background-dark rounded-xl shadow-md p-6 mb-6 border border-border-color-dark">
            <h2 className="text-xl font-semibold text-archer-white mb-6">Study Preferences</h2>
             {prefsMessage && (
              <div className={`mb-4 p-3 rounded-md text-sm ${prefsMessage.type === 'success' ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'}`}>
                {prefsMessage.text}
                 {isRegenerating && <span className="ml-2 font-semibold">Regenerating plan...</span>}
              </div>
            )}
            <div className="space-y-6">
              <div>
                <h3 className="font-medium text-archer-light-text mb-3">Available Study Days</h3>
                <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                  {ALL_DAYS_ABBR.map((day) => {
                    const isSelected = availableDays.includes(day);
                    return (
                      <div key={day} className="text-center">
                        <div className="mb-1 text-xs sm:text-sm text-archer-light-text">{day}</div>
                        <button
                          onClick={() => {
                            if (!(isSavingPrefs || isRegenerating)) {
                              setAvailableDays(prev =>
                                isSelected ? prev.filter(d => d !== day) : [...prev, day]
                              );
                            }
                          }}
                          className={`w-full h-10 sm:h-12 rounded-md text-xs sm:text-sm font-medium transition-all shadow-md border-2 ${
                            isSelected
                              ? 'text-archer-dark-teal border-blue-400'
                              : 'bg-archer-dark-teal text-archer-light-text border-border-color-dark'
                          } hover:border-blue-400`}
                          style={{
                            backgroundColor: isSelected ? '#3b82f6' : '',
                            boxShadow: isSelected ? '0 4px 8px rgba(59, 130, 246, 0.4)' : '0 2px 4px rgba(0, 0, 0, 0.2)'
                          }}
                          disabled={isSavingPrefs || isRegenerating}
                        >
                          {isSelected ? 'On' : 'Off'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div>
                <h3 className="font-medium text-archer-light-text mb-3">Daily Study Hours</h3>
                <div className="flex items-center">
                  <div className="relative w-full">
                    <input
                      type="range"
                      min="1"
                      max="8"
                      value={studyHours}
                      onChange={(e) => setStudyHours(parseInt(e.target.value, 10))}
                      className="w-full h-3 bg-archer-dark-teal rounded-lg appearance-none cursor-pointer"
                      style={{
                        background: `linear-gradient(to right, #00a99d 0%, #00a99d ${(studyHours - 1) / 7 * 100}%, #003049 ${(studyHours - 1) / 7 * 100}%, #003049 100%)`,
                        border: '1px solid #00a99d',
                        boxShadow: '0 0 5px rgba(0, 169, 157, 0.3)'
                      }}
                      disabled={isSavingPrefs || isRegenerating}
                    />
                    <div className="absolute -bottom-5 left-0 w-full flex justify-between text-xs text-archer-light-text/70 px-1">
                      <span>1h</span>
                      <span>2h</span>
                      <span>3h</span>
                      <span>4h</span>
                      <span>5h</span>
                      <span>6h</span>
                      <span>7h</span>
                      <span>8h</span>
                    </div>
                  </div>
                  <div className="ml-4 min-w-[4rem] text-center font-medium text-archer-white bg-archer-bright-teal px-3 py-2 rounded-md shadow-md">
                    {studyHours} hour{studyHours > 1 ? 's' : ''}
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-medium text-archer-light-text mb-3">Preferred Study Time</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {['Morning', 'Afternoon', 'Evening'].map((timeOption) => {
                    const isSelected = preferredTime === timeOption;
                    return (
                      <div
                        key={timeOption}
                        className={`border-2 rounded-lg p-4 cursor-pointer transition-all shadow-md transform hover:-translate-y-0.5 ${
                          isSelected
                            ? 'border-blue-400'
                            : 'border-border-color-dark bg-archer-dark-teal'
                        } hover:border-blue-400`}
                        style={{
                          backgroundColor: isSelected ? '#3b82f6' : '',
                          boxShadow: isSelected ? '0 4px 8px rgba(59, 130, 246, 0.4)' : '0 2px 4px rgba(0, 0, 0, 0.2)'
                        }}
                        onClick={() => !(isSavingPrefs || isRegenerating) && setPreferredTime(timeOption)}
                      >
                        <div className="flex items-center justify-between cursor-pointer">
                          <div className="flex items-center">
                            <div className={`w-5 h-5 rounded-full mr-3 flex items-center justify-center ${
                              isSelected ? 'bg-white' : 'border border-border-color-dark'
                            }`}>
                              {isSelected && (
                                <div className="w-2 h-2 rounded-full bg-blue-600"></div>
                              )}
                            </div>
                            <span className={`font-medium ${isSelected ? 'text-white' : 'text-archer-light-text'}`}>{timeOption}</span>
                          </div>
                          {timeOption === 'Morning' && (
                            <span className={`text-xs ${isSelected ? 'text-white/90' : 'text-archer-light-text/70'}`}>6AM-12PM</span>
                          )}
                          {timeOption === 'Afternoon' && (
                            <span className={`text-xs ${isSelected ? 'text-white/90' : 'text-archer-light-text/70'}`}>12PM-6PM</span>
                          )}
                          {timeOption === 'Evening' && (
                            <span className={`text-xs ${isSelected ? 'text-white/90' : 'text-archer-light-text/70'}`}>6PM-12AM</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="pt-2">
                <button
                  className="bg-archer-bright-teal hover:bg-blue-400 text-archer-dark-teal font-medium py-3 px-6 rounded-lg text-center transition-all disabled:opacity-50 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 border-2 border-archer-bright-teal"
                  style={{
                    boxShadow: '0 4px 6px rgba(0, 169, 157, 0.2)',
                  }}
                  disabled={isSavingPrefs || isRegenerating || userLoading}
                  onClick={handleUpdatePreferences}
                >
                  {isSavingPrefs ? 'Saving...' : (isRegenerating ? 'Regenerating Plan...' : 'Update Preferences & Plan')}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Account Settings & Plan Management */}
        <div>
          {/* Account Settings Card */}
          <div className="bg-card-background-dark rounded-xl shadow-md p-6 mb-6 border border-border-color-dark">
            <h2 className="text-xl font-semibold text-archer-white mb-4">Account Settings</h2>
            <div className="space-y-4">
              {/* Placeholder buttons - Functionality not implemented in this step */}
              <div>
                <button
                  className="w-full flex items-center justify-between p-4 border-2 border-border-color-dark rounded-lg hover:border-blue-400 text-left transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                  style={{
                    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
                  }}
                >
                  <span className="font-medium text-archer-light-text">Change Password</span>
                  <svg className="h-5 w-5 text-archer-light-text/50" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
              <div>
                <button
                  className="w-full flex items-center justify-between p-4 border-2 border-border-color-dark rounded-lg hover:border-blue-400 text-left transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                  style={{
                    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
                  }}
                >
                  <span className="font-medium text-archer-light-text">Notification Settings</span>
                  <svg className="h-5 w-5 text-archer-light-text/50" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
              <div>
                <button
                  className="w-full flex items-center justify-between p-4 border-2 border-border-color-dark rounded-lg hover:border-blue-400 text-left transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                  style={{
                    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
                  }}
                >
                  <span className="font-medium text-archer-light-text">Privacy Settings</span>
                  <svg className="h-5 w-5 text-archer-light-text/50" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {/* Plan Management Card */}
          <div className="bg-card-background-dark rounded-xl shadow-md p-6 border border-border-color-dark">
            <h2 className="text-xl font-semibold text-archer-white mb-4">Plan Management</h2>
            <div className="space-y-4">
              <button
                className="w-full bg-archer-bright-teal/10 hover:border-blue-400 text-archer-bright-teal font-medium py-3 px-6 rounded-lg text-center transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5 border-2 border-archer-bright-teal/30"
                style={{
                  boxShadow: '0 4px 6px rgba(0, 169, 157, 0.1)',
                }}
                onClick={handleResetStudyPlan}
                disabled={isRegenerating}
              >
                {isRegenerating ? 'Regenerating Plan...' : 'Reset Study Plan'}
              </button>
              <button
                className="w-full bg-archer-bright-teal/10 hover:border-blue-400 text-archer-bright-teal font-medium py-3 px-6 rounded-lg text-center transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5 border-2 border-archer-bright-teal/30"
                style={{
                  boxShadow: '0 4px 6px rgba(0, 169, 157, 0.1)',
                }}
              >
                Take Diagnostic Again
              </button>
              <button
                className="w-full bg-red-900/20 hover:border-red-400 text-red-400 font-medium py-3 px-6 rounded-lg text-center transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5 border-2 border-red-900/30"
                style={{
                  boxShadow: '0 4px 6px rgba(220, 38, 38, 0.1)',
                }}
              >
                Delete Account
              </button>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
