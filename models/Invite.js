import mongoose from 'mongoose';

const InviteSchema = new mongoose.Schema({
  token: {
    type: String,
    required: true,
    unique: true,
  },
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  role: {
    type: String,
    enum: ['employee'],
    default: 'employee',
  },
  usedAt: {
    type: Date,
    default: null,
  },
  usedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  expiresAt: {
    type: Date,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Virtual: is this invite still valid?
InviteSchema.virtual('isValid').get(function () {
  return !this.usedAt && this.expiresAt > new Date();
});

export default mongoose.models.Invite || mongoose.model('Invite', InviteSchema);
