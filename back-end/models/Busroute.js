import mongoose from 'mongoose';

// Bus Route Schema - Represents complete bus routes with stops, schedules, and fares
const busRouteSchema = new mongoose.Schema({
  // Route identifier (e.g., "Route 5", "Route 7")
  routeNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  
  // Route name/description (e.g., "Marina Mall - Airport")
  name: {
    type: String,
    required: true,
    trim: true
  },
  
  // Full route description
  description: {
    type: String,
    trim: true
  },
  
  // Ordered list of stops
  stops: [{
    stopId: {
      type: String,
      required: true,
      ref: 'BusStop' // Reference to BusStop model
    },
    order: {
      type: Number,
      required: true
    },
    // Estimated time from first stop (in minutes)
    timeFromStart: {
      type: Number,
      default: 0
    }
  }],
  
  // Schedule information
  schedule: {
    // Weekday schedule (Monday-Thursday)
    weekday: {
      firstBus: {
        type: String, // Format: "06:00"
        default: "06:00"
      },
      lastBus: {
        type: String,
        default: "23:00"
      },
      frequency: {
        type: Number, // Minutes between buses
        default: 15
      }
    },
    // Weekend schedule (Friday-Saturday)
    weekend: {
      firstBus: {
        type: String,
        default: "07:00"
      },
      lastBus: {
        type: String,
        default: "23:00"
      },
      frequency: {
        type: Number,
        default: 20
      }
    }
  },
  
  // Fare information
  fare: {
    baseFare: {
      type: Number, // Base fare in AED
      default: 2,
      min: 0
    },
    // Zones this route covers
    zones: [{
      type: String,
      trim: true
    }],
    // Additional fare per zone
    perZoneFare: {
      type: Number,
      default: 1,
      min: 0
    },
    maxFare: {
      type: Number,
      default: 5,
      min: 0
    }
  },
  
  // Route statistics
  stats: {
    // Total route length in km
    distance: {
      type: Number,
      default: 0
    },
    // Average trip duration in minutes
    duration: {
      type: Number,
      default: 0
    },
    // Number of stops
    totalStops: {
      type: Number,
      default: 0
    }
  },
  
  // Operating information
  operator: {
    type: String,
    default: 'Abu Dhabi Department of Transport',
    trim: true
  },
  
  // Route type
  type: {
    type: String,
    enum: ['express', 'local', 'shuttle', 'intercity'],
    default: 'local'
  },
  
  // Route status
  status: {
    type: String,
    enum: ['active', 'inactive', 'seasonal', 'maintenance'],
    default: 'active'
  },
  
  // Route color (for map display)
  color: {
    type: String,
    default: '#FF6B35' // Orange
  }
}, {
  timestamps: true
});

// Index for efficient queries
busRouteSchema.index({ routeNumber: 1, status: 1 });
busRouteSchema.index({ 'stops.stopId': 1 });

// Pre-save middleware to calculate stats
busRouteSchema.pre('save', function(next) {
  if (this.stops && this.stops.length > 0) {
    this.stats.totalStops = this.stops.length;
    
    // Calculate total duration (time from start to last stop)
    const lastStop = this.stops[this.stops.length - 1];
    if (lastStop && lastStop.timeFromStart) {
      this.stats.duration = lastStop.timeFromStart;
    }
  }
  next();
});

// Instance method to check if route serves a stop
busRouteSchema.methods.servesStop = function(stopId) {
  return this.stops.some(stop => stop.stopId === stopId);
};

// Instance method to get stop order
busRouteSchema.methods.getStopOrder = function(stopId) {
  const stop = this.stops.find(s => s.stopId === stopId);
  return stop ? stop.order : -1;
};

// Instance method to calculate fare between two stops
busRouteSchema.methods.calculateFare = function(fromStopId, toStopId) {
  const fromStop = this.stops.find(s => s.stopId === fromStopId);
  const toStop = this.stops.find(s => s.stopId === toStopId);
  
  if (!fromStop || !toStop) {
    return this.fare.maxFare; // Default to max fare if stops not found
  }
  
  // Calculate number of stops traveled
  const stopsTraveled = Math.abs(toStop.order - fromStop.order);
  
  // Simple fare calculation: base + additional per stop
  const calculatedFare = this.fare.baseFare + (Math.floor(stopsTraveled / 3) * this.fare.perZoneFare);
  
  return Math.min(calculatedFare, this.fare.maxFare);
};

// Static method to find routes connecting two stops
busRouteSchema.statics.findConnectingRoutes = function(stopId1, stopId2) {
  return this.find({
    'stops.stopId': { $all: [stopId1, stopId2] },
    status: 'active'
  });
};

// Static method to find routes by stop
busRouteSchema.statics.findByStop = function(stopId) {
  return this.find({
    'stops.stopId': stopId,
    status: 'active'
  });
};

const BusRoute = mongoose.model('BusRoute', busRouteSchema);

export default BusRoute;