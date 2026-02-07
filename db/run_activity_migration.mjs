import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

const sql = readFileSync('db/add_activity_log.sql', 'utf8')

console.log('Running activity_log migration...')

const { error } = await supabase.rpc('exec_sql', { sql_query: sql }).single()

if (error) {
  console.error('Migration failed:', error)
  process.exit(1)
}

console.log('✓ Activity log table created successfully')
