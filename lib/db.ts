
import Database from 'better-sqlite3';
import path from 'path';
import { readFileSync } from 'fs';

// NOTE: For Vercel Production, you should replace this with a Cloud SQLite provider
// like Turso (LibSQL) or Vercel Postgres, as local SQLite files are ephemeral on Serverless.

// Fix: Cast process to any to resolve 'cwd' property missing on type 'Process'
const dbPath = path.join((process as any).cwd(), 'lumina.db');

// Singleton pattern for DB connection
let db: Database.Database;

export function getDb() {
  if (!db) {
    db = new Database(dbPath, { verbose: console.log });
    db.pragma('journal_mode = WAL');
  }
  return db;
}

// Helper to initialize DB from schema
export function initDb() {
  const database = getDb();
  // Fix: Cast process to any to resolve 'cwd' property missing on type 'Process'
  const schemaPath = path.join((process as any).cwd(), 'db', 'schema.sql');
  const schema = readFileSync(schemaPath, 'utf-8');
  database.exec(schema);
  console.log('Database initialized');
}