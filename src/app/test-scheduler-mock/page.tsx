"use client";

import { useState } from 'react';
import { motion } from 'framer-motion';

// Mock data for testing
const mockUser = {
  _id: "user123",
  name: "Test User",
  email: "test@example.com",
  examDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days from now
  preferences: {
    availableDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
    studyHoursPerDay: 3,
    preferredStudyTime: 'morning',
    notifications: true
  }
};

const mockTopics = [
  {
    _id: "topic1",
    name: "Cardiovascular Nursing",
    description: "Study of the heart and circulatory system",
    category: "PHYSIOLOGICAL_ADAPTATION",
    difficulty: "MEDIUM",
    importance: 8,
    estimatedDuration: 120
  },
  {
    _id: "topic2",
    name: "Respiratory Nursing",
    description: "Study of the respiratory system",
    category: "PHYSIOLOGICAL_ADAPTATION",
    difficulty: "MEDIUM", 
    importance: 7,
    estimatedDuration: 90
  },
  {
    _id: "topic3",
    name: "Medication Administration",
    description: "Safe administration of medications",
    category: "PHARMACOLOGICAL_THERAPIES",
    difficulty: "HARD",
    importance: 9,
    estimatedDuration: 150
  },
  {
    _id: "topic4",
    name: "Infection Control",
    description: "Prevention and control of infections",
    category: "SAFETY_AND_INFECTION_CONTROL",
    difficulty: "EASY",
    importance: 8,
    estimatedDuration: 60
  },
  {
    _id: "topic5",
    name: "Pain Management",
    description: "Assessment and management of pain",
    category: "BASIC_CARE_AND_COMFORT",
    difficulty: "MEDIUM",
    importance: 7,
    estimatedDuration: 90
  }
];

export default function TestSchedulerMockPage() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [generatedPlan, setGeneratedPlan] = useState<any>(null);
  const [tasks, setTasks] = useState<any[]>([]);

  // Mock function to simulate plan generation
  const handleGeneratePlan = async () => {
    try {
      setLoading(true);
      setMessage('Generating study plan...');
      setError('');
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Create a mock study plan
      const mockPlan = {
        _id: "plan123",
        user: mockUser._id,
        examDate: mockUser.examDate,
        isPersonalized: true,
        startDate: new Date(),
        endDate: mockUser.examDate,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      // Create mock tasks
      const mockTasks = [];
      const availableDays = mockUser.preferences.availableDays;
      const startDate = new Date();
      
      // Generate tasks for the next 14 days
      for (let i = 0; i < 14; i++) {
        const currentDate = new Date(startDate);
        currentDate.setDate(currentDate.getDate() + i);
        
        // Only create tasks for available days
        const dayName = currentDate.toLocaleDateString('en-US', { weekday: 'long' });
        if (availableDays.includes(dayName)) {
          // Create 2-3 tasks per day
          const tasksPerDay = Math.floor(Math.random() * 2) + 2;
          
          for (let j = 0; j < tasksPerDay; j++) {
            const startHour = 9 + j * 2; // Start at 9 AM, 2 hours per task
            const startTime = new Date(currentDate);
            startTime.setHours(startHour, 0, 0, 0);
            
            const endTime = new Date(startTime);
            const duration = Math.floor(Math.random() * 60) + 30; // 30-90 minutes
            endTime.setMinutes(endTime.getMinutes() + duration);
            
            // Pick a random topic
            const topic = mockTopics[Math.floor(Math.random() * mockTopics.length)];
            
            // Pick a random task type
            const taskTypes = ['VIDEO', 'QUIZ', 'READING', 'PRACTICE', 'REVIEW'];
            const taskType = taskTypes[Math.floor(Math.random() * taskTypes.length)];
            
            mockTasks.push({
              _id: `task${i}_${j}`,
              plan: mockPlan._id,
              title: `${taskType} on ${topic.name}`,
              description: `Study session on ${topic.description}`,
              type: taskType,
              status: 'PENDING',
              startTime,
              endTime,
              duration,
              topic,
              difficulty: topic.difficulty,
              createdAt: new Date(),
              updatedAt: new Date()
            });
          }
        }
      }
      
      setGeneratedPlan(mockPlan);
      setTasks(mockTasks);
      setMessage('Study plan generated successfully!');
    } catch (err) {
      console.error('Error generating mock plan:', err);
      setError('An error occurred while generating the mock study plan');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-4xl mx-auto"
      >
        <h1 className="text-3xl font-bold text-indigo-600 mb-6">
          Scheduler Agent Test (Mock Version)
        </h1>
        
        {loading && (
          <div className="bg-blue-50 p-4 rounded-md mb-6">
            <p className="text-blue-700">{message || 'Loading...'}</p>
          </div>
        )}
        
        {error && (
          <div className="bg-red-50 p-4 rounded-md mb-6">
            <p className="text-red-700">{error}</p>
          </div>
        )}
        
        {message && !loading && (
          <div className="bg-green-50 p-4 rounded-md mb-6">
            <p className="text-green-700">{message}</p>
          </div>
        )}
        
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Test Setup (Mock Data)</h2>
          
          <div className="mb-4">
            <h3 className="text-lg font-medium mb-2">Test User</h3>
            <div className="bg-gray-50 p-4 rounded-md">
              <p>Name: {mockUser.name}</p>
              <p>Email: {mockUser.email}</p>
              <p>Exam Date: {mockUser.examDate.toLocaleDateString()}</p>
              <p>Available Days: {mockUser.preferences.availableDays.join(', ')}</p>
              <p>Study Hours Per Day: {mockUser.preferences.studyHoursPerDay}</p>
              <p>Preferred Study Time: {mockUser.preferences.preferredStudyTime}</p>
            </div>
          </div>
          
          <button
            onClick={handleGeneratePlan}
            disabled={loading}
            className={`${
              loading 
                ? 'bg-indigo-400 cursor-not-allowed' 
                : 'bg-indigo-600 hover:bg-indigo-700'
            } text-white px-4 py-2 rounded-md transition-colors flex items-center`}
          >
            {loading && (
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            )}
            {loading ? 'Generating Plan...' : 'Generate Mock Study Plan'}
          </button>
        </div>
        
        {generatedPlan && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Generated Plan (Mock)</h2>
            <div className="bg-gray-50 p-4 rounded-md mb-4">
              <p>Plan ID: {generatedPlan._id}</p>
              <p>User ID: {generatedPlan.user}</p>
              <p>Start Date: {new Date(generatedPlan.startDate).toLocaleDateString()}</p>
              <p>End Date: {new Date(generatedPlan.endDate).toLocaleDateString()}</p>
              <p>Personalized: {generatedPlan.isPersonalized ? 'Yes' : 'No'}</p>
            </div>
            
            <h3 className="text-lg font-medium mb-2">Generated Tasks ({tasks.length})</h3>
            
            {tasks.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full bg-white">
                  <thead>
                    <tr>
                      <th className="py-2 px-4 border-b">Title</th>
                      <th className="py-2 px-4 border-b">Type</th>
                      <th className="py-2 px-4 border-b">Date</th>
                      <th className="py-2 px-4 border-b">Time</th>
                      <th className="py-2 px-4 border-b">Duration</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tasks.map((task) => (
                      <tr key={task._id}>
                        <td className="py-2 px-4 border-b">{task.title}</td>
                        <td className="py-2 px-4 border-b">{task.type}</td>
                        <td className="py-2 px-4 border-b">
                          {new Date(task.startTime).toLocaleDateString()}
                        </td>
                        <td className="py-2 px-4 border-b">
                          {new Date(task.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="py-2 px-4 border-b">{task.duration} min</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p>No tasks generated.</p>
            )}
          </div>
        )}
      </motion.div>
    </div>
  );
}
