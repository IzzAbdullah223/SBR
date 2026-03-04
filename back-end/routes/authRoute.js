import express from 'express';
import passport from 'passport';
import { loginPost } from '../controllers/authController.js';

const authRouter = express.Router();

authRouter.post('/login', passport.authenticate('local', { session: false }), loginPost);

export default authRouter;