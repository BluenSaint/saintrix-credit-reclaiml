import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { ReferralService } from '@/services/referral';
import { supabase } from '@/lib/supabase';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import AdminGuard from '@/components/guards/AdminGuard';

interface Referral {
  id: string;
  referral_code: string;
  status: string;
  created_at: string;
  completed_at: string | null;
  reward_type: string | null;
  reward_status: string;
  referrer: {
    full_name: string;
    email: string;
  };
  referred: {
    full_name: string;
    email: string;
  } | null;
}

export default function AdminReferrals() {
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReferrals();
  }, []);

  const fetchReferrals = async () => {
    try {
      const { data, error } = await supabase
        .from('referrals')
        .select(`
          *,
          referrer:referrer_id (
            full_name,
            email
          ),
          referred:referred_id (
            full_name,
            email
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setReferrals(data);
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

  const handleIssueReward = async (referralId: string) => {
    try {
      await ReferralService.issueReward(referralId);
      toast({
        title: 'Success',
        description: 'Reward issued successfully',
      });
      fetchReferrals();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <AdminGuard>
      <div className="container mx-auto py-10">
        <Card>
          <CardHeader>
            <CardTitle>Referral Management</CardTitle>
            <CardDescription>
              Manage referrals and issue rewards
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Referrer</TableHead>
                  <TableHead>Referred</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Reward</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {referrals.map((referral) => (
                  <TableRow key={referral.id}>
                    <TableCell>
                      {new Date(referral.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{referral.referrer.full_name}</div>
                        <div className="text-sm text-gray-500">{referral.referrer.email}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {referral.referred ? (
                        <div>
                          <div className="font-medium">{referral.referred.full_name}</div>
                          <div className="text-sm text-gray-500">{referral.referred.email}</div>
                        </div>
                      ) : (
                        <span className="text-gray-500">Pending</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <code className="px-2 py-1 bg-gray-100 rounded">
                        {referral.referral_code}
                      </code>
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
                    <TableCell>
                      {referral.status === 'completed' && referral.reward_status === 'pending' && (
                        <Button
                          onClick={() => handleIssueReward(referral.id)}
                          variant="outline"
                          size="sm"
                        >
                          Issue Reward
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AdminGuard>
  );
} 