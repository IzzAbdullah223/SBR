import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import dns from 'dns';
import mongoose from 'mongoose';

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from back-end root (two levels up from scripts/)
dotenv.config({ path: path.join(__dirname, '..', '.env') });

// DNS fix for Windows
dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);

// Import models
import BusStop from '../models/BusStop.js';
import BusRoute from '../models/BusRoute.js';

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
 * Load bus stops from JSON file
 */
function loadBusStopsFromFile() {
  const dataPath = path.join(__dirname, '../data/bus_stops_latest.json');
  
  console.log('📂 Loading bus stops from file...');
  console.log('   Path:', dataPath);
  
  if (!fs.existsSync(dataPath)) {
    console.error('❌ File not found:', dataPath);
    console.error('\nPlease run fetchBusData.js first to fetch data from OSM!');
    process.exit(1);
  }
  
  try {
    const fileContent = fs.readFileSync(dataPath, 'utf8');
    const busStops = JSON.parse(fileContent);
    console.log(`✅ Loaded ${busStops.length} bus stops from file\n`);
    return busStops;
  } catch (error) {
    console.error('❌ Error reading file:', error.message);
    process.exit(1);
  }
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
 * Import bus stops to MongoDB
 */
async function importBusStops(busStops) {
  try {
    console.log('📥 Importing bus stops to MongoDB...');
    const result = await BusStop.insertMany(busStops, { ordered: false });
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
 * Extract real routes from OSM data
 */
function extractRealRoutes(busStops) {
  console.log('🔍 Analyzing OSM data for real routes...\n');
  
  const routeMap = new Map();
  
  busStops.forEach(stop => {
    if (stop.routes && stop.routes.length > 0) {
      stop.routes.forEach(routeNumber => {
        if (!routeMap.has(routeNumber)) {
          routeMap.set(routeNumber, []);
        }
        routeMap.get(routeNumber).push(stop);
      });
    }
  });
  
  console.log(`📊 Found ${routeMap.size} unique route numbers in OSM data:`);
  
  const sortedRoutes = Array.from(routeMap.entries())
    .sort((a, b) => b[1].length - a[1].length);
  
  sortedRoutes.forEach(([routeNumber, stops]) => {
    console.log(`   ${routeNumber}: ${stops.length} stops`);
  });
  
  console.log('');
  
  return routeMap;
}

/**
 * Calculate distance between two points using Haversine formula
 */
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Sort stops geographically to create logical route path
 */
function sortStopsGeographically(stops) {
  if (stops.length <= 1) return stops;
  
  const sorted = [stops.reduce((min, stop) => 
    stop.position.lng < min.position.lng ? stop : min
  )];
  
  const remaining = stops.filter(s => s.stopId !== sorted[0].stopId);
  
  while (remaining.length > 0) {
    const last = sorted[sorted.length - 1];
    let nearest = remaining[0];
    let minDist = calculateDistance(
      last.position.lat, last.position.lng,
      nearest.position.lat, nearest.position.lng
    );
    
    for (let i = 1; i < remaining.length; i++) {
      const dist = calculateDistance(
        last.position.lat, last.position.lng,
        remaining[i].position.lat, remaining[i].position.lng
      );
      if (dist < minDist) {
        minDist = dist;
        nearest = remaining[i];
      }
    }
    
    sorted.push(nearest);
    remaining.splice(remaining.indexOf(nearest), 1);
  }
  
  return sorted;
}

/**
 * Create route object from stops
 */
function createRouteFromStops(routeNumber, stops, allStops) {
  const sortedStops = sortStopsGeographically(stops);
  
  let totalDistance = 0;
  for (let i = 0; i < sortedStops.length - 1; i++) {
    totalDistance += calculateDistance(
      sortedStops[i].position.lat,
      sortedStops[i].position.lng,
      sortedStops[i + 1].position.lat,
      sortedStops[i + 1].position.lng
    );
  }
  
  let type = 'local';
  let description = '';
  
  if (routeNumber.startsWith('X')) {
    type = 'express';
    description = 'Express route with limited stops';
  } else if (routeNumber.startsWith('A')) {
    type = 'express';
    description = 'Airport service route';
  } else if (routeNumber.startsWith('M')) {
    type = 'local';
    description = 'Local route serving residential areas';
  } else if (routeNumber.includes('B')) {
    type = 'local';
    description = 'Standard bus service';
  } else {
    type = 'local';
    description = 'Standard city bus route';
  }
  
  const startStop = sortedStops[0].name;
  const endStop = sortedStops[sortedStops.length - 1].name;
  const name = `${startStop.substring(0, 30)} - ${endStop.substring(0, 30)}`;
  
  const routeStops = sortedStops.map((stop, index) => ({
    stopId: stop.stopId,
    order: index + 1,
    timeFromStart: index * (type === 'express' ? 2 : 3)
  }));
  
  const duration = Math.round(totalDistance / 30 * 60);
  
  let schedule;
  if (type === 'express') {
    schedule = {
      weekday: {
        firstBus: '05:00',
        lastBus: '00:00',
        frequency: 15
      },
      weekend: {
        firstBus: '06:00',
        lastBus: '23:00',
        frequency: 20
      }
    };
  } else {
    schedule = {
      weekday: {
        firstBus: '06:00',
        lastBus: '23:00',
        frequency: 12
      },
      weekend: {
        firstBus: '07:00',
        lastBus: '22:00',
        frequency: 15
      }
    };
  }
  
  const baseFare = type === 'express' ? 3 : 2;
  const fare = {
    baseFare: baseFare,
    zones: ['Zone 1', 'Zone 2'],
    perZoneFare: 1,
    maxFare: baseFare + 3
  };
  
  const colors = [
    '#FF6B35', '#4ECDC4', '#95E1D3', '#F38181', '#AA96DA',
    '#FCBAD3', '#FFFFD2', '#A8D8EA', '#FFAAA7', '#FFD3B6'
  ];
  const colorIndex = parseInt(routeNumber.replace(/\D/g, '') || '0') % colors.length;
  
  return {
    routeNumber: routeNumber,
    name: name,
    description: description,
    stops: routeStops,
    schedule: schedule,
    fare: fare,
    stats: {
      distance: Math.round(totalDistance),
      duration: duration,
      totalStops: sortedStops.length
    },
    type: type,
    color: colors[colorIndex],
    operator: 'Abu Dhabi Department of Transport',
    status: 'active'
  };
}

/**
 * Create enhanced routes from real OSM data
 */
async function createEnhancedRoutes(routeMap, allStops) {
  console.log('🚌 Building enhanced routes from real OSM data...\n');
  
  const routes = [];
  const routeArray = Array.from(routeMap.entries());
  
  const validRoutes = routeArray.filter(([_, stops]) => stops.length >= 3);
  
  console.log(`📋 Creating routes (${validRoutes.length} routes with 3+ stops):\n`);
  
  for (const [routeNumber, stops] of validRoutes) {
    const route = createRouteFromStops(routeNumber, stops, allStops);
    routes.push(route);
    
    console.log(`   ✓ ${routeNumber}: ${route.name}`);
    console.log(`     Stops: ${route.stats.totalStops} | Distance: ${route.stats.distance}km | Type: ${route.type}`);
  }
  
  console.log('');
  
  if (routes.length < 5) {
    console.log('📝 Adding supplementary routes to reach minimum coverage...\n');
    
    const syntheticRoutes = createSyntheticRoutes(allStops, routes.length);
    routes.push(...syntheticRoutes);
  }
  
  try {
    const insertedRoutes = await BusRoute.insertMany(routes);
    console.log(`✅ Created ${insertedRoutes.length} bus routes\n`);
    
    return insertedRoutes;
  } catch (error) {
    console.error('❌ Error creating routes:', error.message);
    throw error;
  }
}

/**
 * Categorize stops by type and location
 */
function categorizeStops(allStops) {
  const categories = {
    airport: [],
    malls: [],
    university: [],
    hospital: [],
    residential: [],
    commercial: [],
    industrial: [],
    marina: [],
    island: [],
    downtown: [],
    other: []
  };

  allStops.forEach(stop => {
    const name = stop.name.toLowerCase();
    const lat = stop.position.lat;
    const lng = stop.position.lng;

    if (name.includes('airport') || name.includes('terminal')) {
      categories.airport.push(stop);
    }
    else if (name.includes('mall') || name.includes('shopping')) {
      categories.malls.push(stop);
    }
    else if (name.includes('university') || name.includes('college') || 
             name.includes('school') || name.includes('masdar') || 
             name.includes('institute')) {
      categories.university.push(stop);
    }
    else if (name.includes('hospital') || name.includes('medical') || 
             name.includes('clinic') || name.includes('health')) {
      categories.hospital.push(stop);
    }
    else if (name.includes('marina') || name.includes('corniche')) {
      categories.marina.push(stop);
    }
    else if (name.includes('yas') || name.includes('saadiyat') || 
             name.includes('reem') || name.includes('al raha')) {
      categories.island.push(stop);
    }
    else if (lat >= 24.45 && lat <= 24.50 && lng >= 54.35 && lng <= 54.38) {
      categories.downtown.push(stop);
    }
    else if (name.includes('mussafah') || name.includes('musaffah') ||
             (lat >= 24.32 && lat <= 24.37 && lng >= 54.49 && lng <= 54.56)) {
      categories.industrial.push(stop);
    }
    else if (name.includes('residence') || name.includes('housing') || 
             name.includes('villa') || name.includes('apartment')) {
      categories.residential.push(stop);
    }
    else if (name.includes('business') || name.includes('office') || 
             name.includes('center') || name.includes('centre')) {
      categories.commercial.push(stop);
    }
    else {
      categories.other.push(stop);
    }
  });

  return categories;
}

/**
 * Get stops within a geographic area
 */
function getStopsInArea(allStops, centerLat, centerLng, radiusKm) {
  return allStops.filter(stop => {
    const distance = calculateDistance(
      centerLat, centerLng, 
      stop.position.lat, stop.position.lng
    );
    return distance <= radiusKm;
  });
}

/**
 * Create a route connecting specific stops with intermediate stops
 */
function createRouteWithIntermediates(startStop, endStop, allStops, maxStops = 15) {
  const route = [startStop];
  const remaining = allStops.filter(s => 
    s.stopId !== startStop.stopId && s.stopId !== endStop.stopId
  );

  let current = startStop;
  let stopsAdded = 0;

  while (stopsAdded < maxStops - 2 && remaining.length > 0) {
    const candidates = remaining.filter(stop => {
      const distToCurrent = calculateDistance(
        current.position.lat, current.position.lng,
        stop.position.lat, stop.position.lng
      );
      const distToEnd = calculateDistance(
        stop.position.lat, stop.position.lng,
        endStop.position.lat, endStop.position.lng
      );
      const totalDist = calculateDistance(
        current.position.lat, current.position.lng,
        endStop.position.lat, endStop.position.lng
      );

      return (distToCurrent + distToEnd) <= totalDist * 1.3;
    });

    if (candidates.length === 0) break;

    let nearest = candidates[0];
    let minDist = calculateDistance(
      current.position.lat, current.position.lng,
      nearest.position.lat, nearest.position.lng
    );

    for (let i = 1; i < Math.min(candidates.length, 5); i++) {
      const dist = calculateDistance(
        current.position.lat, current.position.lng,
        candidates[i].position.lat, candidates[i].position.lng
      );
      if (dist < minDist) {
        minDist = dist;
        nearest = candidates[i];
      }
    }

    route.push(nearest);
    remaining.splice(remaining.indexOf(nearest), 1);
    current = nearest;
    stopsAdded++;
  }

  route.push(endStop);
  return route;
}

/**
 * ENHANCED: Create synthetic routes to supplement OSM data
 */
function createSyntheticRoutes(allStops, existingCount) {
  console.log('🎨 Creating intelligent synthetic routes...\n');
  
  const routes = [];
  const categories = categorizeStops(allStops);

  console.log('📍 Stop categories:');
  console.log(`   Airport: ${categories.airport.length}`);
  console.log(`   Malls: ${categories.malls.length}`);
  console.log(`   University: ${categories.university.length}`);
  console.log(`   Hospital: ${categories.hospital.length}`);
  console.log(`   Marina: ${categories.marina.length}`);
  console.log(`   Islands: ${categories.island.length}`);
  console.log(`   Downtown: ${categories.downtown.length}`);
  console.log(`   Industrial: ${categories.industrial.length}\n`);

  // Route 1: Airport Express to Downtown
  if (categories.airport.length > 0 && categories.downtown.length > 0) {
    const airportStop = categories.airport[0];
    const downtownStop = categories.downtown[0];
    const routeStops = createRouteWithIntermediates(airportStop, downtownStop, allStops, 10);
    
    if (routeStops.length >= 5) {
      routes.push(createRouteFromStops('A1', routeStops, allStops));
      console.log(`   ✓ Created A1: Airport Express (${routeStops.length} stops)`);
    }
  }

  // Route 2: Mall Hopper
  if (categories.malls.length >= 3) {
    const mallStops = categories.malls.slice(0, 5);
    const expandedStops = [];
    for (let i = 0; i < mallStops.length - 1; i++) {
      expandedStops.push(mallStops[i]);
      const intermediate = getStopsInArea(
        allStops, 
        (mallStops[i].position.lat + mallStops[i + 1].position.lat) / 2,
        (mallStops[i].position.lng + mallStops[i + 1].position.lng) / 2,
        2
      ).filter(s => !mallStops.includes(s)).slice(0, 2);
      expandedStops.push(...intermediate);
    }
    expandedStops.push(mallStops[mallStops.length - 1]);

    if (expandedStops.length >= 5) {
      routes.push(createRouteFromStops('94', expandedStops, allStops));
      console.log(`   ✓ Created 94: Mall Circuit (${expandedStops.length} stops)`);
    }
  }

  // Route 3: University Line
  if (categories.university.length > 0) {
    const uniStop = categories.university[0];
    const nearbyStops = getStopsInArea(allStops, uniStop.position.lat, uniStop.position.lng, 10)
      .slice(0, 12);
    
    if (nearbyStops.length >= 5) {
      routes.push(createRouteFromStops('U1', nearbyStops, allStops));
      console.log(`   ✓ Created U1: University Line (${nearbyStops.length} stops)`);
    }
  }

  // Route 4: Marina - Islands Connection
  if (categories.marina.length > 0 && categories.island.length > 0) {
    const marinaStop = categories.marina[0];
    const islandStop = categories.island[0];
    const routeStops = createRouteWithIntermediates(marinaStop, islandStop, allStops, 12);
    
    if (routeStops.length >= 5) {
      routes.push(createRouteFromStops('M5', routeStops, allStops));
      console.log(`   ✓ Created M5: Marina-Islands (${routeStops.length} stops)`);
    }
  }

  // Route 5: Industrial Zone Express
  if (categories.industrial.length >= 3) {
    const industrialStops = categories.industrial.slice(0, 10);
    
    if (industrialStops.length >= 5) {
      routes.push(createRouteFromStops('X10', industrialStops, allStops));
      console.log(`   ✓ Created X10: Industrial Express (${industrialStops.length} stops)`);
    }
  }

  // Route 6: Hospital Network
  if (categories.hospital.length > 0) {
    const hospitalStop = categories.hospital[0];
    const nearbyStops = getStopsInArea(allStops, hospitalStop.position.lat, hospitalStop.position.lng, 8)
      .slice(0, 10);
    
    if (nearbyStops.length >= 5) {
      routes.push(createRouteFromStops('H2', nearbyStops, allStops));
      console.log(`   ✓ Created H2: Hospital Network (${nearbyStops.length} stops)`);
    }
  }

  // Route 7-10: Geographic quadrants
  const centerLat = 24.45;
  const centerLng = 54.37;

  const northStops = allStops.filter(s => s.position.lat > centerLat).slice(0, 12);
  if (northStops.length >= 5) {
    routes.push(createRouteFromStops('N15', northStops, allStops));
    console.log(`   ✓ Created N15: North Line (${northStops.length} stops)`);
  }

  const southStops = allStops.filter(s => s.position.lat <= centerLat).slice(0, 12);
  if (southStops.length >= 5) {
    routes.push(createRouteFromStops('S16', southStops, allStops));
    console.log(`   ✓ Created S16: South Line (${southStops.length} stops)`);
  }

  const eastStops = allStops.filter(s => s.position.lng > centerLng).slice(0, 12);
  if (eastStops.length >= 5) {
    routes.push(createRouteFromStops('E20', eastStops, allStops));
    console.log(`   ✓ Created E20: East Line (${eastStops.length} stops)`);
  }

  const westStops = allStops.filter(s => s.position.lng <= centerLng).slice(0, 12);
  if (westStops.length >= 5) {
    routes.push(createRouteFromStops('W21', westStops, allStops));
    console.log(`   ✓ Created W21: West Line (${westStops.length} stops)`);
  }

  // Route 11: Night service
  const landmarkStops = [
    ...categories.airport.slice(0, 1),
    ...categories.malls.slice(0, 2),
    ...categories.downtown.slice(0, 2),
    ...categories.hospital.slice(0, 1)
  ].slice(0, 10);

  if (landmarkStops.length >= 5) {
    routes.push(createRouteFromStops('N1', landmarkStops, allStops));
    console.log(`   ✓ Created N1: Night Service (${landmarkStops.length} stops)`);
  }

  // Route 12: Circular downtown route
  if (categories.downtown.length >= 5) {
    const downtownCircular = categories.downtown.slice(0, 15);
    routes.push(createRouteFromStops('C1', downtownCircular, allStops));
    console.log(`   ✓ Created C1: Downtown Circular (${downtownCircular.length} stops)`);
  }

  // Route 13-15: Coverage for remaining areas
  const usedStops = new Set();
  routes.forEach(route => {
    route.stops.forEach(stop => usedStops.add(stop.stopId));
  });

  const unusedStops = allStops.filter(s => !usedStops.has(s.stopId));
  
  for (let i = 0; i < 3 && unusedStops.length >= 10; i++) {
    const startIdx = i * Math.floor(unusedStops.length / 3);
    const routeStops = unusedStops.slice(startIdx, startIdx + 12);
    
    if (routeStops.length >= 5) {
      const routeNum = `R${30 + i}`;
      routes.push(createRouteFromStops(routeNum, routeStops, allStops));
      console.log(`   ✓ Created ${routeNum}: Regional Line (${routeStops.length} stops)`);
    }
  }

  console.log(`\n📊 Total synthetic routes created: ${routes.length}\n`);

  return routes;
}

/**
 * Update bus stops with route assignments
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
    
    console.log('\n   📊 Route Details:');
    const routes = await BusRoute.find().select('routeNumber name stats type');
    routes.forEach(route => {
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
  console.log('\n🚀 SMART BUS ROUTE PLANNER - ENHANCED DATABASE SEEDER');
  console.log('═'.repeat(70));
  console.log('Semi-Real Hybrid Approach: Real OSM Data + Intelligent Reconstruction');
  console.log('═'.repeat(70) + '\n');
  
  try {
    await connectDB();
    
    const busStops = loadBusStopsFromFile();
    const routeMap = extractRealRoutes(busStops);
    await clearExistingData();
    await importBusStops(busStops);
    const routes = await createEnhancedRoutes(routeMap, busStops);
    await updateStopsWithRoutes(routes);
    await verifyImport(); 
    console.log('✅ DATABASE SEEDING COMPLETE!\n');

  } catch (error) {
    console.error('\n❌ Seeding failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('👋 Database connection closed\n');
  }
}

main();