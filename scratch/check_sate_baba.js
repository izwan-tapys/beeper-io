const apiKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpwaGVoZ2t2dXVycmFobHpxZHF0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzgyMjQ0OCwiZXhwIjoyMDkzMzk4NDQ4fQ.3gH_GNnARkfLXX7rqVl2YQPpbxUgRnZihXixkhhoeq0';

async function run() {
  try {
    // 1. Fetch SATE BABA merchant row
    const res = await fetch('https://jphehgkvuurrahlzqdqt.supabase.co/rest/v1/merchants?email=eq.zaimiramira569@gmail.com', {
      headers: {
        'apikey': apiKey,
        'Authorization': `Bearer ${apiKey}`
      }
    });
    const merchants = await res.json();
    console.log('Sate Baba Merchant row:', JSON.stringify(merchants, null, 2));

    // 2. Fetch all users from auth to match by email zaimiramira569@gmail.com
    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient('https://jphehgkvuurrahlzqdqt.supabase.co', apiKey);
    const { data: { users } } = await supabase.auth.admin.listUsers();
    const targetUser = users.find(u => u.email === 'zaimiramira569@gmail.com');
    console.log('Auth User info:', targetUser ? { id: targetUser.id, email: targetUser.email } : 'Not found');
  } catch (err) {
    console.error(err);
  }
}

run();
