import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is required for seed");
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

const currencies = [
  { code: "UAH", name: "Ukrainian hryvnia", minorUnits: 2 },
  { code: "USD", name: "United States dollar", minorUnits: 2 },
  { code: "EUR", name: "Euro", minorUnits: 2 },
  { code: "GBP", name: "British pound sterling", minorUnits: 2 },
  { code: "PLN", name: "Polish zloty", minorUnits: 2 },
] as const;

async function main(): Promise<void> {
  for (const c of currencies) {
    await prisma.currency.upsert({
      where: { code: c.code },
      create: {
        code: c.code,
        name: c.name,
        minorUnits: c.minorUnits,
      },
      update: {
        name: c.name,
        minorUnits: c.minorUnits,
      },
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e: unknown) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
