const apiKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpwaGVoZ2t2dXVycmFobHpxZHF0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzgyMjQ0OCwiZXhwIjoyMDkzMzk4NDQ4fQ.3gH_GNnARkfLXX7rqVl2YQPpbxUgRnZihXixkhhoeq0';

async function run() {
  try {
    // We can query custom views or run custom queries if we can.
    // Wait! Let's check what is the response when we query the table list or views.
    // Can we run a select on information_schema.table_privileges?
    // Let's try!
    const res = await fetch('https://jphehgkvuurrahlzqdqt.supabase.co/rest/v1/information_schema/table_privileges?table_name=eq.merchants', {
      headers: {
        'apikey': apiKey,
        'Authorization': `Bearer ${apiKey}`
      }
    });
    const data = await res.json();
    console.log('Table privileges for merchants:', data);
  } catch (err) {
    console.error(err);
  }
}

run();
