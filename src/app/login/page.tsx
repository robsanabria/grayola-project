"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useToast } from "@/hooks/use-toast";
import { createClientSupabaseClient } from '@/lib/supabase/client';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const supabase = createClientSupabaseClient();

  useEffect(() => {
    const checkSession = async () => {
      try {
        console.log('Verificando sesión...');
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('Error al verificar sesión:', sessionError);
          return;
        }
        
        if (session) {
          console.log('Sesión encontrada:', session.user.id);
          console.log('Token de acceso presente:', !!session.access_token);
          
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', session.user.id)
            .single();

          if (profileError) {
            console.error('Error al obtener perfil:', profileError);
            return;
          }

          console.log('Perfil encontrado:', profile);

          if (profile?.role) {
            console.log('Redirigiendo a dashboard:', profile.role);
            router.push(`/dashboard/${profile.role}`);
          }
        } else {
          console.log('No hay sesión activa');
        }
      } catch (error) {
        console.error('Error al verificar sesión:', error);
      }
    };

    if (window.location.pathname === '/login') {
      checkSession();
    }
  }, [router, supabase]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      console.log('Intentando iniciar sesión...');
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        console.error('Error de inicio de sesión:', signInError);
        if (signInError.message.includes('Invalid login credentials')) {
          toast({
            variant: "destructive",
            title: "Error al iniciar sesión",
            description: "Credenciales inválidas. Por favor, verifica tu email y contraseña."
          });
        } else {
          toast({
            variant: "destructive",
            title: "Error al iniciar sesión",
            description: signInError.message
          });
        }
        setIsLoading(false);
        return;
      }

      const { session } = data;
      
      if (!session) {
        console.error('No se obtuvo sesión después del login');
        toast({
          variant: "destructive",
          title: "Error al iniciar sesión",
          description: "No se pudo iniciar sesión. Por favor, intenta nuevamente."
        });
        setIsLoading(false);
        return;
      }

      console.log('Login exitoso, sesión obtenida:', session.user.id);
      console.log('Token de acceso presente:', !!session.access_token);
      
      // Obtener el rol del usuario
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single();

      if (profileError) {
        console.error('Error al obtener perfil:', profileError);
        toast({
          variant: "destructive",
          title: "Error al obtener perfil",
          description: "No se pudo obtener la información del usuario."
        });
        setIsLoading(false);
        return;
      }

      if (!profile) {
        console.error('No se encontró perfil para el usuario');
        toast({
          variant: "destructive",
          title: "Error de perfil",
          description: "No se encontró el perfil del usuario."
        });
        setIsLoading(false);
        return;
      }

      console.log('Perfil obtenido, redirigiendo...');
      toast({
        title: "¡Bienvenido!",
        description: "Has iniciado sesión correctamente."
      });

      // Esperar un momento para que se muestre el toast
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Redirigir usando router.push
      router.push(`/dashboard/${profile.role}`);

    } catch (error: any) {
      console.error('Error inesperado:', error);
      toast({
        variant: "destructive",
        title: "Error inesperado",
        description: "Ocurrió un error al iniciar sesión. Por favor, intenta nuevamente."
      });
      setIsLoading(false);
    }
  };

  const handleSignUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      console.error("Error signing up:", error.message);
    } else {
      console.log("User signed up successfully!");
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Card className="w-full max-w-md mx-4 shadow-lg">
        <CardHeader className="space-y-1">
          <div className="flex justify-center mb-4">
            <Image
              src="/images/Favicon.png"
              alt="Grayola Logo"
              width={80}
              height={80}
              className="mx-auto"
              priority
            />
          </div>
          <CardTitle className="text-2xl text-center font-bold">Iniciar Sesión</CardTitle>
          <CardDescription className="text-center text-gray-600">
            Ingresa tus credenciales para acceder a tu cuenta
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="john@example.com"
                  disabled={isLoading}
                  className="w-full"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">
                  Contraseña
                </Label>
                <Input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  disabled={isLoading}
                  className="w-full"
                />
              </div>
            </div>
            <Button 
              type="submit" 
              className="w-full bg-lime-500 hover:bg-lime-600 text-white transition-colors"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Iniciando sesión...
                </>
              ) : (
                'Iniciar Sesión'
              )}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4 text-center">
          <p className="text-sm text-gray-600">
            ¿No tienes una cuenta?{' '}
            <Link href="/register" className="text-lime-600 hover:text-lime-700 font-medium">
              Regístrate
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}