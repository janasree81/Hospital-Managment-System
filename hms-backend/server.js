import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.js';
import appointmentRoutes from './routes/appointments.js';
import complaintRoutes from './routes/complaints.js';
import dotenv from 'dotenv';
import pool from './dbconfig.js';

// Initialize Express App
const app = express();
const PORT = process.env.PORT || 5000;
dotenv.config();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/complaints', complaintRoutes);

// Add this after your routes
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Health check route
app.get('/', async (req, res) => {
  try {
    const [users] = await pool.query('SELECT COUNT(*) as count FROM Users');
    res.json({
      status: 'HMS Backend Server is running!',
      registeredUsers: users[0].count
    });
  } catch (error) {
    res.send('HMS Backend Server is running!');
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

// Example POST request to register a new user
app.post('/api/auth/register', async (req, res) => {
  const { name, email, password, phone, dateOfBirth, gender, address } = req.body;

  try {
    const [result] = await pool.query(
      'INSERT INTO Users (name, email, password, phone, dateOfBirth, gender, address) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [name, email, password, phone, dateOfBirth, gender, address]
    );
    res.json({ message: 'User registered successfully!' });
  } catch (error) {
    res.send('Error registering user!');
  }
});