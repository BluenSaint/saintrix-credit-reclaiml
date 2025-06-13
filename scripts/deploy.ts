import { execSync } from 'child_process';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

async function deploy() {
  console.log('🚀 Starting SAINTRIX deployment process...\n');

  try {
    // 1. Run verification
    console.log('1. Running system verification...');
    execSync('npm run verify', { stdio: 'inherit' });
    console.log('✅ Verification passed\n');

    // 2. Build the project
    console.log('2. Building the project...');
    execSync('npm run build', { stdio: 'inherit' });
    console.log('✅ Build successful\n');

    // 3. Commit changes
    console.log('3. Committing changes...');
    execSync('git add .', { stdio: 'inherit' });
    execSync('git commit -m "chore: deploy latest changes"', { stdio: 'inherit' });
    console.log('✅ Changes committed\n');

    // 4. Push to GitHub
    console.log('4. Pushing to GitHub...');
    execSync('git push origin main', { stdio: 'inherit' });
    console.log('✅ Changes pushed to GitHub\n');

    // 5. Deploy to Vercel
    console.log('5. Deploying to Vercel...');
    execSync('vercel --prod', { stdio: 'inherit' });
    console.log('✅ Deployment successful\n');

    console.log('🎉 SAINTRIX deployment completed successfully!');
  } catch (error) {
    console.error('❌ Deployment failed:', error);
    process.exit(1);
  }
}

deploy().catch(console.error); 