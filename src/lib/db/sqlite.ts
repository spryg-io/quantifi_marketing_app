import Database from "better-sqlite3";
import path from "path";

const DB_PATH = path.join(process.cwd(), "dsp_entries.db");

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
