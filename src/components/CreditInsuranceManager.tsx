import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/use-toast';
import { CreditInsuranceService } from '@/services/credit-insurance';
import { supabase } from '@/lib/supabase';
import { Shield, Calendar, DollarSign, AlertCircle } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { format } from 'date-fns';

interface InsurancePolicy {
  id: string;
  policy_number: string;
  provider: string;
  coverage_amount: number;
  start_date: string;
  end_date: string;
  status: string;
  monthly_premium: number;
  payment_status: string;
  last_payment_date: string | null;
  next_payment_date: string | null;
}

export function CreditInsuranceManager() {
  const [policies, setPolicies] = useState<InsurancePolicy[]>([]);
  const [loading, setLoading] = useState(true);
  const [clientId, setClientId] = useState<string>('');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newPolicy, setNewPolicy] = useState({
    policy_number: '',
    provider: '',
    coverage_amount: '',
    start_date: '',
    end_date: '',
    monthly_premium: ''
  });

  useEffect(() => {
    fetchClientAndPolicies();
  }, []);

  const fetchClientAndPolicies = async () => {
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
      const policies = await CreditInsuranceService.getClientInsurance(client.id);
      setPolicies(policies);
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

  const handleAddPolicy = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const policy = await CreditInsuranceService.addInsurance({
        client_id: clientId,
        policy_number: newPolicy.policy_number,
        provider: newPolicy.provider,
        coverage_amount: parseFloat(newPolicy.coverage_amount),
        start_date: newPolicy.start_date,
        end_date: newPolicy.end_date,
        monthly_premium: parseFloat(newPolicy.monthly_premium),
        status: 'active',
        payment_status: 'current',
        next_payment_date: newPolicy.start_date
      });

      setPolicies([policy, ...policies]);
      setShowAddDialog(false);
      setNewPolicy({
        policy_number: '',
        provider: '',
        coverage_amount: '',
        start_date: '',
        end_date: '',
        monthly_premium: ''
      });

      toast({
        title: 'Success',
        description: 'Insurance policy added successfully',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleRecordPayment = async (policyId: string) => {
    try {
      const updated = await CreditInsuranceService.recordPayment(policyId, new Date());
      setPolicies(policies.map(p => p.id === policyId ? updated : p));
      toast({
        title: 'Success',
        description: 'Payment recorded successfully',
      });
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
    <div className="space-y-6">
      {/* Insurance Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Policies</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {policies.filter(p => p.status === 'active').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Coverage</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${policies
                .filter(p => p.status === 'active')
                .reduce((sum, p) => sum + p.coverage_amount, 0)
                .toLocaleString()}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Next Payment</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {policies.find(p => p.status === 'active' && p.payment_status === 'current')
                ?.next_payment_date
                ? format(new Date(policies.find(p => p.status === 'active' && p.payment_status === 'current')!.next_payment_date!), 'MMM d, yyyy')
                : 'N/A'}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Payment Status</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {policies.some(p => p.payment_status === 'past_due')
                ? 'Past Due'
                : policies.every(p => p.payment_status === 'cancelled')
                  ? 'Cancelled'
                  : 'Current'}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Add Policy Button */}
      <div className="flex justify-end">
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button>Add Insurance Policy</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Insurance Policy</DialogTitle>
              <DialogDescription>
                Enter the details of your new insurance policy
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAddPolicy} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="policy_number">Policy Number</Label>
                <Input
                  id="policy_number"
                  value={newPolicy.policy_number}
                  onChange={e => setNewPolicy({ ...newPolicy, policy_number: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="provider">Provider</Label>
                <Input
                  id="provider"
                  value={newPolicy.provider}
                  onChange={e => setNewPolicy({ ...newPolicy, provider: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="coverage_amount">Coverage Amount</Label>
                <Input
                  id="coverage_amount"
                  type="number"
                  value={newPolicy.coverage_amount}
                  onChange={e => setNewPolicy({ ...newPolicy, coverage_amount: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="start_date">Start Date</Label>
                <Input
                  id="start_date"
                  type="date"
                  value={newPolicy.start_date}
                  onChange={e => setNewPolicy({ ...newPolicy, start_date: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end_date">End Date</Label>
                <Input
                  id="end_date"
                  type="date"
                  value={newPolicy.end_date}
                  onChange={e => setNewPolicy({ ...newPolicy, end_date: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="monthly_premium">Monthly Premium</Label>
                <Input
                  id="monthly_premium"
                  type="number"
                  value={newPolicy.monthly_premium}
                  onChange={e => setNewPolicy({ ...newPolicy, monthly_premium: e.target.value })}
                  required
                />
              </div>
              <Button type="submit" className="w-full">Add Policy</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Policies Table */}
      <Card>
        <CardHeader>
          <CardTitle>Insurance Policies</CardTitle>
          <CardDescription>
            Manage your credit insurance policies
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Policy Number</TableHead>
                <TableHead>Provider</TableHead>
                <TableHead>Coverage</TableHead>
                <TableHead>Premium</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Next Payment</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {policies.map((policy) => (
                <TableRow key={policy.id}>
                  <TableCell>{policy.policy_number}</TableCell>
                  <TableCell>{policy.provider}</TableCell>
                  <TableCell>${policy.coverage_amount.toLocaleString()}</TableCell>
                  <TableCell>${policy.monthly_premium.toLocaleString()}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded text-sm ${
                      policy.status === 'active' ? 'bg-green-100 text-green-800' :
                      policy.status === 'expired' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {policy.status}
                    </span>
                  </TableCell>
                  <TableCell>
                    {policy.next_payment_date
                      ? format(new Date(policy.next_payment_date), 'MMM d, yyyy')
                      : 'N/A'}
                  </TableCell>
                  <TableCell>
                    {policy.status === 'active' && (
                      <Button
                        onClick={() => handleRecordPayment(policy.id)}
                        variant="outline"
                        size="sm"
                      >
                        Record Payment
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
  );
} 