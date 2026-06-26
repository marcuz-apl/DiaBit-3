import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import db from '@/lib/db';

// POST /api/auth (Login)
export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json();

    if (!username || !password) {
      return NextResponse.json({ error: 'Username and password are required' }, { status: 400 });
    }

    const user = db.prepare('SELECT id, username, role, preferences FROM users WHERE username = ? AND password = ?').get(username, password) as {
      id: number;
      username: string;
      role: string;
      preferences: string;
    } | undefined;

    if (!user) {
      return NextResponse.json({ error: 'Invalid username or password' }, { status: 401 });
    }

    const sessionData = {
      id: user.id,
      username: user.username,
      role: user.role,
      preferences: JSON.parse(user.preferences || '{}'),
    };

    const cookieStore = await cookies();
    cookieStore.set('diabit_session', JSON.stringify(sessionData), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24, // 1 day
      path: '/',
    });

    return NextResponse.json(sessionData);
  } catch (error: any) {
    console.error('Auth error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

// GET /api/auth (Get current user)
export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('diabit_session');

    if (!sessionCookie || !sessionCookie.value) {
      return NextResponse.json({ user: null });
    }

    const user = JSON.parse(sessionCookie.value);
    return NextResponse.json({ user });
  } catch (error) {
    return NextResponse.json({ user: null });
  }
}

// DELETE /api/auth (Logout)
export async function DELETE() {
  const cookieStore = await cookies();
  cookieStore.delete('diabit_session');
  return NextResponse.json({ success: true });
}
