const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://jphehgkvuurrahlzqdqt.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpwaGVoZ2t2dXVycmFobHpxZHF0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzgyMjQ0OCwiZXhwIjoyMDkzMzk4NDQ4fQ.3gH_GNnARkfLXX7rqVl2YQPpbxUgRnZihXixkhhoeq0';

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false
  }
});

async function run() {
  try {
    const { data: { users }, error } = await supabase.auth.admin.listUsers();
    if (error) throw error;
    console.log('Total users in Auth:', users.length);
    console.log('Users list:', users.map(u => ({ id: u.id, email: u.email, created_at: u.created_at })));
  } catch (err) {
    console.error(err);
  }
}

run();
