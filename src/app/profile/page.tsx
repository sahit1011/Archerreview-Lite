"use client"; // Add this for client-side hooks

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import AppLayout from '@/components/layouts/AppLayout';
import { useUser } from '@/context/UserContext';
import { Reveal } from '@/components/ui/reveal';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  UserRound,
  Mail,
  CalendarClock,
  SlidersHorizontal,
  CalendarDays,
  Clock3,
  Sunrise,
  Sun,
  Sunset,
  Moon,
  Settings2,
  KeyRound,
  Bell,
  ShieldCheck,
  RefreshCw,
  ClipboardCheck,
  Trash2,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  Loader2,
} from 'lucide-react';
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
  const { user, setUser, logout, isLoading: userLoading } = useUser();
  const router = useRouter();

  // State for personal information
  const [name, setName] = useState('');
  const [examTypeSel, setExamTypeSel] = useState<'NEET' | 'JEE'>('NEET');
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

  // Account-settings state
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [pwCurrent, setPwCurrent] = useState('');
  const [pwNew, setPwNew] = useState('');
  const [pwConfirm, setPwConfirm] = useState('');
  const [pwSaving, setPwSaving] = useState(false);
  const [notificationsOn, setNotificationsOn] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);


  // Effect to populate state when user data loads
  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setEmail(user.email || '');
      setExamDate(formatDateForInput(user.examDate));
      if (user.examType === 'NEET' || user.examType === 'JEE') setExamTypeSel(user.examType);
      // Convert full day names from backend to abbreviated for UI
      const userDays = user.preferences?.availableDays || ALL_DAYS_FULL;
      const abbreviatedDays = userDays.map(fullDay =>
        Object.entries(dayNameMap).find(([_abbr, full]) => full === fullDay)?.[0] || fullDay
      );
      setAvailableDays(abbreviatedDays);
      setStudyHours(user.preferences?.studyHoursPerDay || 2); // Default to 2 hours
      // Stored value is lowercase ('morning'); UI options are capitalized — normalize
      // so the saved preference actually shows as selected.
      const storedTime = user.preferences?.preferredStudyTime || 'morning';
      setPreferredTime(storedTime.charAt(0).toUpperCase() + storedTime.slice(1));
      setNotificationsOn(user.preferences?.notifications !== false); // Default on
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
        body: JSON.stringify({ name, email, examDate, examType: examTypeSel }),
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
       preferredStudyTime: preferredTime.toLowerCase() as 'morning' | 'afternoon' | 'evening' | 'night', // Ensure lowercase
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

  // Change password
  const handleChangePassword = async () => {
    if (!pwCurrent || !pwNew) return;
    if (pwNew !== pwConfirm) {
      toast.error('New passwords do not match.');
      return;
    }
    setPwSaving(true);
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword: pwCurrent, newPassword: pwNew }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Password updated');
        setShowPasswordModal(false);
        setPwCurrent(''); setPwNew(''); setPwConfirm('');
      } else {
        toast.error(data.message || 'Could not change password.');
      }
    } catch {
      toast.error('Could not change password right now.');
    } finally {
      setPwSaving(false);
    }
  };

  // Toggle email notifications (persists to preferences.notifications)
  const handleToggleNotifications = async () => {
    if (!user) return;
    const next = !notificationsOn;
    setNotificationsOn(next);
    try {
      const res = await fetch(`/api/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ preferences: { ...(user.preferences || {}), notifications: next } }),
      });
      const data = await res.json();
      if (data.success) {
        setUser(data.user);
        toast.success(next ? 'Email notifications on' : 'Email notifications off');
      } else {
        setNotificationsOn(!next);
        toast.error('Could not update notifications.');
      }
    } catch {
      setNotificationsOn(!next);
      toast.error('Could not update notifications.');
    }
  };

  // Delete account (self) → cascade cleanup server-side → logout
  const handleDeleteAccount = async () => {
    if (!user) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/users/${user.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        toast.success('Your account has been deleted.');
        logout();
        router.push('/');
      } else {
        toast.error(data.message || 'Could not delete account.');
        setDeleting(false);
      }
    } catch {
      toast.error('Could not delete account right now.');
      setDeleting(false);
    }
  };

  if (userLoading) {
    return <AppLayout>
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-3 text-muted-foreground text-lg">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          Loading profile...
        </div>
      </div>
    </AppLayout>;
  }

  if (!user) {
    return <AppLayout>
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <div className="text-muted-foreground text-lg mb-4">
          Please log in to view your profile.
        </div>
        <Button asChild variant="brand" size="lg">
          <a href="/login">Go to Login</a>
        </Button>
      </div>
    </AppLayout>;
  }

  const timeOptionMeta: Record<string, { icon: typeof Sunrise; range: string }> = {
    Morning: { icon: Sunrise, range: '6AM-12PM' },
    Afternoon: { icon: Sun, range: '12PM-6PM' },
    Evening: { icon: Sunset, range: '6PM-9PM' },
    Night: { icon: Moon, range: '9PM-2AM' },
  };

  return (
    <AppLayout>
      {/* Page header */}
      <Reveal className="mb-8">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/12 text-primary">
            <Settings2 className="h-6 w-6" />
          </div>
          <div>
            <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
              Profile &amp; Settings
            </h1>
            <p className="mt-1 text-muted-foreground">Manage your account and study preferences.</p>
          </div>
        </div>
      </Reveal>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Personal Information */}
          <Reveal>
            <Card className="card-hover">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500/12 text-sky-400">
                    <UserRound className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle>Personal Information</CardTitle>
                    <CardDescription>Your name, contact email, and target exam date.</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-5">
                {infoMessage && (
                  <div className={`flex items-start gap-2 rounded-xl border p-3 text-sm ${infoMessage.type === 'success' ? 'border-success/30 bg-success/10 text-success' : 'border-destructive/30 bg-destructive/10 text-destructive'}`}>
                    {infoMessage.type === 'success'
                      ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                      : <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />}
                    <span>{infoMessage.text}</span>
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="name" className="flex items-center gap-1.5 text-muted-foreground">
                    <UserRound className="h-3.5 w-3.5" /> Full Name
                  </Label>
                  <Input
                    type="text"
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={isSavingInfo}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email" className="flex items-center gap-1.5 text-muted-foreground">
                    <Mail className="h-3.5 w-3.5" /> Email Address
                  </Label>
                  <Input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isSavingInfo}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-1.5 text-muted-foreground">
                    <CalendarClock className="h-3.5 w-3.5" /> Preparing for
                  </Label>
                  <div className="grid grid-cols-2 gap-2">
                    {(['NEET', 'JEE'] as const).map((t) => (
                      <button
                        key={t}
                        type="button"
                        disabled={isSavingInfo}
                        onClick={() => setExamTypeSel(t)}
                        className={`rounded-xl border-2 px-4 py-2.5 text-sm font-semibold transition-all ${
                          examTypeSel === t
                            ? 'border-primary bg-primary/10 text-primary'
                            : 'border-border text-muted-foreground hover:border-primary/40 hover:text-foreground'
                        }`}
                      >
                        {t} <span className="font-normal">· {t === 'NEET' ? 'Phy · Chem · Bio' : 'Phy · Chem · Maths'}</span>
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Switching your exam changes your subjects — use &quot;Reset Study Plan&quot; afterwards to rebuild your schedule.
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="exam-date" className="flex items-center gap-1.5 text-muted-foreground">
                    <CalendarClock className="h-3.5 w-3.5" /> {examTypeSel} Exam Date
                  </Label>
                  <Input
                    type="date"
                    id="exam-date"
                    className="[color-scheme:dark]"
                    value={examDate}
                    onChange={(e) => setExamDate(e.target.value)}
                    disabled={isSavingInfo}
                  />
                </div>
                <div className="pt-1">
                  <Button
                    variant="brand"
                    size="lg"
                    disabled={isSavingInfo || userLoading}
                    onClick={handleSaveChanges}
                  >
                    {isSavingInfo
                      ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving...</>
                      : 'Save Changes'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </Reveal>

          {/* Study Preferences */}
          <Reveal delay={0.05}>
            <Card className="card-hover">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/12 text-primary">
                    <SlidersHorizontal className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle>Study Preferences</CardTitle>
                    <CardDescription>Tune your schedule — we'll regenerate your plan to match.</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-7">
                {prefsMessage && (
                  <div className={`flex items-start gap-2 rounded-xl border p-3 text-sm ${prefsMessage.type === 'success' ? 'border-success/30 bg-success/10 text-success' : 'border-destructive/30 bg-destructive/10 text-destructive'}`}>
                    {prefsMessage.type === 'success'
                      ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                      : <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />}
                    <span>
                      {prefsMessage.text}
                      {isRegenerating && <span className="ml-2 font-semibold">Regenerating plan...</span>}
                    </span>
                  </div>
                )}

                {/* Available Study Days */}
                <div>
                  <h3 className="mb-3 flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
                    <CalendarDays className="h-4 w-4" /> Available Study Days
                  </h3>
                  <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                    {ALL_DAYS_ABBR.map((day) => {
                      const isSelected = availableDays.includes(day);
                      return (
                        <button
                          key={day}
                          onClick={() => {
                            if (!(isSavingPrefs || isRegenerating)) {
                              setAvailableDays(prev =>
                                isSelected ? prev.filter(d => d !== day) : [...prev, day]
                              );
                            }
                          }}
                          className={`flex h-16 flex-col items-center justify-center rounded-xl border text-sm font-semibold transition-all disabled:opacity-50 ${
                            isSelected
                              ? 'border-primary bg-primary/15 text-primary shadow-sm'
                              : 'border-border bg-secondary text-muted-foreground hover:border-primary/40 hover:text-foreground'
                          }`}
                          disabled={isSavingPrefs || isRegenerating}
                        >
                          <span>{day}</span>
                          <span className={`mt-1 text-[10px] font-medium uppercase tracking-wide ${isSelected ? 'text-primary' : 'text-muted-foreground/70'}`}>
                            {isSelected ? 'On' : 'Off'}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Daily Study Hours */}
                <div>
                  <h3 className="mb-3 flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
                    <Clock3 className="h-4 w-4" /> Daily Study Hours
                  </h3>
                  <div className="flex items-center gap-4">
                    <div className="relative w-full">
                      <input
                        type="range"
                        min="1"
                        max="8"
                        value={studyHours}
                        onChange={(e) => setStudyHours(parseInt(e.target.value, 10))}
                        className="h-2.5 w-full cursor-pointer appearance-none rounded-lg"
                        style={{
                          background: `linear-gradient(to right, var(--primary) 0%, var(--primary) ${(studyHours - 1) / 7 * 100}%, var(--secondary) ${(studyHours - 1) / 7 * 100}%, var(--secondary) 100%)`,
                        }}
                        disabled={isSavingPrefs || isRegenerating}
                      />
                      <div className="absolute -bottom-5 left-0 flex w-full justify-between px-1 text-xs text-muted-foreground/60">
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
                    <div className="min-w-[4.5rem] rounded-xl bg-primary px-3 py-2 text-center text-sm font-semibold text-primary-foreground shadow-sm">
                      {studyHours} hour{studyHours > 1 ? 's' : ''}
                    </div>
                  </div>
                </div>

                {/* Preferred Study Time */}
                <div className="pt-2">
                  <h3 className="mb-3 flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
                    <Clock3 className="h-4 w-4" /> Preferred Study Time
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {['Morning', 'Afternoon', 'Evening', 'Night'].map((timeOption) => {
                      const isSelected = preferredTime === timeOption;
                      const Icon = timeOptionMeta[timeOption].icon;
                      return (
                        <button
                          key={timeOption}
                          type="button"
                          className={`rounded-xl border p-4 text-left transition-all ${
                            isSelected
                              ? 'border-primary bg-primary/15 shadow-sm'
                              : 'border-border bg-secondary hover:border-primary/40'
                          } disabled:opacity-50`}
                          onClick={() => !(isSavingPrefs || isRegenerating) && setPreferredTime(timeOption)}
                          disabled={isSavingPrefs || isRegenerating}
                        >
                          <div className="flex items-center justify-between">
                            <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${isSelected ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'}`}>
                              <Icon className="h-5 w-5" />
                            </div>
                            <div className={`flex h-5 w-5 items-center justify-center rounded-full ${isSelected ? 'bg-primary' : 'border border-border'}`}>
                              {isSelected && <div className="h-2 w-2 rounded-full bg-primary-foreground" />}
                            </div>
                          </div>
                          <div className={`mt-3 font-medium ${isSelected ? 'text-foreground' : 'text-muted-foreground'}`}>
                            {timeOption}
                          </div>
                          <div className={`text-xs ${isSelected ? 'text-primary' : 'text-muted-foreground/70'}`}>
                            {timeOptionMeta[timeOption].range}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="pt-1">
                  <Button
                    variant="brand"
                    size="lg"
                    disabled={isSavingPrefs || isRegenerating || userLoading}
                    onClick={handleUpdatePreferences}
                  >
                    {isSavingPrefs
                      ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving...</>
                      : (isRegenerating
                        ? <><Loader2 className="h-4 w-4 animate-spin" /> Regenerating Plan...</>
                        : 'Update Preferences & Plan')}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </Reveal>
        </div>

        {/* Right Column: Account Settings & Plan Management */}
        <div className="space-y-6">
          {/* Account Settings Card */}
          <Reveal delay={0.1}>
            <Card className="card-hover">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/12 text-violet-400">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle>Account Settings</CardTitle>
                    <CardDescription>Security and notifications.</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <button
                  onClick={() => setShowPasswordModal(true)}
                  className="group flex w-full items-center justify-between rounded-xl border border-border bg-secondary p-4 text-left transition-colors hover:border-primary/40 hover:bg-accent"
                >
                  <span className="flex items-center gap-3">
                    <KeyRound className="h-4 w-4 text-muted-foreground transition-colors group-hover:text-primary" />
                    <span className="font-medium text-foreground">Change Password</span>
                  </span>
                  <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                </button>

                {/* Email notifications — a real preference toggle */}
                <div className="flex w-full items-center justify-between rounded-xl border border-border bg-secondary p-4">
                  <span className="flex items-center gap-3">
                    <Bell className="h-4 w-4 text-muted-foreground" />
                    <span>
                      <span className="block font-medium text-foreground">Email Notifications</span>
                      <span className="block text-xs text-muted-foreground">Study reminders and plan updates</span>
                    </span>
                  </span>
                  <button
                    role="switch"
                    aria-checked={notificationsOn}
                    onClick={handleToggleNotifications}
                    className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${notificationsOn ? 'bg-primary' : 'bg-input'}`}
                  >
                    <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${notificationsOn ? 'left-[22px]' : 'left-0.5'}`} />
                  </button>
                </div>
              </CardContent>
            </Card>
          </Reveal>

          {/* Plan Management Card */}
          <Reveal delay={0.15}>
            <Card className="card-hover">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/12 text-amber-400">
                    <RefreshCw className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle>Plan Management</CardTitle>
                    <CardDescription>Regenerate or reset your study plan.</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  variant="outline"
                  className="w-full justify-start border-primary/30 text-primary hover:bg-primary/10 hover:text-primary"
                  onClick={handleResetStudyPlan}
                  disabled={isRegenerating}
                >
                  {isRegenerating
                    ? <><Loader2 className="h-4 w-4 animate-spin" /> Regenerating Plan...</>
                    : <><RefreshCw className="h-4 w-4" /> Reset Study Plan</>}
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start border-primary/30 text-primary hover:bg-primary/10 hover:text-primary"
                  onClick={() => router.push('/onboarding/diagnostic')}
                >
                  <ClipboardCheck className="h-4 w-4" /> Take Diagnostic Again
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive"
                  onClick={() => setShowDeleteModal(true)}
                >
                  <Trash2 className="h-4 w-4" /> Delete Account
                </Button>
              </CardContent>
            </Card>
          </Reveal>
        </div>
      </div>

      {/* Change Password modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 p-4 backdrop-blur-sm" onClick={() => !pwSaving && setShowPasswordModal(false)}>
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/12 text-primary">
                <KeyRound className="h-5 w-5" />
              </div>
              <h3 className="font-display text-lg font-bold">Change Password</h3>
            </div>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="pw-current">Current password</Label>
                <Input id="pw-current" type="password" value={pwCurrent} onChange={(e) => setPwCurrent(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="pw-new">New password</Label>
                <Input id="pw-new" type="password" value={pwNew} onChange={(e) => setPwNew(e.target.value)} placeholder="At least 8 characters" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="pw-confirm">Confirm new password</Label>
                <Input id="pw-confirm" type="password" value={pwConfirm} onChange={(e) => setPwConfirm(e.target.value)} />
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setShowPasswordModal(false)} disabled={pwSaving}>Cancel</Button>
              <Button variant="brand" onClick={handleChangePassword} disabled={pwSaving || !pwCurrent || !pwNew}>
                {pwSaving ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving…</> : 'Update password'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Account confirmation modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 p-4 backdrop-blur-sm" onClick={() => !deleting && setShowDeleteModal(false)}>
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-destructive/12 text-destructive">
                <Trash2 className="h-5 w-5" />
              </div>
              <h3 className="font-display text-lg font-bold">Delete account?</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              This permanently deletes your account, study plan, tasks, progress and notes. This cannot be undone.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setShowDeleteModal(false)} disabled={deleting}>Cancel</Button>
              <Button
                variant="outline"
                className="border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive"
                onClick={handleDeleteAccount}
                disabled={deleting}
              >
                {deleting ? <><Loader2 className="h-4 w-4 animate-spin" /> Deleting…</> : 'Delete permanently'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
