import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { DisputeFollowupService } from '@/services/dispute-followup';
import { format } from 'date-fns';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import AdminGuard from '@/components/guards/AdminGuard';
import { Mail, Phone, FileText, Clock, CheckCircle, XCircle } from 'lucide-react';

interface Followup {
  id: string;
  type: string;
  status: string;
  scheduled_date: string;
  sent_date: string | null;
  recipient: string;
  content: string | null;
  response_received: boolean;
  response_date: string | null;
  response_content: string | null;
  dispute: {
    id: string;
    bureau: string;
    status: string;
    client: {
      id: string;
      full_name: string;
      email: string;
    };
  };
}

export default function AdminFollowups() {
  const [followups, setFollowups] = useState<Followup[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFollowups();
  }, []);

  const fetchFollowups = async () => {
    try {
      const data = await DisputeFollowupService.getPendingFollowups();
      setFollowups(data);
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

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      await DisputeFollowupService.updateFollowupStatus(id, status);
      toast({
        title: 'Success',
        description: 'Status updated successfully',
      });
      fetchFollowups();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleCancelFollowup = async (id: string) => {
    try {
      await DisputeFollowupService.cancelFollowup(id);
      toast({
        title: 'Success',
        description: 'Follow-up cancelled successfully',
      });
      fetchFollowups();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'email':
        return <Mail className="h-4 w-4" />;
      case 'phone':
        return <Phone className="h-4 w-4" />;
      case 'letter':
        return <FileText className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
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
            <CardTitle>Pending Follow-ups</CardTitle>
            <CardDescription>
              Manage and track all pending dispute follow-ups
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Client</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Scheduled</TableHead>
                  <TableHead>Recipient</TableHead>
                  <TableHead>Bureau</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {followups.map((followup) => (
                  <TableRow key={followup.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{followup.dispute.client.full_name}</div>
                        <div className="text-sm text-gray-500">{followup.dispute.client.email}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        {getTypeIcon(followup.type)}
                        <span className="capitalize">{followup.type}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {format(new Date(followup.scheduled_date), 'MMM d, yyyy h:mm a')}
                    </TableCell>
                    <TableCell>{followup.recipient}</TableCell>
                    <TableCell>{followup.dispute.bureau}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded text-sm ${
                        followup.status === 'sent' ? 'bg-green-100 text-green-800' :
                        followup.status === 'failed' ? 'bg-red-100 text-red-800' :
                        followup.status === 'cancelled' ? 'bg-gray-100 text-gray-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {followup.status}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          onClick={() => handleUpdateStatus(followup.id, 'sent')}
                          variant="outline"
                          size="sm"
                        >
                          Mark Sent
                        </Button>
                        <Button
                          onClick={() => handleCancelFollowup(followup.id)}
                          variant="outline"
                          size="sm"
                        >
                          Cancel
                        </Button>
                      </div>
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