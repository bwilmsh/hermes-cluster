import { PrismaClient } from "@prisma/client";

// Singleton Prisma client. If DATABASE_URL is unset, callers get a clear error
// rather than a crash on first query — keeps the backend bootable in dev without a DB.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function createClient(): PrismaClient {
  if (!process.env.DATABASE_URL) {
    // Return a stub that throws on use but lets the process boot for health checks.
    const stub = new Proxy(
      {},
      {
        get: (_t, prop) => {
          if (prop === "$connect" || prop === "$disconnect" || prop === "$on" || prop === "$use") {
            return () => {};
          }
          throw new Error(
            "Prisma client used without DATABASE_URL. Set DATABASE_URL to connect to PostgreSQL."
          );
        },
      }
    ) as unknown as PrismaClient;
    return stub;
  }
  return new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "warn", "error"] : ["error"],
  });
}

export const prisma: PrismaClient =
  globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
