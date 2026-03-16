import { PrismaClient } from "../../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient() {
  if (!process.env.DATABASE_URL) {
    throw new Error(
      "DATABASE_URL environment variable is not set. " +
      "Make sure your .env file exists and is loaded before this module runs."
    );
  }

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    // Required for most managed Postgres providers (Supabase, Railway, Render, etc.)
    ssl: process.env.DATABASE_URL?.includes("sslmode=require") ||
         process.env.DATABASE_SSL === "true"
      ? { rejectUnauthorized: false }
      : false,
  });

  const adapter = new PrismaPg(pool);

  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["query"] : [],
  });
}

// Cache the client globally in all environments to prevent pool exhaustion
export const prisma = globalForPrisma.prisma ?? createPrismaClient();

globalForPrisma.prisma = prisma;
