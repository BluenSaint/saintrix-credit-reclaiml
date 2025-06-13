import { checkUserSentiment } from './sentimentCheck';

// Run sentiment checks every 6 hours
const SENTIMENT_CHECK_INTERVAL = 6 * 60 * 60 * 1000;

export function startScheduler() {
  // Initial check
  checkUserSentiment();

  // Schedule periodic checks
  setInterval(checkUserSentiment, SENTIMENT_CHECK_INTERVAL);
}

// Start the scheduler when the application starts
startScheduler(); 