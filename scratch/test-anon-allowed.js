const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Manually parse .env.local
const envPath = path.resolve(process.cwd(), '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const envConfig = {};
envContent.split('\n').forEach(line => {
  const parts = line.split('=');
  if (parts.length >= 2) {
    const key = parts[0].trim();
    const val = parts.slice(1).join('=').trim();
    envConfig[key] = val;
  }
});

const supabaseUrl = envConfig.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = envConfig.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
  const { data: sessions, error: sessionError } = await supabase
    .from('sessions')
    .select('id')
    .limit(1);

  if (sessionError) {
    console.error("Error fetching sessions:", sessionError);
    return;
  }
  const sessionId = sessions[0].id;

  // Test 1: Query only allowed columns: name, logo_url
  console.log("Test 1: Querying allowed columns (name, logo_url)...");
  const { data: data1, error: error1 } = await supabase
    .from('sessions')
    .select('*, merchants(name, logo_url)')
    .eq('id', sessionId)
    .single();

  if (error1) {
    console.error("Test 1 FAILED:", error1);
  } else {
    console.log("Test 1 SUCCESS! Merchant data:", data1.merchants);
  }

  // Test 2: Query disallowed columns: latitude, longitude
  console.log("\nTest 2: Querying disallowed columns (latitude, longitude)...");
  const { data: data2, error: error2 } = await supabase
    .from('sessions')
    .select('*, merchants(name, logo_url, latitude, longitude)')
    .eq('id', sessionId)
    .single();

  if (error2) {
    console.error("Test 2 FAILED:", error2);
  } else {
    console.log("Test 2 SUCCESS! Merchant data:", data2.merchants);
  }
}

run();
