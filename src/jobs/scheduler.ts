import { checkUserSentiment } from './sentimentCheck';

// Run sentiment checks every 6 hours
const SENTIMENT_CHECK_INTERVAL = 6 * 60 * 60 * 1000;

export async function startScheduler() {
  // Run initial check
  await checkUserSentiment();

  // Set up periodic checks
  setInterval(async () => {
    try {
      await checkUserSentiment();
    } catch (error) {
      console.error('Error in scheduled sentiment check:', error);
    }
  }, SENTIMENT_CHECK_INTERVAL);
}

// Start the scheduler when the application starts
startScheduler(); 