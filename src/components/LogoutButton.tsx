'use client';

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';
import { toast } from 'sonner';
import { supabaseUrl, supabaseKey } from '@/lib/supabase';
import { useState } from 'react';

export function LogoutButton() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const supabase = createClientComponentClient({
    supabaseUrl,
    supabaseKey,
  });

  const handleLogout = async () => {
    setIsLoading(true);
    try {
      // Sign out from Supabase
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      // Clear any local storage or session data
      localStorage.removeItem('supabase.auth.token');
      sessionStorage.clear();
      
      toast.success('Sesión cerrada correctamente');
      
      // Esperar un momento para que se muestre el toast
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Usar router.push en lugar de window.location
      router.push('/login');
      
      // Forzar una recarga completa después de la redirección
      setTimeout(() => {
        window.location.reload();
      }, 100);
    } catch (error) {
      console.error('Error during logout:', error);
      toast.error('Error al cerrar sesión');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      variant="outline"
      onClick={handleLogout}
      className="gap-2"
      disabled={isLoading}
    >
      <LogOut className="h-4 w-4" />
      {isLoading ? 'Cerrando sesión...' : 'Cerrar Sesión'}
    </Button>
  );
} 