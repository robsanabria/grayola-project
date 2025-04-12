import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const supabaseUrl = 'https://iqandlxrydantgxnxlol.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlxYW5kbHhyeWRhbnRneG54bG9sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQzODc3OTMsImV4cCI6MjA1OTk2Mzc5M30.YANpWFUpxl6tszlSzowUxRDseTOmfN9cbwTsSc1xpvk';

export async function middleware(req: NextRequest) {
  console.log('Middleware ejecutándose para ruta:', req.nextUrl.pathname);
  
  // Crear una respuesta que podamos modificar
  const res = NextResponse.next();
  
  // Crear el cliente de Supabase con la solicitud y respuesta
  const supabase = createMiddlewareClient({ req, res }, {
    supabaseUrl,
    supabaseKey
  });

  try {
    // Verificar si hay cookies de sesión
    const supabaseCookie = req.cookies.get('sb-iqandlxrydantgxnxlol-auth-token');
    console.log('Cookie de Supabase presente:', !!supabaseCookie);
    
    // Obtener la sesión
    const {
      data: { session },
      error: sessionError
    } = await supabase.auth.getSession();

    if (sessionError) {
      console.error('Error al obtener la sesión:', sessionError);
      // Si hay un error con la sesión, redirigir a login
      return NextResponse.redirect(new URL('/login', req.url));
    }

    console.log('Estado de la sesión:', session ? 'Autenticado' : 'No autenticado');
    
    // Si el usuario está en /login o /register y tiene una sesión válida
    if ((req.nextUrl.pathname === '/login' || req.nextUrl.pathname === '/register') && session) {
      // Obtener el rol del usuario
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single();

      if (profileError) {
        console.error('Error al obtener el perfil:', profileError);
        return NextResponse.redirect(new URL('/login', req.url));
      }

      const role = profile?.role || 'client';
      const roleToPathMap: Record<string, string> = {
        'project_manager': 'projectManager',
        'client': 'client',
        'designer': 'designer'
      };
      
      const expectedPath = roleToPathMap[role] || role;
      return NextResponse.redirect(new URL(`/dashboard/${expectedPath}`, req.url));
    }

    // Si el usuario no está autenticado y trata de acceder a una ruta protegida
    if (!session && req.nextUrl.pathname.startsWith('/dashboard')) {
      console.log('Usuario no autenticado intentando acceder a ruta protegida');
      return NextResponse.redirect(new URL('/login', req.url));
    }

    // Si el usuario está autenticado y en una ruta protegida
    if (session && req.nextUrl.pathname.startsWith('/dashboard')) {
      console.log('Usuario autenticado, ID:', session.user.id);
      
      // Obtener el rol del usuario
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single();

      if (profileError) {
        console.error('Error al obtener el perfil:', profileError);
        return NextResponse.redirect(new URL('/login', req.url));
      }

      console.log('Perfil del usuario:', profile);
      console.log('Rol del usuario:', profile?.role);

      const role = profile?.role || 'client';
      const currentPath = req.nextUrl.pathname;
      const pathRole = currentPath.split('/')[2];
      
      // Mapeo de roles de la base de datos a nombres de carpetas
      const roleToPathMap: Record<string, string> = {
        'project_manager': 'projectManager',
        'client': 'client',
        'designer': 'designer'
      };
      
      const expectedPath = roleToPathMap[role];
      console.log('Path actual:', pathRole);
      console.log('Path esperado:', expectedPath);
      console.log('Rol en la base de datos:', role);
      
      if (pathRole !== expectedPath) {
        console.log('Redirigiendo a dashboard correcto:', expectedPath);
        return NextResponse.redirect(new URL(`/dashboard/${expectedPath}`, req.url));
      }
    }

    // Si la ruta es /, redirigir a /login
    if (req.nextUrl.pathname === '/') {
      return NextResponse.redirect(new URL('/login', req.url));
    }

    // Devolver la respuesta con las cookies actualizadas
    return res;
  } catch (error) {
    console.error('Error en middleware:', error);
    return NextResponse.redirect(new URL('/login', req.url));
  }
}

export const config = {
  matcher: ['/', '/dashboard/:path*', '/login', '/register'],
}; 