import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current directory (ES module equivalent of __dirname) like to know where to save the file
const __filename = fileURLToPath(import.meta.url);//Gets current file path
const __dirname = path.dirname(__filename);// Get the directory of the file

// Overpass API endpoint
const OVERPASS_API = 'https://overpass-api.de/api/interpreter';

// Abu Dhabi bounding box (approximate)
// Format: [south, west, north, east]
const ABU_DHABI_BBOX = {
  south: 24.2,
  west: 54.2,
  north: 24.7,
  east: 54.7
};

/**
 * Fetch bus stops from OpenStreetMap using Overpass API
 */
async function fetchAbuDhabiBusStops() {
  console.log('🔍 Fetching bus stops from OpenStreetMap...');
  console.log(`📍 Area: Abu Dhabi (${ABU_DHABI_BBOX.south},${ABU_DHABI_BBOX.west},${ABU_DHABI_BBOX.north},${ABU_DHABI_BBOX.east})`);
  
  // Overpass QL query to get bus stops in Abu Dhabi
  const query = `
    [out:json][timeout:60];
    (
      // Bus stops (nodes)
      node["highway"="bus_stop"](${ABU_DHABI_BBOX.south},${ABU_DHABI_BBOX.west},${ABU_DHABI_BBOX.north},${ABU_DHABI_BBOX.east});
      
      // Bus stations (nodes and ways)
      node["amenity"="bus_station"](${ABU_DHABI_BBOX.south},${ABU_DHABI_BBOX.west},${ABU_DHABI_BBOX.north},${ABU_DHABI_BBOX.east});
      way["amenity"="bus_station"](${ABU_DHABI_BBOX.south},${ABU_DHABI_BBOX.west},${ABU_DHABI_BBOX.north},${ABU_DHABI_BBOX.east});
      
      // Public transport platforms
      node["public_transport"="platform"]["bus"="yes"](${ABU_DHABI_BBOX.south},${ABU_DHABI_BBOX.west},${ABU_DHABI_BBOX.north},${ABU_DHABI_BBOX.east});
      way["public_transport"="platform"]["bus"="yes"](${ABU_DHABI_BBOX.south},${ABU_DHABI_BBOX.west},${ABU_DHABI_BBOX.north},${ABU_DHABI_BBOX.east});
    );
    out body;
    >;
    out skel qt;
  `;

  try {
    // Make request to Overpass API
    const response = await fetch(OVERPASS_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'SmartBusRoutePlanner/1.0 (Student Capstone Project)'
      },
      body: `data=${encodeURIComponent(query)}`
    });

    if (!response.ok) {
      throw new Error(`Overpass API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log(`Received ${data.elements.length} elements from OSM`);

    // Process the data
    const busStops = processBusStops(data.elements);
    
    return busStops;
  } catch (error) {
    console.error('❌ Error fetching data from OpenStreetMap:', error.message);
    throw error;
  }
}

/**
 * Process raw OSM data into our bus stop format
 */
function processBusStops(elements) {
  console.log('🔄 Processing bus stops...');
  
  const busStops = [];
  let stopCounter = 1;

  for (const element of elements) {
    // Only process nodes (points) with coordinates
    if (element.type === 'node' && element.lat && element.lon) {
      const tags = element.tags || {};
      
      // Extract bus stop information
      const busStop = {
        stopId: `STOP_${String(stopCounter).padStart(3, '0')}`,
        name: tags.name || tags['name:en'] || tags['name:ar'] || `Bus Stop ${stopCounter}`,
        position: {
          lat: element.lat,
          lng: element.lon
        },
        routes: extractRoutes(tags),
        amenities: extractAmenities(tags),
        type: determineStopType(tags),
        operator: tags.operator || 'Abu Dhabi Department of Transport',
        osm_id: element.id,
        zone: tags.zone || null
      };

      busStops.push(busStop);
      stopCounter++;
    }
  }

  console.log(`Processed ${busStops.length} bus stops`);
  return busStops;
}

/**
 * Extract route numbers from OSM tags
 */
function extractRoutes(tags) {
  const routes = [];
  
  // Check various OSM tags that might contain route info
  if (tags.route_ref) {
    routes.push(...tags.route_ref.split(';').map(r => r.trim()));
  }
  if (tags.ref) {
    routes.push(...tags.ref.split(';').map(r => r.trim()));
  }
  if (tags.route) {
    routes.push(...tags.route.split(';').map(r => r.trim()));
  }
  
  // Clean and deduplicate
  return [...new Set(routes.filter(r => r && r.length > 0))];
}

/**
 * Extract amenities from OSM tags
 */
function extractAmenities(tags) {
  const amenities = [];
  
  if (tags.shelter === 'yes') amenities.push('shelter');
  if (tags.bench === 'yes' || tags.seating === 'yes') amenities.push('seating');
  if (tags.departures_board === 'yes' || tags.display === 'yes') amenities.push('display');
  if (tags.lit === 'yes' || tags.lighting === 'yes') amenities.push('lighting');
  if (tags.wheelchair === 'yes') amenities.push('accessibility');
  
  return amenities;
}

/**
 * Determine stop type from OSM tags
 */
function determineStopType(tags) {
  if (tags.amenity === 'bus_station') return 'station';
  if (tags.public_transport === 'station') return 'station';
  if (tags.bus === 'yes' && tags.train === 'yes') return 'terminal';
  return 'stop';
}

/**
 * Save bus stops to JSON file
 */
function saveBusStops(busStops) {
  const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0];
  const filename = `bus_stops_${timestamp}.json`; // create the file name
  const dataDir = path.join(__dirname, '../data');// join the new file to the current dir
  
  // Create data directory if it doesn't exist
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  
  const filepath = path.join(dataDir, filename);
  
  // Save with pretty formatting
  fs.writeFileSync(
    filepath,
    JSON.stringify(busStops, null, 2),
    'utf8'
  );
  
  console.log(`Saved ${busStops.length} bus stops to: ${filepath}`);
  
  // Also save as latest.json for easy reference
  const latestPath = path.join(dataDir, 'bus_stops_latest.json');
  fs.writeFileSync(
    latestPath,
    JSON.stringify(busStops, null, 2),
    'utf8'
  );
  console.log(` Also saved as: ${latestPath}`);
  
  return filepath;
}

/**
 * Display statistics about fetched data
 */
function displayStats(busStops) {
  console.log('\n STATISTICS:');
  console.log('═'.repeat(50));
  console.log(`Total bus stops: ${busStops.length}`);
  
  // Count by type
  const typeCount = busStops.reduce((acc, stop) => {
    acc[stop.type] = (acc[stop.type] || 0) + 1;
    return acc;
  }, {});
  console.log('\nBy Type:');
  Object.entries(typeCount).forEach(([type, count]) => {
    console.log(`  ${type}: ${count}`);
  });
  
  // Count stops with amenities
  const withAmenities = busStops.filter(s => s.amenities.length > 0).length;
  console.log(`\nWith amenities: ${withAmenities}`);
  
  // Count stops with routes
  const withRoutes = busStops.filter(s => s.routes.length > 0).length;
  console.log(`With route info: ${withRoutes}`);
  
  // Count stops with names
  const withNames = busStops.filter(s => !s.name.includes('Bus Stop')).length;
  console.log(`With proper names: ${withNames}`);
  
  console.log('═'.repeat(50));
}

/**
 * Main execution
 */
async function main() {
  console.log('\n🚀 SMART BUS ROUTE PLANNER - OSM DATA FETCHER');
  console.log('═'.repeat(50));
  console.log('Fetching real bus stop data from OpenStreetMap');
  console.log('Location: Abu Dhabi, UAE');
  console.log('═'.repeat(50) + '\n');

  try {
    // Fetch bus stops
    const busStops = await fetchAbuDhabiBusStops();
    
    if (busStops.length === 0) {
      console.log('⚠️  No bus stops found.');
      console.log('  1. OSM has limited data for Abu Dhabi');
      console.log('  2. The bounding box coordinates are incorrect');
      console.log('  3. Network issues preventing API access');
      return;
    }
    
    // Save to file
    const filepath = saveBusStops(busStops);
    
    // Display statistics
    displayStats(busStops);
    
    console.log('\n✅ SUCCESS!');
    console.log('\nNext steps:');
    console.log('1. Review the data in:', filepath);
  
    console.log('\n');
    
  } catch (error) {
    console.error('\n❌ FAILED:', error.message);
    console.error('\nTroubleshooting:');
    console.error('1. Check your internet connection');
    console.error('2. Verify Overpass API is accessible: https://overpass-api.de/api/status');
    console.error('3. Try again in a few minutes (API might be busy)');
    process.exit(1);
  }
}

// Run the script
main();