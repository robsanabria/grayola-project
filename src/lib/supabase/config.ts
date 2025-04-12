import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://iqandlxrydantgxnxlol.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlxYW5kbHhyeWRhbnRneG54bG9sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQzODc3OTMsImV4cCI6MjA1OTk2Mzc5M30.YANpWFUpxl6tszlSzowUxRDseTOmfN9cbwTsSc1xpvk';

// Verificar si estamos en el navegador
const isBrowser = typeof window !== 'undefined';

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: {
      getItem: (key) => {
        try {
          if (!isBrowser) return null;
          
          const itemStr = localStorage.getItem(key);
          if (!itemStr) return null;
          const item = JSON.parse(itemStr);
          const now = new Date();
          if (now.getTime() > item.expiry) {
            localStorage.removeItem(key);
            return null;
          }
          return item.value;
        } catch (error) {
          console.error('Error getting item from storage:', error);
          return null;
        }
      },
      setItem: (key, value) => {
        try {
          if (!isBrowser) return;
          
          const item = {
            value,
            expiry: new Date().getTime() + 24 * 60 * 60 * 1000, // 24 hours
          };
          localStorage.setItem(key, JSON.stringify(item));
        } catch (error) {
          console.error('Error setting item in storage:', error);
        }
      },
      removeItem: (key) => {
        try {
          if (!isBrowser) return;
          
          localStorage.removeItem(key);
        } catch (error) {
          console.error('Error removing item from storage:', error);
        }
      },
    },
  }
}); 