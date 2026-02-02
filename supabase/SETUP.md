# Supabase Database Setup

## Run Migration via Dashboard (Recommended)

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project: `itnzbdojxvbhuxnwqgzg`
3. Click **SQL Editor** in the left sidebar
4. Click **+ New query**
5. Copy the entire contents of `migrations/0001_initial_schema.sql`
6. Paste into the SQL Editor
7. Click **Run** (or press Cmd+Enter)

The migration will create:
- All required tables (users, shows, episodes, etc.)
- Vector indexes for embeddings
- RLS policies
- A default user for single-user mode

## Run Migration via CLI (Alternative)

If you want to use the CLI instead:

```bash
# Login to Supabase
npx supabase login

# Link to your project
npx supabase link --project-ref itnzbdojxvbhuxnwqgzg

# Push migrations
npx supabase db push
```

## Verify Setup

After running the migration, test the connection:

```bash
# Start the dev server
cd app && npm run dev

# Test the database endpoint
curl http://localhost:3000/api/test-db
```

You should see a success response with created test data.

## Get Database Password (for CLI)

If you need the database password for CLI operations:
1. Go to Supabase Dashboard > Settings > Database
2. Copy the password from the connection string section
