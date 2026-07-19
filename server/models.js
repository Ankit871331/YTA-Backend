import mongoose from 'mongoose';

// Student Model
// Stores student information including belt rank, marks, and fee status
const studentSchema = new mongoose.Schema({
  studentId: { type: String,  unique: true },
  name: { type: String, required: true },
  dob: { type: Date, required: true },
  joiningDate: { type: Date, default: Date.now },
  beltRank: { type: String, default: 'White' },
  marks: { type: Number, default: 0 },
  feesPending: { type: Number, default: 0 },
  phone: { type: String, required: true },
  email: { type: String, required: true },
}, { timestamps: true });

export const Student = mongoose.model('Student', studentSchema);

// Admin Model
// For administrative access
const adminSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
}, { timestamps: true });

export const Admin = mongoose.model('Admin', adminSchema, 'admin');

// Event Model
// Academy events and tournamentsadminSchema 
const eventSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  date: { type: Date, required: true },
  image: { type: String },
  status: { type: String, enum: ['upcoming', 'completed'], default: 'upcoming' },
}, { timestamps: true });

export const Event = mongoose.model('Event', eventSchema);

// Gallery Model
// Images for the academy gallery
const gallerySchema = new mongoose.Schema({
  image: { type: String, required: true },
  uploadedAt: { type: Date, default: Date.now },
}, { timestamps: true });

export const Gallery = mongoose.model('Gallery', gallerySchema);

// Contact Model
// Contact form submissions
const contactSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  message: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
}, { timestamps: true });

export const Contact = mongoose.model('Contact', contactSchema); 

