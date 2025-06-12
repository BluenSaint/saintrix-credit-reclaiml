import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface CreditSyncStepProps {
  userId: string;
  onComplete: () => void;
}

interface CreditReport {
  name: string;
  score: number;
  items: Array<{
    bureau: string;
    type: string;
    dateOpened?: string;
    status: string;
    balance?: number;
    account?: string;
  }>;
}

const mockCreditKarmaData: CreditReport = {
  name: "Jane Smith",
  score: 598,
  items: [
    {
      bureau: "Experian",
      type: "Collection",
      dateOpened: "2023-01-10",
      status: "Negative",
      balance: 1023
    },
    {
      bureau: "TransUnion",
      type: "Late Payment",
      account: "Capital One",
      status: "Negative"
    }
  ]
};

const mockExperianData: CreditReport = {
  name: "Jane Smith",
  score: 612,
  items: [
    {
      bureau: "Experian",
      type: "Collection",
      dateOpened: "2023-01-10",
      status: "Negative",
      balance: 1023
    },
    {
      bureau: "Experian",
      type: "Late Payment",
      account: "Chase",
      status: "Negative"
    }
  ]
};

export const CreditSyncStep: React.FC<CreditSyncStepProps> = ({
  userId,
  onComplete,
}) => {
  const navigate = useNavigate();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<'karma' | 'experian' | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [syncedReport, setSyncedReport] = useState<CreditReport | null>(null);

  const handleSync = async (provider: 'karma' | 'experian') => {
    setSelectedProvider(provider);
    setIsDialogOpen(true);
  };

  const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSyncing(true);
    setError(null);

    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      const reportData = selectedProvider === 'karma' ? mockCreditKarmaData : mockExperianData;

      // Store in Supabase
      const { error: dbError } = await supabase
        .from('credit_reports')
        .insert([{
          user_id: userId,
          source: selectedProvider,
          score: reportData.score,
          items: reportData.items,
          sync_date: new Date().toISOString()
        }]);

      if (dbError) throw dbError;

      setSyncedReport(reportData);
      setIsDialogOpen(false);
      onComplete();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sync credit report');
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold">Sync Your Credit Report</h2>
        <p className="text-gray-500">
          Connect your credit report from one of our supported providers
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold">Credit Karma</h3>
              <p className="text-sm text-gray-500">
                Sync your credit report from Credit Karma
              </p>
            </div>
            <Button
              onClick={() => handleSync('karma')}
              disabled={isSyncing || !!syncedReport}
            >
              Sync Now
            </Button>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold">Experian</h3>
              <p className="text-sm text-gray-500">
                Sync your credit report from Experian
              </p>
            </div>
            <Button
              onClick={() => handleSync('experian')}
              disabled={isSyncing || !!syncedReport}
            >
              Sync Now
            </Button>
          </div>
        </Card>
      </div>

      {syncedReport && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold">Credit Report Synced</h3>
              <p className="text-sm text-gray-500">
                Score: {syncedReport.score}
              </p>
            </div>
            <CheckCircle2 className="h-5 w-5 text-green-500" />
          </div>
        </Card>
      )}

      <div className="flex justify-between items-center">
        <Button
          variant="outline"
          onClick={() => navigate('/signup/documents')}
        >
          Back
        </Button>

        <Button
          onClick={() => navigate('/dashboard')}
          disabled={!syncedReport}
        >
          Continue to Dashboard
        </Button>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedProvider === 'karma' ? 'Credit Karma Login' : 'Experian Login'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                required
              />
            </div>
            <Button
              type="submit"
              className="w-full"
              disabled={isSyncing}
            >
              {isSyncing ? 'Syncing...' : 'Login and Sync'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}; 