import mongoose from 'mongoose';

// ─────────────────────────────────────────────
// Student Model
// Stores student info: belt rank, marks, attendance, fee status, progress
// ─────────────────────────────────────────────
const studentSchema = new mongoose.Schema(
  {
    studentId: { type: String, unique: true, sparse: true, trim: true },
    name: { type: String, required: true, trim: true },
    dob: { type: Date },
    joiningDate: { type: Date, default: Date.now },
    beltRank: { type: String, default: 'White-1', trim: true },
    marks: { type: Number, default: 0, min: 0, max: 100 },
    attendance: { type: Number, default: 0, min: 0, max: 100 },
    feesPending: { type: Number, default: 0, min: 0 },
    phone: { type: String, trim: true },
    email: { type: String, trim: true, lowercase: true },
    progress: [
      {
        title: { type: String, required: true, trim: true },
        date: { type: Date, required: true },
        status: {
          type: String,
          enum: ['Completed', 'Upcoming', 'In Progress'],
          default: 'Completed',
        },
      },
    ],
  },
  { timestamps: true }
);

export const Student = mongoose.model('Student', studentSchema);

// ─────────────────────────────────────────────
// Admin Model
// For administrative access
// ─────────────────────────────────────────────
const adminSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true, trim: true },
    password: { type: String, required: true },
  },
  { timestamps: true }
);

export const Admin = mongoose.model('Admin', adminSchema, 'admin');

// ─────────────────────────────────────────────
// Event Model
// Academy events and tournaments
// ─────────────────────────────────────────────
const eventSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    date: { type: Date, required: true },
    image: { type: String },
    status: {
      type: String,
      enum: ['upcoming', 'completed'],
      default: 'upcoming',
    },
  },
  { timestamps: true }
);

export const Event = mongoose.model('Event', eventSchema);

// ─────────────────────────────────────────────
// Gallery Model
// Images for the academy gallery
// ─────────────────────────────────────────────
const gallerySchema = new mongoose.Schema(
  {
    image: { type: String, required: true },
    uploadedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export const Gallery = mongoose.model('Gallery', gallerySchema);

// ─────────────────────────────────────────────
// Contact Model
// Contact form submissions
// ─────────────────────────────────────────────
const contactSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    message: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export const Contact = mongoose.model('Contact', contactSchema);