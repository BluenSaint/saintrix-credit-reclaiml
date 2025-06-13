import React, { useEffect, useState } from 'react';
import { SentimentDetectionService } from '@/services/sentimentDetection';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface AtRiskUser {
  id: string;
  user: {
    id: string;
    email: string;
    created_at: string;
  };
  reason: string;
  created_at: string;
}

export function AtRiskUsers() {
  const [users, setUsers] = useState<AtRiskUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAtRiskUsers();
  }, []);

  const loadAtRiskUsers = async () => {
    try {
      const atRiskUsers = await SentimentDetectionService.getAtRiskUsers();
      setUsers(atRiskUsers);
    } catch (error) {
      console.error('Error loading at-risk users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleResolve = async (flagId: string, resolution: 'resolved' | 'false_positive') => {
    try {
      await SentimentDetectionService.resolveFlag(flagId, resolution);
      await loadAtRiskUsers(); // Reload the list
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
        <CardTitle>At-Risk Users</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Flagged At</TableHead>
              <TableHead>Reason</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <Badge variant="destructive">🔴 At Risk</Badge>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{user.reason}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <div className="ml-2">{user.user.email}</div>
                </TableCell>
                <TableCell>
                  {new Date(user.created_at).toLocaleDateString()}
                </TableCell>
                <TableCell>{user.reason}</TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleResolve(user.id, 'resolved')}
                    >
                      Mark Resolved
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleResolve(user.id, 'false_positive')}
                    >
                      False Positive
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {users.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-center">
                  No at-risk users found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
} 