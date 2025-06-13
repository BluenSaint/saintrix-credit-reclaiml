import { supabase } from '@/integrations/supabase/client';
import { SentimentDetectionService } from '@/services/sentimentDetection';

export async function checkUserSentiment() {
  try {
    // Check for inactive users (3+ days)
    const { data: inactiveUsers } = await supabase
      .from('clients')
      .select('user_id')
      .lt('last_activity', new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString());

    for (const user of inactiveUsers || []) {
      await SentimentDetectionService.logSentimentTrigger({
        type: 'inactivity',
        userId: user.user_id,
        details: 'User inactive for 3+ days',
      });
    }

    // Check for multiple support contacts (2+ times)
    const { data: supportContacts } = await supabase
      .from('messages')
      .select('sender_id, count')
      .eq('sender_type', 'client')
      .gte('count', 2)
      .group('sender_id');

    for (const contact of supportContacts || []) {
      await SentimentDetectionService.logSentimentTrigger({
        type: 'support_contact',
        userId: contact.sender_id,
        details: 'Multiple support contacts made',
      });
    }

    // Check for missing documents (5+ days)
    const { data: missingDocs } = await supabase
      .from('documents')
      .select('client_id')
      .is('file_url', null)
      .lt('created_at', new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString());

    for (const doc of missingDocs || []) {
      await SentimentDetectionService.logSentimentTrigger({
        type: 'missing_docs',
        userId: doc.client_id,
        details: 'Documents missing for 5+ days',
      });
    }

    // Check for unopened dispute letters
    const { data: unopenedLetters } = await supabase
      .from('disputes')
      .select('user_id')
      .eq('status', 'sent')
      .is('opened_at', null)
      .lt('created_at', new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString());

    for (const letter of unopenedLetters || []) {
      await SentimentDetectionService.logSentimentTrigger({
        type: 'unopened_letters',
        userId: letter.user_id,
        details: 'Dispute letters not opened/downloaded',
      });
    }
  } catch (error) {
    console.error('Error in sentiment check job:', error);
  }
} 