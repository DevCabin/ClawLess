const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

const root = process.cwd();
const dataDir = path.join(root, 'data');
const schemaPath = path.join(dataDir, 'schema.sql');
const dbPath = path.join(dataDir, 'state.db');

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

if (!fs.existsSync(schemaPath)) {
  console.error('[db:init] Missing data/schema.sql');
  process.exit(1);
}

const schema = fs.readFileSync(schemaPath, 'utf8');
const db = new Database(dbPath);

try {
  db.exec(schema);
  console.log(`[db:init] Database initialized at ${dbPath}`);
} finally {
  db.close();
}

