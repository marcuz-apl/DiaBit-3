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

// GET /api/trajectories/[id] - Fetch detailed trajectory data
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const trajId = parseInt(id, 10);

    const trajectory = db.prepare('SELECT * FROM trajectories WHERE id = ?').get(trajId) as any;
    if (!trajectory) {
      return NextResponse.json({ error: 'Trajectory not found' }, { status: 404 });
    }

    // Get wellhead settings
    const settings = db.prepare('SELECT * FROM well_settings WHERE slot_id = ?').get(trajectory.slot_id) as any;
    const wellSettings = settings || { easting: 0, northing: 0, elevation: 0, unit: 'metric' };

    // Get trajectory points ordered by sequence
    const points = db.prepare('SELECT * FROM trajectory_points WHERE trajectory_id = ? ORDER BY sequence_order ASC').all(trajId) as any[];

    // Map to cleaner camelCase
    const formattedPoints = points.map((p) => ({
      id: p.id,
      measuredDepth: p.measured_depth,
      inclination: p.inclination,
      azimuth: p.azimuth,
      tvd: p.tvd,
      easting: p.easting,
      northing: p.northing,
      subseaTvd: p.subsea_tvd,
      dls: p.dogleg_severity,
      xOffset: p.x_offset,
      yOffset: p.y_offset,
      zOffset: p.z_offset,
      sequenceOrder: p.sequence_order,
    }));

    return NextResponse.json({
      id: trajectory.id,
      name: trajectory.name,
      type: trajectory.type,
      slotId: trajectory.slot_id,
      isDefinite: trajectory.is_definite === 1,
      wellSettings: {
        easting: wellSettings.easting,
        northing: wellSettings.northing,
        elevation: wellSettings.elevation,
        unit: wellSettings.unit,
      },
      points: formattedPoints,
    });
  } catch (error: any) {
    console.error('Fetch trajectory detail error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

// PUT /api/trajectories/[id] - Update points, name, or definite status
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await isAuthenticated(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const trajId = parseInt(id, 10);

    const body = await req.json();
    const { name, isDefinite, points } = body;

    const trajectory = db.prepare('SELECT * FROM trajectories WHERE id = ?').get(trajId) as any;
    if (!trajectory) {
      return NextResponse.json({ error: 'Trajectory not found' }, { status: 404 });
    }

    db.transaction(() => {
      // 1. Update name if provided
      if (name !== undefined) {
        db.prepare('UPDATE trajectories SET name = ? WHERE id = ?').run(name, trajId);
      }

      // 2. Update is_definite if provided
      if (isDefinite !== undefined) {
        const val = isDefinite ? 1 : 0;
        if (val === 1) {
          // Reset others of same type for the slot
          db.prepare('UPDATE trajectories SET is_definite = 0 WHERE slot_id = ? AND type = ?').run(
            trajectory.slot_id,
            trajectory.type
          );
        }
        db.prepare('UPDATE trajectories SET is_definite = ? WHERE id = ?').run(val, trajId);
      }

      // 3. Update points if provided
      if (points !== undefined && Array.isArray(points)) {
        // Fetch wellhead settings for calculation
        const ref = db.prepare('SELECT easting, northing, elevation, unit FROM well_settings WHERE slot_id = ?').get(trajectory.slot_id) as any;
        const wellRef = ref || { easting: 0.0, northing: 0.0, elevation: 0.0, unit: 'metric' };

        const mappedRawPoints = points.map((p: any) => ({
          measuredDepth: Number(p.measuredDepth),
          inclination: Number(p.inclination),
          azimuth: Number(p.azimuth),
        }));

        savePoints(trajId, mappedRawPoints, wellRef);
      }
    })();

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Update trajectory error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

// DELETE /api/trajectories/[id] - Delete a trajectory
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await isAuthenticated(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const trajId = parseInt(id, 10);

    const trajectory = db.prepare('SELECT * FROM trajectories WHERE id = ?').get(trajId) as any;
    if (!trajectory) {
      return NextResponse.json({ error: 'Trajectory not found' }, { status: 404 });
    }

    db.transaction(() => {
      // Delete points first (due to foreign keys, cascade delete handles it, but let's be explicit or safe)
      db.prepare('DELETE FROM trajectories WHERE id = ?').run(trajId);

      // If the deleted trajectory was definite, automatically make another trajectory definite (if it exists)
      if (trajectory.is_definite === 1) {
        const nextOne = db.prepare('SELECT id FROM trajectories WHERE slot_id = ? AND type = ? LIMIT 1').get(
          trajectory.slot_id,
          trajectory.type
        ) as { id: number } | undefined;

        if (nextOne) {
          db.prepare('UPDATE trajectories SET is_definite = 1 WHERE id = ?').run(nextOne.id);
        }
      }
    })();

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Delete trajectory error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
