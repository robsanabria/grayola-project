"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { createClientSupabaseClient } from "@/lib/supabase/client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("client");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const supabase = createClientSupabaseClient();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      console.log('Iniciando proceso de registro...');
      
      // 1. Registrar el usuario en auth
      console.log('Creando usuario en Auth...');
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            role: role
          }
        }
      });

      console.log('Respuesta de Auth:', { authData, authError });

      if (authError) {
        console.error('Error detallado de Auth:', {
          message: authError.message,
          status: authError.status,
          name: authError.name
        });
        
        if (authError.message.includes('User already registered')) {
          toast({
            variant: "destructive",
            title: "Error al registrar",
            description: "Este email ya está registrado. Por favor, inicia sesión."
          });
        } else {
          toast({
            variant: "destructive",
            title: "Error al registrar",
            description: `Error: ${authError.message}`
          });
        }
        setIsLoading(false);
        return;
      }

      if (!authData.user) {
        console.error('No se recibieron datos del usuario');
        toast({
          variant: "destructive",
          title: "Error al registrar",
          description: "No se pudo crear el usuario"
        });
        setIsLoading(false);
        return;
      }

      console.log('Usuario creado exitosamente:', authData.user.id);

      // 2. Crear el perfil del usuario
      console.log('Creando perfil de usuario...');
      const profileData = {
        id: authData.user.id,
        email: email,
        role: role,
        points_balance: 100,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      console.log('Datos del perfil a insertar:', profileData);

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .insert([profileData])
        .select()
        .single();

      if (profileError) {
        console.error('Error detallado del perfil:', {
          code: profileError.code,
          message: profileError.message,
          details: profileError.details,
          hint: profileError.hint
        });

        // Intentar eliminar el usuario auth si falla la creación del perfil
        try {
          await supabase.auth.admin.deleteUser(authData.user.id);
        } catch (deleteError) {
          console.error('Error al limpiar usuario de auth:', deleteError);
        }
        
        if (profileError.code === '42501') {
          toast({
            variant: "destructive",
            title: "Error de permisos",
            description: "No tienes permisos para crear un perfil. Por favor, contacta al administrador."
          });
        } else if (profileError.code === '23505') {
          toast({
            variant: "destructive",
            title: "Error al crear perfil",
            description: "Ya existe un usuario con este email."
          });
        } else {
          toast({
            variant: "destructive",
            title: "Error al crear perfil",
            description: `Error: ${profileError.message}`
          });
        }
        setIsLoading(false);
        return;
      }

      console.log('Perfil creado exitosamente:', profile);

      toast({
        title: "¡Registro exitoso!",
        description: "Tu cuenta ha sido creada correctamente."
      });
      // Redirigir al usuario según su rol
      console.log('Redirigiendo a:', `/dashboard/${role}`);
      router.push(`/dashboard/${role}`);
    } catch (error: any) {
      console.error('Error inesperado:', error);
      toast({
        variant: "destructive",
        title: "Error inesperado",
        description: "Ocurrió un error al registrar. Por favor, intenta nuevamente."
      });
      setIsLoading(false);
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
          <CardTitle className="text-2xl text-center font-bold">Crear Cuenta</CardTitle>
          <CardDescription className="text-center text-gray-600">
            Regístrate para comenzar a usar Grayola
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleRegister} className="space-y-6">
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
                  minLength={6}
                  className="w-full"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role" className="text-sm font-medium">
                  Tipo de Usuario
                </Label>
                <Select
                  value={role}
                  onValueChange={setRole}
                  disabled={isLoading}
                >
                  <SelectTrigger id="role" className="w-full">
                    <SelectValue placeholder="Selecciona un tipo de usuario" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="client">Cliente</SelectItem>
                    <SelectItem value="project_manager">Project Manager</SelectItem>
                    <SelectItem value="designer">Diseñador</SelectItem>
                  </SelectContent>
                </Select>
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
                  Registrando...
                </>
              ) : (
                'Registrarse'
              )}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4 text-center">
          <p className="text-sm text-gray-600">
            ¿Ya tienes una cuenta?{' '}
            <Link href="/login" className="text-lime-600 hover:text-lime-700 font-medium">
              Inicia sesión
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
} 