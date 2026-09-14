import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide a name.'],
  },
  email: {
    type: String,
    required: [true, 'Please provide an email.'],
    unique: true,
  },
  passwordHash: {
    type: String,
    required: [true, 'Please provide a password.'],
  },
  role: {
    type: String,
    enum: ['head', 'employee'],
    default: 'employee',
  },
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true,
  },
  avatar: {
    type: String,
    default: '',
  },
  branch: {
    type: String,
    default: 'General',
  },
  specialization: {
    type: String,
    default: 'General',
  },
  workStatus: {
    type: String,
    enum: ['free', 'working', 'offline'],
    default: 'offline',
  },
  performanceScore: {
    type: Number,
    default: 100,
  },
  isApproved: {
    type: Boolean,
    default: true, // Auto-approve by default to not break existing flow, admins can change this
  },
  createdAt: {
    type: Date,
    default: Date.now,
  }
});

UserSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.passwordHash);
};

export default mongoose.models.User || mongoose.model('User', UserSchema);
