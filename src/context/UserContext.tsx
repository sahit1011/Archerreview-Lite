"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, AuthUser } from '@/types';

interface UserContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; message: string; hasStudyPlan?: boolean }>;
  register: (userData: { name: string; email: string; password: string; examDate: Date }) => Promise<{ success: boolean; message: string }>;
  logout: () => void;
  setUser: (user: User | null) => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

interface UserProviderProps {
  children: ReactNode;
}

export function UserProvider({ children }: UserProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Load user from localStorage on initial load
  useEffect(() => {
    const loadUser = async () => {
      try {
        // Uncomment this code to enable user persistence
        const token = localStorage.getItem('token');
        const userData = localStorage.getItem('user');

        if (token && userData) {
          const parsedUser = JSON.parse(userData);
          setUser(parsedUser);
          setIsAuthenticated(true);

          // Verify token with the server
          try {
            const response = await fetch('/api/auth/me', {
              headers: {
                'Authorization': `Bearer ${token}`
              }
            });

            if (response.ok) {
              const data = await response.json();
              if (data.success) {
                setUser(data.user);
              } else {
                // Token is invalid, clear localStorage
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                setUser(null);
                setIsAuthenticated(false);
              }
            }
          } catch (error) {
            console.error('Error verifying token:', error);
          }
        }
      } catch (error) {
        console.error('Failed to load user:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    loadUser();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (data.success) {
        // Save token and user data to localStorage
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        localStorage.setItem('userId', data.user.id);

        // Update state
        setUser(data.user);
        setIsAuthenticated(true);

        // Check if the user has a study plan
        try {
          const studyPlanResponse = await fetch(`/api/study-plans?userId=${data.user.id}`);
          const studyPlanData = await studyPlanResponse.json();
          
          if (studyPlanData.success && studyPlanData.studyPlan) {
            // User has a study plan, return success
            return { success: true, message: 'Login successful', hasStudyPlan: true };
          } else {
            // User doesn't have a study plan, they need to complete onboarding
            return { success: true, message: 'Login successful', hasStudyPlan: false };
          }
        } catch (studyPlanError) {
          console.error('Error checking study plan:', studyPlanError);
          // If we can't check the study plan, assume they need to complete onboarding
          return { success: true, message: 'Login successful', hasStudyPlan: false };
        }
      } else {
        return { success: false, message: data.message || 'Login failed' };
      }
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, message: 'An error occurred during login' };
    }
  };

  const register = async (userData: { name: string; email: string; password: string; examDate: Date }) => {
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(userData)
      });

      const data = await response.json();

      if (data.success) {
        // Save token and user data to localStorage
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        localStorage.setItem('userId', data.user.id);

        // Update state
        setUser(data.user);
        setIsAuthenticated(true);

        return { success: true, message: 'Registration successful' };
      } else {
        return { success: false, message: data.message || 'Registration failed' };
      }
    } catch (error) {
      console.error('Registration error:', error);
      return { success: false, message: 'An error occurred during registration' };
    }
  };

  const logout = () => {
    // Clear localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('userId');

    // Update state
    setUser(null);
    setIsAuthenticated(false);
  };

  return (
    <UserContext.Provider value={{
      user,
      isLoading,
      isAuthenticated,
      login,
      register,
      logout,
      setUser
    }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}
