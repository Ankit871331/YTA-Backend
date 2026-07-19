import express from 'express';
import { createServer as createViteServer } from 'vite';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Student, Admin, Event, Gallery, Contact } from './server/models.js';
import { mockEvents, mockGallery, mockStudents } from './server/mockData.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let isDbConnected = false;

// Local mutable copies of mock data for Demo Mode
let currentMockStudents = [...mockStudents];
let currentMockEvents = [...mockEvents];
let currentMockGallery = [...mockGallery];

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware
  app.use(cors());
  app.use(express.json());

  // Database Connection
  const MONGODB_URI = process.env.MONGODB_URI;

  if (MONGODB_URI) {
    mongoose.connect(MONGODB_URI)
      .then(() => {
        console.log('✅ MongoDB Connected');
        isDbConnected = true;
      })
      .catch(err => {
        console.error('❌ MongoDB Connection Error:', err.message);
        console.log('⚠️ Falling back to Demo Mode with mock data.');
        isDbConnected = false;
      });
  } else {
    console.log('⚠️ No MONGODB_URI provided. Running in Demo Mode with mock data.');
    isDbConnected = false;
  }

  // --- AUTH MIDDLEWARE ---
  const authenticateAdmin = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'Unauthorized' });

    // Allow demo token if DB is not connected OR if the token is explicitly 'demo-token'
    if (token === 'demo-token') {
      req.adminId = 'demo-admin';
      return next();
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
      req.adminId = decoded.id;
      next();
    } catch (err) {
      res.status(401).json({ message: 'Invalid token' });
    }
  };

  // --- API ROUTES ---

  // Admin Auth
  app.post('/api/admin/login', async (req, res) => {
    const { username, password } = req.body;
    try {
      if (!isDbConnected) {
        if (username === 'admin' && password === 'admin123') {
          return res.json({ token: 'demo-token', username: 'admin (Demo)' });
        }
        return res.status(400).json({ message: 'Invalid credentials (Demo Mode: use admin/admin123)' });
      }
      const admin = await Admin.findOne({ username });
      if (!admin) return res.status(400).json({ message: 'Admin not found' });

      const isMatch = await bcrypt.compare(password, admin.password);
      if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

      const token = jwt.sign({ id: admin._id }, process.env.JWT_SECRET || 'secret', { expiresIn: '1d' });
      res.json({ token, username: admin.username });
    } catch (err) {
      res.status(500).json({ message: 'Server error' });
    }
  });

  // Student Portal
  app.get('/api/students/portal/:id', async (req, res) => {
    try {
      if (!isDbConnected) {
        const student = currentMockStudents.find(s => s.studentId === req.params.id);
        if (!student) return res.status(404).json({ message: 'Student not found (Demo Mode)' });
        return res.json(student);
      }
      const student = await Student.findOne({ studentId: req.params.id });
      if (!student) return res.status(404).json({ message: 'Student not found' });
      res.json(student);
    } catch (err) {
      res.status(500).json({ message: 'Server error' });
    }
  });

  app.post('/api/students/find-id', async (req, res) => {
    const { name, dob } = req.body;
    try {
      if (!isDbConnected) {
        const student = currentMockStudents.find(s => s.name === name && new Date(s.dob).toISOString().split('T')[0] === new Date(dob).toISOString().split('T')[0]);
        if (!student) return res.status(404).json({ message: 'Student not found (Demo Mode)' });
        return res.json({ studentId: student.studentId });
      }
      const student = await Student.findOne({ name, dob: new Date(dob) });
      if (!student) return res.status(404).json({ message: 'Student not found' });
      res.json({ studentId: student.studentId });
    } catch (err) {
      res.status(500).json({ message: 'Server error' });
    }
  });

  // Events
  app.get('/api/events', async (req, res) => {
    try {
      if (!isDbConnected) return res.json(currentMockEvents);
      const events = await Event.find().sort({ date: -1 });
      res.json(events);
    } catch (err) {
      res.status(500).json({ message: 'Server error' });
    }
  });

  app.post('/api/admin/events', authenticateAdmin, async (req, res) => {
    try {
      if (!isDbConnected) {
        const newEvent = { ...req.body, _id: Date.now().toString(), status: 'upcoming' };
        currentMockEvents.push(newEvent);
        return res.status(201).json(newEvent);
      }
      const newEvent = new Event(req.body);
      await newEvent.save();
      res.status(201).json(newEvent);
    } catch (err) {
      res.status(500).json({ message: 'Server error' });
    }
  });

  // Gallery
  app.get('/api/gallery', async (req, res) => {
    try {
      if (!isDbConnected) return res.json(currentMockGallery);
      const gallery = await Gallery.find().sort({ uploadedAt: -1 });
      res.json(gallery);
    } catch (err) {
      res.status(500).json({ message: 'Server error' });
    }
  });

  // Contact
  app.post('/api/contact', async (req, res) => {
    try {
      const newContact = new Contact(req.body);
      await newContact.save();
      res.status(201).json({ message: 'Message sent successfully' });
    } catch (err) {
      res.status(500).json({ message: 'Server error' });
    }
  });

  // Dashboard Stats
  app.get('/api/admin/stats', authenticateAdmin, async (req, res) => {
    try {
      const dbStatus = isDbConnected ? 'Connected' : 'Demo Mode';
      if (!isDbConnected) {
        return res.json({
          students: currentMockStudents.length,
          events: currentMockEvents.length,
          pendingFees: currentMockStudents.reduce((acc, s) => acc + (s.feesPending || 0), 0),
          dbStatus
        });
      }
      const [studentsCount, eventsCount, students] = await Promise.all([
        Student.countDocuments(),
        Event.countDocuments(),
        Student.find()
      ]);
      const pendingFees = students.reduce((acc, s) => acc + (s.feesPending || 0), 0);
      res.json({ students: studentsCount, events: eventsCount, pendingFees, dbStatus });
    } catch (err) {
      res.status(500).json({ message: 'Server error' });
    }
  });

  // --- ADMIN MANAGEMENT ROUTES ---

  // Students
  app.get('/api/admin/students', authenticateAdmin, async (req, res) => {
    try {
      if (!isDbConnected) return res.json(currentMockStudents);
      const students = await Student.find().sort({ name: 1 });
      res.json(students);
    } catch (err) {
      res.status(500).json({ message: 'Server error' });
    }
  });

  app.post('/api/admin/students', authenticateAdmin, async (req, res) => {
    try {
      if (!isDbConnected) {
        console.log("⚠️ DEMO MODE");
        const newStudent = { ...req.body, _id: Date.now().toString(), studentId: `ETKD-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}` };
        currentMockStudents.push(newStudent);
        return res.status(201).json(newStudent);
      }
      // const newStudent = new Student(req.body);
      // await newStudent.save();


      // const studentId = `ETKD-${new Date().getFullYear()}-${Date.now()}`;

      // const newStudent = new Student({
      //   ...req.body,
      //   studentId,
      // });

// Get the latest student
const lastStudent = await Student.findOne()
  .sort({ studentId: -1 })
  .select("studentId");

// Start numbering from 1
let nextNumber = 1;

if (lastStudent && lastStudent.studentId) {
  const number = parseInt(lastStudent.studentId.replace("YTA", ""));
  nextNumber = number + 1;
}

// Create Student ID
const studentId = `YTA${String(nextNumber).padStart(4, "0")}`;
console.log("✅ MONGODB MODE");

const newStudent = new Student({
  ...req.body,
  studentId,
});

await newStudent.save();

res.status(201).json(newStudent);



      // await newStudent.save();
      // res.status(201).json(newStudent);



    } catch (err) {
      console.error("========== SAVE ERROR ==========");
      console.error(err);
      console.error("Message:", err.message);

      res.status(500).json({
        message: err.message,
        error: err
      });
    }

  });

  app.delete('/api/admin/students/:id', authenticateAdmin, async (req, res) => {
    try {
      if (!isDbConnected) {
        const index = currentMockStudents.findIndex(s => s._id === req.params.id);
        if (index !== -1) {
          currentMockStudents.splice(index, 1);
          return res.json({ message: 'Student deleted (Demo Mode)' });
        }
        return res.status(404).json({ message: 'Student not found in Demo Mode' });
      }
      const deleted = await Student.findByIdAndDelete(req.params.id);
      if (!deleted) return res.status(404).json({ message: 'Student not found' });
      res.json({ message: 'Student deleted' });
    } catch (err) {
      console.error('Delete Student Error:', err);
      res.status(500).json({ message: 'Server error' });
    }
  });

  app.put('/api/admin/students/:id', authenticateAdmin, async (req, res) => {
    try {
      if (!isDbConnected) {
        const index = currentMockStudents.findIndex(s => s._id === req.params.id);
        if (index !== -1) {
          currentMockStudents[index] = { ...currentMockStudents[index], ...req.body };
          return res.json(currentMockStudents[index]);
        }
        return res.status(404).json({ message: 'Student not found in Demo Mode' });
      }
      const updatedStudent = await Student.findByIdAndUpdate(req.params.id, req.body, { new: true });
      res.json(updatedStudent);
    } catch (err) {
      res.status(500).json({ message: 'Server error' });
    }
  });

  // Events Management
  app.get('/api/admin/events', authenticateAdmin, async (req, res) => {
    try {
      if (!isDbConnected) return res.json(currentMockEvents);
      const events = await Event.find().sort({ date: -1 });
      res.json(events);
    } catch (err) {
      res.status(500).json({ message: 'Server error' });
    }
  });

  app.delete('/api/admin/events/:id', authenticateAdmin, async (req, res) => {
    try {
      if (!isDbConnected) {
        const index = currentMockEvents.findIndex(e => e._id === req.params.id);
        if (index !== -1) {
          currentMockEvents.splice(index, 1);
          return res.json({ message: 'Event deleted (Demo Mode)' });
        }
        return res.status(404).json({ message: 'Event not found in Demo Mode' });
      }
      const deleted = await Event.findByIdAndDelete(req.params.id);
      if (!deleted) return res.status(404).json({ message: 'Event not found' });
      res.json({ message: 'Event deleted' });
    } catch (err) {
      console.error('Delete Event Error:', err);
      res.status(500).json({ message: 'Server error' });
    }
  });

  app.put('/api/admin/events/:id', authenticateAdmin, async (req, res) => {
    try {
      if (!isDbConnected) {
        const index = currentMockEvents.findIndex(e => e._id === req.params.id);
        if (index !== -1) {
          currentMockEvents[index] = { ...currentMockEvents[index], ...req.body };
          return res.json(currentMockEvents[index]);
        }
        return res.status(404).json({ message: 'Event not found in Demo Mode' });
      }
      const updatedEvent = await Event.findByIdAndUpdate(req.params.id, req.body, { new: true });
      res.json(updatedEvent);
    } catch (err) {
      res.status(500).json({ message: 'Server error' });
    }
  });

  // Gallery Management
  app.get('/api/admin/gallery', authenticateAdmin, async (req, res) => {
    try {
      if (!isDbConnected) return res.json(currentMockGallery);
      const gallery = await Gallery.find().sort({ uploadedAt: -1 });
      res.json(gallery);
    } catch (err) {
      res.status(500).json({ message: 'Server error' });
    }
  });

  app.post('/api/admin/gallery', authenticateAdmin, async (req, res) => {
    try {
      if (!isDbConnected) {
        const newImage = { ...req.body, _id: Date.now().toString(), uploadedAt: new Date() };
        currentMockGallery.push(newImage);
        return res.status(201).json(newImage);
      }
      const newImage = new Gallery(req.body);
      await newImage.save();
      res.status(201).json(newImage);
    } catch (err) {
      res.status(500).json({ message: 'Server error' });
    }
  });

  app.delete('/api/admin/gallery/:id', authenticateAdmin, async (req, res) => {
    try {
      if (!isDbConnected) {
        const index = currentMockGallery.findIndex(g => g._id === req.params.id);
        if (index !== -1) {
          currentMockGallery.splice(index, 1);
          return res.json({ message: 'Image deleted (Demo Mode)' });
        }
        return res.status(404).json({ message: 'Image not found in Demo Mode' });
      }
      const deleted = await Gallery.findByIdAndDelete(req.params.id);
      if (!deleted) return res.status(404).json({ message: 'Image not found' });
      res.json({ message: 'Image deleted' });
    } catch (err) {
      console.error('Delete Gallery Error:', err);
      res.status(500).json({ message: 'Server error' });
    }
  });

  app.put('/api/admin/gallery/:id', authenticateAdmin, async (req, res) => {
    try {
      if (!isDbConnected) {
        const index = currentMockGallery.findIndex(g => g._id === req.params.id);
        if (index !== -1) {
          currentMockGallery[index] = { ...currentMockGallery[index], ...req.body };
          return res.json(currentMockGallery[index]);
        }
        return res.status(404).json({ message: 'Image not found in Demo Mode' });
      }
      const updatedImage = await Gallery.findByIdAndUpdate(req.params.id, req.body, { new: true });
      res.json(updatedImage);
    } catch (err) {
      res.status(500).json({ message: 'Server error' });
    }
  });

  // Seed Admin (Run once or if no admins exist)
  app.post('/api/admin/seed', async (req, res) => {
    try {
      const adminExists = await Admin.findOne({ username: 'admin' });
      if (adminExists) return res.status(400).json({ message: 'Admin already exists' });

      const hashedPassword = await bcrypt.hash('admin123', 10);
      const newAdmin = new Admin({ username: 'admin', password: hashedPassword });
      await newAdmin.save();
      res.status(201).json({ message: 'Admin seeded successfully' });
    } catch (err) {
      res.status(500).json({ message: 'Server error' });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
  });
}

startServer();