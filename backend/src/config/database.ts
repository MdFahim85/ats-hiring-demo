import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import env from "./env";

export const pool = new Pool({
  database: env.dbName,
  user: env.dbUser,
  password: env.dbPassword,
  host: env.dbHost,
  port: env.dbPort,
  ssl: {
    rejectUnauthorized: false,
  },
});

export const db = drizzle(pool);
