const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://jphehgkvuurrahlzqdqt.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpwaGVoZ2t2dXVycmFobHpxZHF0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc4MjI0NDgsImV4cCI6MjA5MzM5ODQ0OH0.EpKTdZaEj__X4CaIDdT_Fl1-Wce5RmmrnEDR_2RYjp8';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testFetch() {
  console.log('Fetching ads as anon...');
  const { data, error } = await supabase
    .from('ads')
    .select('*')
    .eq('is_active', true);
    
  console.log('Error:', error);
  console.log('Data:', data);
}

testFetch();
