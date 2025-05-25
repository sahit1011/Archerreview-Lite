# Database Setup for Dynamic Calendar

This document provides instructions for setting up the database for the Dynamic Calendar application.

## MongoDB Setup

The application uses MongoDB as its database. You can either use a local MongoDB instance or a cloud-based MongoDB Atlas instance.

### Option 1: Local MongoDB Setup

1. **Install MongoDB Community Edition**:
   - Follow the instructions for your operating system on the [MongoDB website](https://docs.mongodb.com/manual/installation/).

2. **Start MongoDB**:
   - On Linux/macOS: `sudo systemctl start mongod`
   - On Windows: MongoDB should run as a service automatically after installation.

3. **Verify MongoDB is running**:
   - Connect to MongoDB using the MongoDB shell: `mongosh`
   - You should see a MongoDB shell prompt.

4. **Create the database**:
   ```
   use dynamic-calendar
   ```

### Option 2: MongoDB Atlas Setup

1. **Create a MongoDB Atlas account**:
   - Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) and sign up for a free account.

2. **Create a new cluster**:
   - Follow the instructions to create a new cluster (the free tier is sufficient for development).

3. **Configure network access**:
   - Add your IP address to the IP Access List.

4. **Create a database user**:
   - Create a new database user with read/write permissions.

5. **Get the connection string**:
   - Click on "Connect" for your cluster.
   - Select "Connect your application".
   - Copy the connection string.

6. **Update the .env.local file**:
   - Replace the `MONGODB_URI` value with your MongoDB Atlas connection string.
   - Make sure to replace `<password>` with your database user's password.

## Environment Variables

The application uses environment variables for configuration. These are stored in the `.env.local` file.

```
# MongoDB connection URI
MONGODB_URI=mongodb://localhost:27017/dynamic-calendar

# API base URL
NEXT_PUBLIC_API_URL=http://localhost:3000/api
```

## Database Schema

The application uses the following collections:

1. **users**: Stores user information, preferences, and exam dates.
2. **topics**: Stores NCLEX topics and their metadata.
3. **contents**: Stores content items (videos, quizzes, readings) linked to topics.
4. **studyplans**: Stores study plans for users.
5. **tasks**: Stores tasks within study plans.
6. **performances**: Stores user performance data for tasks.
7. **readinessscores**: Stores calculated readiness scores for users.
8. **diagnosticresults**: Stores results from diagnostic assessments.

## Testing the Database Connection

To test the database connection:

1. Start the application:
   ```
   npm run dev
   ```

2. Visit the test endpoint:
   ```
   http://localhost:3000/api/test-db
   ```

3. You should see a JSON response indicating a successful connection:
   ```json
   {
     "success": true,
     "message": "Database connection successful"
   }
   ```

## Seeding the Database

For development purposes, you may want to seed the database with sample data. This can be done using the API endpoints:

1. Create a user:
   ```
   POST /api/users
   {
     "name": "Test User",
     "email": "test@example.com",
     "examDate": "2024-07-05T00:00:00.000Z",
     "preferences": {
       "availableDays": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
       "studyHoursPerDay": 2,
       "preferredStudyTime": "morning"
     }
   }
   ```

2. Create topics, content, study plans, and tasks as needed using the respective API endpoints.

## Troubleshooting

If you encounter issues with the database connection:

1. **Check MongoDB is running**:
   - On Linux/macOS: `sudo systemctl status mongod`
   - On Windows: Check Services in Task Manager.

2. **Check the connection string**:
   - Make sure the connection string in `.env.local` is correct.
   - For MongoDB Atlas, ensure your IP is in the Access List.

3. **Check for errors in the console**:
   - Look for database connection errors in the server logs.

4. **Test with MongoDB Compass**:
   - Use [MongoDB Compass](https://www.mongodb.com/products/compass) to test the connection string.
