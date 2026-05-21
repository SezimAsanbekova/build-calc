import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken } from '@/lib/auth';

/**
 * Маршруты, доступные только обычным пользователям (role === 'user')
 */
const userOnlyRoutes = ['/dashboard', '/profile', '/calculations'];

/**
 * Маршруты, доступные только администраторам (role === 'admin')
 */
const adminOnlyRoutes = [
  '/admin/dashboard',
  '/admin/materials',
  '/admin/categories',
  '/admin/manufacturers',
  '/admin/compatibility',
  '/admin/alternatives',
  '/admin/users',
  '/admin/calculations',
  '/admin/estimates',
  '/admin/statistics',
  '/admin/settings',
];

/**
 * Страницы входа/регистрации — авторизованные пользователи не должны их видеть
 */
const authRoutes = ['/login', '/register', '/forgot-password', '/reset-password', '/verify-email'];

/**
 * Страницы входа для администратора — авторизованный админ не должен их видеть
 */
const adminAuthRoutes = ['/admin/login', '/admin/verify-code'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Получаем и верифицируем auth-token (наш кастомный JWT)
  const authToken = request.cookies.get('auth-token')?.value;
  const authPayload = authToken ? await verifyToken(authToken) : null;

  // Проверяем NextAuth сессию (для Google OAuth)
  const nextAuthToken =
    request.cookies.get('next-auth.session-token')?.value ||
    request.cookies.get('__Secure-next-auth.session-token')?.value;

  const isAuthTokenValid = !!authPayload;
  const isNextAuthValid = !!nextAuthToken;
  const isAuthenticated = isAuthTokenValid || isNextAuthValid;

  const role = authPayload?.role ?? null;
  const isAdmin = role === 'admin';
  const isUser = role === 'user' || (isNextAuthValid && !isAdmin);

  // ── Редирект авторизованных пользователей с главной страницы ─────────────
  if (pathname === '/') {
    if (isAuthenticated) {
      if (isAdmin) {
        return NextResponse.redirect(new URL('/admin/dashboard', request.url));
      }
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  // ── Защита страниц пользователя ──────────────────────────────────────────
  if (userOnlyRoutes.some((r) => pathname.startsWith(r))) {
    if (!isAuthenticated) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    // Администратор не должен попасть в пользовательские страницы
    if (isAdmin) {
      return NextResponse.redirect(new URL('/admin/dashboard', request.url));
    }
    return NextResponse.next();
  }

  // ── Защита страниц администратора ────────────────────────────────────────
  if (adminOnlyRoutes.some((r) => pathname.startsWith(r))) {
    if (!isAuthTokenValid) {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }
    if (!isAdmin) {
      // Обычный пользователь пытается зайти в админку
      return NextResponse.redirect(new URL('/profile', request.url));
    }
    return NextResponse.next();
  }

  // ── Редирект авторизованных пользователей с auth-страниц ─────────────────
  if (authRoutes.some((r) => pathname.startsWith(r))) {
    if (isAuthenticated) {
      if (isAdmin) {
        return NextResponse.redirect(new URL('/admin/dashboard', request.url));
      }
      return NextResponse.redirect(new URL('/profile', request.url));
    }
    return NextResponse.next();
  }

  // ── Редирект авторизованного администратора с admin auth-страниц ──────────
  if (adminAuthRoutes.some((r) => pathname.startsWith(r))) {
    if (isAuthTokenValid && isAdmin) {
      return NextResponse.redirect(new URL('/admin/dashboard', request.url));
    }
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/',
    '/dashboard/:path*',
    '/profile/:path*',
    '/calculations/:path*',
    '/admin/dashboard/:path*',
    '/admin/materials/:path*',
    '/admin/categories/:path*',
    '/admin/manufacturers/:path*',
    '/admin/compatibility/:path*',
    '/admin/alternatives/:path*',
    '/admin/users/:path*',
    '/admin/calculations/:path*',
    '/admin/estimates/:path*',
    '/admin/statistics/:path*',
    '/admin/settings/:path*',
    '/admin/login',
    '/admin/verify-code',
    '/login',
    '/register',
    '/forgot-password',
    '/reset-password',
    '/verify-email',
  ],
};
