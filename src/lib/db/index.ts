import { neon } from "@neondatabase/serverless";
import dotenv from "dotenv";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

dotenv.config({
  path: ".env.local",
});

const databaseUrl = process.env.DATABASE_URL as string;
const sql = neon(databaseUrl);

export const db = drizzle(sql, { schema });
