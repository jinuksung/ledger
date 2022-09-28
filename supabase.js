import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const SUPABASE_URL = 'https://zozugxztzrhwzaihhkfm.supabase.co';

const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpvenVneHp0enJod3phaWhoa2ZtIiwicm9sZSI6ImFub24iLCJpYXQiOjE2NjE4NTU3ODgsImV4cCI6MTk3NzQzMTc4OH0.Gm6BhqscUtJbQfibLLpvCT8vknM1iNca4haBTJlqs2Q';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
