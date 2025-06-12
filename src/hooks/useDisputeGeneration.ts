import { useState } from 'react';
import { DisputeGenerator } from '../services/disputeGenerator';
import { supabase } from '../lib/supabase';

interface Dispute {
  id: string;
  bureau: string;
  itemType: string;
  openedDate?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'rejected';
  round: number;
  letterUrl: string;
}

export const useDisputeGeneration = (userId: string) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [disputes, setDisputes] = useState<Dispute[]>([]);

  const generateDisputes = async () => {
    setIsGenerating(true);
    setError(null);

    try {
      const generator = DisputeGenerator.getInstance();
      const generatedDisputes = await generator.generateDisputes(userId);
      setDisputes(generatedDisputes);
      return generatedDisputes;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate disputes');
      throw err;
    } finally {
      setIsGenerating(false);
    }
  };

  const fetchDisputes = async () => {
    try {
      const { data, error: fetchError } = await supabase
        .from('disputes')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      setDisputes(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch disputes');
    }
  };

  const updateDisputeStatus = async (disputeId: string, status: Dispute['status']) => {
    try {
      const { error: updateError } = await supabase
        .from('disputes')
        .update({ status })
        .eq('id', disputeId);

      if (updateError) throw updateError;

      setDisputes(prev =>
        prev.map(dispute =>
          dispute.id === disputeId ? { ...dispute, status } : dispute
        )
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update dispute status');
    }
  };

  return {
    isGenerating,
    error,
    disputes,
    generateDisputes,
    fetchDisputes,
    updateDisputeStatus,
  };
}; 