import { ExtractTablesWithRelations } from "drizzle-orm";
import {
  NodePgDatabase,
  NodePgQueryResultHKT,
} from "drizzle-orm/node-postgres";
import { PgTransaction } from "drizzle-orm/pg-core";
import { Pool } from "pg";
import { User } from "../models/User";

declare global {
  namespace NodeJS {
    interface ProcessEnv extends Dict<string> {
      DB_USER?: string | undefined;
      DB_PASSWORD?: string | undefined;
      DB_HOST?: string | undefined;
      DB_PORT?: string | undefined;
      DB_NAME?: string | undefined;

      PORT?: string | undefined;
      JWT_SECRET: string;
      FRONTEND_API: string;
      GEMINI_API_KEY: string;
    }
  }

  namespace Express {
    interface Request {
      user?: Omit<User, "password">;
    }
  }

  function parseInt(string?: string | number, radix?: number): number;

  type DbOrTx =
    | (NodePgDatabase<Record<string, never>> & { $client: Pool })
    | PgTransaction<
        NodePgQueryResultHKT,
        Record<string, never>,
        ExtractTablesWithRelations<Record<string, never>>
      >;

  type InsertModel<T extends object & { id: number; createdAt?: Date }> = Omit<
    T,
    "id" | "createdAt"
  >;

  type JwtToken = { id: number; iat?: number };
}

export {};
