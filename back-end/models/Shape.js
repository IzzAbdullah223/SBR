/**
 * SHAPE MODEL
 * Stores GPS coordinate path for each bus route shape from GTFS shapes.txt
 * One document per shape_id — contains all ordered coordinate points
 */

import mongoose from 'mongoose';

const shapeSchema = new mongoose.Schema({
  shapeId: {
    type: String,
    required: true,
    unique: true,   // ✅ unique:true already creates an index — no need for schema.index()
  },

  // Array of {lat, lng} pairs ordered by shape_pt_sequence
  coordinates: [{
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
    _id: false,
  }],

  pointCount: {
    type: Number,
    default: 0,
  },

  totalDistance: {
    type: Number,
    default: 0,
  },

}, { timestamps: true });


const Shape = mongoose.model('Shape', shapeSchema);

export default Shape;




































































































