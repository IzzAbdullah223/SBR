import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import User from '../models/User.js';

// local strategy = email + password authentication
passport.use(
  new LocalStrategy(
    { usernameField: 'email' }, // tell passport to look for req.body.email.
    async (email, password, done) => {
      try {
        // find user by email — must use .select('+password') because schema has select: false
        const user = await User.findOne({ email }).select('+password');

        if (!user) {
          return done(null, false, { message: 'Incorrect email' }); //Passport sees false and returns 401(Auth failed.) to the client. loginPost never runs.
        }

        if (!user.isActive) {
          return done(null, false, { message: 'Account is deactivated' });
        }

        const match = await user.comparePassword(password);

        // password does not match
        if (!match) {
          return done(null, false, { message: 'Incorrect password' });
        }

        return done(null, user); // everything passed — passport puts this user on req.user
      } catch (err) {
        return done(err);
      }
    }
  )
);

export default passport;
