import { NextRequest, NextResponse } from 'next/server';
import db, { savePoints, initDb } from '@/lib/db';

async function isAdmin(req: NextRequest) {
  const session = req.cookies.get('diabit_session')?.value;
  if (!session) return false;
  try {
    const user = JSON.parse(session);
    return user && user.role === 'Admin';
  } catch {
    return false;
  }
}

// POST /api/admin/database - Dataset Operations
export async function POST(req: NextRequest) {
  try {
    if (!(await isAdmin(req))) {
      return NextResponse.json({ error: 'Forbidden: Admin privilege required' }, { status: 403 });
    }

    const { action, trajectoryId, thresholdDepth, rawPoints } = await req.json();

    if (action === 'reset') {
      // Hard reset database (wipe and reseed)
      db.transaction(() => {
        db.prepare('DELETE FROM trajectory_points').run();
        db.prepare('DELETE FROM trajectories').run();
        db.prepare('DELETE FROM well_settings').run();
        db.prepare('DELETE FROM assets').run();
        db.prepare('DELETE FROM users').run();
      })();
      
      // Trigger initialization which recreates schema and default seed data
      initDb();
      return NextResponse.json({ success: true, message: 'Database reset to default settings' });
    }

    if (action === 'prune_points') {
      if (!trajectoryId || thresholdDepth === undefined) {
        return NextResponse.json({ error: 'trajectoryId and thresholdDepth are required' }, { status: 400 });
      }

      // Delete points below a certain Measured Depth (MD)
      const res = db.prepare('DELETE FROM trajectory_points WHERE trajectory_id = ? AND measured_depth > ?').run(
        trajectoryId,
        thresholdDepth
      );

      // We should recalculate remaining points to ensure correct continuity!
      const trajectory = db.prepare('SELECT slot_id, type FROM trajectories WHERE id = ?').get(trajectoryId) as any;
      if (trajectory) {
        const ref = db.prepare('SELECT easting, northing, elevation, unit FROM well_settings WHERE slot_id = ?').get(trajectory.slot_id) as any;
        const wellRef = ref || { easting: 0, northing: 0, elevation: 0, unit: 'metric' };
        
        const remainingPoints = db.prepare(`
          SELECT measured_depth, inclination, azimuth
          FROM trajectory_points
          WHERE trajectory_id = ?
          ORDER BY sequence_order ASC
        `).all(trajectoryId) as any[];

        const formatted = remainingPoints.map((pt) => ({
          measuredDepth: pt.measured_depth,
          inclination: pt.inclination,
          azimuth: pt.azimuth,
        }));

        savePoints(trajectoryId, formatted, wellRef);
      }

      return NextResponse.json({ success: true, message: `Pruned ${res.changes} points below depth ${thresholdDepth}` });
    }

    if (action === 'bulk_import') {
      if (!trajectoryId || !Array.isArray(rawPoints)) {
        return NextResponse.json({ error: 'trajectoryId and rawPoints array are required' }, { status: 400 });
      }

      const trajectory = db.prepare('SELECT slot_id, type FROM trajectories WHERE id = ?').get(trajectoryId) as any;
      if (!trajectory) {
        return NextResponse.json({ error: 'Trajectory not found' }, { status: 404 });
      }

      const ref = db.prepare('SELECT easting, northing, elevation, unit FROM well_settings WHERE slot_id = ?').get(trajectory.slot_id) as any;
      const wellRef = ref || { easting: 0, northing: 0, elevation: 0, unit: 'metric' };

      const formatted = rawPoints.map((pt: any) => ({
        measuredDepth: Number(pt.measuredDepth),
        inclination: Number(pt.inclination),
        azimuth: Number(pt.azimuth),
      }));

      savePoints(trajectoryId, formatted, wellRef);
      return NextResponse.json({ success: true, message: `Successfully imported ${rawPoints.length} points` });
    }

    return NextResponse.json({ error: 'Invalid database action' }, { status: 400 });
  } catch (error: any) {
    console.error('Database administration error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
