/**
 * IMPORT SHAPES SCRIPT
 * Reads shapes.txt from GTFS data and imports into MongoDB
 * Usage: node scripts/importShapes.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { parse as csv } from 'csv-parse/sync';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import dns from 'dns';
import Shape from '../models/Shape.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ✅ FIX: Point dotenv to the .env file in back-end/ (one level up from scripts/)
dotenv.config({ path: path.join(__dirname, '../.env') });

dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);

const importShapes = async () => {
  console.log('🚀 Starting shapes import...');

  try {
    await mongoose.connect(process.env.MONGO_URL);
    console.log('✅ DB is connected successfully');
  } catch (error) {
    console.log(`Connection Errorrrrrr: ${error}`);
    process.exit(1);
  }

  try {
    const shapesPath = path.join(__dirname, '../data/shapes.txt');

    if (!fs.existsSync(shapesPath)) {
      console.error('❌ shapes.txt not found at:', shapesPath);
      console.error('   Make sure shapes.txt is in back-end/data/');
      process.exit(1);
    }

    const fileContent = fs.readFileSync(shapesPath, 'utf8');

    const records = csv(fileContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
      quote: '"',
      relax_quotes: true,
    });

    console.log(`📄 Read ${records.length} rows from shapes.txt`);

    const shapesMap = new Map();

    for (const row of records) {
      const shapeId = row.shape_id?.replace(/"/g, '').trim();
      const lat = parseFloat(row.shape_pt_lat);
      const lng = parseFloat(row.shape_pt_lon);
      const sequence = parseInt(row.shape_pt_sequence);
      const distTraveled = parseFloat(row.shape_dist_traveled) || 0;

      if (!shapeId || isNaN(lat) || isNaN(lng) || isNaN(sequence)) continue;

      if (!shapesMap.has(shapeId)) {
        shapesMap.set(shapeId, { points: [], maxDist: 0 });
      }

      shapesMap.get(shapeId).points.push({ lat, lng, sequence, distTraveled });
      if (distTraveled > shapesMap.get(shapeId).maxDist) {
        shapesMap.get(shapeId).maxDist = distTraveled;
      }
    }

    console.log(`🗺️  Found ${shapesMap.size} unique shapes`);

    const bulkOps = [];

    for (const [shapeId, data] of shapesMap) {
      data.points.sort((a, b) => a.sequence - b.sequence);
      const coordinates = data.points.map(p => ({ lat: p.lat, lng: p.lng }));

      bulkOps.push({
        updateOne: {
          filter: { shapeId },
          update: {
            $set: {
              shapeId,
              coordinates,
              pointCount: coordinates.length,
              totalDistance: Math.round(data.maxDist),
            },
          },
          upsert: true,
        },
      });
    }

    const BATCH_SIZE = 50;
    let imported = 0;

    for (let i = 0; i < bulkOps.length; i += BATCH_SIZE) {
      const batch = bulkOps.slice(i, i + BATCH_SIZE);
      await Shape.bulkWrite(batch, { ordered: false });
      imported += batch.length;
      console.log(`   ✅ Imported ${imported}/${bulkOps.length} shapes...`);
    }

    const totalShapes = await Shape.countDocuments();
    console.log(`\n🎉 Done! ${totalShapes} shapes now in MongoDB`);

  } catch (error) {
    console.error('❌ Import failed:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
};

importShapes();