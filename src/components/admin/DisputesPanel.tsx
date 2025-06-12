import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Badge } from '../ui/badge';
import { Download, RefreshCw } from 'lucide-react';
import { DisputeGenerator } from '../../services/disputeGenerator';

interface Dispute {
  id: string;
  user_id: string;
  bureau: string;
  item_type: string;
  opened_date: string;
  status: 'pending' | 'in_progress' | 'completed' | 'rejected';
  round: number;
  letter_url: string;
  user: {
    full_name: string;
    email: string;
  };
}

export const DisputesPanel: React.FC = () => {
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    bureau: 'all',
    status: 'all',
    round: 'all',
  });

  useEffect(() => {
    fetchDisputes();
  }, []);

  const fetchDisputes = async () => {
    try {
      const { data, error: fetchError } = await supabase
        .from('disputes')
        .select(`
          *,
          user:users(full_name, email)
        `)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      setDisputes(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch disputes');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (disputeId: string, newStatus: Dispute['status']) => {
    try {
      const { error: updateError } = await supabase
        .from('disputes')
        .update({ status: newStatus })
        .eq('id', disputeId);

      if (updateError) throw updateError;

      setDisputes(prev =>
        prev.map(dispute =>
          dispute.id === disputeId
            ? { ...dispute, status: newStatus }
            : dispute
        )
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update dispute status');
    }
  };

  const handleRegenerateLetter = async (dispute: Dispute) => {
    try {
      const generator = DisputeGenerator.getInstance();
      const updatedDispute = await generator.regenerateLetter(dispute.id);
      
      setDisputes(prev =>
        prev.map(d =>
          d.id === dispute.id
            ? { ...d, letter_url: updatedDispute.letter_url }
            : d
        )
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to regenerate letter');
    }
  };

  const filteredDisputes = disputes.filter(dispute => {
    if (filters.bureau !== 'all' && dispute.bureau !== filters.bureau) return false;
    if (filters.status !== 'all' && dispute.status !== filters.status) return false;
    if (filters.round !== 'all' && dispute.round !== parseInt(filters.round)) return false;
    return true;
  });

  if (loading) {
    return <div>Loading disputes...</div>;
  }

  if (error) {
    return <div className="text-red-500">Error: {error}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Disputes Management</h2>
      </div>

      <div className="flex space-x-4">
        <Select
          value={filters.bureau}
          onValueChange={(value) => setFilters(prev => ({ ...prev, bureau: value }))}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by Bureau" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Bureaus</SelectItem>
            <SelectItem value="Experian">Experian</SelectItem>
            <SelectItem value="TransUnion">TransUnion</SelectItem>
            <SelectItem value="Equifax">Equifax</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={filters.status}
          onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={filters.round}
          onValueChange={(value) => setFilters(prev => ({ ...prev, round: value }))}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by Round" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Rounds</SelectItem>
            <SelectItem value="1">Round 1</SelectItem>
            <SelectItem value="2">Round 2</SelectItem>
            <SelectItem value="3">Round 3</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-6">
        {filteredDisputes.map((dispute) => (
          <Card key={dispute.id} className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-semibold">{dispute.user.full_name}</h3>
                <p className="text-gray-500">{dispute.user.email}</p>
                <div className="mt-2 space-x-2">
                  <Badge variant="outline">{dispute.bureau}</Badge>
                  <Badge variant={
                    dispute.status === 'completed' ? 'default' :
                    dispute.status === 'rejected' ? 'destructive' :
                    dispute.status === 'in_progress' ? 'secondary' :
                    'outline'
                  }>
                    {dispute.status}
                  </Badge>
                  <Badge variant="outline">Round {dispute.round}</Badge>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <Select
                  value={dispute.status}
                  onValueChange={(value: Dispute['status']) => handleStatusUpdate(dispute.id, value)}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Update Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(dispute.letter_url, '_blank')}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download Letter
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleRegenerateLetter(dispute)}
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Regenerate
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}; 