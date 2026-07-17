"use client";

import { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import { useRouter } from 'next/navigation';

// Define the onboarding steps
export enum OnboardingStep {
  ACCOUNT_CREATION = 'account-creation',
  WELCOME = 'welcome',
  DIAGNOSTIC = 'diagnostic',
  ASSESSMENT = 'assessment',
  ASSESSMENT_RESULTS = 'assessment-results',
  SCHEDULE = 'schedule',
  PREVIEW = 'preview',
}

// Define the question type
export interface DiagnosticQuestion {
  id: number;
  question: string;
  options: string[];
  correctAnswer: number;
  category: string;
  explanation: string;
  // Content-backed questions also carry topic provenance so weak-area signal can be
  // attributed to specific Topics (not just subject categories). Optional to preserve the
  // existing public shape and keep the hardcoded fallback set valid.
  topicId?: string;
  topicName?: string;
}

// Define the answer type
export interface DiagnosticAnswer {
  questionId: number;
  selectedOption: number;
  isCorrect: boolean;
  timeSpent: number; // in seconds
}

// Define the category score type
export interface CategoryScore {
  category: string;
  score: number; // 0-100 percentage
}

// Define the per-topic score type (finer-grained weak-area signal than category)
export interface TopicScore {
  topicId: string;
  topicName: string;
  category: string;
  score: number; // 0-100 percentage
}

// Define the onboarding context type
interface OnboardingContextType {
  currentStep: OnboardingStep;
  // Account creation fields
  name: string;
  email: string;
  password: string;
  // Exam and preferences
  examType: 'NEET' | 'JEE' | null;
  examDate: Date | null;
  diagnosticCompleted: boolean;
  diagnosticSkipped: boolean;
  availableDays: string[];
  studyHoursPerDay: number;
  preferredStudyTime: 'morning' | 'afternoon' | 'evening';
  // Diagnostic assessment
  currentQuestionIndex: number;
  diagnosticQuestions: DiagnosticQuestion[];
  diagnosticAnswers: DiagnosticAnswer[];
  categoryScores: CategoryScore[];
  topicScores: TopicScore[];
  overallScore: number;
  // Account creation setters
  setName: (name: string) => void;
  setEmail: (email: string) => void;
  setPassword: (password: string) => void;
  // Exam and preferences setters
  setExamType: (type: 'NEET' | 'JEE') => void;
  setExamDate: (date: Date) => void;
  setDiagnosticCompleted: (completed: boolean) => void;
  setDiagnosticSkipped: (skipped: boolean) => void;
  setAvailableDays: (days: string[]) => void;
  setStudyHoursPerDay: (hours: number) => void;
  setPreferredStudyTime: (time: 'morning' | 'afternoon' | 'evening') => void;
  // Navigation
  goToNextStep: () => void;
  goToPreviousStep: () => void;
  goToStep: (step: OnboardingStep) => void;
  goToNextQuestion: () => void;
  goToPreviousQuestion: () => void;
  // Assessment
  answerQuestion: (questionId: number, selectedOption: number, timeSpent: number) => void;
  calculateResults: () => void;
  // Data saving
  saveOnboardingData: () => Promise<any>;
  saveDiagnosticResults: () => Promise<void>;
  registerUser: () => Promise<void>;
}

// Create the onboarding context
const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

// Define the onboarding provider props
interface OnboardingProviderProps {
  children: ReactNode;
}

// Fallback diagnostic question bank — NEET/JEE, tagged by subject.
// The runner filters this by the chosen exam (NEET: Phy/Chem/Bio, JEE: Phy/Chem/Maths).
const sampleQuestions: DiagnosticQuestion[] = [
  {
    id: 1,
    question: "A body starts from rest and moves with uniform acceleration. The ratio of distances covered in the 1st, 2nd and 3rd seconds is:",
    options: ["1 : 2 : 3", "1 : 3 : 5", "1 : 4 : 9", "1 : 1 : 1"],
    correctAnswer: 1,
    category: "PHYSICS",
    explanation: "Distance covered in the nth second is s\u2099 = u + a(2n \u2212 1)/2. With u = 0, the distances in successive seconds are proportional to the odd numbers 1, 3, 5 — Galileo's odd-number rule."
  },
  {
    id: 2,
    question: "Two resistors of 4 \u03a9 and 12 \u03a9 are connected in parallel. The equivalent resistance is:",
    options: ["16 \u03a9", "8 \u03a9", "3 \u03a9", "0.33 \u03a9"],
    correctAnswer: 2,
    category: "PHYSICS",
    explanation: "For parallel resistors, 1/R = 1/4 + 1/12 = 3/12 + 1/12 = 4/12, so R = 3 \u03a9. The parallel equivalent is always smaller than the smallest branch."
  },
  {
    id: 3,
    question: "A convex lens of focal length 20 cm forms a real, inverted image the same size as the object. The object distance is:",
    options: ["10 cm", "20 cm", "40 cm", "60 cm"],
    correctAnswer: 2,
    category: "PHYSICS",
    explanation: "A same-size real image forms when the object is at 2f. With f = 20 cm, the object must be at 40 cm; the image also forms at 40 cm on the other side."
  },
  {
    id: 4,
    question: "The dimensional formula of Planck's constant is the same as that of:",
    options: ["Energy", "Angular momentum", "Linear momentum", "Power"],
    correctAnswer: 1,
    category: "PHYSICS",
    explanation: "E = h\u03bd gives h = E/\u03bd with dimensions [ML\u00b2T\u207b\u00b9] — identical to angular momentum (mvr). This equivalence underlies Bohr's quantization condition."
  },
  {
    id: 5,
    question: "Which of the following has the maximum number of atoms?",
    options: ["1 g of Mg (24 u)", "1 g of O\u2082 (32 u)", "1 g of Li (7 u)", "1 g of Ag (108 u)"],
    correctAnswer: 2,
    category: "CHEMISTRY",
    explanation: "Number of atoms = (mass/atomic mass) \u00d7 N\u2090. Lithium has the smallest atomic mass (7 u), so 1 g of Li contains the most atoms (\u2248 8.6 \u00d7 10\u00b2\u00b2)."
  },
  {
    id: 6,
    question: "The IUPAC name of CH\u2083\u2013CH(CH\u2083)\u2013CH\u2082\u2013CHO is:",
    options: ["2-methylbutanal", "3-methylbutanal", "2-methylbutan-4-al", "Pentanal"],
    correctAnswer: 1,
    category: "CHEMISTRY",
    explanation: "Number from the CHO carbon (C1). The methyl branch falls on C3 of a four-carbon aldehyde chain, giving 3-methylbutanal."
  },
  {
    id: 7,
    question: "In the reaction Zn + Cu\u00b2\u207a \u2192 Zn\u00b2\u207a + Cu, which statement is correct?",
    options: [
      "Zinc is reduced",
      "Copper ion is oxidized",
      "Zinc is the reducing agent",
      "No electron transfer occurs"
    ],
    correctAnswer: 2,
    category: "CHEMISTRY",
    explanation: "Zn loses electrons (0 \u2192 +2), so it is oxidized and therefore acts as the reducing agent, driving the reduction of Cu\u00b2\u207a to Cu."
  },
  {
    id: 8,
    question: "Which quantum number determines the shape of an orbital?",
    options: [
      "Principal quantum number (n)",
      "Azimuthal quantum number (l)",
      "Magnetic quantum number (m)",
      "Spin quantum number (s)"
    ],
    correctAnswer: 1,
    category: "CHEMISTRY",
    explanation: "The azimuthal (angular momentum) quantum number l defines orbital shape: l = 0 (s, spherical), 1 (p, dumbbell), 2 (d), 3 (f). n sets size/energy and m sets orientation."
  },
  {
    id: 9,
    question: "During which phase of mitosis do sister chromatids separate and move to opposite poles?",
    options: ["Prophase", "Metaphase", "Anaphase", "Telophase"],
    correctAnswer: 2,
    category: "BIOLOGY",
    explanation: "In anaphase, centromeres split and spindle fibres pull the sister chromatids to opposite poles, ensuring each daughter cell receives an identical chromosome set."
  },
  {
    id: 10,
    question: "In a dihybrid cross between two heterozygous parents (AaBb \u00d7 AaBb), the phenotypic ratio in the offspring is:",
    options: ["3 : 1", "1 : 2 : 1", "9 : 3 : 3 : 1", "1 : 1 : 1 : 1"],
    correctAnswer: 2,
    category: "BIOLOGY",
    explanation: "Independent assortment of two heterozygous gene pairs gives the classic Mendelian dihybrid phenotypic ratio 9 : 3 : 3 : 1 (9 double-dominant, two 3s single-dominant, 1 double-recessive)."
  },
  {
    id: 11,
    question: "If f(x) = x\u00b3 \u2212 6x\u00b2 + 9x + 2, the function is decreasing on the interval:",
    options: ["(\u2212\u221e, 1)", "(1, 3)", "(3, \u221e)", "It is never decreasing"],
    correctAnswer: 1,
    category: "MATHEMATICS",
    explanation: "f\u2032(x) = 3x\u00b2 \u2212 12x + 9 = 3(x \u2212 1)(x \u2212 3), which is negative between the roots. So f decreases exactly on (1, 3)."
  },
  {
    id: 12,
    question: "The number of ways to arrange the letters of the word 'EXAM' taken all at a time is:",
    options: ["12", "16", "24", "256"],
    correctAnswer: 2,
    category: "MATHEMATICS",
    explanation: "EXAM has 4 distinct letters, so the arrangements are 4! = 24. No repeated letters means no division by repetition factorials."
  }
];

// Create the onboarding provider
export function OnboardingProvider({ children }: OnboardingProviderProps) {
  const router = useRouter();

  // Define the state
  const [currentStep, setCurrentStep] = useState<OnboardingStep>(OnboardingStep.ACCOUNT_CREATION);

  // Account creation state
  const [name, setName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');

  // Exam and preferences state
  const [examType, setExamType] = useState<'NEET' | 'JEE' | null>(null);
  const [examDate, setExamDate] = useState<Date | null>(null);
  const [diagnosticCompleted, setDiagnosticCompleted] = useState<boolean>(false);
  const [diagnosticSkipped, setDiagnosticSkipped] = useState<boolean>(false);
  const [availableDays, setAvailableDays] = useState<string[]>(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']);
  const [studyHoursPerDay, setStudyHoursPerDay] = useState<number>(2);
  const [preferredStudyTime, setPreferredStudyTime] = useState<'morning' | 'afternoon' | 'evening'>('morning');

  // Diagnostic assessment state.
  // sourceQuestions is the unfiltered pool (fallback bank or content-backed from the API);
  // diagnosticQuestions is that pool narrowed to the chosen exam's subjects
  // (NEET: Physics/Chemistry/Biology — JEE: Physics/Chemistry/Mathematics).
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [sourceQuestions, setSourceQuestions] = useState<DiagnosticQuestion[]>(sampleQuestions);
  const diagnosticQuestions = useMemo(() => {
    const subjects: string[] =
      examType === 'JEE'
        ? ['PHYSICS', 'CHEMISTRY', 'MATHEMATICS']
        : examType === 'NEET'
          ? ['PHYSICS', 'CHEMISTRY', 'BIOLOGY']
          : ['PHYSICS', 'CHEMISTRY', 'BIOLOGY', 'MATHEMATICS'];
    const filtered = sourceQuestions.filter((q) => subjects.includes(q.category));
    return filtered.length > 0 ? filtered : sourceQuestions;
  }, [sourceQuestions, examType]);
  // Changing the exam changes the question set — restart from the first question.
  useEffect(() => {
    setCurrentQuestionIndex(0);
  }, [examType]);
  const [diagnosticAnswers, setDiagnosticAnswers] = useState<DiagnosticAnswer[]>([]);
  const [categoryScores, setCategoryScores] = useState<CategoryScore[]>([]);
  const [topicScores, setTopicScores] = useState<TopicScore[]>([]);
  const [overallScore, setOverallScore] = useState<number>(0);

  // Fetch content-backed diagnostic questions once on mount. The auth token is attached
  // automatically by the client-side fetch shim (src/lib/authFetch.ts) for /api/* calls.
  // If the DB has too few questions (or the request fails), we keep the hardcoded
  // sampleQuestions so onboarding never breaks.
  useEffect(() => {
    let cancelled = false;

    const loadQuestions = async () => {
      try {
        const response = await fetch('/api/diagnostic/questions');
        if (!response.ok) return; // keep fallback sampleQuestions
        const data = await response.json();
        if (
          !cancelled &&
          data?.success &&
          data?.sufficient &&
          Array.isArray(data.questions) &&
          data.questions.length > 0
        ) {
          setSourceQuestions(data.questions as DiagnosticQuestion[]);
        }
        // If not "sufficient", we deliberately leave the hardcoded fallback in place.
      } catch (error) {
        // Never let a fetch failure break onboarding — fall back to sampleQuestions.
        console.error('Error loading diagnostic questions, using fallback set:', error);
      }
    };

    loadQuestions();
    return () => {
      cancelled = true;
    };
  }, []);

  // Define the step order
  const stepOrder = [
    OnboardingStep.ACCOUNT_CREATION,
    OnboardingStep.WELCOME,
    OnboardingStep.DIAGNOSTIC,
    OnboardingStep.SCHEDULE,
    OnboardingStep.PREVIEW,
  ];

  // Go to the next step
  const goToNextStep = () => {
    const currentIndex = stepOrder.indexOf(currentStep);
    if (currentIndex < stepOrder.length - 1) {
      const nextStep = stepOrder[currentIndex + 1];
      setCurrentStep(nextStep);
      router.push(`/onboarding/${nextStep}`);
    } else {
      // If we're at the last step, save the data and go to the dashboard
      saveOnboardingData().then(() => {
        router.push('/dashboard');
      });
    }
  };

  // Go to the previous step
  const goToPreviousStep = () => {
    const currentIndex = stepOrder.indexOf(currentStep);
    if (currentIndex > 0) {
      const previousStep = stepOrder[currentIndex - 1];
      setCurrentStep(previousStep);
      router.push(`/onboarding/${previousStep}`);
    } else {
      // If we're at the first step, go to the home page
      router.push('/');
    }
  };

  // Go to a specific step
  const goToStep = (step: OnboardingStep) => {
    setCurrentStep(step);
    router.push(`/onboarding/${step}`);
  };

  // Go to the next question
  const goToNextQuestion = () => {
    if (currentQuestionIndex < diagnosticQuestions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      // If we're at the last question, calculate results and go to results page
      calculateResults();
      router.push('/onboarding/assessment-results');
    }
  };

  // Go to the previous question
  const goToPreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  // Answer a question
  const answerQuestion = (questionId: number, selectedOption: number, timeSpent: number) => {
    const question = diagnosticQuestions.find(q => q.id === questionId);
    if (!question) return;

    const isCorrect = selectedOption === question.correctAnswer;

    // Check if this question has already been answered
    const existingAnswerIndex = diagnosticAnswers.findIndex(a => a.questionId === questionId);

    if (existingAnswerIndex !== -1) {
      // Update existing answer
      const updatedAnswers = [...diagnosticAnswers];
      updatedAnswers[existingAnswerIndex] = {
        questionId,
        selectedOption,
        isCorrect,
        timeSpent
      };
      setDiagnosticAnswers(updatedAnswers);
    } else {
      // Add new answer
      setDiagnosticAnswers([
        ...diagnosticAnswers,
        {
          questionId,
          selectedOption,
          isCorrect,
          timeSpent
        }
      ]);
    }
  };

  // Calculate assessment results
  const calculateResults = () => {
    // Group questions by category
    const categoriesMap = new Map<string, DiagnosticQuestion[]>();
    diagnosticQuestions.forEach(question => {
      const category = question.category;
      if (!categoriesMap.has(category)) {
        categoriesMap.set(category, []);
      }
      categoriesMap.get(category)?.push(question);
    });

    // Calculate score for each category
    const scores: CategoryScore[] = [];
    let totalCorrect = 0;

    categoriesMap.forEach((questions, category) => {
      const categoryQuestionIds = questions.map(q => q.id);
      const categoryAnswers = diagnosticAnswers.filter(a => categoryQuestionIds.includes(a.questionId));

      const correctAnswers = categoryAnswers.filter(a => a.isCorrect).length;
      const totalQuestions = questions.length;

      const score = totalQuestions > 0 ? (correctAnswers / totalQuestions) * 100 : 0;
      scores.push({ category, score });

      totalCorrect += correctAnswers;
    });

    // Calculate overall score
    const overallScoreValue = diagnosticQuestions.length > 0
      ? (totalCorrect / diagnosticQuestions.length) * 100
      : 0;

    // Calculate finer-grained per-topic scores (only meaningful for content-backed
    // questions, which carry topicId/topicName). This gives plan generation a precise
    // weak-area signal beyond the subject categories.
    const topicsMap = new Map<string, { topicName: string; category: string; questions: DiagnosticQuestion[] }>();
    diagnosticQuestions.forEach(question => {
      if (!question.topicId) return; // hardcoded fallback questions have no topic provenance
      if (!topicsMap.has(question.topicId)) {
        topicsMap.set(question.topicId, {
          topicName: question.topicName || 'General',
          category: question.category,
          questions: [],
        });
      }
      topicsMap.get(question.topicId)?.questions.push(question);
    });

    const newTopicScores: TopicScore[] = [];
    topicsMap.forEach((value, topicId) => {
      const topicQuestionIds = value.questions.map(q => q.id);
      const topicAnswers = diagnosticAnswers.filter(a => topicQuestionIds.includes(a.questionId));
      const correctAnswers = topicAnswers.filter(a => a.isCorrect).length;
      const totalQuestions = value.questions.length;
      const score = totalQuestions > 0 ? (correctAnswers / totalQuestions) * 100 : 0;
      newTopicScores.push({
        topicId,
        topicName: value.topicName,
        category: value.category,
        score,
      });
    });

    setCategoryScores(scores);
    setTopicScores(newTopicScores);
    setOverallScore(overallScoreValue);
    setDiagnosticCompleted(true);
  };

  // Save the diagnostic results to the API
  const saveDiagnosticResults = async () => {
    try {
      // Get the user ID from localStorage
      const userId = localStorage.getItem('userId');
      if (!userId) {
        throw new Error('User ID not found');
      }

      // Prepare the answers data. The DiagnosticResult schema requires a real Topic ObjectId
      // for each answer, so we only persist answers tied to content-backed questions (which
      // carry question.topicId). Hardcoded fallback questions have no topic provenance, so
      // including them would fail Mongoose ObjectId casting — we omit those answers but still
      // persist the category-level scores below, keeping onboarding working end to end.
      const answersData = diagnosticAnswers
        .map(answer => {
          const question = diagnosticQuestions.find(q => q.id === answer.questionId);
          if (!question || !question.topicId) return null;
          return {
            question: question.question || '',
            topic: question.topicId,
            category: question.category || '',
            selectedOption: answer.selectedOption,
            correctOption: question.correctAnswer || 0,
            isCorrect: answer.isCorrect
          };
        })
        .filter((a): a is NonNullable<typeof a> => a !== null);

      // Prepare weak areas (categories with score < 70%)
      const weakAreas = categoryScores
        .filter(cs => cs.score < 70)
        .map(cs => cs.category);

      // Per-topic scores carry the trusted Topic ObjectId so plan generation can target
      // weak topics directly (finer than the subject categories).
      const topicScoresData = topicScores.map(ts => ({
        topic: ts.topicId,
        topicName: ts.topicName,
        category: ts.category,
        score: ts.score,
      }));

      // Recommended focus = weak topics (score < 70%) as Topic IDs, which is the field
      // plan generation reads to personalize the study plan.
      const recommendedFocus = topicScores
        .filter(ts => ts.score < 70)
        .map(ts => ts.topicId);

      // Create diagnostic result
      const response = await fetch('/api/diagnostic', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          completed: true,
          skipped: false,
          score: overallScore,
          categoryScores,
          topicScores: topicScoresData,
          answers: answersData,
          weakAreas,
          recommendedFocus,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save diagnostic results');
      }

      return await response.json();
    } catch (error) {
      console.error('Error saving diagnostic results:', error);
      throw error;
    }
  };

  // Register a new user
  const registerUser = async () => {
    try {
      console.log('Registering user with data:', { name, email, password, examDate });

      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          email,
          password,
          examType: examType || undefined,
          examDate: examDate || new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // Default to 90 days from now
        }),
      });

      const userData = await response.json();
      console.log('Registration response:', userData);

      if (!response.ok || !userData.success) {
        const errorMessage = userData.message || 'Failed to register user';
        console.error('Registration failed:', errorMessage);
        throw new Error(errorMessage);
      }

      // Store the user ID and token in localStorage
      if (userData.user && userData.user.id) {
        localStorage.setItem('userId', userData.user.id);
        localStorage.setItem('token', userData.token);
        console.log('User ID stored in localStorage:', userData.user.id);
      } else {
        console.error('User ID not found in response:', userData);
        throw new Error('User ID not found in response');
      }

      return userData;
    } catch (error) {
      console.error('Error registering user:', error);
      throw error;
    }
  };

  // Save the onboarding data to the API
  const saveOnboardingData = async () => {
    try {
      // Get the user ID from localStorage
      const userId = localStorage.getItem('userId');
      console.log('Saving onboarding data for user ID:', userId);

      if (!userId) {
        console.error('User ID not found in localStorage');
        throw new Error('User ID not found');
      }

      // Update user preferences
      console.log('Updating user preferences:', {
        examDate,
        preferences: {
          availableDays,
          studyHoursPerDay,
          preferredStudyTime,
        },
      });

      const response = await fetch(`/api/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          examDate,
          examType: examType || undefined,
          preferences: {
            availableDays,
            studyHoursPerDay,
            preferredStudyTime,
          },
        }),
      });

      const userData = await response.json();
      console.log('User update response:', userData);

      if (!response.ok || !userData.success) {
        const errorMessage = userData.message || 'Failed to save user data';
        console.error('Failed to save user data:', errorMessage);
        throw new Error(errorMessage);
      }

      // If the diagnostic was skipped, call the skip endpoint
      if (diagnosticSkipped) {
        console.log('Diagnostic was skipped, calling skip endpoint');
        const skipResponse = await fetch('/api/diagnostic/skip', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: userId,
          }),
        });

        const skipData = await skipResponse.json();
        console.log('Skip diagnostic response:', skipData);

        if (!skipResponse.ok) {
          console.error('Failed to skip diagnostic:', skipData);
          throw new Error('Failed to skip diagnostic');
        }
      }

      // Create a study plan for the user
      console.log('Creating study plan for user:', userId);
      const planResponse = await fetch('/api/study-plans', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: userId,
          examDate,
          isPersonalized: !diagnosticSkipped,
        }),
      });

      const planData = await planResponse.json();
      console.log('Study plan creation response:', planData);

      if (!planResponse.ok || !planData.success) {
        const errorMessage = planData.message || 'Failed to create study plan';
        console.error('Failed to create study plan:', errorMessage);
        throw new Error(errorMessage);
      }

      // Note: We don't generate the plan here anymore
      // Plan generation is now handled by the scheduler agent
      // and is called from the preview page when the user clicks "Start My Plan"

      // Make sure we return a properly structured user object
      return {
        success: true,
        user: {
          id: userId,
          ...userData.user
        }
      };
    } catch (error) {
      console.error('Error saving onboarding data:', error);
      throw error;
    }
  };

  // Create the context value
  const contextValue: OnboardingContextType = {
    currentStep,
    // Account creation fields
    name,
    email,
    password,
    // Exam and preferences
    examType,
    examDate,
    diagnosticCompleted,
    diagnosticSkipped,
    availableDays,
    studyHoursPerDay,
    preferredStudyTime,
    // Diagnostic assessment
    currentQuestionIndex,
    diagnosticQuestions,
    diagnosticAnswers,
    categoryScores,
    topicScores,
    overallScore,
    // Account creation setters
    setName,
    setEmail,
    setPassword,
    // Exam and preferences setters
    setExamType,
    setExamDate,
    setDiagnosticCompleted,
    setDiagnosticSkipped,
    setAvailableDays,
    setStudyHoursPerDay,
    setPreferredStudyTime,
    // Navigation
    goToNextStep,
    goToPreviousStep,
    goToStep,
    goToNextQuestion,
    goToPreviousQuestion,
    // Assessment
    answerQuestion,
    calculateResults,
    // Data saving
    saveOnboardingData,
    saveDiagnosticResults,
    registerUser,
  };

  return (
    <OnboardingContext.Provider value={contextValue}>
      {children}
    </OnboardingContext.Provider>
  );
}

// Create a hook for using the onboarding context
export function useOnboarding() {
  const context = useContext(OnboardingContext);
  if (context === undefined) {
    throw new Error('useOnboarding must be used within an OnboardingProvider');
  }
  return context;
}
