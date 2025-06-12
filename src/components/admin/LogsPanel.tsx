import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Card } from '../ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Badge } from '../ui/badge';
import { format } from 'date-fns';

interface AdminLog {
  id: string;
  user_id: string;
  action: string;
  details: any;
  created_at: string;
  user: {
    full_name: string;
    email: string;
    role: string;
  };
}

export const LogsPanel: React.FC = () => {
  const [logs, setLogs] = useState<AdminLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    role: 'all',
    action: 'all',
  });

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      const { data, error: fetchError } = await supabase
        .from('admin_logs')
        .select(`
          *,
          user:users(full_name, email, role)
        `)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      setLogs(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch logs');
    } finally {
      setLoading(false);
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'create':
        return 'bg-green-100 text-green-800';
      case 'update':
        return 'bg-blue-100 text-blue-800';
      case 'delete':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredLogs = logs.filter(log => {
    if (filters.role !== 'all' && log.user.role !== filters.role) return false;
    if (filters.action !== 'all' && !log.action.includes(filters.action)) return false;
    return true;
  });

  if (loading) {
    return <div>Loading logs...</div>;
  }

  if (error) {
    return <div className="text-red-500">Error: {error}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Activity Logs</h2>
      </div>

      <div className="flex space-x-4">
        <Select
          value={filters.role}
          onValueChange={(value) => setFilters(prev => ({ ...prev, role: value }))}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by Role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
            <SelectItem value="user">User</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={filters.action}
          onValueChange={(value) => setFilters(prev => ({ ...prev, action: value }))}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by Action" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Actions</SelectItem>
            <SelectItem value="create">Create</SelectItem>
            <SelectItem value="update">Update</SelectItem>
            <SelectItem value="delete">Delete</SelectItem>
            <SelectItem value="login">Login</SelectItem>
            <SelectItem value="logout">Logout</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4">
        {filteredLogs.map((log) => (
          <Card key={log.id} className="p-4">
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="font-medium">{log.user.full_name}</h3>
                  <Badge variant="outline">{log.user.role}</Badge>
                  <Badge className={getActionColor(log.action)}>
                    {log.action}
                  </Badge>
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  {format(new Date(log.created_at), 'PPpp')}
                </p>
                <p className="text-sm mt-2">
                  {JSON.stringify(log.details, null, 2)}
                </p>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}; 