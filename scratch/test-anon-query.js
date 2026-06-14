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
  // 1. Let's first fetch an active session ID to use for testing
  const { data: sessions, error: sessionError } = await supabase
    .from('sessions')
    .select('id')
    .limit(1);

  if (sessionError) {
    console.error("Error fetching sessions as anon:", sessionError);
    return;
  }
  if (!sessions || sessions.length === 0) {
    console.log("No sessions found to test with.");
    return;
  }

  const sessionId = sessions[0].id;
  console.log("Testing with Session ID:", sessionId);

  // 2. Query the session using the same select as the pager page
  const { data, error } = await supabase
    .from('sessions')
    .select('*, merchants(name, logo_url, gmb_url, theme_color, plan_type, subscription_status, expiry_date, upsell_title, upsell_description, upsell_link_url, upsell_video_url, upsell_image_url, upsell_cta_text, latitude, longitude, category, state)')
    .eq('id', sessionId)
    .single();

  if (error) {
    console.error("FAILED to fetch session joined with merchants:", error);
  } else {
    console.log("SUCCESS! Data fetched:", data);
  }
}

run();
