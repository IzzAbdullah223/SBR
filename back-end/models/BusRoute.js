
import mongoose from 'mongoose';

const busRouteSchema = new mongoose.Schema({
  routeNumber: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  name: {
    type: String,
    required: true
  },
  
  // Route stops with sequence
  stops: [{
    stopId: {
      type: String,
      required: true
    },
    stopSequence: {
      type: Number,
      required: true
    },
    _id: false
  }],
  

  schedule: {
    weekday: {
      firstBus: {
        type: String,
        default: '05:00'
      },
      lastBus: {
        type: String,
        default: '23:30'
      },
      frequency: {
        type: Number,
        default: 15  
      }
    },
    weekend: {
      firstBus: {
        type: String,
        default: '06:00'
      },
      lastBus: {
        type: String,
        default: '23:00'
      },
      frequency: {
        type: Number,
        default: 20
      }
    }
  },
  
 
  stats: {
    duration: {
      type: Number,
      default: 20  // Total route duration in minutes
    },
    distance: {
      type: Number,
      default: 5  // Total route distance in km
    },
    numStops: {
      type: Number,
      default: 0
    }
  },
  

  fare: {
    baseFare: {
      type: Number,
      default: 5  // AED (average - calculated by distance)
    },
    nolFare: {
      type: Number,
      default: 5  // AED (Nol card price - same as base)
    },
    cashFare: {
      type: Number,
      default: 6  // AED (cash costs 1 AED more)
    }
  },
  

  color: {
    type: String,
    default: '#667eea'  // Hex color code
  },
  textColor: {
    type: String,
    default: '#FFFFFF'
  },
  type: {
    type: String,
    default: '3'  // GTFS route_type (3 = bus)
  },
  shapeId: {
  type: String,
  default: null,
},
shapeIdReturn: {
  type: String,
  default: null,
},
  
}, {
  timestamps: true
});


busRouteSchema.index({ 'stops.stopId': 1 });

const BusRoute = mongoose.model('BusRoute', busRouteSchema);

export default BusRoute;