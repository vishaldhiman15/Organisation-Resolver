import mongoose from 'mongoose';

const OrganizationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide a name for this organization.'],
    maxlength: [60, 'Name cannot be more than 60 characters'],
  },
  tenantSlug: {
    type: String,
    required: [true, 'Please provide a unique slug for this organization.'],
    unique: true,
    maxlength: [40, 'Slug cannot be more than 40 characters'],
  },
  companyLogo: {
    type: String,
    default: '',
  },
  location: {
    latitude: { type: Number, default: null },
    longitude: { type: Number, default: null },
    radius: { type: Number, default: 200 } // in meters
  },
  branches: {
    type: [String],
    default: ['General'],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  }
});

export default mongoose.models.Organization || mongoose.model('Organization', OrganizationSchema);
