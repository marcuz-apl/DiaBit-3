import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

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

// GET /api/admin/users - List all users (excluding passwords)
export async function GET(req: NextRequest) {
  try {
    if (!(await isAdmin(req))) {
      return NextResponse.json({ error: 'Forbidden: Admin privilege required' }, { status: 403 });
    }

    const users = db.prepare('SELECT id, username, role, preferences FROM users').all() as any[];
    const formatted = users.map((u) => ({
      id: u.id,
      username: u.username,
      role: u.role,
      preferences: JSON.parse(u.preferences || '{}'),
    }));

    return NextResponse.json(formatted);
  } catch (error: any) {
    console.error('List users error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

// POST /api/admin/users - Create or update a user
export async function POST(req: NextRequest) {
  try {
    if (!(await isAdmin(req))) {
      return NextResponse.json({ error: 'Forbidden: Admin privilege required' }, { status: 403 });
    }

    const { id, username, password, role } = await req.json();

    if (!username || !role) {
      return NextResponse.json({ error: 'Username and role are required' }, { status: 400 });
    }

    if (id) {
      // Update existing user
      if (password) {
        db.prepare('UPDATE users SET username = ?, password = ?, role = ? WHERE id = ?').run(
          username,
          password,
          role,
          id
        );
      } else {
        db.prepare('UPDATE users SET username = ?, role = ? WHERE id = ?').run(username, role, id);
      }
    } else {
      // Create new user
      if (!password) {
        return NextResponse.json({ error: 'Password is required for new users' }, { status: 400 });
      }
      db.prepare('INSERT INTO users (username, password, role, preferences) VALUES (?, ?, ?, ?)').run(
        username,
        password,
        role,
        JSON.stringify({ theme: 'dark', unit: 'metric' })
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Save user error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

// DELETE /api/admin/users - Delete a user
export async function DELETE(req: NextRequest) {
  try {
    if (!(await isAdmin(req))) {
      return NextResponse.json({ error: 'Forbidden: Admin privilege required' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const userIdStr = searchParams.get('id');
    if (!userIdStr) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const userId = parseInt(userIdStr, 10);

    // Prevent deleting the currently logged-in admin (we can check username or id from session)
    const session = req.cookies.get('diabit_session')?.value;
    if (session) {
      const currentUser = JSON.parse(session);
      if (currentUser.id === userId) {
        return NextResponse.json({ error: 'Cannot delete your own admin account' }, { status: 400 });
      }
    }

    db.prepare('DELETE FROM users WHERE id = ?').run(userId);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Delete user error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
