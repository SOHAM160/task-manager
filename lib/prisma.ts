import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

<<<<<<< HEAD
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error(
    "DATABASE_URL is not set. Create a .env file in the project root with a valid PostgreSQL connection string."
  );
}

const adapter = new PrismaPg({
  connectionString,
=======
const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
>>>>>>> 733e1d5d8aaa1d561483c9dc3bea52ff502641b3
});

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}