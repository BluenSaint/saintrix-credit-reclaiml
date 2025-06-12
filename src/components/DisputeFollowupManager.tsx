import { useState, useEffect } from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  Dialog,
  DialogContent,
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
import { DisputeFollowupService } from '@/services/dispute-followup';
import { Mail, Phone, FileText, Fax, Calendar, CheckCircle, XCircle, Clock } from 'lucide-react';

interface DisputeFollowup {
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
}

interface DisputeFollowupManagerProps {
  disputeId: string;
  isAdmin?: boolean;
}

export function DisputeFollowupManager({ disputeId, isAdmin = false }: DisputeFollowupManagerProps) {
  const [followups, setFollowups] = useState<DisputeFollowup[]>([]);
  const [loading, setLoading] = useState(true);
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  const [newFollowup, setNewFollowup] = useState({
    type: '',
    scheduledDate: '',
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
    } catch (error) {
      toast.error('Failed to fetch follow-ups');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSchedule = async () => {
    if (!newFollowup.type || !newFollowup.scheduledDate || !newFollowup.recipient) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      await DisputeFollowupService.scheduleFollowup(
        disputeId,
        newFollowup.type as 'email' | 'letter' | 'phone' | 'fax',
        new Date(newFollowup.scheduledDate),
        newFollowup.recipient,
        newFollowup.content || undefined
      );
      toast.success('Follow-up scheduled successfully');
      setScheduleDialogOpen(false);
      setNewFollowup({
        type: '',
        scheduledDate: '',
        recipient: '',
        content: ''
      });
      fetchFollowups();
    } catch (error) {
      toast.error('Failed to schedule follow-up');
      console.error(error);
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

  if (loading) {
    return <div>Loading follow-ups...</div>;
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <h2 className="text-xl font-semibold">Follow-ups</h2>
        {isAdmin && (
          <Dialog open={scheduleDialogOpen} onOpenChange={setScheduleDialogOpen}>
            <DialogTrigger asChild>
              <Button>Schedule Follow-up</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Schedule New Follow-up</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
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
                      <SelectItem value="letter">Letter</SelectItem>
                      <SelectItem value="phone">Phone</SelectItem>
                      <SelectItem value="fax">Fax</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="scheduledDate">Scheduled Date</Label>
                  <Input
                    id="scheduledDate"
                    type="datetime-local"
                    value={newFollowup.scheduledDate}
                    onChange={(e) => setNewFollowup({ ...newFollowup, scheduledDate: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="recipient">Recipient</Label>
                  <Input
                    id="recipient"
                    value={newFollowup.recipient}
                    onChange={(e) => setNewFollowup({ ...newFollowup, recipient: e.target.value })}
                    placeholder="Email, phone number, or address"
                  />
                </div>
                <div>
                  <Label htmlFor="content">Content (Optional)</Label>
                  <Input
                    id="content"
                    value={newFollowup.content}
                    onChange={(e) => setNewFollowup({ ...newFollowup, content: e.target.value })}
                    placeholder="Message content or notes"
                  />
                </div>
                <Button onClick={handleSchedule}>Schedule</Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Type</TableHead>
              <TableHead>Recipient</TableHead>
              <TableHead>Scheduled</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Response</TableHead>
              {isAdmin && <TableHead>Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {followups.map((followup) => (
              <TableRow key={followup.id}>
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
                {isAdmin && followup.status === 'pending' && (
                  <TableCell>
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
                  </TableCell>
                )}
              </TableRow>
            ))}
            {followups.length === 0 && (
              <TableRow>
                <TableCell colSpan={isAdmin ? 6 : 5} className="text-center text-muted-foreground">
                  No follow-ups scheduled
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
} 