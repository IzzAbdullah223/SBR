import express from 'express';
import dotenv from 'dotenv';
import { db_Connection } from './db/dbConnection.js';

const app = express();
dotenv.config();

const PORT = process.env.PORT || 3000;
await db_Connection();


app.get('/', (req, res) => {
  res.send('Hello World from Express!');
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});