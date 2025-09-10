'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
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
  createdAt?: string;
}

export default function TopicForm() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  const isNew = id === 'new';
  const topicId = isNew ? null : id;

  const [topic, setTopic] = useState<Topic>({
    _id: '',
    name: '',
    description: '',
    category: 'MANAGEMENT_OF_CARE',
    subcategory: '',
    difficulty: 'MEDIUM',
    importance: 5,
    estimatedDuration: 30,
    prerequisites: []
  });

  const [allTopics, setAllTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

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
    async function fetchData() {
      try {
        setLoading(true);

        // Fetch all topics for prerequisites dropdown
        const topicsResponse = await fetch('/api/topics');
        const topicsData = await topicsResponse.json();

        if (topicsData.success) {
          setAllTopics(topicsData.topics);
        } else {
          setError('Failed to fetch topics');
        }

        // If editing an existing topic, fetch its data
        if (!isNew && topicId) {
          const topicResponse = await fetch(`/api/topics/${topicId}`);
          const topicData = await topicResponse.json();

          if (topicData.success) {
            // Convert prerequisites to array of IDs if they're objects
            const prerequisites = topicData.topic.prerequisites.map((prereq: any) =>
              typeof prereq === 'string' ? prereq : prereq._id
            );

            setTopic({
              ...topicData.topic,
              prerequisites
            });
          } else {
            setError(topicData.message || 'Failed to fetch topic');
          }
        }
      } catch (err) {
        setError('Error fetching data');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [isNew, topicId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setTopic(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setTopic(prev => ({
      ...prev,
      [name]: parseInt(value) || 0
    }));
  };

  const handlePrerequisitesChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedOptions = Array.from(e.target.selectedOptions).map(option => option.value);
    setTopic(prev => ({
      ...prev,
      prerequisites: selectedOptions
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      const method = isNew ? 'POST' : 'PUT';
      const url = isNew ? '/api/topics' : `/api/topics/${topicId}`;

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: topic.name,
          description: topic.description,
          category: topic.category,
          subcategory: topic.subcategory,
          difficulty: topic.difficulty,
          importance: topic.importance,
          estimatedDuration: topic.estimatedDuration,
          prerequisites: topic.prerequisites
        })
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(isNew ? 'Topic created successfully!' : 'Topic updated successfully!');

        // If creating a new topic, reset the form
        if (isNew) {
          setTopic({
            _id: '',
            name: '',
            description: '',
            category: 'MANAGEMENT_OF_CARE',
            subcategory: '',
            difficulty: 'MEDIUM',
            importance: 5,
            estimatedDuration: 30,
            prerequisites: []
          });

          // Redirect to the topics list after a short delay
          setTimeout(() => {
            router.push('/admin/topics');
          }, 1500);
        }
      } else {
        setError(data.message || 'Failed to save topic');
      }
    } catch (err) {
      setError('Error saving topic');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {isNew ? 'Create New Topic' : 'Edit Topic'}
          </h1>
          <p className="text-gray-600">
            {isNew ? 'Add a new NCLEX topic to the system' : 'Update an existing NCLEX topic'}
          </p>
        </div>
        <Link
          href="/admin/topics"
          className="bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium py-2 px-4 rounded-lg"
        >
          Back to Topics
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

      {success && (
        <div className="bg-green-50 border-l-4 border-green-500 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-green-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-green-700">{success}</p>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-12">
          <svg className="animate-spin h-8 w-8 text-indigo-600 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="mt-2 text-gray-500">Loading...</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="col-span-2">
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Topic Name *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  required
                  value={topic.name}
                  onChange={handleChange}
                  className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="e.g., Pain Management"
                />
              </div>

              <div className="col-span-2">
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                  Description *
                </label>
                <textarea
                  id="description"
                  name="description"
                  required
                  value={topic.description}
                  onChange={handleChange}
                  rows={4}
                  className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="Provide a detailed description of this topic..."
                />
              </div>

              <div>
                <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
                  Category *
                </label>
                <select
                  id="category"
                  name="category"
                  required
                  value={topic.category}
                  onChange={handleChange}
                  className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                >
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category.replace(/_/g, ' ')}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="subcategory" className="block text-sm font-medium text-gray-700 mb-1">
                  Subcategory
                </label>
                <input
                  type="text"
                  id="subcategory"
                  name="subcategory"
                  value={topic.subcategory || ''}
                  onChange={handleChange}
                  className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="e.g., Acute Pain"
                />
              </div>

              <div>
                <label htmlFor="difficulty" className="block text-sm font-medium text-gray-700 mb-1">
                  Difficulty *
                </label>
                <select
                  id="difficulty"
                  name="difficulty"
                  required
                  value={topic.difficulty}
                  onChange={handleChange}
                  className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                >
                  {difficulties.map((difficulty) => (
                    <option key={difficulty} value={difficulty}>
                      {difficulty}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="importance" className="block text-sm font-medium text-gray-700 mb-1">
                  Importance (1-10) *
                </label>
                <input
                  type="number"
                  id="importance"
                  name="importance"
                  required
                  min="1"
                  max="10"
                  value={topic.importance}
                  onChange={handleNumberChange}
                  className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>

              <div>
                <label htmlFor="estimatedDuration" className="block text-sm font-medium text-gray-700 mb-1">
                  Estimated Duration (minutes) *
                </label>
                <input
                  type="number"
                  id="estimatedDuration"
                  name="estimatedDuration"
                  required
                  min="5"
                  value={topic.estimatedDuration}
                  onChange={handleNumberChange}
                  className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>

              <div className="col-span-2">
                <label htmlFor="prerequisites" className="block text-sm font-medium text-gray-700 mb-1">
                  Prerequisites
                </label>
                <select
                  id="prerequisites"
                  name="prerequisites"
                  multiple
                  value={topic.prerequisites}
                  onChange={handlePrerequisitesChange}
                  className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  size={5}
                >
                  {allTopics
                    .filter(t => t._id !== topicId) // Filter out the current topic
                    .map((t) => (
                      <option key={t._id} value={t._id}>
                        {t.name}
                      </option>
                    ))}
                </select>
                <p className="mt-1 text-sm text-gray-500">
                  Hold Ctrl (or Cmd) to select multiple topics
                </p>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <Link
                href="/admin/topics"
                className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 mr-3"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={saving}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-lg flex items-center"
              >
                {saving && (
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                )}
                {isNew ? 'Create Topic' : 'Update Topic'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
