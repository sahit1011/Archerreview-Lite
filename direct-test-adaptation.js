// Direct test of the adaptation agent service
const mongoose = require('mongoose');
const dbConnect = require('./src/lib/db');
const { User, StudyPlan, Task, Topic, Alert, Performance } = require('./src/models/index');
const { runAdaptationAgent } = require('./src/services/adaptationAgent');

async function createTestData() {
  try {
    // Connect to the database
    await dbConnect();
    console.log('Connected to database');

    // Get or create a test user
    let user = await User.findOne({ email: 'test@example.com' });
    if (!user) {
      user = new User({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123'
      });
      await user.save();
      console.log('Created test user');
    }

    // Get or create a study plan
    let studyPlan = await StudyPlan.findOne({ user: user._id });
    if (!studyPlan) {
      const examDate = new Date();
      examDate.setDate(examDate.getDate() + 30); // Exam in 30 days

      studyPlan = new StudyPlan({
        user: user._id,
        examDate,
        isPersonalized: true,
        startDate: new Date(),
        endDate: examDate
      });
      await studyPlan.save();
      console.log('Created study plan');
    }

    // Get or create topics
    const topics = [];
    const topicNames = ['Pharmacology', 'Anatomy', 'Physiology', 'Pathology', 'Nursing Process'];
    
    for (const name of topicNames) {
      let topic = await Topic.findOne({ name });
      if (!topic) {
        topic = new Topic({
          name,
          description: `${name} topic for NCLEX preparation`,
          category: 'Nursing',
          difficulty: 'MEDIUM',
          estimatedDuration: 60
        });
        await topic.save();
        console.log(`Created topic: ${name}`);
      }
      topics.push(topic);
    }

    // Create test scenarios

    // 1. Missed tasks scenario
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    const missedTask = new Task({
      plan: studyPlan._id,
      title: 'Missed Pharmacology Quiz',
      description: 'Quiz on medication administration',
      type: 'QUIZ',
      status: 'PENDING', // Pending but past due
      startTime: new Date(yesterday.setHours(10, 0, 0)),
      endTime: new Date(yesterday.setHours(11, 0, 0)),
      duration: 60,
      topic: topics[0]._id, // Pharmacology
      difficulty: 'MEDIUM'
    });
    await missedTask.save();
    console.log('Created missed task');

    // Create alert for missed task
    const missedTaskAlert = new Alert({
      user: user._id,
      plan: studyPlan._id,
      type: 'MISSED_TASK',
      severity: 'HIGH',
      message: 'You missed a Pharmacology quiz',
      relatedTask: missedTask._id,
      relatedTopic: topics[0]._id,
      isResolved: false
    });
    await missedTaskAlert.save();
    console.log('Created missed task alert');

    // 2. Low performance scenario
    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
    
    const lowPerfTask = new Task({
      plan: studyPlan._id,
      title: 'Anatomy Quiz',
      description: 'Quiz on human anatomy',
      type: 'QUIZ',
      status: 'COMPLETED',
      startTime: new Date(twoDaysAgo.setHours(14, 0, 0)),
      endTime: new Date(twoDaysAgo.setHours(15, 0, 0)),
      duration: 60,
      topic: topics[1]._id, // Anatomy
      difficulty: 'MEDIUM'
    });
    await lowPerfTask.save();
    console.log('Created low performance task');

    // Create performance record for low performance
    const lowPerformance = new Performance({
      user: user._id,
      task: lowPerfTask._id,
      topic: topics[1]._id,
      score: 45, // Low score
      timeSpent: 55,
      completed: true,
      confidence: 2 // Low confidence
    });
    await lowPerformance.save();
    console.log('Created low performance record');

    // Create alert for low performance
    const lowPerfAlert = new Alert({
      user: user._id,
      plan: studyPlan._id,
      type: 'LOW_PERFORMANCE',
      severity: 'MEDIUM',
      message: 'Your performance in Anatomy is below target',
      relatedTask: lowPerfTask._id,
      relatedTopic: topics[1]._id,
      isResolved: false
    });
    await lowPerfAlert.save();
    console.log('Created low performance alert');

    // 3. Future tasks for difficulty adjustment
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const futureTasks = [];
    for (let i = 0; i < 3; i++) {
      const startHour = 9 + i * 2;
      const task = new Task({
        plan: studyPlan._id,
        title: `Future ${topics[1].name} Task ${i+1}`,
        description: `Future task for ${topics[1].name}`,
        type: 'QUIZ',
        status: 'PENDING',
        startTime: new Date(new Date(tomorrow).setHours(startHour, 0, 0)),
        endTime: new Date(new Date(tomorrow).setHours(startHour + 1, 0, 0)),
        duration: 60,
        topic: topics[1]._id, // Anatomy (same as low performance)
        difficulty: 'HARD' // Should be adjusted down
      });
      await task.save();
      futureTasks.push(task);
    }
    console.log('Created future tasks for difficulty adjustment');

    // 4. Completed tasks for spaced repetition
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    
    const completedTask = new Task({
      plan: studyPlan._id,
      title: 'Completed Physiology Quiz',
      description: 'Quiz on human physiology',
      type: 'QUIZ',
      status: 'COMPLETED',
      startTime: new Date(threeDaysAgo.setHours(11, 0, 0)),
      endTime: new Date(threeDaysAgo.setHours(12, 0, 0)),
      duration: 60,
      topic: topics[2]._id, // Physiology
      difficulty: 'MEDIUM'
    });
    await completedTask.save();
    console.log('Created completed task for spaced repetition');

    // Create performance record for completed task
    const goodPerformance = new Performance({
      user: user._id,
      task: completedTask._id,
      topic: topics[2]._id,
      score: 85, // Good score
      timeSpent: 50,
      completed: true,
      confidence: 4 // Good confidence
    });
    await goodPerformance.save();
    console.log('Created good performance record');

    // 5. Create tasks on an overloaded day for workload balancing
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    
    // Create 5 tasks on the same day (overloaded)
    for (let i = 0; i < 5; i++) {
      const startHour = 9 + i;
      const task = new Task({
        plan: studyPlan._id,
        title: `Overloaded Day Task ${i+1}`,
        description: `Task on overloaded day`,
        type: 'QUIZ',
        status: 'PENDING',
        startTime: new Date(new Date(nextWeek).setHours(startHour, 0, 0)),
        endTime: new Date(new Date(nextWeek).setHours(startHour + 1, 0, 0)),
        duration: 60,
        topic: topics[i % topics.length]._id,
        difficulty: 'MEDIUM'
      });
      await task.save();
    }
    console.log('Created tasks on overloaded day');

    return {
      userId: user._id.toString(),
      studyPlanId: studyPlan._id.toString()
    };
  } catch (error) {
    console.error('Error creating test data:', error);
    throw error;
  }
}

async function testAdaptationAgent() {
  try {
    // Create test data
    const { userId } = await createTestData();
    console.log(`\nTest data created for user: ${userId}`);
    
    // Run the adaptation agent
    console.log('\nRunning adaptation agent...');
    const result = await runAdaptationAgent(userId);
    
    // Display results
    console.log('\nAdaptation agent results:');
    console.log(JSON.stringify(result, null, 2));
    
    // Check for adaptations
    if (result.adaptations.length > 0) {
      console.log(`\nNumber of adaptations: ${result.adaptations.length}`);
      
      console.log('\nAdaptation details:');
      result.adaptations.forEach((adaptation, index) => {
        console.log(`\n[${index + 1}] ${adaptation.type}: ${adaptation.description}`);
      });
      
      console.log('\nAdaptation summary:');
      console.log(result.summary);
    } else {
      console.log('\nNo adaptations were made. This could be because:');
      console.log('1. There are no issues that require adaptation');
      console.log('2. There is not enough data to make adaptations');
      console.log('3. The adaptation agent is not finding applicable scenarios');
    }
    
    return result;
  } catch (error) {
    console.error('Error testing adaptation agent:', error);
    throw error;
  } finally {
    // Close the database connection
    await mongoose.disconnect();
    console.log('\nDisconnected from database');
  }
}

// Run the test
testAdaptationAgent()
  .then(() => console.log('\nTest completed successfully'))
  .catch(error => {
    console.error('\nTest failed:', error);
    process.exit(1);
  });
