import { createClient } from '@supabase/supabase-js';

// Support both Vite and Netlify environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL ||
                    import.meta.env.SUPABASE_DATABASE_URL ||
                    'https://revrmdtnffgnmnqytedr.supabase.co';

const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY ||
                        import.meta.env.PUBLIC_SUPABASE_ANON_KEY ||
                        import.meta.env.SUPABASE_ANON_KEY ||
                        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJldnJtZHRuZmZnbm1ucXl0ZWRyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI4MDYyOTYsImV4cCI6MjA5ODM4MjI5Nn0.d_cw9bytgHl9BvN-SSASb6IJDuuliJg6kNOGUyxS_II';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
