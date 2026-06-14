/**
 * apply-anon-location-grant.js
 * Applies the missing GRANT SELECT (latitude, longitude) to the anon role
 * on the merchants table, resolving the 42501 permission error that prevented
 * the pager page from loading when a customer scans the QR code.
 *
 * Run from the project root: node scratch/apply-anon-location-grant.js
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Parse .env.local
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

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyFix() {
  console.log('Applying GRANT SELECT (latitude, longitude) ON merchants TO anon ...');

  // Use rpc to execute raw SQL via a service-role client
  const { error } = await supabase.rpc('exec_sql', {
    sql: 'GRANT SELECT (latitude, longitude) ON TABLE public.merchants TO anon;'
  });

  if (error) {
    // exec_sql may not exist — fall back to a known workaround:
    // Supabase does NOT expose raw SQL execution via JS SDK without a custom RPC.
    // The SQL must be run manually in the Supabase SQL Editor.
    console.error('exec_sql RPC not available:', error.message);
    console.log('\n=========================================================');
    console.log('MANUAL STEP REQUIRED');
    console.log('Please run the following SQL in Supabase SQL Editor:');
    console.log('---------------------------------------------------------');
    console.log('GRANT SELECT (latitude, longitude) ON TABLE public.merchants TO anon;');
    console.log('=========================================================\n');
    return;
  }

  console.log('✅ Grant applied successfully!');
}

applyFix();
