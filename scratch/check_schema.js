const apiKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpwaGVoZ2t2dXVycmFobHpxZHF0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzgyMjQ0OCwiZXhwIjoyMDkzMzk4NDQ4fQ.3gH_GNnARkfLXX7rqVl2YQPpbxUgRnZihXixkhhoeq0';

async function run() {
  try {
    const res = await fetch('https://jphehgkvuurrahlzqdqt.supabase.co/rest/v1/', {
      headers: {
        'apikey': apiKey,
        'Authorization': `Bearer ${apiKey}`
      }
    });
    const schema = await res.json();
    console.log('Exposed tables and functions:', Object.keys(schema.paths));
  } catch (err) {
    console.error(err);
  }
}

run();
