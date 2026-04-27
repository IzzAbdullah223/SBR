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
    lat: { type: Number, required: true, min: -90, max: 90 },
    lng: { type: Number, required: true, min: -180, max: 180 }
  },

  
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number], 
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


busStopSchema.pre('save', function (next) {
  if (this.position?.lat != null && this.position?.lng != null) {
    this.location = {
      type: 'Point',
      coordinates: [this.position.lng, this.position.lat] 
    };
  }
  next();
});


busStopSchema.index({ location: '2dsphere' });
busStopSchema.index({ routes: 1, status: 1 });


busStopSchema.statics.findNearby = function (lat, lng, radiusKm = 1) {//busStopSchema.statics adds a function to the BusStop model itself  (not individual stops), busStopSchema.methods/ added to each stop not the model (methods)
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