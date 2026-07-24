import { createClient, RedisClientType } from "redis";

const globalForRedis = global as unknown as { redisClient: RedisClientType };

export const redisClient: RedisClientType =
  globalForRedis.redisClient ||
  createClient({
    url: process.env.REDIS_URL || "redis://localhost:6379",
  });

if (!globalForRedis.redisClient) {
  globalForRedis.redisClient = redisClient;
  redisClient.on("error", (err) => console.error("Redis Client Error:", err));
}

export async function ensureRedisConnected() {
  if (!redisClient.isOpen) {
    await redisClient.connect();
  }
}
