'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';

interface Topic {
  _id: string;
  name: string;
  category: string;
}

interface Content {
  _id: string;
  title: string;
  description: string;
  type: string;
  topic: string;
  duration: number;
  difficulty: string;
  url?: string;
  content?: string;
  questions?: any[];
  createdAt?: string;
}

export default function ContentForm() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  const isNew = id === 'new';
  const contentId = isNew ? null : id;

  const [content, setContent] = useState<Content>({
    _id: '',
    title: '',
    description: '',
    type: 'READING',
    topic: '',
    duration: 30,
    difficulty: 'MEDIUM',
    url: '',
    content: '',
    questions: []
  });

  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const contentTypes = ['VIDEO', 'QUIZ', 'READING', 'PRACTICE'];
  const difficulties = ['EASY', 'MEDIUM', 'HARD'];

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);

        // Fetch all topics for dropdown
        const topicsResponse = await fetch('/api/topics');
        const topicsData = await topicsResponse.json();

        if (topicsData.success) {
          setTopics(topicsData.topics);
        } else {
          setError('Failed to fetch topics');
        }

        // If editing an existing content, fetch its data
        if (!isNew && contentId) {
          const contentResponse = await fetch(`/api/content/${contentId}`);
          const contentData = await contentResponse.json();

          if (contentData.success) {
            // Convert topic to ID if it's an object
            const topicId = contentData.content.topic && typeof contentData.content.topic === 'object'
              ? contentData.content.topic._id
              : contentData.content.topic;

            setContent({
              ...contentData.content,
              topic: topicId
            });
          } else {
            setError(contentData.message || 'Failed to fetch content');
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
  }, [isNew, contentId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setContent(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setContent(prev => ({
      ...prev,
      [name]: parseInt(value) || 0
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      const method = isNew ? 'POST' : 'PUT';
      const url = isNew ? '/api/content' : `/api/content/${contentId}`;

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: content.title,
          description: content.description,
          type: content.type,
          topicId: content.topic,
          duration: content.duration,
          difficulty: content.difficulty,
          url: content.url,
          content: content.content,
          questions: content.questions
        })
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(isNew ? 'Content created successfully!' : 'Content updated successfully!');

        // If creating new content, reset the form
        if (isNew) {
          setContent({
            _id: '',
            title: '',
            description: '',
            type: 'READING',
            topic: '',
            duration: 30,
            difficulty: 'MEDIUM',
            url: '',
            content: '',
            questions: []
          });

          // Redirect to the content list after a short delay
          setTimeout(() => {
            router.push('/admin/content');
          }, 1500);
        }
      } else {
        setError(data.message || 'Failed to save content');
      }
    } catch (err) {
      setError('Error saving content');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  // Render different form fields based on content type
  const renderTypeSpecificFields = () => {
    switch (content.type) {
      case 'VIDEO':
        return (
          <div className="col-span-2">
            <label htmlFor="url" className="block text-sm font-medium text-gray-700 mb-1">
              Video URL *
            </label>
            <input
              type="url"
              id="url"
              name="url"
              required
              value={content.url || ''}
              onChange={handleChange}
              className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              placeholder="e.g., https://www.youtube.com/watch?v=..."
            />
          </div>
        );

      case 'READING':
        return (
          <div className="col-span-2">
            <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-1">
              Content *
            </label>
            <textarea
              id="content"
              name="content"
              required
              value={content.content || ''}
              onChange={handleChange}
              rows={10}
              className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              placeholder="Enter the reading content here..."
            />
            <p className="mt-1 text-sm text-gray-500">
              You can use Markdown formatting
            </p>
          </div>
        );

      case 'QUIZ':
      case 'PRACTICE':
        return (
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Questions
            </label>
            <div className="bg-gray-50 p-4 rounded-md">
              <p className="text-sm text-gray-500">
                Question management will be implemented in a future update. For now, please add questions manually through the database.
              </p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div>
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {isNew ? 'Create New Content' : 'Edit Content'}
          </h1>
          <p className="text-gray-600">
            {isNew ? 'Add new content for NCLEX topics' : 'Update existing content'}
          </p>
        </div>
        <Link
          href="/admin/content"
          className="bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium py-2 px-4 rounded-lg"
        >
          Back to Content
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
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                  Title *
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  required
                  value={content.title}
                  onChange={handleChange}
                  className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="e.g., Understanding Pain Management"
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
                  value={content.description}
                  onChange={handleChange}
                  rows={3}
                  className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="Provide a brief description of this content..."
                />
              </div>

              <div>
                <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">
                  Content Type *
                </label>
                <select
                  id="type"
                  name="type"
                  required
                  value={content.type}
                  onChange={handleChange}
                  className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                >
                  {contentTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="topic" className="block text-sm font-medium text-gray-700 mb-1">
                  Topic *
                </label>
                <select
                  id="topic"
                  name="topic"
                  required
                  value={content.topic}
                  onChange={handleChange}
                  className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                >
                  <option value="">Select a topic</option>
                  {topics.map((topic) => (
                    <option key={topic._id} value={topic._id}>
                      {topic.name} ({topic.category.replace(/_/g, ' ')})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="difficulty" className="block text-sm font-medium text-gray-700 mb-1">
                  Difficulty *
                </label>
                <select
                  id="difficulty"
                  name="difficulty"
                  required
                  value={content.difficulty}
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
                <label htmlFor="duration" className="block text-sm font-medium text-gray-700 mb-1">
                  Duration (minutes) *
                </label>
                <input
                  type="number"
                  id="duration"
                  name="duration"
                  required
                  min="1"
                  value={content.duration}
                  onChange={handleNumberChange}
                  className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>

              {renderTypeSpecificFields()}
            </div>

            <div className="mt-6 flex justify-end">
              <Link
                href="/admin/content"
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
                {isNew ? 'Create Content' : 'Update Content'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
