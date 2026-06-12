const apiKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpwaGVoZ2t2dXVycmFobHpxZHF0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzgyMjQ0OCwiZXhwIjoyMDkzMzk4NDQ4fQ.3gH_GNnARkfLXX7rqVl2YQPpbxUgRnZihXixkhhoeq0';

async function run() {
  try {
    // We can query the PostgREST OpenAPI spec or query information_schema if exposed.
    // If not, we can check via the supabase schema query or run a fetch to /rest/v1/
    // Let's query information_schema columns via PostgREST if we can. 
    // Wait, PostgREST doesn't usually expose information_schema by default.
    // But we can check if there's any other way.
    // Let's try to query /rest/v1/merchants with a custom header or query.
    // Wait! In query_db_v2.js we saw the output:
    // user_id: '8a223e7e-740d-4695-adbc-ee8174ceaa76'
    
    // Let's check if the column type of user_id is UUID or TEXT by attempting to cast it in a filter:
    // For example, if it's text, filtering by a non-uuid string like 'hello' won't fail.
    // If it's uuid, filtering by 'hello' will throw an invalid uuid format error!
    const res = await fetch('https://jphehgkvuurrahlzqdqt.supabase.co/rest/v1/merchants?user_id=eq.hello', {
      headers: {
        'apikey': apiKey,
        'Authorization': `Bearer ${apiKey}`
      }
    });
    const data = await res.json();
    console.log('Query result with non-uuid:', data);
  } catch (err) {
    console.error(err);
  }
}

run();
