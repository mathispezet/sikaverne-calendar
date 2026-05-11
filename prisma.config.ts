import "dotenv/config";
import { defineConfig, env } from "prisma/config";

const isDev = process.env.NODE_ENV !== "production";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    // Seed uniquement en dev — en prod les users sont créés au premier login Authentik
    ...(isDev ? { seed: "tsx prisma/seed.ts" } : {}),
  },
  datasource: {
    url: env("DATABASE_URL"),
  },
});