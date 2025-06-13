import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { formatDistanceToNow } from 'date-fns';

interface AtRiskUser {
  id: string;
  user: {
    id: string;
    email: string;
    created_at: string;
  };
  flag_type: string;
  reason: string;
  created_at: string;
  status: string;
}

export const AtRiskUsers: React.FC = () => {
  const [users, setUsers] = useState<AtRiskUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAtRiskUsers();
  }, []);

  const fetchAtRiskUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('user_flags')
        .select(`
          id,
          flag_type,
          reason,
          created_at,
          status,
          user:user_id (
            id,
            email,
            created_at
          )
        `)
        .eq('flag_type', 'at_risk')
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching at-risk users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleResolveFlag = async (flagId: string, resolution: 'resolved' | 'false_positive') => {
    try {
      const { error } = await supabase
        .from('user_flags')
        .update({
          status: resolution,
          resolved_at: new Date().toISOString(),
        })
        .eq('id', flagId);

      if (error) throw error;
      await fetchAtRiskUsers();
    } catch (error) {
      console.error('Error resolving flag:', error);
    }
  };

  if (loading) {
    return <div>Loading at-risk users...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>At-Risk Users</span>
          <Badge variant="destructive">{users.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Reason</TableHead>
              <TableHead>Flagged</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell>{user.user.email}</TableCell>
                <TableCell>{user.reason}</TableCell>
                <TableCell>
                  {formatDistanceToNow(new Date(user.created_at), { addSuffix: true })}
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleResolveFlag(user.id, 'resolved')}
                    >
                      Resolve
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleResolveFlag(user.id, 'false_positive')}
                    >
                      False Positive
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {users.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground">
                  No at-risk users found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}; 