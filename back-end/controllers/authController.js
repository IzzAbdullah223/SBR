import jwt from 'jsonwebtoken';
import User from '../models/User.js';

// ── LOGIN ──────────────────────────────────────────────────────────────────
// runs after passport has verified the user (email + password correct)
// passport already put the user on req.user — we just need to generate the token
export const loginPost = async (req, res) => {
  try {
    const user = req.user; // set by passport after successful authentication

    // update last login timestamp
    await user.updateLastLogin();

    // create a JWT token with user info encoded inside
    jwt.sign(
      { user: { id: user._id, email: user.email } }, // payload — data stored inside the token
      process.env.JWT_SECRET,                          // secret key — only our server knows this
      { expiresIn: '7d' },                             // token expires in 7 days
      (err, token) => {
        if (err) return res.status(500).json({ message: 'Token generation failed' });

        // send token AND public user info back to frontend
        // frontend saves token in localStorage and uses user to show name in navbar
        res.json({ token, user: user.getPublicProfile() });
      }
    );
  } catch (err) {
    res.status(500).json({ message: 'Login failed', error: err.message });
  }
};

// ── SIGNUP ─────────────────────────────────────────────────────────────────
// creates a new user account and returns a token immediately
// user is logged in automatically after signup
export const signupPost = async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;

    // check if email is already registered
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already in use' });
    }

    // create new user — password gets hashed automatically by User model pre-save hook
    const user = await User.create({ name, email, password, phone });

    // generate JWT token same as login
    jwt.sign(
      { user: { id: user._id, email: user.email } },
      process.env.JWT_SECRET,
      { expiresIn: '7d' },
      (err, token) => {
        if (err) return res.status(500).json({ message: 'Token generation failed' });

        // return token and public profile — user is now logged in
        res.status(201).json({ token, user: user.getPublicProfile() });
      }
    );
  } catch (err) {
    // handle mongoose validation errors (email format, required fields etc)
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map(e => e.message);
      return res.status(400).json({ message: messages[0] });
    }
    res.status(500).json({ message: 'Signup failed', error: err.message });
  }
};

// ── VERIFY TOKEN ───────────────────────────────────────────────────────────
// middleware that protects routes — must be logged in to continue
// usage: router.get('/protected-route', verifyToken, routeHandler)
export const verifyToken = (req, res, next) => {

  // frontend must send every protected request with this header:
  // Authorization: Bearer eyJhbGc...
  const bearerHeader = req.headers['authorization'];

  // no header at all — not logged in
  if (!bearerHeader) return res.status(403).json({ error: 'No token provided' });

  // split "Bearer eyJhbGc..." into ["Bearer", "eyJhbGc..."] and take the token part
  const token = bearerHeader.split(' ')[1];
  if (!token) return res.status(403).json({ error: 'Invalid token format' });

  // verify the token using the same secret key it was signed with
  // checks: was it created by us? has it expired? was it tampered with?
  jwt.verify(token, process.env.JWT_SECRET, (err, authData) => {

    // token is invalid or expired — block the request
    if (err) return res.status(403).json({ error: 'Invalid or expired token' });

    // token is valid — put the decoded user data on req.user
    // route handler can now use req.user.id to know who is making the request
    req.user = authData.user;

    // continue to the actual route handler
    next();
  });
};