/**
 * UPDATE ROUTES WITH SHAPE IDS SCRIPT
 * Adds shapeId to existing BusRoute documents — no data deleted
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

// ✅ FIX: Point dotenv to the .env file in back-end/ (one level up from scripts/)
dotenv.config({ path: path.join(__dirname, '../.env') });

dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);

const updateRoutesWithShapes = async () => {
  console.log('🚀 Starting route shape update...');
  console.log('ℹ️  This will ONLY add shapeId to existing routes — no data will be deleted\n');

  try {
    await mongoose.connect(process.env.MONGO_URL);
    console.log('✅ DB is connected successfully');
  } catch (error) {
    console.log(`Connection Errorrrrrr: ${error}`);
    process.exit(1);
  }

  try {
    const dataDir = path.join(__dirname, '../data');

    const routesContent = fs.readFileSync(path.join(dataDir, 'routes.txt'), 'utf8');
    const routesRecords = csv(routesContent, {
      columns: true, skip_empty_lines: true, trim: true, quote: '"', relax_quotes: true,
    });

    const routeIdToShortName = new Map();
    for (const row of routesRecords) {
      const routeId = row.route_id?.replace(/"/g, '').trim();
      const shortName = row.route_short_name?.replace(/"/g, '').trim();
      if (routeId && shortName) routeIdToShortName.set(routeId, shortName);
    }
    console.log(`📄 Loaded ${routeIdToShortName.size} routes from routes.txt`);

    const tripsContent = fs.readFileSync(path.join(dataDir, 'trips.txt'), 'utf8');
    const tripsRecords = csv(tripsContent, {
      columns: true, skip_empty_lines: true, trim: true, quote: '"', relax_quotes: true,
    });

    const routeShapes = new Map();
    for (const row of tripsRecords) {
      const routeId = row.route_id?.replace(/"/g, '').trim();
      const shapeId = row.shape_id?.replace(/"/g, '').trim();
      const direction = row.direction_id?.replace(/"/g, '').trim();

      if (!routeId || !shapeId) continue;

      const shortName = routeIdToShortName.get(routeId);
      if (!shortName) continue;

      if (!routeShapes.has(shortName)) routeShapes.set(shortName, {});
      const existing = routeShapes.get(shortName);
      if (!existing[direction]) existing[direction] = shapeId;
    }
    console.log(`🗺️  Built shape map for ${routeShapes.size} routes\n`);

    const allRoutes = await BusRoute.find({});
    console.log(`🔍 Found ${allRoutes.length} routes in MongoDB\n`);

    let updated = 0;
    let noShape = 0;

    for (const route of allRoutes) {
      const shapes = routeShapes.get(route.routeNumber);

      if (!shapes) {
        console.log(`   ⚠️  No shape found for route: ${route.routeNumber}`);
        noShape++;
        continue;
      }

      const primaryShapeId = shapes['0'] || shapes['1'];
      const returnShapeId = shapes['1'] || null;

      await BusRoute.updateOne(
        { routeNumber: route.routeNumber },
        { $set: { shapeId: primaryShapeId, shapeIdReturn: returnShapeId } }
      );

      console.log(`   ✅ Route ${route.routeNumber} → shapeId: ${primaryShapeId}`);
      updated++;
    }

    console.log(`\n📊 Summary:`);
    console.log(`   ✅ Updated: ${updated} routes`);
    console.log(`   ⚠️  No shape: ${noShape} routes`);
    console.log(`\n🎉 Done!`);

  } catch (error) {
    console.error('❌ Update failed:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
};

updateRoutesWithShapes();