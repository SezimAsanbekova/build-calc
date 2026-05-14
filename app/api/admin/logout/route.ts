import { NextResponse } from 'next/server';

/**
 * POST /api/admin/logout
 * Очищает auth-token cookie администратора.
 */
export async function POST() {
  const response = NextResponse.json(
    { success: true, message: 'Вы вышли из панели администратора' },
    { status: 200 }
  );

  response.cookies.set('auth-token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
  });

  return response;
}
