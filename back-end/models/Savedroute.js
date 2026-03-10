import mongoose from 'mongoose';

// Saved Route Schema - User's favorite/frequently used routes
const savedRouteSchema = new mongoose.Schema({
  // Link to user
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  // User-given name for the route
  routeName: {
    type: String,
    required: [true, 'Route name is required'],
    trim: true,
    maxlength: [100, 'Route name cannot exceed 100 characters']
  },
  
  // Origin location
  origin: {
    name: { type: String, required: true, trim: true },
    stopId: { type: String, ref: 'BusStop' },
    position: {
      lat: { type: Number, min: -90, max: 90 },
      lng: { type: Number, min: -180, max: 180 }
    }
  },
  
  // Destination location
  destination: {
    name: { type: String, required: true, trim: true },
    stopId: { type: String, ref: 'BusStop' },
    position: {
      lat: { type: Number, min: -90, max: 90 },
      lng: { type: Number, min: -180, max: 180 }
    }
  },

  // ── Display fields stored at save-time ─────────────────────────────────────
  // These let the saved routes panel show rich info without re-running TOPSIS

  // Route number shown on the coloured badge (e.g. "81", "F55")
  routeNumber: { type: String, trim: true, default: null },

  // Hex colour of the route badge
  routeColor: {
    type: String,
    default: '#667eea',
    match: [/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Invalid color format'],
  },

  // 'direct' or 'transfer'
  journeyType: {
    type: String,
    enum: ['direct', 'transfer', null],
    default: null,
  },

  // Estimated travel time in minutes when the route was saved
  estimatedTime: { type: Number, default: null },

  // Fare in AED when the route was saved
  fare: { type: Number, default: null },

  // Preferred optimization method
  optimizationPreference: {
    type: String,
    enum: ['fastest', 'cheapest', 'minimal_walking', 'minimal_transfers'],
    default: 'fastest'
  },
  
  // Usage statistics
  stats: {
    timesUsed: { type: Number, default: 0 },
    lastUsed: { type: Date },
    averageTime: { type: Number },
    averageCost: { type: Number }
  },
  
  // Notification preferences for this route
  notifications: {
    enabled: { type: Boolean, default: false },
    notifyDays: [{ type: Number, min: 0, max: 6 }],
    notifyTime: {
      type: String,
      match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format']
    }
  },
  
  isActive: { type: Boolean, default: true },
  tags: [{ type: String, trim: true, lowercase: true }],
  color: {
    type: String,
    default: '#4CAF50',
    match: [/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Invalid color format']
  },
  notes: { type: String, maxlength: [200, 'Notes cannot exceed 200 characters'], trim: true }
}, {
  timestamps: true
});

// Compound indexes for efficient queries
savedRouteSchema.index({ userId: 1, isActive: 1 });
savedRouteSchema.index({ userId: 1, 'stats.timesUsed': -1 });
savedRouteSchema.index({ userId: 1, 'stats.lastUsed': -1 });

// Prevent duplicate route names for same user
savedRouteSchema.index({ userId: 1, routeName: 1 }, { unique: true });

// Instance method to increment usage
savedRouteSchema.methods.incrementUsage = async function() {
  this.stats.timesUsed += 1;
  this.stats.lastUsed = new Date();
  await this.save();
  return this;
};

// Instance method to update average stats
savedRouteSchema.methods.updateAverageStats = async function(time, cost) {
  const currentAvgTime = this.stats.averageTime || 0;
  const currentAvgCost = this.stats.averageCost || 0;
  const timesUsed = this.stats.timesUsed;
  this.stats.averageTime = ((currentAvgTime * (timesUsed - 1)) + time) / timesUsed;
  this.stats.averageCost = ((currentAvgCost * (timesUsed - 1)) + cost) / timesUsed;
  await this.save();
  return this;
};

// Instance method to toggle active status
savedRouteSchema.methods.toggleActive = async function() {
  this.isActive = !this.isActive;
  await this.save();
  return this;
};

// Instance method to add tag
savedRouteSchema.methods.addTag = async function(tag) {
  if (!this.tags.includes(tag.toLowerCase())) {
    this.tags.push(tag.toLowerCase());
    await this.save();
  }
  return this;
};

// Instance method to remove tag
savedRouteSchema.methods.removeTag = async function(tag) {
  this.tags = this.tags.filter(t => t !== tag.toLowerCase());
  await this.save();
  return this;
};

// Static method to find user's routes
savedRouteSchema.statics.findByUserId = function(userId, activeOnly = true) {
  const query = { userId };
  if (activeOnly) query.isActive = true;
  return this.find(query).sort({ 'stats.lastUsed': -1 });
};

// Static method to find most used routes for a user
savedRouteSchema.statics.findMostUsed = function(userId, limit = 5) {
  return this.find({ userId, isActive: true }).sort({ 'stats.timesUsed': -1 }).limit(limit);
};

// Static method to find routes with notifications for a specific day and time
savedRouteSchema.statics.findDueNotifications = function(dayOfWeek, currentTime) {
  return this.find({
    isActive: true,
    'notifications.enabled': true,
    'notifications.notifyDays': dayOfWeek,
    'notifications.notifyTime': currentTime
  }).populate('userId', 'name email phone');
};

// Static method to find routes by tag
savedRouteSchema.statics.findByTag = function(userId, tag) {
  return this.find({ userId, isActive: true, tags: tag.toLowerCase() });
};

// Virtual for formatted origin
savedRouteSchema.virtual('originDisplay').get(function() {
  return this.origin.name;
});

// Virtual for formatted destination
savedRouteSchema.virtual('destinationDisplay').get(function() {
  return this.destination.name;
});

// Virtual for full route display
savedRouteSchema.virtual('routeDisplay').get(function() {
  return `${this.origin.name} → ${this.destination.name}`;
});

// Ensure virtuals are included in JSON output
savedRouteSchema.set('toJSON', { virtuals: true });
savedRouteSchema.set('toObject', { virtuals: true });

const SavedRoute = mongoose.model('SavedRoute', savedRouteSchema);

export default SavedRoute;