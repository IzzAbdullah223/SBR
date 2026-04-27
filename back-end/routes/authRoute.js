

import express from 'express';
import rateLimit from 'express-rate-limit';
import passport from '../config/passport.js';
import { loginPost, signupPost } from '../controllers/authController.js';

const authRouter = express.Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many attempts. Please try again in 15 minutes.' },
});

authRouter.post('/login',  authLimiter, passport.authenticate('local', { session: false }), loginPost);
authRouter.post('/signup', authLimiter, signupPost);

export default authRouter;
