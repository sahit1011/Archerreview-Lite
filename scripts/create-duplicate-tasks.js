// Script to create duplicate tasks for testing the cleanup functionality
const mongoose = require('mongoose');
// Use hardcoded MongoDB URI instead of dotenv
const MONGODB_URI = 'mongodb://localhost:27017/dynamic-calendar';

// Connect to MongoDB
async function connectToDatabase() {
  try {
    console.log('Connecting to MongoDB at:', MONGODB_URI);

    await mongoose.connect(MONGODB_URI);
    console.log('MongoDB connection successful');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
}

// Define Task schema
const TaskSchema = new mongoose.Schema(
  {
    plan: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'StudyPlan',
      required: true
    },
    title: {
      type: String,
      required: true
    },
    description: {
      type: String,
      required: true
    },
    type: {
      type: String,
      required: true,
      enum: ['VIDEO', 'QUIZ', 'READING', 'PRACTICE', 'REVIEW']
    },
    status: {
      type: String,
      required: true,
      enum: ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'SKIPPED'],
      default: 'PENDING'
    },
    startTime: {
      type: Date,
      required: true
    },
    endTime: {
      type: Date,
      required: true
    },
    duration: {
      type: Number,
      required: true,
      min: 1
    },
    content: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Content'
    },
    topic: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Topic',
      required: true
    },
    difficulty: {
      type: String,
      required: true,
      enum: ['EASY', 'MEDIUM', 'HARD'],
      default: 'MEDIUM'
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed
    }
  },
  { timestamps: true }
);

// Define StudyPlan schema
const StudyPlanSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    examDate: {
      type: Date,
      required: true
    },
    isPersonalized: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
);

// Create models
const Task = mongoose.models.Task || mongoose.model('Task', TaskSchema);
const StudyPlan = mongoose.models.StudyPlan || mongoose.model('StudyPlan', StudyPlanSchema);

// Create duplicate tasks
async function createDuplicateTasks() {
  try {
    // Get user ID from command line or use default
    const userId = process.argv[2] || '6818ed80539a47f3e1d5b9ab';

    // Find the user's study plan
    const studyPlan = await StudyPlan.findOne({ user: userId });
    if (!studyPlan) {
      console.error('Study plan not found for user:', userId);
      process.exit(1);
    }

    console.log('Found study plan:', studyPlan._id);

    // Get existing tasks
    const existingTasks = await Task.find({
      plan: studyPlan._id,
      status: 'PENDING'
    }).populate('topic');

    console.log(`Found ${existingTasks.length} existing tasks`);

    if (existingTasks.length === 0) {
      console.error('No existing tasks found to duplicate');
      process.exit(1);
    }

    // Create duplicates for the first 5 tasks
    const tasksToClone = existingTasks.slice(0, 5);
    const duplicateTasks = [];

    for (const task of tasksToClone) {
      // Create 2 duplicates of each task
      for (let i = 0; i < 2; i++) {
        const duplicateTask = new Task({
          plan: task.plan,
          title: `${task.title} (Duplicate ${i+1})`,
          description: task.description,
          type: task.type,
          status: 'PENDING',
          startTime: task.startTime,
          endTime: task.endTime,
          duration: task.duration,
          topic: task.topic._id,
          difficulty: task.difficulty,
          metadata: task.metadata
        });

        duplicateTasks.push(duplicateTask);
      }
    }

    // Save all duplicate tasks
    const savedTasks = await Promise.all(duplicateTasks.map(task => task.save()));

    console.log(`Created ${savedTasks.length} duplicate tasks`);
    console.log('Duplicate tasks created at these times:');

    // Group by time for display
    const tasksByTime = {};
    for (const task of savedTasks) {
      const time = task.startTime.toLocaleTimeString();
      if (!tasksByTime[time]) {
        tasksByTime[time] = [];
      }
      tasksByTime[time].push(task);
    }

    for (const [time, tasks] of Object.entries(tasksByTime)) {
      console.log(`${time}: ${tasks.length} tasks`);
    }

  } catch (error) {
    console.error('Error creating duplicate tasks:', error);
  } finally {
    // Close the database connection
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
}

// Run the script
async function run() {
  await connectToDatabase();
  await createDuplicateTasks();
}

run();
