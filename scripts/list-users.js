/**
 * Script to list all users in the database
 */

// Load environment variables
require('dotenv').config({ path: '.env.local' });

// Import required modules
const mongoose = require('mongoose');
const { Schema } = mongoose;

// Define User schema
const UserSchema = new Schema({
  email: { type: String, required: true, unique: true },
  name: { type: String },
  password: { type: String, required: true },
  role: { type: String, enum: ['student', 'admin'], default: 'student' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Connect to MongoDB
async function connectToDatabase() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error);
    process.exit(1);
  }
}

// List all users
async function listUsers() {
  try {
    // Create User model
    const User = mongoose.models.User || mongoose.model('User', UserSchema);
    
    // Find all users
    const users = await User.find({});
    
    // Log user information
    console.log(`Found ${users.length} users:`);
    users.forEach((user, index) => {
      console.log(`${index + 1}. ID: ${user._id}, Email: ${user.email}, Name: ${user.name || 'N/A'}, Role: ${user.role}`);
    });
    
    return users;
  } catch (error) {
    console.error('Error listing users:', error);
    throw error;
  }
}

// Main function
async function main() {
  try {
    // Connect to the database
    await connectToDatabase();
    
    // List all users
    await listUsers();
    
    // Disconnect from the database
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

// Run the main function
main();
