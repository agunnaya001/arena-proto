#!/usr/bin/env node

const { Client } = require("pg");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

const connectionString = process.env.POSTGRES_URL;

if (!connectionString) {
  console.error("Error: POSTGRES_URL must be set in environment variables");
  process.exit(1);
}

async function runMigration() {
  const client = new Client({ connectionString });

  try {
    console.log("Connecting to database...");
    await client.connect();

    console.log("Reading SQL migration file...");
    const sqlPath = path.join(__dirname, "setup-database.sql");
    const sql = fs.readFileSync(sqlPath, "utf-8");

    console.log("Executing SQL migration...");
    await client.query(sql);

    console.log("✓ Migration completed successfully!");
  } catch (err) {
    console.error("✗ Error running migration:", err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigration();
