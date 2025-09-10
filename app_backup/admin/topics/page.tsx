'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Topic {
  _id: string;
  name: string;
  description: string;
  category: string;
  subcategory?: string;
  difficulty: string;
  importance: number;
  estimatedDuration: number;
  prerequisites: any[];
  createdAt: string;
}

export default function TopicsManagement() {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState('');

  const categories = [
    'MANAGEMENT_OF_CARE',
    'SAFETY_AND_INFECTION_CONTROL',
    'HEALTH_PROMOTION',
    'PSYCHOSOCIAL_INTEGRITY',
    'BASIC_CARE_AND_COMFORT',
    'PHARMACOLOGICAL_THERAPIES',
    'REDUCTION_OF_RISK_POTENTIAL',
    'PHYSIOLOGICAL_ADAPTATION'
  ];

  const difficulties = ['EASY', 'MEDIUM', 'HARD'];

  useEffect(() => {
    fetchTopics();
  }, [categoryFilter, difficultyFilter]);

  async function fetchTopics() {
    try {
      setLoading(true);
      
      // Build query string
      let queryParams = new URLSearchParams();
      if (categoryFilter) queryParams.append('category', categoryFilter);
      if (difficultyFilter) queryParams.append('difficulty', difficultyFilter);
      
      // Fetch topics
      const response = await fetch(`/api/topics?${queryParams.toString()}`);
      const data = await response.json();
      
      if (data.success) {
        setTopics(data.topics);
      } else {
        setError(data.message || 'Failed to fetch topics');
      }
    } catch (err) {
      setError('Error fetching topics');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteTopic(id: string) {
    if (!confirm('Are you sure you want to delete this topic? This action cannot be undone.')) {
      return;
    }
    
    try {
      const response = await fetch(`/api/topics/${id}`, {
        method: 'DELETE'
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Remove the deleted topic from the state
        setTopics(topics.filter(topic => topic._id !== id));
      } else {
        alert(data.message || 'Failed to delete topic');
      }
    } catch (err) {
      alert('Error deleting topic');
      console.error(err);
    }
  }

  // Filter topics based on search query
  const filteredTopics = topics.filter(topic => 
    topic.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    topic.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    topic.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (topic.subcategory && topic.subcategory.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div>
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Topics Management</h1>
          <p className="text-gray-600">Manage NCLEX topics and their metadata</p>
        </div>
        <Link 
          href="/admin/topics/new" 
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-lg"
        >
          Add New Topic
        </Link>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0 mb-6">
          <div className="w-full md:w-1/3">
            <label htmlFor="search" className="sr-only">Search</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                </svg>
              </div>
              <input
                id="search"
                name="search"
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="Search topics"
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          
          <div className="flex space-x-4">
            <div>
              <label htmlFor="category" className="sr-only">Category</label>
              <select
                id="category"
                name="category"
                className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
              >
                <option value="">All Categories</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category.replace(/_/g, ' ')}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label htmlFor="difficulty" className="sr-only">Difficulty</label>
              <select
                id="difficulty"
                name="difficulty"
                className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                value={difficultyFilter}
                onChange={(e) => setDifficultyFilter(e.target.value)}
              >
                <option value="">All Difficulties</option>
                {difficulties.map((difficulty) => (
                  <option key={difficulty} value={difficulty}>
                    {difficulty}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <svg className="animate-spin h-8 w-8 text-indigo-600 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="mt-2 text-gray-500">Loading topics...</p>
          </div>
        ) : filteredTopics.length === 0 ? (
          <div className="text-center py-12">
            <svg className="h-12 w-12 text-gray-400 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <p className="mt-2 text-gray-500">No topics found</p>
            <Link href="/admin/topics/new" className="mt-3 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
              Add New Topic
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Difficulty
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Importance
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Duration
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Prerequisites
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredTopics.map((topic) => (
                  <tr key={topic._id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{topic.name}</div>
                      <div className="text-sm text-gray-500">{topic.description.substring(0, 50)}...</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{topic.category.replace(/_/g, ' ')}</div>
                      {topic.subcategory && (
                        <div className="text-sm text-gray-500">{topic.subcategory}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        topic.difficulty === 'EASY' ? 'bg-green-100 text-green-800' :
                        topic.difficulty === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {topic.difficulty}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {topic.importance}/10
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {topic.estimatedDuration} min
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {topic.prerequisites.length}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Link href={`/admin/topics/${topic._id}`} className="text-indigo-600 hover:text-indigo-900 mr-4">
                        Edit
                      </Link>
                      <button
                        onClick={() => handleDeleteTopic(topic._id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
