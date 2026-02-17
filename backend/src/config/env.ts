import { config } from "dotenv";

config();

export default {
  dbHost: process.env.DB_HOST || "localhost",
  dbPort: parseInt(process.env.DB_PORT) || 5432,
  dbName: process.env.DB_NAME || "ats-hiring-demo",
  dbPassword: process.env.DB_PASSWORD || "postgres",
  dbUser: process.env.DB_USER || "postgres",
  port: parseInt(process.env.PORT) || 3000,
  jwtSecret: process.env.JWT_SECRET,
  frontend_API: process.env.FRONTEND_API,
  gemini_API: process.env.GEMINI_API_KEY,
  isProduction: process.env.NODE_ENV === "production",
};
