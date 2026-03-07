import express from 'express';
import passport from 'passport';
import { loginPost,signupPost} from '../controllers/authController.js';

const authRouter = express.Router();

authRouter.post('/login', passport.authenticate('local', { session: false }), loginPost);
//passport.authenticate('local', { session: false }) — passport runs the local strategy, checks email and password against the database
//If it fails — passport automatically returns 401 unauthorized, loginPost never runs
//If it passes — passport puts the user on req.user and calls loginPost
//session: false means don't create a session cookie — we're using JWT instead
authRouter.post('/signup', signupPost);


export default authRouter;
