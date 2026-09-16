import { defineConfig } from "drizzle-kit";
import * as dotenv from "dotenv";

dotenv.config();

const sqlHost = process.env.DB_HOST || process.env.AWS_RDS_HOST || process.env.SQL_HOST;
const sqlDbName = process.env.DB_NAME || process.env.AWS_RDS_DB || process.env.SQL_DB_NAME;
const user = process.env.DB_USER || process.env.AWS_RDS_USER || process.env.SQL_ADMIN_USER || process.env.SQL_USER;
const password = process.env.DB_PASSWORD || process.env.AWS_RDS_PASSWORD || process.env.SQL_ADMIN_PASSWORD || process.env.SQL_PASSWORD;

if (!sqlHost) {
  throw new Error("DB_HOST or SQL_HOST must be set in environment variables.");
}
if (!sqlDbName) {
  throw new Error("DB_NAME or SQL_DB_NAME must be set in environment variables.");
}
if (!user) {
  throw new Error("DB_USER or SQL_ADMIN_USER must be set in environment variables.");
}
if (!password) {
  throw new Error("DB_PASSWORD or SQL_ADMIN_PASSWORD must be set in environment variables.");
}
console.log(`Using user: ${user} to connect to database.`);

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  schemaFilter: ["public"],
  dbCredentials: {
    host: sqlHost,
    user: user,
    password: password,
    database: sqlDbName,
    ssl: false,
  },
  verbose: true,
});
