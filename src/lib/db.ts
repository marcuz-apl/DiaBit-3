import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { calculateMCM } from './mcm';

const dbDir = path.join(process.cwd(), 'data');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = path.join(dbDir, 'diabit.db');

// Ensure single database connection in Next.js dev hot-reloading
let db: Database.Database;
if (process.env.NODE_ENV === 'production') {
  db = new Database(dbPath);
} else {
  if (!(global as any)._sqliteDb) {
    (global as any)._sqliteDb = new Database(dbPath);
  }
  db = (global as any)._sqliteDb;
}

// Enable foreign key support
db.pragma('foreign_keys = ON');

/**
 * Initialize schema and seed default data
 */
export function initDb() {
  // Create tables
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('Admin', 'Engineer')),
      preferences TEXT DEFAULT '{}'
    );

    CREATE TABLE IF NOT EXISTS assets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('Country', 'State/Province', 'GeoBasin', 'Field', 'Well', 'Slot')),
      parent_id INTEGER,
      FOREIGN KEY (parent_id) REFERENCES assets(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS well_settings (
      slot_id INTEGER PRIMARY KEY,
      easting REAL DEFAULT 0.0,
      northing REAL DEFAULT 0.0,
      elevation REAL DEFAULT 0.0,
      unit TEXT DEFAULT 'metric' CHECK(unit IN ('metric', 'imperial')),
      FOREIGN KEY (slot_id) REFERENCES assets(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS trajectories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      slot_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('Plan', 'Survey')),
      is_definite INTEGER DEFAULT 0 CHECK(is_definite IN (0, 1)),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (slot_id) REFERENCES assets(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS trajectory_points (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      trajectory_id INTEGER NOT NULL,
      measured_depth REAL NOT NULL,
      inclination REAL NOT NULL,
      azimuth REAL NOT NULL,
      tvd REAL DEFAULT 0.0,
      easting REAL DEFAULT 0.0,
      northing REAL DEFAULT 0.0,
      subsea_tvd REAL DEFAULT 0.0,
      dogleg_severity REAL DEFAULT 0.0,
      x_offset REAL DEFAULT 0.0,
      y_offset REAL DEFAULT 0.0,
      z_offset REAL DEFAULT 0.0,
      sequence_order INTEGER NOT NULL,
      FOREIGN KEY (trajectory_id) REFERENCES trajectories(id) ON DELETE CASCADE
    );
  `);

  // Seed default users if empty
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };
  if (userCount.count === 0) {
    db.prepare('INSERT INTO users (username, password, role, preferences) VALUES (?, ?, ?, ?)').run(
      'admin',
      'admin123',
      'Admin',
      JSON.stringify({ theme: 'dark', unit: 'metric' })
    );
    db.prepare('INSERT INTO users (username, password, role, preferences) VALUES (?, ?, ?, ?)').run(
      'engineer',
      'engineer123',
      'Engineer',
      JSON.stringify({ theme: 'dark', unit: 'metric' })
    );
  }

  // Seed default assets tree if empty
  const assetCount = db.prepare('SELECT COUNT(*) as count FROM assets').get() as { count: number };
  if (assetCount.count === 0) {
    // Tree: Canada -> Alberta -> Western Canada -> Pembina -> PEM-101 -> Slot-A1
    const runInsert = db.prepare('INSERT INTO assets (name, type, parent_id) VALUES (?, ?, ?)');
    
    const countryResult = runInsert.run('Canada', 'Country', null);
    const countryId = countryResult.lastInsertRowid;

    const stateResult = runInsert.run('Alberta', 'State/Province', countryId);
    const stateId = stateResult.lastInsertRowid;

    const basinResult = runInsert.run('Western Canada', 'GeoBasin', stateId);
    const basinId = basinResult.lastInsertRowid;

    const fieldResult = runInsert.run('Pembina', 'Field', basinId);
    const fieldId = fieldResult.lastInsertRowid;

    const wellResult = runInsert.run('PEM-101', 'Well', fieldId);
    const wellId = wellResult.lastInsertRowid;

    const slotResult = runInsert.run('Slot-A1', 'Slot', wellId);
    const slotId = slotResult.lastInsertRowid;

    // Seed default settings for Slot-A1
    db.prepare('INSERT INTO well_settings (slot_id, easting, northing, elevation, unit) VALUES (?, ?, ?, ?, ?)').run(
      slotId,
      500000.0,
      5800000.0,
      120.0,
      'metric'
    );

    // Create a default Plan and Survey for Slot-A1
    const trajInsert = db.prepare('INSERT INTO trajectories (slot_id, name, type, is_definite) VALUES (?, ?, ?, ?)');
    
    const planResult = trajInsert.run(slotId, 'Plan v1', 'Plan', 1);
    const planId = planResult.lastInsertRowid;

    const surveyResult = trajInsert.run(slotId, 'Survey Actual', 'Survey', 1);
    const surveyId = surveyResult.lastInsertRowid;

    // Default Plan Points
    const planPoints = [
      { measuredDepth: 0, inclination: 0, azimuth: 0 },
      { measuredDepth: 100, inclination: 0, azimuth: 0 },
      { measuredDepth: 500, inclination: 10, azimuth: 45 },
      { measuredDepth: 1000, inclination: 25, azimuth: 45 },
      { measuredDepth: 1500, inclination: 25, azimuth: 45 },
    ];

    // Default Survey Points
    const surveyPoints = [
      { measuredDepth: 0, inclination: 0, azimuth: 0 },
      { measuredDepth: 100, inclination: 0.2, azimuth: 10 },
      { measuredDepth: 300, inclination: 4.5, azimuth: 42 },
      { measuredDepth: 600, inclination: 14.2, azimuth: 46 },
      { measuredDepth: 900, inclination: 21.8, azimuth: 44 },
      { measuredDepth: 1200, inclination: 24.9, azimuth: 45 },
    ];

    // Calculate details and insert for Canada
    savePoints(planId, planPoints, { easting: 500000.0, northing: 5800000.0, elevation: 120.0, unit: 'metric' });
    savePoints(surveyId, surveyPoints, { easting: 500000.0, northing: 5800000.0, elevation: 120.0, unit: 'metric' });

    // Tree: USA -> Texas -> Permian Basin -> Midland -> MID-202 -> Slot-B1
    const usaResult = runInsert.run('USA', 'Country', null);
    const usaId = usaResult.lastInsertRowid;

    const texasResult = runInsert.run('Texas', 'State/Province', usaId);
    const texasId = texasResult.lastInsertRowid;

    const permianResult = runInsert.run('Permian Basin', 'GeoBasin', texasId);
    const permianId = permianResult.lastInsertRowid;

    const midlandResult = runInsert.run('Midland', 'Field', permianId);
    const midlandId = midlandResult.lastInsertRowid;

    const midWellResult = runInsert.run('MID-202', 'Well', midlandId);
    const midWellId = midWellResult.lastInsertRowid;

    const slotB1Result = runInsert.run('Slot-B1', 'Slot', midWellId);
    const slotB1Id = slotB1Result.lastInsertRowid;

    // Seed default settings for Slot-B1 (Imperial)
    db.prepare('INSERT INTO well_settings (slot_id, easting, northing, elevation, unit) VALUES (?, ?, ?, ?, ?)').run(
      slotB1Id,
      1500000.0,
      10500000.0,
      2800.0,
      'imperial'
    );

    const usaPlanResult = trajInsert.run(slotB1Id, 'Plan v1', 'Plan', 1);
    const usaPlanId = usaPlanResult.lastInsertRowid;

    const usaSurveyResult = trajInsert.run(slotB1Id, 'Survey Actual', 'Survey', 1);
    const usaSurveyId = usaSurveyResult.lastInsertRowid;

    const usaPlanPoints = [
      { measuredDepth: 0, inclination: 0, azimuth: 0 },
      { measuredDepth: 500, inclination: 0, azimuth: 0 },
      { measuredDepth: 2000, inclination: 15, azimuth: 90 },
      { measuredDepth: 4000, inclination: 45, azimuth: 90 },
      { measuredDepth: 6000, inclination: 90, azimuth: 90 },
      { measuredDepth: 10000, inclination: 90, azimuth: 90 },
    ];

    const usaSurveyPoints = [
      { measuredDepth: 0, inclination: 0, azimuth: 0 },
      { measuredDepth: 550, inclination: 0.5, azimuth: 12 },
      { measuredDepth: 1950, inclination: 12.5, azimuth: 88 },
      { measuredDepth: 3900, inclination: 44.0, azimuth: 92 },
      { measuredDepth: 5950, inclination: 89.5, azimuth: 89 },
      { measuredDepth: 9800, inclination: 90.2, azimuth: 91 },
    ];

    savePoints(usaPlanId, usaPlanPoints, { easting: 1500000.0, northing: 10500000.0, elevation: 2800.0, unit: 'imperial' });
    savePoints(usaSurveyId, usaSurveyPoints, { easting: 1500000.0, northing: 10500000.0, elevation: 2800.0, unit: 'imperial' });
  }
}

/**
 * Saves points to a trajectory, recalculating their coordinates using MCM
 */
export function savePoints(
  trajectoryId: number | bigint,
  rawPoints: { measuredDepth: number; inclination: number; azimuth: number }[],
  ref: { easting: number; northing: number; elevation: number; unit: 'metric' | 'imperial' }
) {
  // Recalculate everything via MCM
  const calculated = calculateMCM(rawPoints, ref);

  db.transaction(() => {
    // Delete existing points
    db.prepare('DELETE FROM trajectory_points WHERE trajectory_id = ?').run(trajectoryId);

    // Insert new points
    const insertStmt = db.prepare(`
      INSERT INTO trajectory_points (
        trajectory_id, measured_depth, inclination, azimuth,
        tvd, easting, northing, subsea_tvd, dogleg_severity,
        x_offset, y_offset, z_offset, sequence_order
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    calculated.forEach((pt, index) => {
      insertStmt.run(
        trajectoryId,
        pt.measuredDepth,
        pt.inclination,
        pt.azimuth,
        pt.tvd,
        pt.easting,
        pt.northing,
        pt.subseaTvd,
        pt.dls,
        pt.xOffset,
        pt.yOffset,
        pt.zOffset,
        index
      );
    });
  })();
}

// Initialize the database on load
initDb();

export default db;
