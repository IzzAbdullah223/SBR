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
  
  position: {
    lat: {
      type: Number,
      required: true,
      min: -90,
      max: 90
    },
    lng: {
      type: Number,
      required: true,
      min: -180,
      max: 180
    }
  },
  
  routes: [{
    type: String,
    trim: true
  }],
  
 
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
    default: 'Abu Dhabi Department of Transport',
    trim: true
  },
  
  // Original OSM ID (for reference)
  osm_id: {
    type: Number,
    sparse: true
  },
  
  // Additional metadata
  zone: {
    type: String,
    trim: true
  },
  
  status: {
    type: String,
    enum: ['active', 'inactive', 'maintenance'],
    default: 'active'
  }
}, {
  timestamps: true 
});

// Create 2dsphere index for geospatial queries
// This allows efficient "find nearby stops" queries
busStopSchema.index({ position: '2dsphere' });

// Create compound index for common queries
busStopSchema.index({ routes: 1, status: 1 });

// Instance method to calculate distance to another point
busStopSchema.methods.distanceTo = function(lat, lng) {//Instance method: Called on a single bus stop object
  const R = 6371; // Earth's radius in km
  const dLat = (lat - this.position.lat) * Math.PI / 180;
  const dLng = (lng - this.position.lng) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(this.position.lat * Math.PI / 180) * 
            Math.cos(lat * Math.PI / 180) *
            Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c; // Distance in km
};

// Static method to find stops within radius
busStopSchema.statics.findNearby = function(lat, lng, radiusKm = 1) {//Called on the Model itself (BusStop.findNearby()),Returns multiple documents (array of bus stops)

  return this.find({
    position: {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: [lng, lat] // Note: GeoJSON uses [lng, lat]
        },
        $maxDistance: radiusKm * 1000 // Convert km to meters
      }
    },
    status: 'active'
  });
};

const BusStop = mongoose.model('BusStop', busStopSchema);

export default BusStop;