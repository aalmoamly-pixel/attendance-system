import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Load .env file for Supabase credentials
let url = '';
let key = '';
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
  console.error('Error reading .env:', e);
}

if (!url || !key) {
  console.error('Supabase credentials missing.');
  process.exit(1);
}

console.log('Connecting to Supabase at', url);
const supabase = createClient(url, key);

async function testConnection() {
  const tables = ['students', 'subjects', 'schedules', 'attendance'];
  for (const table of tables) {
    console.log(`Checking table ${table}...`);
    try {
      const { data, error } = await supabase.from(table).select('*').limit(1);
      if (error) console.error(`Error on ${table}:`, error.message);
      else console.log(`${table} ok, rows: ${data ? data.length : 0}`);
    } catch (err) {
      console.error(`Exception on ${table}:`, err.message);
    }
  }
}

testConnection();
