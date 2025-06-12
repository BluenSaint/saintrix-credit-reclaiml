import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { toast } from '@/components/ui/use-toast';
import { MessageService } from '@/services/message';
import { CommunicationHub } from '@/components/CommunicationHub';
import AdminGuard from '@/components/guards/AdminGuard';
import { Search } from 'lucide-react';

interface Thread {
  id: string;
  client: {
    id: string;
    full_name: string;
    email: string;
  };
  last_message: {
    content: string;
    sent_at: string;
  };
  unread_count: number;
}

export default function AdminCommunications() {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchThreads();
  }, []);

  const fetchThreads = async () => {
    try {
      setLoading(true);
      const messages = await MessageService.getAllThreads();
      
      // Group messages by client and get latest message
      const threadMap = new Map<string, Thread>();
      messages.forEach(message => {
        const clientId = message.sender_type === 'client' ? message.sender_id : message.recipient_id;
        const client = message.sender_type === 'client' ? message.sender : message.recipient;
        
        if (!threadMap.has(clientId)) {
          threadMap.set(clientId, {
            id: clientId,
            client,
            last_message: {
              content: message.content,
              sent_at: message.sent_at
            },
            unread_count: message.read ? 0 : 1
          });
        } else {
          const thread = threadMap.get(clientId)!;
          if (new Date(message.sent_at) > new Date(thread.last_message.sent_at)) {
            thread.last_message = {
              content: message.content,
              sent_at: message.sent_at
            };
          }
          if (!message.read) {
            thread.unread_count++;
          }
        }
      });

      setThreads(Array.from(threadMap.values()));
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

  const filteredThreads = threads.filter(thread =>
    thread.client.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    thread.client.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <AdminGuard>
      <div className="container mx-auto py-10">
        <div className="grid grid-cols-12 gap-6">
          <Card className="col-span-4">
            <CardHeader>
              <CardTitle>Conversations</CardTitle>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  placeholder="Search clients..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8"
                />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {filteredThreads.map(thread => (
                  <div
                    key={thread.id}
                    className={`p-3 rounded-lg cursor-pointer hover:bg-gray-100 ${
                      selectedClientId === thread.id ? 'bg-gray-100' : ''
                    }`}
                    onClick={() => setSelectedClientId(thread.id)}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-medium">{thread.client.full_name}</div>
                        <div className="text-sm text-gray-500">{thread.client.email}</div>
                      </div>
                      {thread.unread_count > 0 && (
                        <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
                          {thread.unread_count}
                        </span>
                      )}
                    </div>
                    <div className="mt-1 text-sm text-gray-600 truncate">
                      {thread.last_message.content}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          <div className="col-span-8">
            {selectedClientId ? (
              <CommunicationHub isAdmin selectedClientId={selectedClientId} />
            ) : (
              <Card className="h-[600px] flex items-center justify-center">
                <div className="text-center text-gray-500">
                  Select a conversation to view messages
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </AdminGuard>
  );
} 