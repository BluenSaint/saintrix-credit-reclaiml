import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Switch } from '../ui/switch';
import { Badge } from '../ui/badge';
import { Eye, Download, CheckCircle, XCircle } from 'lucide-react';

interface User {
  id: string;
  email: string;
  full_name: string;
  role: string;
  intake_status: string;
  credit_insurance: boolean;
  created_at: string;
  documents: {
    id: string;
    type: string;
    file_url: string;
    upload_date: string;
  }[];
  credit_report?: {
    score: number;
    source: string;
    sync_date: string;
  };
  disputes: {
    id: string;
    bureau: string;
    status: string;
    round: number;
    letter_url: string;
  }[];
}

export const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isViewingDocuments, setIsViewingDocuments] = useState(false);
  const [isViewingDisputes, setIsViewingDisputes] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select(`
          *,
          documents (*),
          credit_reports (*),
          disputes (*)
        `)
        .order('created_at', { ascending: false });

      if (usersError) throw usersError;

      setUsers(usersData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleInsurance = async (userId: string, currentValue: boolean) => {
    try {
      const { error: updateError } = await supabase
        .from('users')
        .update({ credit_insurance: !currentValue })
        .eq('id', userId);

      if (updateError) throw updateError;

      setUsers(prev =>
        prev.map(user =>
          user.id === userId
            ? { ...user, credit_insurance: !currentValue }
            : user
        )
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update insurance status');
    }
  };

  const handleApproveLegacy = async (userId: string) => {
    try {
      const { error: updateError } = await supabase
        .from('users')
        .update({ intake_status: 'complete' })
        .eq('id', userId);

      if (updateError) throw updateError;

      setUsers(prev =>
        prev.map(user =>
          user.id === userId
            ? { ...user, intake_status: 'complete' }
            : user
        )
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to approve legacy client');
    }
  };

  if (loading) {
    return <div>Loading users...</div>;
  }

  if (error) {
    return <div className="text-red-500">Error: {error}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">User Management</h2>
      </div>

      <div className="grid gap-6">
        {users.map((user) => (
          <Card key={user.id} className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-semibold">{user.full_name}</h3>
                <p className="text-gray-500">{user.email}</p>
                <div className="mt-2 space-x-2">
                  <Badge variant={user.intake_status === 'complete' ? 'default' : 'secondary'}>
                    {user.intake_status}
                  </Badge>
                  {user.credit_report && (
                    <Badge variant="outline">
                      Score: {user.credit_report.score}
                    </Badge>
                  )}
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Label htmlFor={`insurance-${user.id}`}>Credit Insurance</Label>
                  <Switch
                    id={`insurance-${user.id}`}
                    checked={user.credit_insurance}
                    onCheckedChange={() => handleToggleInsurance(user.id, user.credit_insurance)}
                  />
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedUser(user);
                    setIsViewingDocuments(true);
                  }}
                >
                  <Eye className="w-4 h-4 mr-2" />
                  Documents
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedUser(user);
                    setIsViewingDisputes(true);
                  }}
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Disputes
                </Button>

                {user.intake_status !== 'complete' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleApproveLegacy(user.id)}
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Approve Legacy
                  </Button>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Documents Dialog */}
      <Dialog open={isViewingDocuments} onOpenChange={setIsViewingDocuments}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>User Documents</DialogTitle>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4">
              {selectedUser.documents.map((doc) => (
                <Card key={doc.id} className="p-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="font-medium">{doc.type}</h4>
                      <p className="text-sm text-gray-500">
                        Uploaded: {new Date(doc.upload_date).toLocaleDateString()}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(doc.file_url, '_blank')}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Disputes Dialog */}
      <Dialog open={isViewingDisputes} onOpenChange={setIsViewingDisputes}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>User Disputes</DialogTitle>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4">
              {selectedUser.disputes.map((dispute) => (
                <Card key={dispute.id} className="p-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="font-medium">{dispute.bureau}</h4>
                      <p className="text-sm text-gray-500">
                        Round {dispute.round} - {dispute.status}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(dispute.letter_url, '_blank')}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download Letter
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}; 