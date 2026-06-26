import { NextRequest, NextResponse } from 'next/server';
import db, { savePoints } from '@/lib/db';

async function isAuthenticated(req: NextRequest) {
  const session = req.cookies.get('diabit_session')?.value;
  if (!session) return null;
  try {
    return JSON.parse(session);
  } catch {
    return null;
  }
}

// GET /api/settings?slotId=... - Retrieve reference settings for a Slot
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const slotIdStr = searchParams.get('slotId');
    if (!slotIdStr) {
      return NextResponse.json({ error: 'slotId is required' }, { status: 400 });
    }

    const slotId = parseInt(slotIdStr, 10);
    const settings = db.prepare('SELECT * FROM well_settings WHERE slot_id = ?').get(slotId) as any;

    if (!settings) {
      return NextResponse.json({
        slotId,
        easting: 0,
        northing: 0,
        elevation: 0,
        unit: 'metric',
      });
    }

    return NextResponse.json({
      slotId: settings.slot_id,
      easting: settings.easting,
      northing: settings.northing,
      elevation: settings.elevation,
      unit: settings.unit,
    });
  } catch (error: any) {
    console.error('Fetch settings error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

// PUT /api/settings - Update reference settings and recalculate associated trajectories
export async function PUT(req: NextRequest) {
  try {
    const user = await isAuthenticated(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { slotId, easting, northing, elevation, unit } = await req.json();

    if (slotId === undefined || easting === undefined || northing === undefined || elevation === undefined || !unit) {
      return NextResponse.json({ error: 'slotId, easting, northing, elevation, and unit are required' }, { status: 400 });
    }

    db.transaction(() => {
      // 1. Update or Insert settings
      const settingsExist = db.prepare('SELECT slot_id FROM well_settings WHERE slot_id = ?').get(slotId);
      if (settingsExist) {
        db.prepare(`
          UPDATE well_settings
          SET easting = ?, northing = ?, elevation = ?, unit = ?
          WHERE slot_id = ?
        `).run(easting, northing, elevation, unit, slotId);
      } else {
        db.prepare(`
          INSERT INTO well_settings (slot_id, easting, northing, elevation, unit)
          VALUES (?, ?, ?, ?, ?)
        `).run(slotId, easting, northing, elevation, unit);
      }

      // 2. Fetch all trajectories for this slot
      const trajectories = db.prepare('SELECT id FROM trajectories WHERE slot_id = ?').all(slotId) as { id: number }[];

      // 3. For each trajectory, fetch its raw points and recalculate with new settings
      const newRef = { easting, northing, elevation, unit };

      trajectories.forEach((t) => {
        const rawPoints = db.prepare(`
          SELECT measured_depth, inclination, azimuth
          FROM trajectory_points
          WHERE trajectory_id = ?
          ORDER BY sequence_order ASC
        `).all(t.id) as { measured_depth: number; inclination: number; azimuth: number }[];

        const formattedRawPoints = rawPoints.map((pt) => ({
          measuredDepth: pt.measured_depth,
          inclination: pt.inclination,
          azimuth: pt.azimuth,
        }));

        savePoints(t.id, formattedRawPoints, newRef);
      });
    })();

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Update settings error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
