/**
 * UPDATE ROUTES WITH SHAPE IDS SCRIPT
 * Adds shapeId (forward) AND shapeIdReturn (return) to all BusRoute documents
 * Uses direction_id from trips.txt:
 *   direction_id = 0 → forward journey → shapeId
 *   direction_id = 1 → return journey → shapeIdReturn
 * Usage: node scripts/updateRoutesWithShapes.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { parse as csv } from 'csv-parse/sync';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import dns from 'dns';
import BusRoute from '../models/BusRoute.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Point dotenv to .env in back-end/ (one level up from scripts/)
dotenv.config({ path: path.join(__dirname, '../.env') });

dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);

const updateRoutesWithShapes = async () => {
  console.log('🚀 Starting route shape update (forward + return)...\n');

  try {
    await mongoose.connect(process.env.MONGO_URL);
    console.log('✅ DB connected\n');
  } catch (error) {
    console.error(`❌ Connection error: ${error}`);
    process.exit(1);
  }

  try {
    const dataDir = path.join(__dirname, '../data');

    // ── Step 1: Build map of route_id → route_short_name from routes.txt ──
    const routesContent = fs.readFileSync(path.join(dataDir, 'routes.txt'), 'utf8');
    const routesRecords = csv(routesContent, {
      columns: true, skip_empty_lines: true, trim: true, quote: '"', relax_quotes: true,
    });

    // Map: route_id → routeNumber (short name)
    // e.g. "2002" → "81"
    const routeIdToShortName = new Map();
    for (const row of routesRecords) {
      const routeId = row.route_id?.replace(/"/g, '').trim();
      const shortName = row.route_short_name?.replace(/"/g, '').trim();
      if (routeId && shortName) routeIdToShortName.set(routeId, shortName);
    }
    console.log(`📄 Loaded ${routeIdToShortName.size} routes from routes.txt`);

    // ── Step 2: Build map of routeNumber → { forward: shapeId, return: shapeId } ──
    const tripsContent = fs.readFileSync(path.join(dataDir, 'trips.txt'), 'utf8');
    const tripsRecords = csv(tripsContent, {
      columns: true, skip_empty_lines: true, trim: true, quote: '"', relax_quotes: true,
    });

    // Map: routeNumber → { '0': shapeId, '1': shapeId }
    // direction_id 0 = forward, direction_id 1 = return
    const routeShapes = new Map();
    for (const row of tripsRecords) {
      const routeId   = row.route_id?.replace(/"/g, '').trim();
      const shapeId   = row.shape_id?.replace(/"/g, '').trim();
      const direction = row.direction_id?.replace(/"/g, '').trim();

      if (!routeId || !shapeId || direction === undefined) continue;

      const shortName = routeIdToShortName.get(routeId);
      if (!shortName) continue;

      if (!routeShapes.has(shortName)) routeShapes.set(shortName, {});
      const existing = routeShapes.get(shortName);

      // Only store first shape found per direction — they repeat across many trips
      if (!existing[direction]) existing[direction] = shapeId;
    }
    console.log(`🗺️  Built shape map for ${routeShapes.size} routes\n`);

    // ── Step 3: Update each route in MongoDB ──
    const allRoutes = await BusRoute.find({});
    console.log(`🔍 Found ${allRoutes.length} routes in MongoDB\n`);

    let updated = 0;
    let noShape = 0;
    let noReturn = 0;

    for (const route of allRoutes) {
      const shapes = routeShapes.get(route.routeNumber);

      if (!shapes) {
        console.log(`   ⚠️  No shape found for route: ${route.routeNumber}`);
        noShape++;
        continue;
      }

      // direction 0 = forward = shapeId
      // direction 1 = return  = shapeIdReturn
      const forwardShapeId = shapes['0'] || null;
      const returnShapeId  = shapes['1'] || null;

      if (!returnShapeId) noReturn++;

      await BusRoute.updateOne(
        { routeNumber: route.routeNumber },
        { $set: { shapeId: forwardShapeId, shapeIdReturn: returnShapeId } }
      );

      console.log(
        `   ✅ Route ${route.routeNumber.padEnd(6)} → forward: ${(forwardShapeId || 'none').padEnd(12)} return: ${returnShapeId || 'none'}`
      );
      updated++;
    }

    console.log(`\n📊 Summary:`);
    console.log(`   ✅ Updated:          ${updated} routes`);
    console.log(`   ⚠️  No shape at all: ${noShape} routes`);
    console.log(`   ⚠️  No return shape: ${noReturn} routes`);
    console.log(`\n🎉 Done! Both shapeId and shapeIdReturn are now populated.`);

  } catch (error) {
    console.error('❌ Update failed:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
};

updateRoutesWithShapes();
