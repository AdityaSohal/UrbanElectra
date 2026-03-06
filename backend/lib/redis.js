import Redis from "ioredis";
import dotenv from "dotenv";

dotenv.config();

export const redis = new Redis(process.env.UPSTASH_REDIS_URL, {
	tls: {
		rejectUnauthorized: false, // required for Upstash rediss:// connections
	},
	maxRetriesPerRequest: 3,
});

redis.on("connect", () => {
	console.log("✅ Redis connected");
});

redis.on("error", (err) => {
	console.error("❌ Redis connection error:", err.message);
});