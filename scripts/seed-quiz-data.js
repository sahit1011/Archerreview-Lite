// This script seeds sample quiz data for testing the quiz interface

const { MongoClient, ObjectId } = require('mongodb');
require('dotenv').config();

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/dynamic-calendar';

async function seedQuizData() {
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log('Connected to MongoDB');

    const db = client.db();
    const contentCollection = db.collection('contents');
    const topicCollection = db.collection('topics');

    // Get a random topic ID
    const topic = await topicCollection.findOne();
    if (!topic) {
      console.log('No topics found. Please seed topics first.');
      return;
    }

    // Create sample quiz content
    const quizContent = {
      title: 'NCLEX Practice Quiz: Pharmacological Therapies',
      description: 'Test your knowledge of common medications and their effects',
      type: 'QUIZ',
      topic: topic._id,
      duration: 15, // in minutes
      difficulty: 'MEDIUM',
      questions: [
        {
          question: 'Which of the following is a common side effect of ACE inhibitors?',
          options: [
            'Hypokalemia',
            'Dry cough',
            'Tachycardia',
            'Constipation'
          ],
          correctAnswer: 1,
          explanation: 'ACE inhibitors commonly cause a dry, persistent cough as a side effect. This is due to the accumulation of bradykinin in the lungs. Other side effects include hypotension, hyperkalemia, and angioedema.'
        },
        {
          question: 'A patient is prescribed warfarin. Which of the following foods should the nurse instruct the patient to limit in their diet?',
          options: [
            'Citrus fruits',
            'Dairy products',
            'Leafy green vegetables',
            'Lean proteins'
          ],
          correctAnswer: 2,
          explanation: 'Leafy green vegetables are high in vitamin K, which can counteract the anticoagulant effects of warfarin. Patients on warfarin should maintain a consistent intake of vitamin K-rich foods rather than completely avoiding them.'
        },
        {
          question: 'Which of the following medications is classified as a beta-blocker?',
          options: [
            'Lisinopril',
            'Amlodipine',
            'Metoprolol',
            'Furosemide'
          ],
          correctAnswer: 2,
          explanation: 'Metoprolol is a beta-blocker that works by blocking the action of certain natural chemicals in your body (such as epinephrine) that affect the heart and blood vessels. This results in a lower heart rate and blood pressure.'
        },
        {
          question: 'A patient with type 1 diabetes is experiencing hypoglycemia. Which of the following is the most appropriate immediate intervention?',
          options: [
            'Administer insulin',
            'Provide a glass of orange juice',
            'Encourage the patient to rest',
            'Administer glucagon'
          ],
          correctAnswer: 1,
          explanation: 'For mild to moderate hypoglycemia, the initial treatment is to provide 15-20 grams of fast-acting carbohydrates, such as orange juice, glucose tablets, or hard candy. Insulin would further lower blood glucose and worsen hypoglycemia.'
        },
        {
          question: 'Which of the following medications requires monitoring of serum drug levels due to its narrow therapeutic range?',
          options: [
            'Ibuprofen',
            'Digoxin',
            'Loratadine',
            'Simvastatin'
          ],
          correctAnswer: 1,
          explanation: 'Digoxin has a narrow therapeutic range, meaning the difference between therapeutic and toxic doses is small. Regular monitoring of serum drug levels is necessary to prevent toxicity while ensuring therapeutic effectiveness.'
        }
      ],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Insert quiz content
    const result = await contentCollection.insertOne(quizContent);
    console.log(`Inserted quiz content with ID: ${result.insertedId}`);

    console.log('Sample quiz data seeded successfully');
  } catch (error) {
    console.error('Error seeding quiz data:', error);
  } finally {
    await client.close();
    console.log('MongoDB connection closed');
  }
}

seedQuizData().catch(console.error);
