import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from '@/components/ui/use-toast';
import { ReferralService } from '@/services/referral';
import { supabase } from '@/lib/supabase';
import { Share2, Copy, Users, Award, Clock } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface ReferralStats {
  totalReferred: number;
  completedReferrals: number;
  pendingReferrals: number;
  rewardsEarned: number;
}

export function ReferralSystem() {
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [referralCode, setReferralCode] = useState<string>('');
  const [referralHistory, setReferralHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [clientId, setClientId] = useState<string>('');

  useEffect(() => {
    fetchClientAndStats();
  }, []);

  const fetchClientAndStats = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: client } = await supabase
        .from('clients')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!client) throw new Error('Client not found');

      setClientId(client.id);
      const stats = await ReferralService.getReferralStats(client.id);
      setStats(stats);

      const history = await ReferralService.getReferralHistory(client.id);
      setReferralHistory(history);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateCode = async () => {
    try {
      const code = await ReferralService.generateReferralCode(clientId);
      setReferralCode(code);
      toast({
        title: 'Success',
        description: 'New referral code generated!',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleCopyCode = () => {
    if (!referralCode) return;
    navigator.clipboard.writeText(referralCode);
    toast({
      title: 'Copied!',
      description: 'Referral code copied to clipboard',
    });
  };

  const handleShareCode = async () => {
    if (!referralCode) return;
    try {
      await navigator.share({
        title: 'Join SAINTRIX Credit Repair',
        text: `Use my referral code ${referralCode} to get started with SAINTRIX Credit Repair!`,
        url: window.location.origin,
      });
    } catch (error) {
      // Fallback to clipboard if sharing is not supported
      handleCopyCode();
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Referrals</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalReferred || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.completedReferrals || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.pendingReferrals || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rewards Earned</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.rewardsEarned || 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* Referral Code Section */}
      <Card>
        <CardHeader>
          <CardTitle>Your Referral Code</CardTitle>
          <CardDescription>
            Share your code with friends to earn rewards
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-2">
            <Input
              value={referralCode}
              readOnly
              placeholder="Generate a referral code"
            />
            <Button onClick={handleGenerateCode} variant="outline">
              Generate
            </Button>
            <Button onClick={handleCopyCode} variant="outline">
              <Copy className="h-4 w-4" />
            </Button>
            <Button onClick={handleShareCode} variant="outline">
              <Share2 className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Referral History */}
      <Card>
        <CardHeader>
          <CardTitle>Referral History</CardTitle>
          <CardDescription>
            Track your referrals and rewards
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Referred User</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Reward</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {referralHistory.map((referral) => (
                <TableRow key={referral.id}>
                  <TableCell>
                    {new Date(referral.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    {referral.referred?.full_name || 'Pending'}
                  </TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded text-sm ${
                      referral.status === 'completed' ? 'bg-green-100 text-green-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {referral.status}
                    </span>
                  </TableCell>
                  <TableCell>
                    {referral.reward_status === 'issued' ? (
                      <span className="text-green-600">Issued</span>
                    ) : referral.reward_status === 'pending' ? (
                      <span className="text-yellow-600">Pending</span>
                    ) : (
                      <span className="text-gray-600">Expired</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
} 