import { useState, useEffect } from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
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
import { DocumentService, Document } from '@/services/document';
import { AdminGuard } from '@/components/AdminGuard';
import { EyeIcon, DownloadIcon, TrashIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DocumentManager } from '@/components/DocumentManager';

interface Client {
  id: string;
  full_name: string;
  email: string;
}

export default function AdminDocuments() {
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClient, setSelectedClient] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('id, full_name, email')
        .order('full_name');

      if (error) throw error;
      setClients(data);
    } catch (error) {
      toast.error('Failed to fetch clients');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <AdminGuard>
      <div className="container mx-auto py-6 space-y-6">
        <Card>
          <CardHeader>
            <h1 className="text-2xl font-bold">Document Management</h1>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <div className="flex-1">
                  <Select
                    value={selectedClient}
                    onValueChange={setSelectedClient}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a client" />
                    </SelectTrigger>
                    <SelectContent>
                      {clients.map((client) => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.full_name} ({client.email})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {selectedClient && (
                <DocumentManager
                  clientId={selectedClient}
                  isAdmin={true}
                />
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminGuard>
  );
} 