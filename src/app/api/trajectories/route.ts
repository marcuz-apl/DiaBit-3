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

// POST /api/trajectories - Create a new Plan or Survey
export async function POST(req: NextRequest) {
  try {
    const user = await isAuthenticated(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { slot_id, name, type, is_definite } = await req.json();

    if (!slot_id || !name || !type) {
      return NextResponse.json({ error: 'slot_id, name, and type are required' }, { status: 400 });
    }

    // Check if slot exists
    const slot = db.prepare('SELECT id FROM assets WHERE id = ? AND type = "Slot"').get(slot_id);
    if (!slot) {
      return NextResponse.json({ error: 'Slot not found' }, { status: 404 });
    }

    // Get wellhead reference settings for this slot
    const ref = db.prepare('SELECT easting, northing, elevation, unit FROM well_settings WHERE slot_id = ?').get(slot_id) as {
      easting: number;
      northing: number;
      elevation: number;
      unit: 'metric' | 'imperial';
    } | undefined;

    const wellRef = ref || { easting: 0.0, northing: 0.0, elevation: 0.0, unit: 'metric' as const };

    const defValue = is_definite ? 1 : 0;

    let trajId: bigint | number;

    db.transaction(() => {
      // If setting as definite, remove is_definite from others of the same type under this slot
      if (defValue === 1) {
        db.prepare('UPDATE trajectories SET is_definite = 0 WHERE slot_id = ? AND type = ?').run(slot_id, type);
      } else {
        // If it's the first trajectory of this type for the slot, make it definite by default
        const count = db.prepare('SELECT COUNT(*) as count FROM trajectories WHERE slot_id = ? AND type = ?').get(slot_id, type) as { count: number };
        if (count.count === 0) {
          db.prepare('UPDATE trajectories SET is_definite = 0 WHERE slot_id = ? AND type = ?').run(slot_id, type);
        }
      }

      // Check if there are no definite trajectories for this type and slot, make this one definite
      const hasDefinite = db.prepare('SELECT COUNT(*) as count FROM trajectories WHERE slot_id = ? AND type = ? AND is_definite = 1').get(slot_id, type) as { count: number };
      const finalDefValue = (hasDefinite.count === 0) ? 1 : defValue;

      const runInsert = db.prepare('INSERT INTO trajectories (slot_id, name, type, is_definite) VALUES (?, ?, ?, ?)').run(
        slot_id,
        name,
        type,
        finalDefValue
      );
      trajId = runInsert.lastInsertRowid;

      // Seed with a default starting point at MD=0, Inc=0, Az=0
      savePoints(trajId, [{ measuredDepth: 0, inclination: 0, azimuth: 0 }], wellRef);
    })();

    return NextResponse.json({
      success: true,
      trajectory: {
        id: Number(trajId!),
        slot_id,
        name,
        type,
        is_definite: defValue,
      },
    });
  } catch (error: any) {
    console.error('Create trajectory error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
