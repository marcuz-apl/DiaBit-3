import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

// Helper to check authentication
async function isAuthenticated(req: NextRequest) {
  // Simple check for dev/local or through cookie
  const session = req.cookies.get('diabit_session')?.value;
  if (!session) return null;
  try {
    return JSON.parse(session);
  } catch {
    return null;
  }
}

// GET /api/assets - Build the hierarchical tree
export async function GET() {
  try {
    // 1. Fetch all assets
    const assets = db.prepare('SELECT * FROM assets').all() as any[];
    
    // 2. Fetch all trajectories
    const trajectories = db.prepare('SELECT id, slot_id, name, type, is_definite FROM trajectories').all() as any[];

    // 3. Helper to group trajectories by slot
    const trajBySlot: Record<number, { plans: any[]; surveys: any[] }> = {};
    trajectories.forEach((t) => {
      if (!trajBySlot[t.slot_id]) {
        trajBySlot[t.slot_id] = { plans: [], surveys: [] };
      }
      if (t.type === 'Plan') {
        trajBySlot[t.slot_id].plans.push({
          id: t.id,
          name: t.name,
          type: 'Plan',
          isDefinite: t.is_definite === 1,
          slotId: t.slot_id,
        });
      } else {
        trajBySlot[t.slot_id].surveys.push({
          id: t.id,
          name: t.name,
          type: 'Survey',
          isDefinite: t.is_definite === 1,
          slotId: t.slot_id,
        });
      }
    });

    // 4. Map assets by ID for easy lookup
    const assetMap: Record<number, any> = {};
    assets.forEach((a) => {
      assetMap[a.id] = {
        id: a.id,
        name: a.name,
        type: a.type,
        parent_id: a.parent_id,
        children: [],
      };
    });

    // 5. Build trees, injecting virtual folders for Slots
    const rootNodes: any[] = [];

    assets.forEach((a) => {
      const node = assetMap[a.id];
      if (node.type === 'Slot') {
        const slotTrajs = trajBySlot[a.id] || { plans: [], surveys: [] };
        node.children = [
          {
            id: `plans-folder-${a.id}`,
            name: 'Plans',
            type: 'Folder',
            slotId: a.id,
            children: slotTrajs.plans,
          },
          {
            id: `surveys-folder-${a.id}`,
            name: 'Surveys',
            type: 'Folder',
            slotId: a.id,
            children: slotTrajs.surveys,
          },
        ];
      }

      if (a.parent_id === null) {
        rootNodes.push(node);
      } else {
        const parent = assetMap[a.parent_id];
        if (parent) {
          parent.children.push(node);
        }
      }
    });

    return NextResponse.json(rootNodes);
  } catch (error: any) {
    console.error('Fetch assets error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

// POST /api/assets - Add a new asset node
export async function POST(req: NextRequest) {
  try {
    const user = await isAuthenticated(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { name, type, parent_id } = await req.json();

    if (!name || !type) {
      return NextResponse.json({ error: 'Name and type are required' }, { status: 400 });
    }

    const insertResult = db.prepare('INSERT INTO assets (name, type, parent_id) VALUES (?, ?, ?)').run(
      name,
      type,
      parent_id || null
    );

    const assetId = insertResult.lastInsertRowid;

    // If it's a Slot, automatically create default well settings
    if (type === 'Slot') {
      db.prepare('INSERT INTO well_settings (slot_id, easting, northing, elevation, unit) VALUES (?, ?, ?, ?, ?)').run(
        assetId,
        0.0,
        0.0,
        0.0,
        'metric'
      );
    }

    return NextResponse.json({
      success: true,
      asset: {
        id: Number(assetId),
        name,
        type,
        parent_id,
      },
    });
  } catch (error: any) {
    console.error('Create asset error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

// DELETE /api/assets - Delete an asset node
export async function DELETE(req: NextRequest) {
  try {
    const user = await isAuthenticated(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const idStr = searchParams.get('id');
    if (!idStr) {
      return NextResponse.json({ error: 'Asset ID is required' }, { status: 400 });
    }

    const id = parseInt(idStr, 10);
    db.prepare('DELETE FROM assets WHERE id = ?').run(id);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Delete asset error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
