import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";
import { CLIENT_TYPES, CUSTOMER_DISCOUNT, DOCUMENT_TYPES, SHIPPING_METHOD_SURCHARGE, SHIPPING_METHODS } from "@/src/app/api/constants";
import { hashPassword } from "@/src/lib/password";

const DB_DIR = path.join(process.cwd(), "data");
const DB_PATH = path.join(DB_DIR, "pca-fastexpress.db");

const requiredEnvironment = (name: "DEFAULT_USER" | "DEFAULT_USER_NAME" | "DEFAULT_PASSWORD") => {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Falta la variable de entorno requerida: ${name}`);
  return value;
};

const defaultUser = () => ({
  username: requiredEnvironment("DEFAULT_USER"),
  name: requiredEnvironment("DEFAULT_USER_NAME"),
  password: requiredEnvironment("DEFAULT_PASSWORD"),
});

const createTables = (db: Database.Database) => {
  db.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version INTEGER PRIMARY KEY,
      applied_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS client_types (
      id INTEGER PRIMARY KEY,
      label TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS document_types (
      id INTEGER PRIMARY KEY,
      label TEXT NOT NULL UNIQUE
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
    CREATE TABLE IF NOT EXISTS clients (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      document_type_id INTEGER NOT NULL REFERENCES document_types(id),
      document_number TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(document_type_id, document_number)
    );
    CREATE TABLE IF NOT EXISTS shipping_quotes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      client_name TEXT NOT NULL,
      client_identification TEXT NOT NULL,
      document_type_id INTEGER REFERENCES document_types(id),
      client_id INTEGER REFERENCES clients(id),
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
};

const hasColumn = (db: Database.Database, table: string, column: string) =>
  (db.prepare(`PRAGMA table_info(${table})`).all() as { name: string }[]).some((item) => item.name === column);

const addColumnIfMissing = (db: Database.Database, table: string, definition: string, column: string) => {
  if (!hasColumn(db, table, column)) db.exec(`ALTER TABLE ${table} ADD COLUMN ${definition}`);
};

const seedCatalogs = (db: Database.Database) => {
  const insertClientType = db.prepare("INSERT OR IGNORE INTO client_types (id, label) VALUES (@id, @label)");
  const insertDocumentType = db.prepare("INSERT OR IGNORE INTO document_types (id, label) VALUES (@id, @label)");
  const insertShippingMethod = db.prepare("INSERT OR IGNORE INTO shipping_methods (id, label) VALUES (@id, @label)");
  const insertDiscount = db.prepare("INSERT OR IGNORE INTO customer_discounts (id, label, client_type_id, value) VALUES (@id, @label, @client_type_id, @value)");
  const insertSurcharge = db.prepare("INSERT OR IGNORE INTO shipping_method_surcharges (id, label, shipping_method_id, value) VALUES (@id, @label, @shipping_method_id, @value)");

  db.transaction(() => {
    CLIENT_TYPES.forEach((item) => insertClientType.run(item));
    DOCUMENT_TYPES.forEach((item) => insertDocumentType.run(item));
    SHIPPING_METHODS.forEach((item) => insertShippingMethod.run(item));
    CUSTOMER_DISCOUNT.forEach((item) => insertDiscount.run(item));
    SHIPPING_METHOD_SURCHARGE.forEach((item) => insertSurcharge.run(item));
  })();
};

const seedDefaultUser = (db: Database.Database) => {
  const user = defaultUser();
  db.prepare("INSERT OR IGNORE INTO users (username, name, password_hash) VALUES (?, ?, ?)")
    .run(user.username, user.name, hashPassword(user.password));
};

const backfillClients = (db: Database.Database) => {
  db.prepare("UPDATE shipping_quotes SET document_type_id = 1 WHERE document_type_id IS NULL").run();
  db.prepare(`
    INSERT OR IGNORE INTO clients (name, document_type_id, document_number)
    SELECT client_name, document_type_id, client_identification
    FROM shipping_quotes
  `).run();
  db.prepare(`
    UPDATE shipping_quotes
    SET client_id = (
      SELECT clients.id FROM clients
      WHERE clients.document_type_id = shipping_quotes.document_type_id
        AND clients.document_number = shipping_quotes.client_identification
    )
    WHERE client_id IS NULL
  `).run();
};

const seedInitialQuotes = (db: Database.Database) => {
  const quoteCount = db.prepare("SELECT COUNT(*) AS count FROM shipping_quotes").get() as { count: number };
  if (quoteCount.count > 0) return;

  const responsible = db.prepare("SELECT id FROM users ORDER BY id LIMIT 1").get() as { id: number } | undefined;
  if (!responsible) return;

  const createClient = db.prepare("INSERT OR IGNORE INTO clients (name, document_type_id, document_number) VALUES (?, ?, ?)");
  const findClient = db.prepare("SELECT id FROM clients WHERE document_type_id = ? AND document_number = ?");
  const createQuote = db.prepare(`
    INSERT INTO shipping_quotes (
      client_name, client_identification, document_type_id, client_id, client_type_id,
      shipping_method_id, weight, calculation_weight, discount, surcharge, total, responsible_id
    ) VALUES (
      @client_name, @client_identification, @document_type_id, @client_id, @client_type_id,
      @shipping_method_id, @weight, @calculation_weight, @discount, @surcharge, @total, @responsible_id
    )
  `);

  db.transaction(() => {
    const samples = [
      { client_name: "Mariana Torres", client_identification: "10203040", document_type_id: 1, client_type_id: 2, shipping_method_id: 2, weight: 3, calculation_weight: 2, discount: "10%", surcharge: "25%", total: 6.75 },
      { client_name: "Comercial Andina S.A.S.", client_identification: "901234567", document_type_id: 3, client_type_id: 1, shipping_method_id: 1, weight: 7, calculation_weight: 4, discount: "0%", surcharge: "0%", total: 28 },
    ];
    samples.forEach((sample) => {
      createClient.run(sample.client_name, sample.document_type_id, sample.client_identification);
      const client = findClient.get(sample.document_type_id, sample.client_identification) as { id: number };
      createQuote.run({ ...sample, client_id: client.id, responsible_id: responsible.id });
    });
  })();
};

type Migration = { version: number; up: (db: Database.Database) => void };

const migrations: Migration[] = [
  { version: 1, up: createTables },
  { version: 2, up: (db) => addColumnIfMissing(db, "shipping_quotes", "responsible_id INTEGER REFERENCES users(id)", "responsible_id") },
  { version: 3, up: (db) => { seedCatalogs(db); seedDefaultUser(db); } },
  {
    version: 4,
    up: (db) => {
      addColumnIfMissing(db, "shipping_quotes", "document_type_id INTEGER REFERENCES document_types(id)", "document_type_id");
      addColumnIfMissing(db, "shipping_quotes", "client_id INTEGER REFERENCES clients(id)", "client_id");
      backfillClients(db);
    },
  },
  { version: 5, up: seedInitialQuotes },
];

const runMigrations = (db: Database.Database) => {
  createTables(db);
  const applied = new Set((db.prepare("SELECT version FROM schema_migrations").all() as { version: number }[]).map((item) => item.version));
  migrations.forEach((migration) => {
    if (applied.has(migration.version)) return;
    db.transaction(() => {
      migration.up(db);
      db.prepare("INSERT INTO schema_migrations (version) VALUES (?)").run(migration.version);
    })();
  });
};

export const initDB = () => {
  fs.mkdirSync(DB_DIR, { recursive: true });
  const db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  runMigrations(db);
  return db;
};

const SCHEMA_VERSION = 5;
const globalForDB = globalThis as unknown as { db?: Database.Database; dbSchemaVersion?: number };

export const getDB = () => {
  if (!globalForDB.db) globalForDB.db = initDB();
  else if (globalForDB.dbSchemaVersion !== SCHEMA_VERSION) runMigrations(globalForDB.db);
  globalForDB.dbSchemaVersion = SCHEMA_VERSION;
  return globalForDB.db;
};
