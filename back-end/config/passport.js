import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import User from '../models/User.js';

// local strategy = email + password authentication
// passport calls this automatically when passport.authenticate('local') middleware runs
passport.use(
  new LocalStrategy(
    { usernameField: 'email' }, // tell passport to use 'email' field instead of default 'username'
    async (email, password, done) => {
      try {
        // find user by email — must use .select('+password') because schema has select: false
        const user = await User.findOne({ email }).select('+password');

        // no user found with that email
        if (!user) {
          return done(null, false, { message: 'Incorrect email' });
        }

        // check if account is active
        if (!user.isActive) {
          return done(null, false, { message: 'Account is deactivated' });
        }

        // compare typed password against hashed password in database
        const match = await user.comparePassword(password);

        // password does not match
        if (!match) {
          return done(null, false, { message: 'Incorrect password' });
        }

        // everything passed — passport puts this user on req.user
        return done(null, user);

      } catch (err) {
        // unexpected error — database error etc
        return done(err);
      }
    }
  )
);

export default passport;