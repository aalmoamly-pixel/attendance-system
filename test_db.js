const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

let url = 'https://kvceksrtlqdnrhkzshqp.supabase.co';
let key = 'sb_publishable_JQ-QhRuG9OJzuBn8XcdRzA_B13m_YCS';

try {
  const envPath = path.join('d:', 'system', '.env');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const urlMatch = envContent.match(/VITE_SUPABASE_URL\s*=\s*(.*)/);
    const keyMatch = envContent.match(/VITE_SUPABASE_ANON_KEY\s*=\s*(.*)/);
    if (urlMatch && urlMatch[1]) url = urlMatch[1].trim();
    if (keyMatch && keyMatch[1]) key = keyMatch[1].trim();
  }
} catch (e) {
  console.log('Could not read .env, using defaults');
}

console.log('Connecting to Supabase at', url);
const supabase = createClient(url, key);

async function test() {
  const tables = ['students', 'subjects', 'schedules', 'attendance'];
  for (const t of tables) {
    try {
      const { data, error } = await supabase.from(t).select('*').limit(1);
      if (error) console.log(`❌ ${t}: ${error.message}`);
      else console.log(`✅ ${t}: ${data.length} rows`);
    } catch (err) {
      console.log(`❌ ${t} exception: ${err.message}`);
    }
  }
}

test();
