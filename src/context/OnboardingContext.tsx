"use client";

import { createContext, useContext, useState, ReactNode } from 'react';
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

// Define the onboarding context type
interface OnboardingContextType {
  currentStep: OnboardingStep;
  // Account creation fields
  name: string;
  email: string;
  password: string;
  // Exam and preferences
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
  overallScore: number;
  // Account creation setters
  setName: (name: string) => void;
  setEmail: (email: string) => void;
  setPassword: (password: string) => void;
  // Exam and preferences setters
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
  saveOnboardingData: () => Promise<void>;
  saveDiagnosticResults: () => Promise<void>;
  registerUser: () => Promise<void>;
}

// Create the onboarding context
const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

// Define the onboarding provider props
interface OnboardingProviderProps {
  children: ReactNode;
}

// Sample diagnostic questions
const sampleQuestions: DiagnosticQuestion[] = [
  {
    id: 1,
    question: "A client with chronic kidney disease is receiving hemodialysis. Which of the following assessment findings should the nurse report to the healthcare provider immediately?",
    options: [
      "Blood pressure of 110/70 mmHg",
      "Potassium level of 6.5 mEq/L",
      "Respiratory rate of 18 breaths per minute",
      "Body temperature of 98.6°F (37°C)"
    ],
    correctAnswer: 1,
    category: "PHYSIOLOGICAL_ADAPTATION",
    explanation: "A potassium level of 6.5 mEq/L is significantly elevated (normal range is 3.5-5.0 mEq/L) and can lead to cardiac arrhythmias and cardiac arrest. This is especially concerning in a client with chronic kidney disease on hemodialysis, as the kidneys are the primary regulators of potassium balance."
  },
  {
    id: 2,
    question: "A nurse is caring for a client who is receiving a blood transfusion. Which of the following symptoms would indicate a transfusion reaction requiring immediate intervention?",
    options: [
      "Slight increase in body temperature of 0.5°F",
      "Urticaria and chills",
      "Decreased heart rate",
      "Increased blood pressure"
    ],
    correctAnswer: 1,
    category: "REDUCTION_OF_RISK_POTENTIAL",
    explanation: "Urticaria (hives) and chills are signs of a transfusion reaction. Other signs include fever, back pain, hypotension, tachycardia, dyspnea, and flushing. If these occur, the transfusion should be stopped immediately and the healthcare provider notified."
  },
  {
    id: 3,
    question: "A nurse is administering medications to a client with heart failure. Which medication requires the nurse to assess the client's potassium level before administration?",
    options: [
      "Furosemide (Lasix)",
      "Metoprolol (Lopressor)",
      "Atorvastatin (Lipitor)",
      "Aspirin"
    ],
    correctAnswer: 0,
    category: "PHARMACOLOGICAL_THERAPIES",
    explanation: "Furosemide (Lasix) is a loop diuretic that causes increased excretion of potassium, which can lead to hypokalemia. The nurse should assess the client's potassium level before administering this medication to prevent dangerous electrolyte imbalances."
  },
  {
    id: 4,
    question: "A nurse is teaching a client about warfarin (Coumadin) therapy. Which of the following foods should the nurse instruct the client to limit in their diet?",
    options: [
      "Citrus fruits",
      "Dairy products",
      "Leafy green vegetables",
      "Lean proteins"
    ],
    correctAnswer: 2,
    category: "PHARMACOLOGICAL_THERAPIES",
    explanation: "Leafy green vegetables are high in vitamin K, which can counteract the anticoagulant effects of warfarin. Clients on warfarin therapy should maintain a consistent intake of vitamin K-rich foods rather than completely avoiding them, as sudden changes can affect INR levels."
  },
  {
    id: 5,
    question: "A nurse is caring for a client who has just returned from surgery with a nasogastric tube. Which of the following interventions should the nurse perform first?",
    options: [
      "Irrigate the tube with normal saline",
      "Connect the tube to suction",
      "Verify tube placement",
      "Administer prescribed medications through the tube"
    ],
    correctAnswer: 2,
    category: "BASIC_CARE_AND_COMFORT",
    explanation: "Before any other interventions, the nurse must verify proper placement of the nasogastric tube to ensure it is in the stomach and not in the lungs. This is typically done by aspirating gastric contents and checking the pH, or by obtaining an X-ray confirmation."
  },
  {
    id: 6,
    question: "A nurse is caring for a client with a pressure ulcer on the sacrum. Which of the following would be the most appropriate position for this client?",
    options: [
      "Supine position",
      "Prone position",
      "Lateral position",
      "Semi-Fowler's position"
    ],
    correctAnswer: 1,
    category: "BASIC_CARE_AND_COMFORT",
    explanation: "The prone position (lying on the stomach) would be most appropriate for a client with a sacral pressure ulcer as it completely relieves pressure on the sacrum. However, this position may not be tolerated by all clients and should be used as part of a comprehensive repositioning schedule."
  },
  {
    id: 7,
    question: "A nurse is teaching a client about insulin administration. Which of the following statements by the client indicates a need for further teaching?",
    options: [
      "I should rotate my injection sites.",
      "I can mix my NPH and Regular insulin in the same syringe.",
      "I should inject my insulin at a 90-degree angle.",
      "I should store my unopened insulin vials in the freezer."
    ],
    correctAnswer: 3,
    category: "PHARMACOLOGICAL_THERAPIES",
    explanation: "Insulin should never be frozen as this can alter its effectiveness. Unopened insulin vials should be stored in the refrigerator (36-46°F or 2-8°C), and opened vials can be kept at room temperature (below 86°F or 30°C) for up to 28 days."
  },
  {
    id: 8,
    question: "A nurse is assessing a client who has been diagnosed with tuberculosis. Which of the following findings would the nurse expect to observe?",
    options: [
      "Productive cough with purulent sputum",
      "Fever only in the morning",
      "Weight gain",
      "Increased appetite"
    ],
    correctAnswer: 0,
    category: "PHYSIOLOGICAL_ADAPTATION",
    explanation: "A productive cough with purulent or blood-tinged sputum is a classic symptom of tuberculosis. Other symptoms include night sweats, evening low-grade fever, fatigue, weight loss, and decreased appetite."
  },
  {
    id: 9,
    question: "A nurse is caring for a client who is at risk for developing deep vein thrombosis (DVT). Which of the following interventions would be most effective in preventing DVT?",
    options: [
      "Encouraging the client to remain on bed rest",
      "Applying warm compresses to the legs",
      "Encouraging the client to cross their legs while sitting",
      "Early ambulation and sequential compression devices when in bed"
    ],
    correctAnswer: 3,
    category: "REDUCTION_OF_RISK_POTENTIAL",
    explanation: "Early ambulation and the use of sequential compression devices when the client is in bed are effective interventions for preventing DVT. These measures promote venous return and prevent venous stasis, which is a risk factor for DVT formation."
  },
  {
    id: 10,
    question: "A nurse is teaching a client about the signs and symptoms of hypoglycemia. Which of the following should the nurse include as early signs of hypoglycemia?",
    options: [
      "Polyuria and polydipsia",
      "Shakiness, sweating, and tachycardia",
      "Kussmaul respirations",
      "Fruity breath odor"
    ],
    correctAnswer: 1,
    category: "PHYSIOLOGICAL_ADAPTATION",
    explanation: "Early signs of hypoglycemia include shakiness, sweating, tachycardia, hunger, anxiety, and irritability. These are adrenergic symptoms that occur as the body tries to raise blood glucose levels. The other options are signs of hyperglycemia or diabetic ketoacidosis."
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
  const [examDate, setExamDate] = useState<Date | null>(null);
  const [diagnosticCompleted, setDiagnosticCompleted] = useState<boolean>(false);
  const [diagnosticSkipped, setDiagnosticSkipped] = useState<boolean>(false);
  const [availableDays, setAvailableDays] = useState<string[]>(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']);
  const [studyHoursPerDay, setStudyHoursPerDay] = useState<number>(2);
  const [preferredStudyTime, setPreferredStudyTime] = useState<'morning' | 'afternoon' | 'evening'>('morning');

  // Diagnostic assessment state
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [diagnosticQuestions, setDiagnosticQuestions] = useState<DiagnosticQuestion[]>(sampleQuestions);
  const [diagnosticAnswers, setDiagnosticAnswers] = useState<DiagnosticAnswer[]>([]);
  const [categoryScores, setCategoryScores] = useState<CategoryScore[]>([]);
  const [overallScore, setOverallScore] = useState<number>(0);

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

    setCategoryScores(scores);
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

      // Prepare the answers data
      const answersData = diagnosticAnswers.map(answer => {
        const question = diagnosticQuestions.find(q => q.id === answer.questionId);
        return {
          question: question?.question || '',
          topic: question?.id || '',
          category: question?.category || '',
          selectedOption: answer.selectedOption,
          correctOption: question?.correctAnswer || 0,
          isCorrect: answer.isCorrect
        };
      });

      // Prepare weak areas (categories with score < 70%)
      const weakAreas = categoryScores
        .filter(cs => cs.score < 70)
        .map(cs => cs.category);

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
          answers: answersData,
          weakAreas
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
    overallScore,
    // Account creation setters
    setName,
    setEmail,
    setPassword,
    // Exam and preferences setters
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
