import mongoose from 'mongoose';

const savedRouteSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },

  routeName: {
    type: String,
    required: [true, 'Route name is required'],
    trim: true,
    maxlength: [100, 'Route name cannot exceed 100 characters'],
  },

  origin: {
    name: { type: String, required: true, trim: true },
    stopId: { type: String, ref: 'BusStop' },
    position: {
      lat: { type: Number, min: -90,  max: 90  },
      lng: { type: Number, min: -180, max: 180 },
    },
  },

  destination: {
    name: { type: String, required: true, trim: true },
    stopId: { type: String, ref: 'BusStop' },
    position: {
      lat: { type: Number, min: -90,  max: 90  },
      lng: { type: Number, min: -180, max: 180 },
    },
  },

  optimizationPreference: {
    type: String,
    enum: ['fastest', 'cheapest', 'minimal_walking', 'minimal_transfers'],
    default: 'fastest',
  },

  stats: {
    timesUsed:   { type: Number, default: 0 },
    lastUsed:    { type: Date },
    averageTime: { type: Number },
    averageCost: { type: Number },
  },

  notifications: {
    enabled: { type: Boolean, default: false },
    notifyDays: [{ type: Number, min: 0, max: 6 }],
    notifyTime: {
      type: String,
      match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format'],
    },
  },

  isActive: { type: Boolean, default: true },

  tags: [{ type: String, trim: true, lowercase: true }],

  color: {
    type: String,
    default: '#4CAF50',
    match: [/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Invalid color format'],
  },

  notes: {
    type: String,
    maxlength: [200, 'Notes cannot exceed 200 characters'],
    trim: true,
  },

}, { timestamps: true });

// Prevent saving the exact same journey (same coordinates) twice for the same user.
// Using coordinates instead of routeName because:
//   - routeName is auto-generated from LocationIQ display strings which can vary
//     slightly between searches ("Dubai Mall" vs "Dubai Mall, Dubai")
//   - coordinates are exact and unambiguous
savedRouteSchema.index(
  {
    userId: 1,
    'origin.position.lat': 1,
    'origin.position.lng': 1,
    'destination.position.lat': 1,
    'destination.position.lng': 1,
  },
  { unique: true }
);

savedRouteSchema.index({ userId: 1, isActive: 1 });
savedRouteSchema.index({ userId: 1, 'stats.timesUsed': -1 });
savedRouteSchema.index({ userId: 1, 'stats.lastUsed': -1 });

savedRouteSchema.methods.incrementUsage = async function () {
  this.stats.timesUsed += 1;
  this.stats.lastUsed = new Date();
  await this.save();
  return this;
};

savedRouteSchema.methods.updateAverageStats = async function (time, cost) {
  const timesUsed = this.stats.timesUsed;
  this.stats.averageTime = (((this.stats.averageTime || 0) * (timesUsed - 1)) + time) / timesUsed;
  this.stats.averageCost = (((this.stats.averageCost || 0) * (timesUsed - 1)) + cost) / timesUsed;
  await this.save();
  return this;
};

savedRouteSchema.methods.toggleActive = async function () {
  this.isActive = !this.isActive;
  await this.save();
  return this;
};

savedRouteSchema.methods.addTag = async function (tag) {
  if (!this.tags.includes(tag.toLowerCase())) {
    this.tags.push(tag.toLowerCase());
    await this.save();
  }
  return this;
};

savedRouteSchema.methods.removeTag = async function (tag) {
  this.tags = this.tags.filter(t => t !== tag.toLowerCase());
  await this.save();
  return this;
};

savedRouteSchema.statics.findByUserId = function (userId, activeOnly = true) {
  const query = { userId };
  if (activeOnly) query.isActive = true;
  return this.find(query).sort({ createdAt: -1 });
};

savedRouteSchema.statics.findMostUsed = function (userId, limit = 5) {
  return this.find({ userId, isActive: true })
    .sort({ 'stats.timesUsed': -1 })
    .limit(limit);
};

savedRouteSchema.statics.findDueNotifications = function (dayOfWeek, currentTime) {
  return this.find({
    isActive: true,
    'notifications.enabled': true,
    'notifications.notifyDays': dayOfWeek,
    'notifications.notifyTime': currentTime,
  }).populate('userId', 'name email phone');
};

savedRouteSchema.statics.findByTag = function (userId, tag) {
  return this.find({ userId, isActive: true, tags: tag.toLowerCase() });
};

savedRouteSchema.virtual('originDisplay').get(function () { return this.origin.name; });
savedRouteSchema.virtual('destinationDisplay').get(function () { return this.destination.name; });
savedRouteSchema.virtual('routeDisplay').get(function () {
  return `${this.origin.name} → ${this.destination.name}`;
});

savedRouteSchema.set('toJSON', { virtuals: true });
savedRouteSchema.set('toObject', { virtuals: true });

const SavedRoute = mongoose.model('SavedRoute', savedRouteSchema);

export default SavedRoute;