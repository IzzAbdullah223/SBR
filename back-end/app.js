import express from 'express';
import { db_connection } from './db/dbConnection.js';
import dotenv from 'dotenv';


const app = express();
dotenv.config();

const PORT = process.env.PORT || 3000;
await db_connection();


app.get('/', (req, res) => {
  res.send('Hello World from Express!');
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});