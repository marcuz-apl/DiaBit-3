import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

// GET /api/slots/[id]/active - Get definite Plan and Survey for a Slot
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const slotId = parseInt(id, 10);

    // Get wellhead settings
    const settings = db.prepare('SELECT * FROM well_settings WHERE slot_id = ?').get(slotId) as any;
    const wellSettings = settings || { easting: 0, northing: 0, elevation: 0, unit: 'metric' };

    // Fetch definite trajectories for this slot
    const trajectories = db.prepare('SELECT * FROM trajectories WHERE slot_id = ? AND is_definite = 1').all(slotId) as any[];

    const result: { plan: any | null; survey: any | null } = { plan: null, survey: null };

    for (const t of trajectories) {
      const points = db.prepare('SELECT * FROM trajectory_points WHERE trajectory_id = ? ORDER BY sequence_order ASC').all(t.id) as any[];
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

      const trajData = {
        id: t.id,
        name: t.name,
        type: t.type,
        isDefinite: t.is_definite === 1,
        points: formattedPoints,
      };

      if (t.type === 'Plan') {
        result.plan = trajData;
      } else {
        result.survey = trajData;
      }
    }

    return NextResponse.json({
      slotId,
      wellSettings: {
        easting: wellSettings.easting,
        northing: wellSettings.northing,
        elevation: wellSettings.elevation,
        unit: wellSettings.unit,
      },
      ...result,
    });
  } catch (error: any) {
    console.error('Fetch active trajectories error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
