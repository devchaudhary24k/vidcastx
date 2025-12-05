import { Redis } from "ioredis";

import { env } from "./env";

const globalForRedis = global as unknown as { redis: Redis | undefined };

const createRedisClient = () => {
  const client = new Redis({
    host: env.REDIS_HOST,
    port: env.REDIS_PORT,
    password: env.REDIS_PASSWORD,
    maxRetriesPerRequest: null,
  });

  client.on("error", (err) => {
    console.error("[Redis] Connection Error:", err);
  });

  return client;
};

export const redis = globalForRedis.redis ?? createRedisClient();

if (env.NODE_ENV !== "production") {
  globalForRedis.redis = redis;
}
