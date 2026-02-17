import express from 'express';
import cors from 'cors';
import { db_connection } from './DB/dbConnection.js';
import apiRoutes from './routes/index.js';

const app = express();
await db_connection(); 

/**
 * MIDDLEWARE
 */
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/**
 * API ROUTES
 */
app.use('/api', apiRoutes);

/**
 * HEALTH CHECK
 */
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Smart Bus Route Planner API is running',
    timestamp: new Date().toISOString()
  });
});

/**
 * 404 HANDLER
 */
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found'
  });
});

/**
 * ERROR HANDLER
 */
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error'
  });
});


const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`\n🚀 Server running on port ${PORT}`);
  console.log(`📍 API: http://localhost:${PORT}/api`);
  console.log(`💚 Health: http://localhost:${PORT}/health\n`);
});

export default app;