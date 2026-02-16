import { NextResponse } from 'next/server';
import { DEMO_COOKIE_NAME, DEMO_COOKIE_VALUE, getDemoPassword } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const password = typeof body?.password === 'string' ? body.password.trim() : '';
    const expected = getDemoPassword();

    if (!password) {
      return NextResponse.json({ ok: false, error: 'Password required' }, { status: 400 });
    }

    if (password !== expected) {
      return NextResponse.json({ ok: false, error: 'Invalid password' }, { status: 401 });
    }

    const res = NextResponse.json({ ok: true });
    res.cookies.set(DEMO_COOKIE_NAME, DEMO_COOKIE_VALUE, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });
    return res;
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid request' }, { status: 400 });
  }
}
