import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email'],
  },

  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false,
  },

  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
  },

  phone: {
    type: String,
    trim: true,
    match: [/^(\+971|00971|0)?[0-9]{9}$/, 'Please enter a valid UAE phone number'],
  },

  preferences: {
    language: {
      type: String,
      enum: ['en', 'ar'],
      default: 'en',
    },
    theme: {
      type: String,
      enum: ['light', 'dark'],
      default: 'light',
    },
    walkingSpeed: {
      type: Number,
      default: 5,
      min: 3,
      max: 7,
    },
    notifications: {
      email:      { type: Boolean, default: true },
      push:       { type: Boolean, default: true },
      busArrival: { type: Boolean, default: true },
    },
    optimizationMode: {
      type: String,
      enum: ['fastest', 'cheapest', 'less_walking', 'fewest_transfers'],
      default: 'fastest',
    },
  },

  isActive:     { type: Boolean, default: true },
  isVerified:   { type: Boolean, default: false },
  lastLogin:    { type: Date },
  signupSource: {
    type: String,
    enum: ['web', 'mobile', 'admin'],
    default: 'web',
  },

}, { timestamps: true });

userSchema.index({ isActive: 1 });

userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.updateLastLogin = function () {
  this.lastLogin = new Date();
  return this.save();
};

userSchema.methods.getPublicProfile = function () {
  return {
    id: this._id,
    name: this.name,
    email: this.email,
    phone: this.phone,
    preferences: this.preferences,
    createdAt: this.createdAt,
  };
};

userSchema.statics.findActive = function () {
  return this.find({ isActive: true });
};

userSchema.virtual('savedRoutesCount', {
  ref: 'SavedRoute',
  localField: '_id',
  foreignField: 'userId',
  count: true,
});

userSchema.virtual('wallet', {
  ref: 'VirtualWallet',
  localField: '_id',
  foreignField: 'userId',
  justOne: true,
});

userSchema.set('toJSON', { virtuals: true });
userSchema.set('toObject', { virtuals: true });

const User = mongoose.model('User', userSchema);

export default User;