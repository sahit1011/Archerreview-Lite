/**
 * Database configuration
 */
export const dbConfig = {
  // MongoDB connection URI
  uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/dynamic-calendar',
  
  // MongoDB connection options
  options: {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    bufferCommands: false,
    autoIndex: true,
  },
  
  // Collection names
  collections: {
    users: 'users',
    topics: 'topics',
    contents: 'contents',
    studyPlans: 'studyplans',
    tasks: 'tasks',
    performances: 'performances',
    readinessScores: 'readinessscores',
    diagnosticResults: 'diagnosticresults',
  }
};
