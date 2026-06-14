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
  // 1. Fetch a session ID that is currently waiting or confirm
  const { data: sessions, error: sessionError } = await supabase
    .from('sessions')
    .select('id, is_confirmed, client_uuid')
    .limit(1);

  if (sessionError) {
    console.error("Error fetching sessions:", sessionError);
    return;
  }
  if (!sessions || sessions.length === 0) {
    console.log("No sessions found to test.");
    return;
  }

  const sessionId = sessions[0].id;
  console.log("Testing UPDATE on Session ID:", sessionId);

  // 2. Attempt to update it as anon
  const testUuid = '00000000-0000-0000-0000-000000000000';
  const { data, error } = await supabase
    .from('sessions')
    .update({
      is_confirmed: true,
      client_uuid: testUuid
    })
    .eq('id', sessionId)
    .select();

  if (error) {
    console.error("FAILED to update session as anon:", error);
  } else {
    console.log("SUCCESS! Updated data:", data);
  }
}

run();
