import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';
import { CLIENT_TYPES, CUSTOMER_DISCOUNT, DEFAULT_USER, SHIPPING_METHOD_SURCHARGE, SHIPPING_METHODS } from '@/src/app/api/constants';
import { hashPassword } from '@/src/lib/password';

const DB_DIR = path.join(process.cwd(), 'data');
const DB_PATH = path.join(DB_DIR, 'pca-fastexpress.db');

const createTables = (db: Database.Database) => {
  db.exec(`
    CREATE TABLE IF NOT EXISTS client_types (
      id INTEGER PRIMARY KEY,
      label TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS shipping_methods (
      id INTEGER PRIMARY KEY,
      label TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS customer_discounts (
      id INTEGER PRIMARY KEY,
      label TEXT NOT NULL,
      client_type_id INTEGER NOT NULL REFERENCES client_types(id),
      value REAL NOT NULL
    );
    CREATE TABLE IF NOT EXISTS shipping_method_surcharges (
      id INTEGER PRIMARY KEY,
      label TEXT NOT NULL,
      shipping_method_id INTEGER NOT NULL REFERENCES shipping_methods(id),
      value REAL NOT NULL
    );
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS sessions (
      token_hash TEXT PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      expires_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS shipping_quotes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      client_name TEXT NOT NULL,
      client_identification TEXT NOT NULL,
      client_type_id INTEGER NOT NULL REFERENCES client_types(id),
      shipping_method_id INTEGER NOT NULL REFERENCES shipping_methods(id),
      weight REAL NOT NULL,
      calculation_weight REAL NOT NULL,
      discount TEXT NOT NULL,
      surcharge TEXT NOT NULL,
      total REAL NOT NULL,
      responsible_id INTEGER REFERENCES users(id),
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);
}

// Bases creadas antes del login no tienen la columna responsible_id
const migrate = (db: Database.Database) => {
  const columns = db.prepare('PRAGMA table_info(shipping_quotes)').all() as { name: string }[];
  if (!columns.some((column) => column.name === 'responsible_id')) {
    db.exec('ALTER TABLE shipping_quotes ADD COLUMN responsible_id INTEGER REFERENCES users(id)');
  }
}

const seedDefaultUser = (db: Database.Database) => {
  db.prepare('INSERT OR IGNORE INTO users (username, name, password_hash) VALUES (?, ?, ?)')
    .run(DEFAULT_USER.username, DEFAULT_USER.name, hashPassword(DEFAULT_USER.password));
}

// Carga los datos de constants.ts; INSERT OR IGNORE evita duplicados en cada inicio
const seed = (db: Database.Database) => {
  const insertClientType = db.prepare('INSERT OR IGNORE INTO client_types (id, label) VALUES (@id, @label)');
  const insertShippingMethod = db.prepare('INSERT OR IGNORE INTO shipping_methods (id, label) VALUES (@id, @label)');
  const insertDiscount = db.prepare('INSERT OR IGNORE INTO customer_discounts (id, label, client_type_id, value) VALUES (@id, @label, @client_type_id, @value)');
  const insertSurcharge = db.prepare('INSERT OR IGNORE INTO shipping_method_surcharges (id, label, shipping_method_id, value) VALUES (@id, @label, @shipping_method_id, @value)');

  db.transaction(() => {
    CLIENT_TYPES.forEach((item) => insertClientType.run(item));
    SHIPPING_METHODS.forEach((item) => insertShippingMethod.run(item));
    CUSTOMER_DISCOUNT.forEach((item) => insertDiscount.run(item));
    SHIPPING_METHOD_SURCHARGE.forEach((item) => insertSurcharge.run(item));
  })();
}

export const initDB = () => {
  fs.mkdirSync(DB_DIR, { recursive: true });
  const db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  setupSchema(db);
  return db;
}

// Subir SCHEMA_VERSION al cambiar tablas o seeds para que se apliquen sin reiniciar next dev
const SCHEMA_VERSION = 2;

const setupSchema = (db: Database.Database) => {
  createTables(db);
  migrate(db);
  seed(db);
  seedDefaultUser(db);
}

// Singleton en globalThis para no abrir conexiones nuevas con el hot reload de next dev
const globalForDB = globalThis as unknown as { db?: Database.Database; dbSchemaVersion?: number };

export const getDB = () => {
  if (!globalForDB.db) {
    globalForDB.db = initDB();
  } else if (globalForDB.dbSchemaVersion !== SCHEMA_VERSION) {
    setupSchema(globalForDB.db);
  }
  globalForDB.dbSchemaVersion = SCHEMA_VERSION;
  return globalForDB.db;
}
