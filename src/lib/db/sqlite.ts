import Database from "better-sqlite3";
import path from "path";

const DATA_DIR = process.env.SQLITE_DATA_DIR || process.cwd();
const DB_PATH = path.join(DATA_DIR, "dsp_entries.db");

let db: Database.Database | null = null;

function getDb(): Database.Database {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma("journal_mode = WAL");
    db.exec(`
      CREATE TABLE IF NOT EXISTS dsp_entries (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        brand_key TEXT NOT NULL,
        date TEXT NOT NULL,
        spend REAL NOT NULL DEFAULT 0,
        sales REAL NOT NULL DEFAULT 0,
        UNIQUE(brand_key, date)
      )
    `);
    db.exec(`
      CREATE TABLE IF NOT EXISTS cell_highlights (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        page TEXT NOT NULL,
        context_date TEXT NOT NULL,
        cell_key TEXT NOT NULL,
        color TEXT NOT NULL,
        UNIQUE(page, context_date, cell_key)
      )
    `);
    db.exec(`
      CREATE TABLE IF NOT EXISTS cell_overrides (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        page TEXT NOT NULL,
        context_date TEXT NOT NULL,
        cell_key TEXT NOT NULL,
        value REAL NOT NULL,
        UNIQUE(page, context_date, cell_key)
      )
    `);
  }
  return db;
}

export function getDspEntries(date: string): { brand_key: string; date: string; spend: number; sales: number }[] {
  const db = getDb();
  return db
    .prepare("SELECT brand_key, date, spend, sales FROM dsp_entries WHERE date = ?")
    .all(date) as { brand_key: string; date: string; spend: number; sales: number }[];
}

export function getDspEntriesByMonth(yearMonth: string): { brand_key: string; date: string; spend: number; sales: number }[] {
  const db = getDb();
  return db
    .prepare("SELECT brand_key, date, spend, sales FROM dsp_entries WHERE date LIKE ?")
    .all(`${yearMonth}%`) as { brand_key: string; date: string; spend: number; sales: number }[];
}

export function getDspMonthlyTotals(yearMonth: string): Record<string, { spend: number; sales: number }> {
  const db = getDb();
  const rows = db
    .prepare(
      "SELECT brand_key, SUM(spend) as spend, SUM(sales) as sales FROM dsp_entries WHERE date LIKE ? GROUP BY brand_key"
    )
    .all(`${yearMonth}%`) as { brand_key: string; spend: number; sales: number }[];

  const result: Record<string, { spend: number; sales: number }> = {};
  for (const row of rows) {
    result[row.brand_key] = { spend: row.spend, sales: row.sales };
  }
  return result;
}

export function upsertDspEntry(brand_key: string, date: string, spend: number, sales: number): void {
  const db = getDb();
  db.prepare(
    `INSERT INTO dsp_entries (brand_key, date, spend, sales)
     VALUES (?, ?, ?, ?)
     ON CONFLICT(brand_key, date) DO UPDATE SET spend = excluded.spend, sales = excluded.sales`
  ).run(brand_key, date, spend, sales);
}

export function deleteDspEntry(brand_key: string, date: string): void {
  const db = getDb();
  db.prepare("DELETE FROM dsp_entries WHERE brand_key = ? AND date = ?").run(brand_key, date);
}

export function getAllDspEntries(): { brand_key: string; date: string; spend: number; sales: number }[] {
  const db = getDb();
  return db
    .prepare("SELECT brand_key, date, spend, sales FROM dsp_entries ORDER BY date DESC, brand_key")
    .all() as { brand_key: string; date: string; spend: number; sales: number }[];
}

// --- Cell Highlights ---

export function getHighlights(page: string, contextDate: string): Record<string, string> {
  const db = getDb();
  const rows = db
    .prepare("SELECT cell_key, color FROM cell_highlights WHERE page = ? AND context_date = ?")
    .all(page, contextDate) as { cell_key: string; color: string }[];
  const result: Record<string, string> = {};
  for (const row of rows) {
    result[row.cell_key] = row.color;
  }
  return result;
}

export function upsertHighlight(page: string, contextDate: string, cellKey: string, color: string): void {
  const db = getDb();
  db.prepare(
    `INSERT INTO cell_highlights (page, context_date, cell_key, color)
     VALUES (?, ?, ?, ?)
     ON CONFLICT(page, context_date, cell_key) DO UPDATE SET color = excluded.color`
  ).run(page, contextDate, cellKey, color);
}

export function deleteHighlight(page: string, contextDate: string, cellKey: string): void {
  const db = getDb();
  db.prepare("DELETE FROM cell_highlights WHERE page = ? AND context_date = ? AND cell_key = ?")
    .run(page, contextDate, cellKey);
}

export function deleteAllHighlights(page: string, contextDate: string): void {
  const db = getDb();
  db.prepare("DELETE FROM cell_highlights WHERE page = ? AND context_date = ?")
    .run(page, contextDate);
}

// --- Cell Overrides ---

export function getOverrides(page: string, contextDate: string): Record<string, number> {
  const db = getDb();
  const rows = db
    .prepare("SELECT cell_key, value FROM cell_overrides WHERE page = ? AND context_date = ?")
    .all(page, contextDate) as { cell_key: string; value: number }[];
  const result: Record<string, number> = {};
  for (const row of rows) {
    result[row.cell_key] = row.value;
  }
  return result;
}

export function upsertOverride(page: string, contextDate: string, cellKey: string, value: number): void {
  const db = getDb();
  db.prepare(
    `INSERT INTO cell_overrides (page, context_date, cell_key, value)
     VALUES (?, ?, ?, ?)
     ON CONFLICT(page, context_date, cell_key) DO UPDATE SET value = excluded.value`
  ).run(page, contextDate, cellKey, value);
}

export function deleteOverride(page: string, contextDate: string, cellKey: string): void {
  const db = getDb();
  db.prepare("DELETE FROM cell_overrides WHERE page = ? AND context_date = ? AND cell_key = ?")
    .run(page, contextDate, cellKey);
}
