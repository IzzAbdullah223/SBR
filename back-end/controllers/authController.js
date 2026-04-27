import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const loginPost = async (req, res) => {
  try {
    const user = req.user; // set by passport after successful authentication

    await user.updateLastLogin();

    jwt.sign(
      { user: { id: user._id, email: user.email } }, // payload — data stored inside the token
      process.env.JWT_SECRET,
      { expiresIn: '1d' },
      (err, token) => {
        if (err)
          return res.status(500).json({ message: 'Token generation failed' });

        // frontend saves token in localStorage and uses user to show name in navbar
        res.json({ token, user: user.getPublicProfile() });
      }
    );
  } catch (err) {
    res.status(500).json({ message: 'Login failed', error: err.message });
  }
};

// creates a new user account and returns a token immediately

export const signupPost = async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already in use' });
    }

    const user = await User.create({ name, email, password, phone });

    // generate JWT token to be returned to the front-end
    jwt.sign(
      { user: { id: user._id, email: user.email } }, // payload(the data encrypted)
      process.env.JWT_SECRET,
      { expiresIn: '1d' },
      (err, token) => {
        if (err)
          return res.status(500).json({ message: 'Token generation failed' });

        res.status(201).json({ token, user: user.getPublicProfile() });
      }
    );
  } catch (err) {
    // handle mongoose validation errors (email format, required fields etc)
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map((e) => e.message);
      return res.status(400).json({ message: messages[0] });
    }
    res.status(500).json({ message: 'Signup failed', error: err.message });
  }
};
