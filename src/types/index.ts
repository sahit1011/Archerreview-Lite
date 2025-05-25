// User types
export interface User {
  id: string;
  name: string;
  email: string;
  examDate: Date;
  preferences?: {
    availableDays: string[];
    studyHoursPerDay: number;
    preferredStudyTime: 'morning' | 'afternoon' | 'evening';
    notifications: boolean;
  };
  role: 'user' | 'admin';
  isEmailVerified: boolean;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthUser extends User {
  token: string;
}

// Study plan types
export interface StudyPlan {
  id: string;
  userId: string;
  examDate: Date;
  createdAt: Date;
  updatedAt: Date;
  tasks: Task[];
  isPersonalized: boolean;
}

// Task types
export interface Task {
  id: string;
  planId: string;
  title: string;
  description: string;
  type: TaskType;
  status: TaskStatus;
  startTime: Date;
  endTime: Date;
  duration: number; // in minutes
  topicId: string;
  difficulty: Difficulty;
  confidence?: number; // 1-5 scale
  createdAt: Date;
  updatedAt: Date;
}

export enum TaskType {
  VIDEO = 'VIDEO',
  QUIZ = 'QUIZ',
  READING = 'READING',
  PRACTICE = 'PRACTICE',
  REVIEW = 'REVIEW',
}

export enum TaskStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  SKIPPED = 'SKIPPED',
}

export enum Difficulty {
  EASY = 'EASY',
  MEDIUM = 'MEDIUM',
  HARD = 'HARD',
}

// Topic types
export interface Topic {
  id: string;
  name: string;
  description: string;
  category: Category;
  subcategory?: string;
  prerequisites: string[]; // Array of topic IDs
  difficulty: Difficulty;
  importance: number; // 1-10 scale
  createdAt: Date;
  updatedAt: Date;
}

export enum Category {
  MANAGEMENT_OF_CARE = 'MANAGEMENT_OF_CARE',
  SAFETY_AND_INFECTION_CONTROL = 'SAFETY_AND_INFECTION_CONTROL',
  HEALTH_PROMOTION = 'HEALTH_PROMOTION',
  PSYCHOSOCIAL_INTEGRITY = 'PSYCHOSOCIAL_INTEGRITY',
  BASIC_CARE_AND_COMFORT = 'BASIC_CARE_AND_COMFORT',
  PHARMACOLOGICAL_THERAPIES = 'PHARMACOLOGICAL_THERAPIES',
  REDUCTION_OF_RISK_POTENTIAL = 'REDUCTION_OF_RISK_POTENTIAL',
  PHYSIOLOGICAL_ADAPTATION = 'PHYSIOLOGICAL_ADAPTATION',
}
