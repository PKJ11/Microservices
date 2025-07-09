import express from "express";
import dotenv from "dotenv";
import blogRoutes from "./routes/blog.js";
import { createClient } from "redis";
import cors from "cors";
import { startCacheConsumer } from "./utils/consumer.js";

dotenv.config();

const app = express();

app.use(express.json());
app.use(cors());

const port = process.env.PORT;

startCacheConsumer();

export const redisClient = createClient({
  url: process.env.REDIS_URL,
  socket: {
    tls: true,
    rejectUnauthorized: false,
    connectTimeout: 10000,
    keepAlive: 10000, // Send keepalive every 10 seconds
    reconnectStrategy: (retries) => {
      if (retries > 5) {
        console.log('Max Redis reconnection attempts reached');
        return new Error('Max retries reached');
      }
      return Math.min(retries * 500, 5000); // Exponential backoff
    }
  }
});

// Add robust error handling
redisClient.on('error', (err) => {
  console.error('Redis Client Error:', err.message);
});

redisClient.on('ready', () => {
  console.log('Redis connection is ready');
});

redisClient.on('reconnecting', () => {
  console.log('Redis client reconnecting...');
});

redisClient.on('end', () => {
  console.log('Redis connection closed');
});

redisClient
  .connect()
  .then(() => console.log("Connected to redis"))
  .catch(console.error);

  // Ping Redis every minute to keep connection alive
setInterval(async () => {
  try {
    await redisClient.ping();
    console.log('Redis keepalive ping successful');
  } catch (err) {
    console.error('Redis keepalive ping failed:', err);
  }
}, 60000); // 60 seconds
app.use("/api/v1", blogRoutes);

app.get('/',(req,res)=>{
  console.log("backend is working.....")
  res.send("backend for blog is working")
})

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});