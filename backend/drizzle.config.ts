import { defineConfig } from "drizzle-kit";
import env from "./src/config/env";

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/models/*.ts",
  out: "./src/models/migration/",
  dbCredentials: {
    host: env.dbHost,
    port: env.dbPort,
    user: env.dbUser,
    password: env.dbPassword,
    database: env.dbName,
    ssl: false,
  },
  migrations: {
    table: "Sentinel_Migrations",
    schema: "public",
  },
});
