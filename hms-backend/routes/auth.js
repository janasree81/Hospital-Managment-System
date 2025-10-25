// This file contains the actual backend logic for handling authentication API requests.
import express from 'express';
import bcrypt from 'bcryptjs';
import pool from '../dbconfig.js'; // Import the MySQL connection pool

const router = express.Router();

/**
 * @route   POST /api/auth/register
 * @desc    Registers a new patient user. Hashes the password and inserts into the 'Users' table.
 * @access  Public
 */
router.post('/register', async (req, res) => {
  const { name, email, password, phone, dateOfBirth, gender, address } = req.body;
  
  if (!name || !email || !password || !phone || !dateOfBirth || !gender || !address) {
    return res.status(400).json({ msg: 'Please enter all fields.' });
  }

  try {
    // 1. Check if user already exists
    const [existingUsers] = await pool.query('SELECT * FROM Users WHERE email = ?', [email]);
    if (existingUsers.length > 0) {
      return res.status(400).json({ msg: 'User with this email already exists.' });
    }

    // 2. Hash the password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    
    // 3. Insert the new user into the database
    // Assuming you have a 'Users' table with these columns.
    const sql = `
      INSERT INTO Users (name, email, password, phone, role, avatarUrl, dateOfBirth, gender, address) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const role = 'Patient';
    const avatarUrl = `https://picsum.photos/seed/${name}/100`;
    
    const [result] = await pool.query(sql, [name, email, passwordHash, phone, role, avatarUrl, dateOfBirth, gender, address]);
    
    // 4. Send back the newly created user data (without password)
    const newUser = {
      id: result.insertId.toString(),
      name,
      email,
      phone,
      dateOfBirth,
      gender,
      address,
      role,
      avatarUrl
    };

    console.log(`Successfully registered user and stored in MySQL: ${email}`);
    res.status(201).json(newUser);

  } catch (err) {
    console.error('Registration error:', err.message);
    res.status(500).send('Server error');
  }
});


/**
 * @route   POST /api/auth/login
 * @desc    Authenticates a user and returns their data.
 * @access  Public
 */
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ msg: 'Please provide email and password.' });
    }

    try {
        // 1. Find the user by email
        const [users] = await pool.query('SELECT * FROM Users WHERE email = ?', [email]);
        if (users.length === 0) {
            return res.status(400).json({ msg: 'Invalid credentials.' });
        }
        const user = users[0];

        // 2. Compare the provided password with the stored hash
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ msg: 'Invalid credentials.' });
        }

        // 3. Login successful. Send back user data (excluding the password hash)
        // In a real app, you would also generate and send a JSON Web Token (JWT) here.
        const userResponse = {
            id: user.id.toString(),
            name: user.name,
            email: user.email,
            phone: user.phone,
            role: user.role,
            avatarUrl: user.avatarUrl,
            dateOfBirth: user.dateOfBirth,
            gender: user.gender,
            address: user.address,
        };

        console.log(`Successfully logged in user from MySQL: ${email}`);
        res.json({
            // token: "your_jwt_token_here",
            user: userResponse
        });

    } catch (err) {
        console.error('Login error:', err.message);
        res.status(500).send('Server error');
    }
});


export default router;