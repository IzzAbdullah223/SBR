import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

// User Schema - Represents app users
const userSchema = new mongoose.Schema({
  // Authentication
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },

  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false // never returned in queries unless explicitly requested with .select('+password')
  },

  // Profile information
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true
  },

  phone: {
    type: String,
    trim: true,
    match: [/^(\+971|00971|0)?[0-9]{9}$/, 'Please enter a valid UAE phone number']
  },

  // User preferences
  preferences: {
    language: {
      type: String,
      enum: ['en', 'ar'],
      default: 'en'
    },
    theme: {
      type: String,
      enum: ['light', 'dark'],
      default: 'light'
    },
    defaultOptimization: {
      type: String,
      enum: ['fastest', 'cheapest', 'minimal_walking'],
      default: 'fastest'
    },
    walkingSpeed: {
      type: Number,
      default: 5,
      min: 3,
      max: 7
    },
    notifications: {
      email: { type: Boolean, default: true },
      push: { type: Boolean, default: true },
      busArrival: { type: Boolean, default: true }
    }
  },

  // Account status
  isActive: { type: Boolean, default: true },
  isVerified: { type: Boolean, default: false },
  lastLogin: { type: Date },
  signupSource: {
    type: String,
    enum: ['web', 'mobile', 'admin'],
    default: 'web'
  }

}, { timestamps: true });

// Indexes for efficient queries
userSchema.index({ email: 1 });
userSchema.index({ isActive: 1 });

// Pre-save hook — hashes password before saving to MongoDB
// using async without next — mixing async + next causes "next is not a function" error
userSchema.pre('save', async function() {
  // only hash if password was actually changed — prevents re-hashing on profile updates
  if (!this.isModified('password')) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// compares plain text password against hashed password in DB
// used by passport local strategy during login
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// updates lastLogin timestamp — called after successful login in authController
userSchema.methods.updateLastLogin = function() {
  this.lastLogin = new Date();
  return this.save();
};

// returns safe user data to send to frontend — no password, no internal flags
userSchema.methods.getPublicProfile = function() {
  return {
    id: this._id,
    name: this.name,
    email: this.email,
    phone: this.phone,
    preferences: this.preferences,
    createdAt: this.createdAt
  };
};

// shortcut for finding only active users
userSchema.statics.findActive = function() {
  return this.find({ isActive: true });
};

// virtual — counts saved routes for this user (future feature)
userSchema.virtual('savedRoutesCount', {
  ref: 'SavedRoute',
  localField: '_id',
  foreignField: 'userId',
  count: true
});

// virtual — links to user's wallet (future feature)
userSchema.virtual('wallet', {
  ref: 'VirtualWallet',
  localField: '_id',
  foreignField: 'userId',
  justOne: true
});

// include virtuals when converting to JSON or object
userSchema.set('toJSON', { virtuals: true });
userSchema.set('toObject', { virtuals: true });

const User = mongoose.model('User', userSchema);

export default User;