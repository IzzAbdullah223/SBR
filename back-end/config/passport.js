import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import User from '../models/User.js'; // adjust path if needed

passport.use(
  new LocalStrategy({ usernameField: 'email' }, async (email, password, done) => {
    try {
      const user = await User.findOne({ email }).select('+password'); // +password required because schema has select:false

      if (!user) {
        return done(null, false, { message: 'Incorrect email' });
      }

      const match = await user.comparePassword(password); // using your schema's instance method

      if (!match) {
        return done(null, false, { message: 'Incorrect password' });
      }

      return done(null, user);
    } catch (err) {
      return done(err);
    }
  })
);

export default passport;