import { supabase } from '../lib/supabase';
import { SentimentDetectionService } from '../services/sentimentDetection';

export async function checkUserSentiment() {
  try {
    // Check for inactive users (no activity in 3+ days)
    const { data: inactiveUsers } = await supabase
      .from('user_activity')
      .select('user_id')
      .lt('last_activity', new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString());

    for (const user of inactiveUsers || []) {
      await SentimentDetectionService.getInstance().logSentimentTrigger(
        user.user_id,
        'inactivity',
        'User has been inactive for 3+ days'
      );
    }

    // Check for users with multiple support contacts
    const { data: supportContacts } = await supabase
      .from('support_tickets')
      .select('user_id, count')
      .gte('count', 2)
      .lt('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

    for (const contact of supportContacts || []) {
      await SentimentDetectionService.getInstance().logSentimentTrigger(
        contact.user_id,
        'support_contact',
        'User has submitted multiple support tickets'
      );
    }

    // Check for users with missing documents
    const { data: missingDocs } = await supabase
      .from('documents')
      .select('user_id')
      .is('status', null)
      .lt('created_at', new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString());

    for (const doc of missingDocs || []) {
      await SentimentDetectionService.getInstance().logSentimentTrigger(
        doc.user_id,
        'missing_docs',
        'User has not uploaded required documents'
      );
    }

    // Check for unopened dispute letters
    const { data: unopenedLetters } = await supabase
      .from('disputes')
      .select('user_id')
      .eq('status', 'pending')
      .lt('created_at', new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString());

    for (const letter of unopenedLetters || []) {
      await SentimentDetectionService.getInstance().logSentimentTrigger(
        letter.user_id,
        'unopened_letters',
        'User has not opened generated dispute letters'
      );
    }

    console.log('Sentiment check completed successfully');
  } catch (error) {
    console.error('Error in sentiment check:', error);
  }
} 