#!/usr/bin/env node
import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function setupDatabase() {
  try {
    console.log("Starting database setup...");

    // Read the SQL migration file
    const sqlPath = path.join(__dirname, "01-init-database.sql");
    const sql = fs.readFileSync(sqlPath, "utf-8");

    // Split by semicolon and filter empty statements
    const statements = sql
      .split(";")
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    console.log(`Found ${statements.length} SQL statements`);

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i] + ";";
      console.log(`[${i + 1}/${statements.length}] Executing...`);

      const { error } = await supabase.rpc("execute_sql", {
        sql: statement,
      });

      if (error && !error.message.includes("already exists")) {
        console.warn(`Warning at statement ${i + 1}:`, error.message);
      } else if (!error) {
        console.log(`✓ Statement ${i + 1} completed`);
      }
    }

    console.log("\nDatabase setup completed!");

    // Verify tables were created
    const { data: tables, error: tablesError } = await supabase
      .from("information_schema.tables")
      .select("table_name")
      .eq("table_schema", "public");

    if (!tablesError) {
      console.log("\nCreated tables:");
      console.log(tables.map((t) => `  - ${t.table_name}`).join("\n"));
    }
  } catch (error) {
    console.error("Database setup failed:", error.message);
    process.exit(1);
  }
}

setupDatabase();
