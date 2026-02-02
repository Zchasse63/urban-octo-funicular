import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://itnzbdojxvbhuxnwqgzg.supabase.co';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!serviceRoleKey) {
  console.error('SUPABASE_SERVICE_ROLE_KEY is required');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Read the migration file
const migrationPath = join(__dirname, '..', 'supabase', 'migrations', '0001_initial_schema.sql');
const migrationSQL = readFileSync(migrationPath, 'utf-8');

// Split into individual statements (simple approach)
const statements = migrationSQL
  .split(/;[\s]*\n/)
  .map(s => s.trim())
  .filter(s => s.length > 0 && !s.startsWith('--'));

console.log(`Found ${statements.length} SQL statements to execute`);

async function runMigration() {
  // Use the Supabase Management API via fetch with service role
  const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': serviceRoleKey,
      'Authorization': `Bearer ${serviceRoleKey}`
    },
    body: JSON.stringify({ sql: migrationSQL })
  });

  if (!response.ok) {
    // Try the pg_dump approach instead - execute statements one by one
    console.log('Direct SQL execution not available, trying statement-by-statement...');

    // For now, let's just test if we can query the database
    const { data, error } = await supabase.from('shows').select('*').limit(1);

    if (error && error.code === 'PGRST205') {
      console.log('Tables do not exist. Migration needs to be run via Supabase Dashboard SQL Editor.');
      console.log('\nPlease copy the contents of:');
      console.log(migrationPath);
      console.log('\nAnd paste it into the SQL Editor at:');
      console.log(`https://supabase.com/dashboard/project/itnzbdojxvbhuxnwqgzg/sql`);
      process.exit(1);
    } else if (error) {
      console.error('Database error:', error);
      process.exit(1);
    } else {
      console.log('Tables already exist! Migration may have been run previously.');
      console.log('Shows found:', data?.length || 0);
    }
    return;
  }

  const result = await response.json();
  console.log('Migration completed:', result);
}

runMigration().catch(console.error);
