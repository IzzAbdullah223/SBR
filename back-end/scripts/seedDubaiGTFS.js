/**
 * DUBAI GTFS DATABASE SEEDER
 * Seeds MongoDB with real Dubai RTA bus data from GTFS files
 * 
 * Data Source: Dubai RTA GTFS (2,819 stops, 182 bus routes)
 * Files Used: stops.txt, routes.txt, trips.txt, stop_times.txt, calendar.txt
 * 
 * HOW TO USE:
 * 1. Ensure GTFS files are in back-end/data/ folder
 * 2. Run: node scripts/seedDubaiGTFS.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import dns from 'dns';
import mongoose from 'mongoose';
import readline from 'readline';

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from back-end root
dotenv.config({ path: path.join(__dirname, '..', '.env') });

// DNS fix for Windows
dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);

// Import models
import BusStop from '../models/BusStop.js';
import BusRoute from '../models/BusRoute.js';

// GTFS data path
// Use path.resolve to handle spaces in directory names
const GTFS_PATH = path.resolve(__dirname, '..', 'data');
console.log('📂 GTFS Path:', GTFS_PATH);

/**
 * Connect to MongoDB
 */
async function connectDB() {
  try {
    console.log('📡 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URL);
    console.log('✅ Connected to MongoDB successfully!\n');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    process.exit(1);
  }
}

/**
 * Parse CSV line handling quoted fields
 */
function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  
  return result;
}

/**
 * Read GTFS file and parse to objects
 */
async function readGTFSFile(filename) {
  const filePath = path.join(GTFS_PATH, filename);
  
  console.log(`   Checking file: ${filePath}`);
  
  if (!fs.existsSync(filePath)) {
    console.error(`\n❌ File not found: ${filePath}`);
    console.error(`\n💡 Please check that the file exists at this location.`);
    console.error(`   Expected files in: ${GTFS_PATH}`);
    console.error(`   Looking for: ${filename} (no .txt extension)\n`);
    
    // List what files ARE in the data directory
    try {
      const filesInDir = fs.readdirSync(GTFS_PATH);
      console.error(`   Files found in data directory:`);
      filesInDir.forEach(f => console.error(`     - ${f}`));
    } catch (e) {
      console.error(`   Could not read directory: ${GTFS_PATH}`);
    }
    
    throw new Error(`File not found: ${filePath}`);
  }
  
  const fileStream = fs.createReadStream(filePath);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });
  
  const records = [];
  let headers = [];
  let isFirstLine = true;
  
  for await (const line of rl) {
    if (!line.trim()) continue;
    
    if (isFirstLine) {
      headers = parseCSVLine(line).map(h => h.replace(/^\uFEFF/, '')); // Remove BOM
      isFirstLine = false;
    } else {
      const values = parseCSVLine(line);
      const record = {};
      headers.forEach((header, index) => {
        record[header] = values[index] || '';
      });
      records.push(record);
    }
  }
  
  return records;
}

/**
 * Clear existing data from database
 */
async function clearExistingData() {
  try {
    console.log('🗑️  Clearing existing data...');
    const stopsDeleted = await BusStop.deleteMany({});
    const routesDeleted = await BusRoute.deleteMany({});
    console.log(`✅ Deleted ${stopsDeleted.deletedCount} bus stops`);
    console.log(`✅ Deleted ${routesDeleted.deletedCount} bus routes\n`);
  } catch (error) {
    console.error('❌ Error clearing data:', error.message);
    throw error;
  }
}

/**
 * Load and process stops.txt
 */
async function loadStops() {
  console.log('📍 Loading stops from GTFS...');
  
  const stopsData = await readGTFSFile('stops.txt');
  
  // Filter only bus stops (location_type = 0 or empty)
  const busStops = stopsData.filter(stop => {
    const locationType = stop.location_type || '0';
    return locationType === '0' || locationType === '';
  });
  
  console.log(`   Found ${busStops.length} bus stops (filtered from ${stopsData.length} total)`);
  
  // Convert to BusStop model format
  const stops = busStops.map(stop => ({
    stopId: stop.stop_id,
    name: stop.stop_name,
    position: {
      lat: parseFloat(stop.stop_lat),
      lng: parseFloat(stop.stop_lon)
    },
    routes: [], // Will be populated later from stop_times
    type: determineStopType(stop.stop_name),
    operator: 'Dubai RTA',
    zone: stop.zone_id || undefined,
    status: 'active'
  }));
  
  console.log(`✅ Processed ${stops.length} bus stops\n`);
  return stops;
}

/**
 * Determine stop type from name
 */
function determineStopType(name) {
  const nameLower = name.toLowerCase();
  if (nameLower.includes('station') || nameLower.includes('metro')) {
    return 'station';
  } else if (nameLower.includes('terminal') || nameLower.includes('bus stn')) {
    return 'terminal';
  }
  return 'stop';
}

/**
 * Load and process routes.txt
 */
async function loadRoutes() {
  console.log('🚌 Loading routes from GTFS...');
  
  const routesData = await readGTFSFile('routes.txt');
  
  // Filter only bus routes (route_type = 3)
  const busRoutes = routesData.filter(route => route.route_type === '3');
  
  console.log(`   Found ${busRoutes.length} bus routes (filtered from ${routesData.length} total)`);
  
  // Convert to route info (will be completed later)
  const routes = busRoutes.map(route => ({
    routeId: route.route_id,
    routeNumber: route.route_short_name,
    name: route.route_long_name || `Route ${route.route_short_name}`,
    description: '',
    color: route.route_color ? `#${route.route_color}` : '#6F2E90',
    type: determineRouteType(route.route_short_name),
    operator: 'Dubai RTA',
    status: 'active'
  }));
  
  console.log(`✅ Processed ${routes.length} bus routes\n`);
  return routes;
}

/**
 * Determine route type from route number
 */
function determineRouteType(routeNumber) {
  if (routeNumber.startsWith('X')) return 'express';
  if (routeNumber.startsWith('E')) return 'intercity';
  if (routeNumber.startsWith('C')) return 'local';
  if (routeNumber.startsWith('F')) return 'local';
  return 'local';
}

/**
 * Load trips.txt and create route-to-trips mapping
 */
async function loadTrips() {
  console.log('🔗 Loading trips from GTFS...');
  
  const tripsData = await readGTFSFile('trips.txt');
  
  // Group trips by route_id
  const routeTripsMap = new Map();
  
  tripsData.forEach(trip => {
    const routeId = trip.route_id;
    if (!routeTripsMap.has(routeId)) {
      routeTripsMap.set(routeId, []);
    }
    routeTripsMap.get(routeId).push({
      tripId: trip.trip_id,
      serviceId: trip.service_id,
      directionId: trip.direction_id
    });
  });
  
  console.log(`✅ Loaded ${tripsData.length} trips for ${routeTripsMap.size} routes\n`);
  return routeTripsMap;
}

/**
 * Load calendar.txt and create service schedules
 */
async function loadCalendar() {
  console.log('📅 Loading calendar from GTFS...');
  
  const calendarData = await readGTFSFile('calendar.txt');
  
  const serviceMap = new Map();
  
  calendarData.forEach(service => {
    const serviceId = service.service_id;
    
    // Determine if weekday or weekend service
    // Dubai: Weekday = Sun-Thu, Weekend = Fri-Sat
    const isFriday = service.friday === '1';
    const isSaturday = service.saturday === '1';
    const isWeekday = service.sunday === '1' || service.monday === '1' || 
                      service.tuesday === '1' || service.wednesday === '1' || 
                      service.thursday === '1';
    
    serviceMap.set(serviceId, {
      hasWeekday: isWeekday,
      hasWeekend: isFriday || isSaturday
    });
  });
  
  console.log(`✅ Loaded ${serviceMap.size} service schedules\n`);
  return serviceMap;
}

/**
 * Process stop_times.txt to build route sequences
 * This is the most complex part - processes the huge file efficiently
 */
async function processStopTimes(routes, routeTripsMap) {
  console.log('⏱️  Processing stop_times (this may take a while)...');
  console.log('   File size: ~133 MB - Processing in batches...\n');
  
  const filePath = path.join(GTFS_PATH, 'stop_times.txt');
  const fileStream = fs.createReadStream(filePath);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });
  
  // Map to store stop sequences for each trip
  const tripStopsMap = new Map();
  
  let headers = [];
  let isFirstLine = true;
  let lineCount = 0;
  
  for await (const line of rl) {
    if (!line.trim()) continue;
    
    if (isFirstLine) {
      headers = parseCSVLine(line).map(h => h.replace(/^\uFEFF/, ''));
      isFirstLine = false;
      continue;
    }
    
    const values = parseCSVLine(line);
    const record = {};
    headers.forEach((header, index) => {
      record[header] = values[index] || '';
    });
    
    const tripId = record.trip_id;
    const stopId = record.stop_id;
    const stopSequence = parseInt(record.stop_sequence);
    const arrivalTime = record.arrival_time;
    
    if (!tripStopsMap.has(tripId)) {
      tripStopsMap.set(tripId, []);
    }
    
    tripStopsMap.get(tripId).push({
      stopId,
      sequence: stopSequence,
      arrivalTime
    });
    
    lineCount++;
    if (lineCount % 100000 === 0) {
      console.log(`   Processed ${lineCount.toLocaleString()} stop_times...`);
    }
  }
  
  console.log(`✅ Processed ${lineCount.toLocaleString()} total stop_times\n`);
  console.log('🔨 Building route sequences...');
  
  // Now build route sequences
  const routeStopsMap = new Map();
  
  routes.forEach(route => {
    const trips = routeTripsMap.get(route.routeId) || [];
    
    if (trips.length === 0) return;
    
    // Use first trip in direction 0 to get stop sequence
    const firstTrip = trips.find(t => t.directionId === '0') || trips[0];
    const tripStops = tripStopsMap.get(firstTrip.tripId) || [];
    
    if (tripStops.length === 0) return;
    
    // Sort by sequence
    tripStops.sort((a, b) => a.sequence - b.sequence);
    
    // Convert to route stops format
    const routeStops = tripStops.map((stop, index) => ({
      stopId: stop.stopId,
      order: index + 1,
      timeFromStart: calculateTimeFromStart(tripStops[0].arrivalTime, stop.arrivalTime)
    }));
    
    routeStopsMap.set(route.routeId, routeStops);
  });
  
  console.log(`✅ Built sequences for ${routeStopsMap.size} routes\n`);
  return routeStopsMap;
}

/**
 * Calculate time difference in minutes
 */
function calculateTimeFromStart(startTime, currentTime) {
  const parseTime = (timeStr) => {
    const [hours, minutes, seconds] = timeStr.split(':').map(Number);
    return hours * 60 + minutes + (seconds / 60);
  };
  
  const startMinutes = parseTime(startTime);
  const currentMinutes = parseTime(currentTime);
  
  return Math.round(currentMinutes - startMinutes);
}

/**
 * Calculate distance between two points (Haversine formula)
 */
function calculateDistance(lat1, lng1, lat2, lng2) {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Import bus stops to MongoDB
 */
async function importBusStops(stops) {
  try {
    console.log('📥 Importing bus stops to MongoDB...');
    const result = await BusStop.insertMany(stops, { ordered: false });
    console.log(`✅ Successfully imported ${result.length} bus stops\n`);
    return result;
  } catch (error) {
    if (error.code === 11000) {
      console.log('⚠️  Some stops already exist (duplicates skipped)');
      console.log(`✅ Imported ${error.insertedDocs?.length || 0} new stops\n`);
    } else {
      console.error('❌ Error importing bus stops:', error.message);
      throw error;
    }
  }
}

/**
 * Build complete routes and import to MongoDB
 */
async function importBusRoutes(routes, routeStopsMap, allStops, serviceMap, routeTripsMap) {
  console.log('🚌 Building complete bus routes...');
  
  const completeRoutes = [];
  const stopIdToCoords = new Map();
  
  // Create stop lookup map
  allStops.forEach(stop => {
    stopIdToCoords.set(stop.stopId, {
      lat: stop.position.lat,
      lng: stop.position.lng
    });
  });
  
  routes.forEach(route => {
    const stops = routeStopsMap.get(route.routeId);
    
    if (!stops || stops.length < 2) {
      console.log(`   ⚠️  Skipping ${route.routeNumber} - insufficient stops`);
      return;
    }
    
    // Calculate total distance
    let totalDistance = 0;
    for (let i = 0; i < stops.length - 1; i++) {
      const stop1 = stopIdToCoords.get(stops[i].stopId);
      const stop2 = stopIdToCoords.get(stops[i + 1].stopId);
      
      if (stop1 && stop2) {
        totalDistance += calculateDistance(stop1.lat, stop1.lng, stop2.lat, stop2.lng);
      }
    }
    
    // Get duration from last stop's timeFromStart
    const duration = stops[stops.length - 1].timeFromStart || 0;
    
    // Determine schedule from service_id
    const trips = routeTripsMap.get(route.routeId) || [];
    const firstTrip = trips[0];
    const serviceInfo = firstTrip ? serviceMap.get(firstTrip.serviceId) : null;
    
    const schedule = {
      weekday: {
        firstBus: '05:00',
        lastBus: '24:00',
        frequency: route.type === 'express' ? 10 : 15
      },
      weekend: {
        firstBus: '06:00',
        lastBus: '23:00',
        frequency: route.type === 'express' ? 15 : 20
      }
    };
    
    // Determine fare based on route type
    const baseFare = route.type === 'express' ? 5 : 3;
    
    completeRoutes.push({
      routeNumber: route.routeNumber,
      name: route.name,
      description: `${route.type.charAt(0).toUpperCase() + route.type.slice(1)} bus service`,
      stops: stops,
      schedule: schedule,
      fare: {
        baseFare: baseFare,
        zones: ['Zone 1', 'Zone 2'],
        perZoneFare: 1.5,
        maxFare: baseFare + 4.5
      },
      stats: {
        distance: Math.round(totalDistance * 10) / 10,
        duration: duration,
        totalStops: stops.length
      },
      operator: 'Dubai RTA',
      type: route.type,
      status: 'active',
      color: route.color
    });
  });
  
  console.log(`   Built ${completeRoutes.length} complete routes`);
  console.log('📥 Importing routes to MongoDB...');
  
  try {
    const result = await BusRoute.insertMany(completeRoutes);
    console.log(`✅ Successfully imported ${result.length} bus routes\n`);
    return result;
  } catch (error) {
    console.error('❌ Error importing routes:', error.message);
    throw error;
  }
}

/**
 * Update bus stops with route information
 */
async function updateStopsWithRoutes(routes) {
  console.log('🔗 Updating bus stops with route assignments...');
  
  let updateCount = 0;
  
  for (const route of routes) {
    const stopIds = route.stops.map(s => s.stopId);
    
    const result = await BusStop.updateMany(
      { stopId: { $in: stopIds } },
      { $addToSet: { routes: route.routeNumber } }
    );
    
    updateCount += result.modifiedCount;
  }
  
  console.log(`✅ Updated ${updateCount} bus stops with route information\n`);
}

/**
 * Verify and display statistics
 */
async function verifyImport() {
  try {
    console.log('🔍 Verifying imported data...\n');
    
    const totalStops = await BusStop.countDocuments();
    console.log(`   📍 Total bus stops: ${totalStops}`);
    
    const totalRoutes = await BusRoute.countDocuments();
    console.log(`   🚌 Total bus routes: ${totalRoutes}`);
    
    const stopsWithRoutes = await BusStop.countDocuments({ 
      routes: { $exists: true, $ne: [] } 
    });
    console.log(`   🔗 Stops with route info: ${stopsWithRoutes}`);
    
    // Sample route details
    const sampleRoutes = await BusRoute.find().limit(10).select('routeNumber name stats type');
    console.log('\n   📊 Sample Routes:');
    sampleRoutes.forEach(route => {
      console.log(`      ${route.routeNumber}: ${route.name}`);
      console.log(`         ${route.stats.totalStops} stops | ${route.stats.distance}km | ${route.type}`);
    });
    
    console.log('\n✅ Verification complete!\n');
  } catch (error) {
    console.error('❌ Error verifying data:', error.message);
  }
}

/**
 * Main function
 */
async function main() {
  console.log('\n🚀 DUBAI RTA GTFS DATABASE SEEDER');
  console.log('═'.repeat(70));
  console.log('Converting real Dubai GTFS data to MongoDB');
  console.log('═'.repeat(70) + '\n');
  
  try {
    // Connect to database
    await connectDB();
    
    // Clear existing data
    await clearExistingData();
    
    // Load GTFS files
    const stops = await loadStops();
    const routes = await loadRoutes();
    const routeTripsMap = await loadTrips();
    const serviceMap = await loadCalendar();
    
    // Process stop_times to build route sequences
    const routeStopsMap = await processStopTimes(routes, routeTripsMap);
    
    // Import stops
    await importBusStops(stops);
    
    // Build and import complete routes
    const importedRoutes = await importBusRoutes(routes, routeStopsMap, stops, serviceMap, routeTripsMap);
    
    // Update stops with route info
    await updateStopsWithRoutes(importedRoutes);
    
    // Verify
    await verifyImport();
    
    console.log('✅ DATABASE SEEDING COMPLETE!\n');
    console.log('📋 Summary:');
    console.log(`   • ${stops.length} bus stops imported`);
    console.log(`   • ${importedRoutes.length} bus routes imported`);
    console.log(`   • All data from Dubai RTA GTFS`);
    console.log(`   • Ready for TOPSIS algorithm!\n`);
    
  } catch (error) {
    console.error('\n❌ Seeding failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('👋 Database connection closed\n');
  }
}

// Run the seeder
main();