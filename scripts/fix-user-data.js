// Script to fix user data with invalid preferredStudyTime
const mongoose = require('mongoose');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/dynamic-calendar')
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// Define a simplified User schema for this script
const UserSchema = new mongoose.Schema({
  email: String,
  preferences: {
    preferredStudyTime: String
  }
});

const User = mongoose.model('User', UserSchema);

async function fixUserData() {
  try {
    // Find the user with email n1@gmail.com
    const user = await User.findOne({ email: 'n1@gmail.com' });

    if (!user) {
      console.log('User not found');
      return;
    }

    console.log('Current user data:', user);

    // Update the preferredStudyTime to a valid value
    user.preferences.preferredStudyTime = 'evening';

    // Save the updated user
    await user.save();

    console.log('User updated successfully');
    console.log('New user data:', await User.findOne({ email: 'n1@gmail.com' }));
  } catch (error) {
    console.error('Error updating user:', error);
  } finally {
    // Close the MongoDB connection
    mongoose.connection.close();
  }
}

// Run the function
fixUserData();
