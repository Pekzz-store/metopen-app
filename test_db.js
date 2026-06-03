const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function test() {
  console.log("Checking locations...");
  const { data: locs, error: locErr } = await supabase.from('parking_locations').select('*');
  if (locErr) { console.error("Error fetching locs:", locErr); return; }
  
  if (locs.length === 0) { console.log("No locations found."); return; }
  
  const targetLoc = locs[0];
  console.log("Targeting location:", targetLoc.name, "Available slots:", targetLoc.available_slots);
  
  const newAvail = Math.max(0, targetLoc.available_slots - 1);
  console.log("Attempting to decrement available_slots to:", newAvail);
  
  const { data: updateData, error: updateErr } = await supabase
    .from('parking_locations')
    .update({ available_slots: newAvail })
    .eq('id', targetLoc.id)
    .select();
    
  if (updateErr) {
    console.error("Update failed:", updateErr.message, updateErr.details, updateErr.hint);
  } else {
    console.log("Update success!", updateData);
  }
}
test();
