/**
 * Utility functions for validating generated study plans
 */

/**
 * Check if a study plan has prerequisite violations
 * @param tasks Array of tasks
 * @param topics Array of topics with prerequisites
 * @returns Array of prerequisite violations
 */
export function checkPrerequisiteViolations(tasks: any[], topics: any[]): any[] {
  const violations: any[] = [];
  const topicMap = new Map();
  
  // Create a map of topic IDs to topics for easy lookup
  topics.forEach(topic => {
    topicMap.set(topic._id.toString(), topic);
  });
  
  // Create a map of topic IDs to their scheduled dates
  const topicScheduleDates = new Map();
  
  tasks.forEach(task => {
    const topicId = task.topic.toString();
    const taskDate = new Date(task.startTime);
    
    // Skip review tasks
    if (task.type === 'REVIEW') return;
    
    // If this topic is already scheduled earlier, use the earlier date
    if (topicScheduleDates.has(topicId)) {
      const existingDate = topicScheduleDates.get(topicId);
      if (taskDate < existingDate) {
        topicScheduleDates.set(topicId, taskDate);
      }
    } else {
      topicScheduleDates.set(topicId, taskDate);
    }
  });
  
  // Check for prerequisite violations
  topicScheduleDates.forEach((taskDate, topicId) => {
    const topic = topicMap.get(topicId);
    
    // Skip if topic not found or has no prerequisites
    if (!topic || !topic.prerequisites || topic.prerequisites.length === 0) return;
    
    // Check each prerequisite
    topic.prerequisites.forEach((prerequisiteId: string) => {
      const prerequisiteId_str = prerequisiteId.toString();
      
      // If prerequisite is not scheduled, that's a violation
      if (!topicScheduleDates.has(prerequisiteId_str)) {
        violations.push({
          topic: topicId,
          prerequisite: prerequisiteId_str,
          issue: 'Prerequisite not scheduled'
        });
        return;
      }
      
      // If prerequisite is scheduled after the topic, that's a violation
      const prerequisiteDate = topicScheduleDates.get(prerequisiteId_str);
      if (prerequisiteDate > taskDate) {
        violations.push({
          topic: topicId,
          prerequisite: prerequisiteId_str,
          issue: 'Prerequisite scheduled after topic',
          topicDate: taskDate,
          prerequisiteDate: prerequisiteDate
        });
      }
    });
  });
  
  return violations;
}

/**
 * Check if a study plan has workload distribution issues
 * @param schedule Array of schedule days
 * @param maxDailyHours Maximum recommended daily study hours
 * @returns Array of workload distribution issues
 */
export function checkWorkloadDistribution(
  schedule: any[],
  maxDailyHours: number = 4
): any[] {
  const issues: any[] = [];
  const maxDailyMinutes = maxDailyHours * 60;
  
  schedule.forEach((day, index) => {
    // Calculate total minutes scheduled for this day
    const totalMinutes = day.tasks.reduce(
      (sum: number, task: any) => sum + task.duration,
      0
    );
    
    // Check if day is overloaded
    if (totalMinutes > maxDailyMinutes) {
      issues.push({
        day: index,
        date: day.date,
        scheduledMinutes: totalMinutes,
        maxRecommendedMinutes: maxDailyMinutes,
        overloadedBy: totalMinutes - maxDailyMinutes
      });
    }
  });
  
  return issues;
}

/**
 * Check if a study plan has difficulty progression issues
 * @param tasks Array of tasks
 * @param maxDifficultyJump Maximum allowed difficulty jump
 * @returns Array of difficulty progression issues
 */
export function checkDifficultyProgression(
  tasks: any[],
  maxDifficultyJump: number = 1
): any[] {
  const issues: any[] = [];
  const difficultyLevels = ['EASY', 'MEDIUM', 'HARD'];
  
  // Sort tasks by date
  const sortedTasks = [...tasks].sort(
    (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
  );
  
  // Group tasks by day
  const tasksByDay = new Map();
  
  sortedTasks.forEach(task => {
    // Skip review tasks
    if (task.type === 'REVIEW') return;
    
    const dateStr = new Date(task.startTime).toDateString();
    
    if (!tasksByDay.has(dateStr)) {
      tasksByDay.set(dateStr, []);
    }
    
    tasksByDay.get(dateStr).push(task);
  });
  
  // Convert map to array of day entries
  const days = Array.from(tasksByDay.entries());
  
  // Check difficulty progression between consecutive days
  for (let i = 1; i < days.length; i++) {
    const prevDayTasks = days[i - 1][1];
    const currentDayTasks = days[i][1];
    
    // Calculate average difficulty for each day
    const prevDayAvgDifficulty = calculateAverageDifficulty(prevDayTasks);
    const currentDayAvgDifficulty = calculateAverageDifficulty(currentDayTasks);
    
    // Calculate difficulty jump
    const difficultyJump = Math.abs(currentDayAvgDifficulty - prevDayAvgDifficulty);
    
    // Check if jump is too large
    if (difficultyJump > maxDifficultyJump) {
      issues.push({
        prevDay: days[i - 1][0],
        currentDay: days[i][0],
        prevDayAvgDifficulty,
        currentDayAvgDifficulty,
        difficultyJump,
        maxAllowedJump: maxDifficultyJump
      });
    }
  }
  
  return issues;
}

/**
 * Calculate average difficulty for an array of tasks
 * @param tasks Array of tasks
 * @returns Average difficulty (0 = EASY, 1 = MEDIUM, 2 = HARD)
 */
function calculateAverageDifficulty(tasks: any[]): number {
  if (tasks.length === 0) return 1; // Default to MEDIUM
  
  const difficultyMap: Record<string, number> = {
    'EASY': 0,
    'MEDIUM': 1,
    'HARD': 2
  };
  
  const totalDifficulty = tasks.reduce((sum, task) => {
    return sum + (difficultyMap[task.difficulty] || 1);
  }, 0);
  
  return totalDifficulty / tasks.length;
}

/**
 * Check if a study plan has spaced repetition issues
 * @param tasks Array of tasks
 * @param minReviewsPerTopic Minimum recommended reviews per topic
 * @returns Array of spaced repetition issues
 */
export function checkSpacedRepetition(
  tasks: any[],
  minReviewsPerTopic: number = 2
): any[] {
  const issues: any[] = [];
  
  // Group tasks by topic
  const tasksByTopic = new Map();
  
  tasks.forEach(task => {
    const topicId = task.topic.toString();
    
    if (!tasksByTopic.has(topicId)) {
      tasksByTopic.set(topicId, []);
    }
    
    tasksByTopic.get(topicId).push(task);
  });
  
  // Check each topic
  tasksByTopic.forEach((topicTasks: any[], topicId: string) => { // Added types for topicTasks and topicId
    // Count review tasks
    const reviewTasks = topicTasks.filter((task: { type: string }) => task.type === 'REVIEW'); // Added type for task
    
    // Check if there are enough review tasks
    if (reviewTasks.length < minReviewsPerTopic) {
      issues.push({
        topic: topicId,
        reviewCount: reviewTasks.length,
        minRecommendedReviews: minReviewsPerTopic
      });
    }
    
    // Check spacing between reviews
    if (reviewTasks.length >= 2) {
      // Sort review tasks by date
      const sortedReviews = [...reviewTasks].sort(
        (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
      );
      
      // Check spacing between consecutive reviews
      for (let i = 1; i < sortedReviews.length; i++) {
        const prevReview = sortedReviews[i - 1];
        const currentReview = sortedReviews[i];
        
        // Calculate days between reviews
        const daysBetween = Math.round(
          (new Date(currentReview.startTime).getTime() - new Date(prevReview.startTime).getTime()) / 
          (1000 * 60 * 60 * 24)
        );
        
        // Check if reviews are too close together
        if (daysBetween < 2) {
          issues.push({
            topic: topicId,
            prevReviewDate: prevReview.startTime,
            currentReviewDate: currentReview.startTime,
            daysBetween,
            minRecommendedDays: 2
          });
        }
      }
    }
  });
  
  return issues;
}

/**
 * Validate a generated study plan
 * @param tasks Array of tasks
 * @param topics Array of topics
 * @param schedule Array of schedule days
 * @returns Validation results with any issues found
 */
export function validateStudyPlan(tasks: any[], topics: any[], schedule: any[]): any {
  const prerequisiteViolations = checkPrerequisiteViolations(tasks, topics);
  const workloadIssues = checkWorkloadDistribution(schedule);
  const difficultyIssues = checkDifficultyProgression(tasks);
  const spacedRepetitionIssues = checkSpacedRepetition(tasks);
  
  const hasIssues = 
    prerequisiteViolations.length > 0 || 
    workloadIssues.length > 0 || 
    difficultyIssues.length > 0 || 
    spacedRepetitionIssues.length > 0;
  
  return {
    isValid: !hasIssues,
    issues: {
      prerequisiteViolations,
      workloadIssues,
      difficultyIssues,
      spacedRepetitionIssues
    }
  };
}
