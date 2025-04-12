import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

const supabaseUrl = 'https://iqandlxrydantgxnxlol.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlxYW5kbHhyeWRhbnRneG54bG9sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQzODc3OTMsImV4cCI6MjA1OTk2Mzc5M30.YANpWFUpxl6tszlSzowUxRDseTOmfN9cbwTsSc1xpvk';

export function createClientSupabaseClient() {
  return createClientComponentClient({
    supabaseUrl,
    supabaseKey
  });
} 