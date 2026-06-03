import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env' });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function checkRel() {
  const fallback = await supabase.from('profiles').select('*, vehicles(license_plate, created_at)').order('created_at', { ascending: false }).limit(5);
  console.log("Profiles w/ vehicles:", fallback.data, "Error:", fallback.error?.message);
}
checkRel();
