import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import cors from 'cors';
import { db_connection } from './db/dbConnection.js';
import apiRoutes from './routes/index.js';
import passport from './config/passport.js';
import compression from 'compression';

const app = express();


app.use(compression());

app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(passport.initialize());

app.use('/api', apiRoutes);

app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Smart Bus Route Planner API is running',
    timestamp: new Date().toISOString(),
  });
});

app.use((req, res) => {
  res.status(404).json({ success: false, error: 'Route not found' });
});

app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ success: false, error: 'Internal server error' });
});


if (process.argv[1] && process.argv[1].endsWith('app.js')) {
  const PORT = process.env.PORT || 5000;

  await db_connection(); // connect to DB before accepting requests

  app.listen(PORT, () => {
    console.log(`\n Server running on port ${PORT}`);
    console.log(` API: http://localhost:${PORT}/api`);
    console.log(` Health: http://localhost:${PORT}/health\n`);
  });
}

export default app;