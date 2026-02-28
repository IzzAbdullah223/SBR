import mongoose from 'mongoose';

const busStopSchema = new mongoose.Schema({
  stopId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },

  name: {
    type: String,
    required: true,
    trim: true
  },

  // Flat position — kept for backward compatibility with all existing code
  position: {
    lat: { type: Number, required: true, min: -90, max: 90 },
    lng: { type: Number, required: true, min: -180, max: 180 }
  },

  // ✅ GeoJSON Point — required for MongoDB $near geospatial queries
  // Auto-populated by pre-save hook below, never set manually
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [longitude, latitude] — GeoJSON order
      required: true
    }
  },

  routes: [{ type: String, trim: true }],

  amenities: [{
    type: String,
    enum: ['shelter', 'seating', 'display', 'lighting', 'accessibility'],
    trim: true
  }],

  type: {
    type: String,
    enum: ['stop', 'station', 'terminal'],
    default: 'stop'
  },

  operator: {
    type: String,
    default: 'Roads and Transport Authority (RTA) Dubai',
    trim: true
  },

  osm_id: { type: Number, sparse: true },
  zone: { type: String, trim: true },

  status: {
    type: String,
    enum: ['active', 'inactive', 'maintenance'],
    default: 'active'
  }

}, { timestamps: true });

// ✅ Auto-sync GeoJSON location from flat position before every save
busStopSchema.pre('save', function (next) {
  if (this.position?.lat != null && this.position?.lng != null) {
    this.location = {
      type: 'Point',
      coordinates: [this.position.lng, this.position.lat] // GeoJSON: [lng, lat]
    };
  }
  next();
});

// ✅ 2dsphere index on GeoJSON location field (NOT on flat position)
busStopSchema.index({ location: '2dsphere' });
busStopSchema.index({ routes: 1, status: 1 });

busStopSchema.methods.distanceTo = function (lat, lng) {
  const R = 6371;
  const dLat = (lat - this.position.lat) * Math.PI / 180;
  const dLng = (lng - this.position.lng) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(this.position.lat * Math.PI / 180) *
            Math.cos(lat * Math.PI / 180) *
            Math.sin(dLng/2) * Math.sin(dLng/2);
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

// ✅ Uses GeoJSON $near — fast indexed query, no full collection scan
busStopSchema.statics.findNearby = function (lat, lng, radiusKm = 1) {
  return this.find({
    location: {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: [lng, lat] // GeoJSON: [lng, lat]
        },
        $maxDistance: radiusKm * 1000
      }
    },
    status: 'active'
  });
};

const BusStop = mongoose.model('BusStop', busStopSchema);

export default BusStop;