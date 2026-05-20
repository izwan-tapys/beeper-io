const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://jphehgkvuurrahlzqdqt.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpwaGVoZ2t2dXVycmFobHpxZHF0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc4MjI0NDgsImV4cCI6MjA5MzM5ODQ0OH0.EpKTdZaEj__X4CaIDdT_Fl1-Wce5RmmrnEDR_2RYjp8');

async function run() {
  const { data, error } = await supabase.from('ads').select('*');
  console.log("ALL ADS:", data);
}
run();
