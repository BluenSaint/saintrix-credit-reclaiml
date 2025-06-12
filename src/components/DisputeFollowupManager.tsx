import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar, Mail, Phone, FileText, Clock, CheckCircle, XCircle } from 'lucide-react';

interface DisputeFollowup {
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
}

interface DisputeFollowupManagerProps {
  disputeId: string;
  isAdmin?: boolean;
}

export function DisputeFollowupManager({ disputeId, isAdmin = false }: DisputeFollowupManagerProps) {
  const [followups, setFollowups] = useState<DisputeFollowup[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newFollowup, setNewFollowup] = useState({
    type: '',
    scheduled_date: '',
    recipient: '',
    content: ''
  });

  useEffect(() => {
    fetchFollowups();
  }, [disputeId]);

  const fetchFollowups = async () => {
    try {
      const data = await DisputeFollowupService.getDisputeFollowups(disputeId);
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

  const handleScheduleFollowup = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const followup = await DisputeFollowupService.scheduleFollowup({
        dispute_id: disputeId,
        type: newFollowup.type,
        scheduled_date: newFollowup.scheduled_date,
        recipient: newFollowup.recipient,
        content: newFollowup.content,
        status: 'pending'
      });

      setFollowups([followup, ...followups]);
      setShowAddDialog(false);
      setNewFollowup({
        type: '',
        scheduled_date: '',
        recipient: '',
        content: ''
      });

      toast({
        title: 'Success',
        description: 'Follow-up scheduled successfully',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      const updated = await DisputeFollowupService.updateFollowupStatus(id, status);
      setFollowups(followups.map(f => f.id === id ? updated : f));
      toast({
        title: 'Success',
        description: 'Status updated successfully',
      });
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
      const updated = await DisputeFollowupService.cancelFollowup(id);
      setFollowups(followups.map(f => f.id === id ? updated : f));
      toast({
        title: 'Success',
        description: 'Follow-up cancelled successfully',
      });
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
    <div className="space-y-6">
      {isAdmin && (
        <div className="flex justify-end">
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button>Schedule Follow-up</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Schedule New Follow-up</DialogTitle>
                <DialogDescription>
                  Schedule a new follow-up for this dispute
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleScheduleFollowup} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="type">Type</Label>
                  <Select
                    value={newFollowup.type}
                    onValueChange={(value) => setNewFollowup({ ...newFollowup, type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="phone">Phone</SelectItem>
                      <SelectItem value="letter">Letter</SelectItem>
                      <SelectItem value="fax">Fax</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="scheduled_date">Scheduled Date</Label>
                  <Input
                    id="scheduled_date"
                    type="datetime-local"
                    value={newFollowup.scheduled_date}
                    onChange={e => setNewFollowup({ ...newFollowup, scheduled_date: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="recipient">Recipient</Label>
                  <Input
                    id="recipient"
                    value={newFollowup.recipient}
                    onChange={e => setNewFollowup({ ...newFollowup, recipient: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="content">Content</Label>
                  <Input
                    id="content"
                    value={newFollowup.content}
                    onChange={e => setNewFollowup({ ...newFollowup, content: e.target.value })}
                  />
                </div>
                <Button type="submit" className="w-full">Schedule</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Follow-up History</CardTitle>
          <CardDescription>
            Track all follow-ups for this dispute
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Scheduled</TableHead>
                <TableHead>Recipient</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Response</TableHead>
                {isAdmin && <TableHead>Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {followups.map((followup) => (
                <TableRow key={followup.id}>
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
                    {followup.response_received ? (
                      <div className="flex items-center space-x-2 text-green-600">
                        <CheckCircle className="h-4 w-4" />
                        <span>Received</span>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2 text-gray-500">
                        <XCircle className="h-4 w-4" />
                        <span>Pending</span>
                      </div>
                    )}
                  </TableCell>
                  {isAdmin && (
                    <TableCell>
                      <div className="flex space-x-2">
                        {followup.status === 'pending' && (
                          <>
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
                          </>
                        )}
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
} 