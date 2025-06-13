import '@/styles/globals.css'
import { startScheduler } from '@/jobs/scheduler'

// Start the sentiment check scheduler
startScheduler();

export default function App({ Component, pageProps }: AppProps) {
  return <Component {...pageProps} />
} 