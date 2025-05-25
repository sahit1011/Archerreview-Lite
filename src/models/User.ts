import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';

// Define the interface for the User document
export interface IUser extends Document {
  name: string;
  email: string;
  password?: string; // Optional for OAuth users
  examDate: Date;
  preferences: {
    availableDays: string[];
    studyHoursPerDay: number;
    preferredStudyTime: 'morning' | 'afternoon' | 'evening';
    notifications: boolean;
  };
  role: 'user' | 'admin';
  isEmailVerified: boolean;
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
  comparePassword: (candidatePassword: string) => Promise<boolean>;
}

// Define the User schema
const UserSchema: Schema = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String },
    examDate: { type: Date, required: true },
    preferences: {
      availableDays: { type: [String], default: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'] },
      studyHoursPerDay: { type: Number, default: 2 },
      preferredStudyTime: {
        type: String,
        enum: ['morning', 'afternoon', 'evening'],
        default: 'morning'
      },
      notifications: { type: Boolean, default: true }
    },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    isEmailVerified: { type: Boolean, default: false },
    resetPasswordToken: { type: String },
    resetPasswordExpires: { type: Date },
    lastLogin: { type: Date }
  },
  { timestamps: true }
);

// Hash password before saving
UserSchema.pre('save', async function(next) {
  const user = this as unknown as IUser; // Cast to unknown first

  // Only hash the password if it has been modified (or is new)
  if (!user.isModified('password') || !user.password) return next();

  try {
    // Generate a salt
    const salt = await bcrypt.genSalt(10);

    // Hash the password along with the new salt
    const hash = await bcrypt.hash(user.password, salt);

    // Override the cleartext password with the hashed one
    user.password = hash;
    next();
  } catch (error) {
    next(error as Error);
  }
});

// Method to compare passwords
UserSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  const user = this as unknown as IUser; // Cast to unknown first

  if (!user.password) return false;

  return bcrypt.compare(candidatePassword, user.password);
};

// Create and export the User model
export default mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
