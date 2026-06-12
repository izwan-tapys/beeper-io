const apiKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpwaGVoZ2t2dXVycmFobHpxZHF0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzgyMjQ0OCwiZXhwIjoyMDkzMzk4NDQ4fQ.3gH_GNnARkfLXX7rqVl2YQPpbxUgRnZihXixkhhoeq0';

async function run() {
  try {
    const res = await fetch('https://jphehgkvuurrahlzqdqt.supabase.co/rest/v1/merchants?select=id,user_id,name,email', {
      headers: {
        'apikey': apiKey,
        'Authorization': `Bearer ${apiKey}`
      }
    });
    const merchants = await res.json();
    console.log('Merchants user_id mapping:', merchants);
  } catch (err) {
    console.error(err);
  }
}

run();
