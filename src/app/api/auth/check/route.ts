import { NextResponse } from 'next/server';
import { isAuthenticated } from '@/lib/auth';

export async function GET(req: Request) {
  const cookie = req.headers.get('cookie');
  const ok = isAuthenticated(cookie);
  return NextResponse.json({ ok });
}
