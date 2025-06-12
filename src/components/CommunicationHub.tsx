import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/use-toast';
import { MessageService } from '@/services/message';
import { format } from 'date-fns';
import { Paperclip, Send, X, FileText, Image } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

interface Message {
  id: string;
  content: string;
  sender_id: string;
  sender_type: 'client' | 'admin';
  recipient_id: string;
  recipient_type: 'client' | 'admin';
  sent_at: string;
  read: boolean;
  thread_id: string | null;
  attachment_url: string | null;
  sender: {
    id: string;
    full_name: string;
    email: string;
  };
  recipient: {
    id: string;
    full_name: string;
    email: string;
  };
}

interface CommunicationHubProps {
  isAdmin?: boolean;
  selectedClientId?: string;
}

export function CommunicationHub({ isAdmin = false, selectedClientId }: CommunicationHubProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedThread, setSelectedThread] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [attachment, setAttachment] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();

  useEffect(() => {
    fetchMessages();
    MessageService.subscribeToNewMessages(handleNewMessage);
    return () => MessageService.unsubscribe();
  }, [isAdmin, selectedClientId]);

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const data = isAdmin
        ? await MessageService.getAllThreads()
        : await MessageService.getClientThreads(selectedClientId || '');
      setMessages(data);
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

  const handleNewMessage = (message: Message) => {
    setMessages(prev => [message, ...prev]);
    if (message.thread_id === selectedThread) {
      scrollToBottom();
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() && !attachment) return;

    try {
      let attachmentUrl = null;
      if (attachment) {
        attachmentUrl = await MessageService.uploadAttachment(attachment);
      }

      await MessageService.sendMessage({
        content: newMessage,
        sender_id: user?.id || '',
        sender_type: isAdmin ? 'admin' : 'client',
        recipient_id: selectedClientId || '',
        recipient_type: isAdmin ? 'client' : 'admin',
        thread_id: selectedThread,
        attachment_url: attachmentUrl,
      });

      setNewMessage('');
      setAttachment(null);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast({
          title: 'Error',
          description: 'File size must be less than 5MB',
          variant: 'destructive',
        });
        return;
      }
      setAttachment(file);
    }
  };

  const renderAttachmentPreview = () => {
    if (!attachment) return null;

    return (
      <div className="flex items-center gap-2 p-2 bg-gray-100 rounded">
        {attachment.type.startsWith('image/') ? (
          <Image className="h-4 w-4" />
        ) : (
          <FileText className="h-4 w-4" />
        )}
        <span className="text-sm truncate">{attachment.name}</span>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setAttachment(null)}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    );
  };

  const renderMessage = (message: Message) => {
    const isOwnMessage = message.sender_id === user?.id;
    const isImage = message.attachment_url?.match(/\.(jpg|jpeg|png|gif)$/i);

    return (
      <div
        key={message.id}
        className={cn(
          'flex flex-col gap-2 max-w-[80%]',
          isOwnMessage ? 'ml-auto' : 'mr-auto'
        )}
      >
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">
            {message.sender.full_name}
          </span>
          <span className="text-xs text-gray-500">
            {format(new Date(message.sent_at), 'MMM d, h:mm a')}
          </span>
        </div>
        <div
          className={cn(
            'rounded-lg p-3',
            isOwnMessage ? 'bg-blue-500 text-white' : 'bg-gray-100'
          )}
        >
          {message.content}
          {message.attachment_url && (
            <div className="mt-2">
              {isImage ? (
                <img
                  src={message.attachment_url}
                  alt="Attachment"
                  className="max-w-full rounded"
                />
              ) : (
                <a
                  href={message.attachment_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm underline"
                >
                  <FileText className="h-4 w-4" />
                  View Attachment
                </a>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <Card className="h-[600px] flex flex-col">
      <CardHeader>
        <CardTitle>Messages</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col gap-4">
        <div className="flex-1 overflow-y-auto space-y-4">
          {messages.map(renderMessage)}
          <div ref={messagesEndRef} />
        </div>
        <form onSubmit={handleSendMessage} className="space-y-2">
          {renderAttachmentPreview()}
          <div className="flex gap-2">
            <Input
              type="file"
              id="attachment"
              className="hidden"
              onChange={handleFileChange}
              accept="image/*,.pdf,.doc,.docx"
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => document.getElementById('attachment')?.click()}
            >
              <Paperclip className="h-4 w-4" />
            </Button>
            <Textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type your message..."
              className="flex-1"
            />
            <Button type="submit" size="icon">
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
} 