import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

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
    select: false // Don't return password by default in queries
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
    // Default route optimization preference
    defaultOptimization: {
      type: String,
      enum: ['fastest', 'cheapest', 'minimal_walking'],
      default: 'fastest'
    },
    // Walking speed preference (km/h)
    walkingSpeed: {
      type: Number,
      default: 5,
      min: 3,
      max: 7
    },
    // Notifications
    notifications: {
      email: {
        type: Boolean,
        default: true
      },
      push: {
        type: Boolean,
        default: true
      },
      busArrival: {
        type: Boolean,
        default: true
      }
    }
  },
  
  // Account status
  isActive: {
    type: Boolean,
    default: true
  },
  
  isVerified: {
    type: Boolean,
    default: false
  },
  
  // Last login tracking
  lastLogin: {
    type: Date
  },
  
  // Account creation source
  signupSource: {
    type: String,
    enum: ['web', 'mobile', 'admin'],
    default: 'web'
  }
}, {
  timestamps: true // Adds createdAt and updatedAt
});

// Index for efficient queries
userSchema.index({ email: 1 });
userSchema.index({ isActive: 1 });

// Pre-save middleware to hash password
userSchema.pre('save', async function(next) {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified('password')) {
    return next();
  }
  
  try {
    // Generate salt and hash password
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Instance method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw new Error('Password comparison failed');
  }
};

// Instance method to update last login
userSchema.methods.updateLastLogin = function() {
  this.lastLogin = new Date();
  return this.save();
};

// Instance method to get public profile (without sensitive data)
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

// Static method to find active users
userSchema.statics.findActive = function() {
  return this.find({ isActive: true });
};

// Virtual for getting user's saved routes count (will populate later)
userSchema.virtual('savedRoutesCount', {
  ref: 'SavedRoute',
  localField: '_id',
  foreignField: 'userId',
  count: true
});

// Virtual for getting user's wallet (will populate later)
userSchema.virtual('wallet', {
  ref: 'VirtualWallet',
  localField: '_id',
  foreignField: 'userId',
  justOne: true
});

// Ensure virtuals are included in JSON output
userSchema.set('toJSON', { virtuals: true });
userSchema.set('toObject', { virtuals: true });

const User = mongoose.model('User', userSchema);

export default User;