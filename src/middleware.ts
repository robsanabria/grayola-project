import { middleware as supabaseMiddleware } from '@/lib/supabase/middleware';

export const middleware = supabaseMiddleware;

export const config = {
  matcher: ['/', '/dashboard/:path*', '/login', '/register'],
}; 