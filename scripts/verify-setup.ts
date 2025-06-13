import { createClient } from '@supabase/supabase-js';
import { execSync } from 'child_process';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

if (process.env.NODE_ENV === 'production') process.exit(0);

async function verifySetup() {
  console.log('🔍 Starting SAINTRIX system verification...\n');

  // 1. Verify Supabase connection
  console.log('1. Verifying Supabase connection...');
  try {
    const supabase = createClient(SUPABASE_URL!, SUPABASE_ANON_KEY!);
    const { data, error } = await supabase.auth.getSession();

    if (error) throw error;
    console.log('✅ Supabase connection successful\n');
  } catch (error) {
    console.error('❌ Supabase connection failed:', error);
    process.exit(1);
  }

  // 2. Verify Vercel CLI
  console.log('2. Verifying Vercel CLI...');
  try {
    execSync('vercel --version');
    console.log('✅ Vercel CLI is installed\n');
  } catch (error) {
    console.error('❌ Vercel CLI not found. Please install it with: npm i -g vercel');
    process.exit(1);
  }

  // 3. Verify Git
  console.log('3. Verifying Git repository...');
  try {
    const gitStatus = execSync('git status').toString();
    if (gitStatus.includes('On branch main')) {
      console.log('✅ Git repository is on main branch\n');
    } else {
      console.error('❌ Git repository is not on main branch');
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Git repository verification failed:', error);
    process.exit(1);
  }

  // 4. Verify environment variables
  console.log('4. Verifying environment variables...');
  const requiredVars = [
    'VITE_SUPABASE_URL',
    'VITE_SUPABASE_ANON_KEY',
  ];

  const missingVars = requiredVars.filter(varName => !process.env[varName]);

  if (missingVars.length === 0) {
    console.log('✅ All required environment variables are set\n');
  } else {
    console.error('❌ Missing environment variables:', missingVars.join(', '));
    process.exit(1);
  }

  // 5. Verify database tables
  console.log('5. Verifying database tables...');
  try {
    const supabase = createClient(SUPABASE_URL!, SUPABASE_ANON_KEY!);
    const requiredTables = [
      'user_sentiment_logs',
      'user_flags',
      'ai_chat_history',
    ];

    for (const table of requiredTables) {
      const { error } = await supabase.from(table).select('count').limit(1);
      if (error) throw new Error(`Table ${table} not found: ${error.message}`);
    }
    console.log('✅ All required database tables exist\n');
  } catch (error) {
    console.error('❌ Database verification failed:', error);
    process.exit(1);
  }

  console.log('🎉 All verifications passed! The SAINTRIX system is ready to use.');
}

verifySetup().catch(console.error);
