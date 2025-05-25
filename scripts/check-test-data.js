const { MongoClient, ObjectId } = require('mongodb');

async function checkTestData() {
  const client = new MongoClient(process.env.MONGODB_URI || 'mongodb://localhost:27017/dynamic-calendar');
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db();
    
    // Check test users
    const testUserIds = ['68163365d212f2aae00aebd6', '68163365d212f2aae00aebd7', '68163365d212f2aae00aebd8'];
    
    for (const userId of testUserIds) {
      console.log(`\n=== Checking data for user ID: ${userId} ===`);
      
      // Get user
      const user = await db.collection('users').findOne({ _id: new ObjectId(userId) });
      console.log(`User: ${user ? user.name : 'Not found'}`);
      
      if (user) {
        // Get study plan
        const studyPlan = await db.collection('studyplans').findOne({ user: new ObjectId(userId) });
        console.log(`Study Plan: ${studyPlan ? 'Found' : 'Not found'}`);
        
        if (studyPlan) {
          // Get tasks
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const tomorrow = new Date(today);
          tomorrow.setDate(tomorrow.getDate() + 1);
          
          const todaysTasks = await db.collection('tasks')
            .find({ 
              plan: studyPlan._id,
              startTime: { $gte: today, $lt: tomorrow }
            })
            .toArray();
          
          console.log(`Today's Tasks: ${todaysTasks.length}`);
          
          if (todaysTasks.length > 0) {
            console.log('Sample task:', {
              title: todaysTasks[0].title,
              type: todaysTasks[0].type,
              status: todaysTasks[0].status,
              startTime: todaysTasks[0].startTime
            });
          }
          
          // Get all tasks
          const allTasks = await db.collection('tasks')
            .find({ plan: studyPlan._id })
            .toArray();
          
          console.log(`Total Tasks: ${allTasks.length}`);
          
          // Get completed tasks
          const completedTasks = allTasks.filter(task => task.status === 'COMPLETED');
          console.log(`Completed Tasks: ${completedTasks.length}`);
        }
        
        // Get readiness score
        const readinessScore = await db.collection('readinessscores').findOne({ user: new ObjectId(userId) });
        console.log(`Readiness Score: ${readinessScore ? readinessScore.overallScore + '%' : 'Not found'}`);
        
        if (readinessScore) {
          console.log(`Category Scores: ${readinessScore.categoryScores.length}`);
          console.log(`Weak Areas: ${readinessScore.weakAreas.length}`);
          console.log(`Strong Areas: ${readinessScore.strongAreas.length}`);
        }
      }
    }
    
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.close();
    console.log('\nMongoDB connection closed');
  }
}

checkTestData();
