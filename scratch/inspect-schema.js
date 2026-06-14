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
const supabaseServiceKey = envConfig.SUPABASE_SERVICE_ROLE_KEY;

console.log("Supabase URL:", supabaseUrl);

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function run() {
  const { data, error } = await supabase.from('merchants').select('*').limit(1);
  if (error) {
    console.error("Error fetching merchants:", error);
    return;
  }
  if (data.length === 0) {
    console.log("No merchants found in database.");
    return;
  }
  console.log("Merchant columns:", Object.keys(data[0] || {}));
}

run();
