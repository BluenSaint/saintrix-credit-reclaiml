import { useState, useEffect } from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DisputeFollowupService } from '@/services/dispute-followup';
import { AdminGuard } from '@/components/AdminGuard';
import { Mail, Phone, FileText, Fax, Calendar, CheckCircle, XCircle, Clock, Search } from 'lucide-react';

interface FollowupWithDetails {
  id: string;
  type: 'email' | 'letter' | 'phone' | 'fax';
  status: 'pending' | 'sent' | 'failed' | 'cancelled';
  scheduled_date: string;
  sent_date: string | null;
  recipient: string;
  content: string | null;
  response_received: boolean;
  response_date: string | null;
  response_content: string | null;
  dispute: {
    id: string;
    reference: string;
    client: {
      id: string;
      name: string;
      email: string;
    };
  };
}

export default function AdminFollowups() {
  const [followups, setFollowups] = useState<FollowupWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');

  useEffect(() => {
    fetchFollowups();
  }, []);

  const fetchFollowups = async () => {
    try {
      const data = await DisputeFollowupService.getPendingFollowups();
      setFollowups(data);
    } catch (error) {
      toast.error('Failed to fetch follow-ups');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (id: string, status: 'sent' | 'failed' | 'cancelled') => {
    try {
      await DisputeFollowupService.updateFollowupStatus(id, status);
      toast.success('Status updated successfully');
      fetchFollowups();
    } catch (error) {
      toast.error('Failed to update status');
      console.error(error);
    }
  };

  const handleCancel = async (id: string) => {
    try {
      await DisputeFollowupService.cancelFollowup(id);
      toast.success('Follow-up cancelled successfully');
      fetchFollowups();
    } catch (error) {
      toast.error('Failed to cancel follow-up');
      console.error(error);
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
      case 'fax':
        return <Fax className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'cancelled':
        return <XCircle className="h-4 w-4 text-gray-500" />;
      default:
        return null;
    }
  };

  const filteredFollowups = followups.filter(followup => {
    const matchesSearch = 
      followup.dispute.client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      followup.dispute.client.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      followup.dispute.reference.toLowerCase().includes(searchQuery.toLowerCase()) ||
      followup.recipient.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesType = !typeFilter || followup.type === typeFilter;
    const matchesStatus = !statusFilter || followup.status === statusFilter;

    return matchesSearch && matchesType && matchesStatus;
  });

  if (loading) {
    return <div>Loading follow-ups...</div>;
  }

  return (
    <AdminGuard>
      <div className="container mx-auto py-6 space-y-6">
        <h1 className="text-3xl font-bold">Dispute Follow-ups</h1>
        
        <Card>
          <CardHeader>
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="flex flex-1 gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by client name, email, or dispute reference..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8"
                  />
                </div>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter by type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Types</SelectItem>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="letter">Letter</SelectItem>
                    <SelectItem value="phone">Phone</SelectItem>
                    <SelectItem value="fax">Fax</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Statuses</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="sent">Sent</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Client</TableHead>
                  <TableHead>Dispute</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Recipient</TableHead>
                  <TableHead>Scheduled</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Response</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredFollowups.map((followup) => (
                  <TableRow key={followup.id}>
                    <TableCell>
                      <div className="font-medium">{followup.dispute.client.name}</div>
                      <div className="text-sm text-muted-foreground">{followup.dispute.client.email}</div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{followup.dispute.reference}</div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getTypeIcon(followup.type)}
                        <span className="capitalize">{followup.type}</span>
                      </div>
                    </TableCell>
                    <TableCell>{followup.recipient}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        {new Date(followup.scheduled_date).toLocaleString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(followup.status)}
                        <span className="capitalize">{followup.status}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {followup.response_received ? (
                        <div className="text-sm">
                          <div className="font-medium">Received: {new Date(followup.response_date!).toLocaleString()}</div>
                          <div className="text-muted-foreground">{followup.response_content}</div>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">No response</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {followup.status === 'pending' && (
                        <div className="flex space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleUpdateStatus(followup.id, 'sent')}
                          >
                            Mark Sent
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleUpdateStatus(followup.id, 'failed')}
                          >
                            Mark Failed
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleCancel(followup.id)}
                          >
                            Cancel
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {filteredFollowups.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground">
                      No follow-ups found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AdminGuard>
  );
} 