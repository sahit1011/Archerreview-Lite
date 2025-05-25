// Simple script to duplicate tasks for testing
const { MongoClient, ObjectId } = require('mongodb');

// MongoDB connection URI
const uri = 'mongodb://localhost:27017';
const dbName = 'dynamic-calendar';

async function duplicateTasks() {
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log('Connected to MongoDB');

    const db = client.db(dbName);
    const tasksCollection = db.collection('tasks');
    const studyPlansCollection = db.collection('studyplans');

    // Find a study plan for our user
    const userId = '6818ed80539a47f3e1d5b9ab';
    const studyPlan = await studyPlansCollection.findOne({ user: new ObjectId(userId) });

    if (!studyPlan) {
      console.error('Study plan not found');
      return;
    }

    console.log('Found study plan:', studyPlan._id);

    // Find some tasks to duplicate
    const tasks = await tasksCollection.find({
      plan: studyPlan._id,
      status: 'PENDING'
    }).limit(5).toArray();

    if (tasks.length === 0) {
      console.error('No tasks found to duplicate');
      return;
    }

    console.log(`Found ${tasks.length} tasks to duplicate`);

    // Create duplicates on different days
    const duplicates = [];

    for (const task of tasks) {
      // Create 2 duplicates of each task
      for (let i = 0; i < 2; i++) {
        // Create a copy of the task
        const duplicate = {
          ...task,
          _id: new ObjectId(), // Generate a new ID
          title: `${task.title} (Duplicate ${i+1})`,
          createdAt: new Date(),
          updatedAt: new Date()
        };

        // Modify the start and end times for different days
        const startTime = new Date(task.startTime);
        const endTime = new Date(task.endTime);

        // Add i days to the dates to spread them across different days
        startTime.setDate(startTime.getDate() + i);
        endTime.setDate(endTime.getDate() + i);

        duplicate.startTime = startTime;
        duplicate.endTime = endTime;

        delete duplicate.id; // Remove any id field if it exists
        duplicates.push(duplicate);
      }
    }

    // Insert the duplicates
    if (duplicates.length > 0) {
      const result = await tasksCollection.insertMany(duplicates);
      console.log(`Created ${result.insertedCount} duplicate tasks`);

      // Group by time for display
      const tasksByTime = {};
      for (const task of duplicates) {
        const time = new Date(task.startTime).toLocaleTimeString();
        if (!tasksByTime[time]) {
          tasksByTime[time] = [];
        }
        tasksByTime[time].push(task);
      }

      console.log('Duplicate tasks created at these times:');
      for (const [time, tasks] of Object.entries(tasksByTime)) {
        console.log(`${time}: ${tasks.length} tasks`);
      }
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
    console.log('MongoDB connection closed');
  }
}

// Run the script
duplicateTasks();
