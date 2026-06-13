import { PrismaClient } from "@prisma/client";
import fs from "fs";
import os from "os";
import path from "path";
import { DEMO_DB_BASE64 } from "./demo-db.generated";

// When DATABASE_URL is configured (local dev, real deploys) we use it as-is.
// When it's absent — e.g. a zero-config Vercel import of this repo — we
// bootstrap the bundled demo database into the writable tmp dir so the app
// works immediately. Demo data is ephemeral there (resets on new serverless
// instances); switch to Postgres for persistence (see README).
function resolveDatabaseUrl(): string {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;
  const file = path.join(os.tmpdir(), "zinzino-demo.db");
  if (!fs.existsSync(file)) {
    fs.writeFileSync(file, Buffer.from(DEMO_DB_BASE64, "base64"));
  }
  return `file:${file}`;
}

// Singleton across Next.js dev hot-reloads.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({ datasources: { db: { url: resolveDatabaseUrl() } } });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
