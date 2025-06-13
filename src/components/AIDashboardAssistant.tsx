import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageSquare, Send, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";
import { SentimentAnalysis } from './SentimentAnalysis';
import { SentimentDetectionService } from '@/services/sentimentDetection';

interface Message {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
}

interface AIDashboardAssistantProps {
  userId: string;
  clientData?: any;
  disputeData?: any;
}

export function AIDashboardAssistant({
  userId,
  clientData,
  disputeData,
}: AIDashboardAssistantProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: input,
      isUser: true,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      // Analyze sentiment of user message
      await SentimentDetectionService.getInstance().logSentimentTrigger(
        userId,
        'chat_message',
        input
      );

      // Store message in chat history
      await supabase.from("ai_chat_history").insert({
        user_id: userId,
        message: input,
        response: "", // Will be updated after AI response
      });

      // Get AI response based on context and sentiment
      const response = await getAIResponse(input, clientData, disputeData);

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: response,
        isUser: false,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, aiMessage]);

      // Update chat history with AI response
      await supabase
        .from("ai_chat_history")
        .update({ response })
        .eq("user_id", userId)
        .eq("message", input)
        .order("created_at", { ascending: false })
        .limit(1);
    } catch (error) {
      console.error("Error getting AI response:", error);
      toast({
        title: "Error",
        description: "Failed to get AI response",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getAIResponse = async (
    message: string,
    clientData?: any,
    disputeData?: any
  ): Promise<string> => {
    try {
      // Get current sentiment to tailor response
      const sentimentScore = await SentimentDetectionService.getInstance().getRecentSentiment(userId);
      const isAtRisk = await SentimentDetectionService.getInstance().checkUserRisk(userId);

      // Base response on message content and sentiment
      const lowerMessage = message.toLowerCase();
      let response = "";

      if (lowerMessage.includes("dispute")) {
        response = "Your dispute is currently in progress. We've sent the first round of letters and are awaiting bureau responses.";
      } else if (lowerMessage.includes("score")) {
        response = `Your current credit score is ${clientData?.current_score || "not available"}. We're working on improving it through our dispute process.`;
      } else if (lowerMessage.includes("letter")) {
        response = "The first round of dispute letters was sent on " +
          new Date(disputeData?.created_at).toLocaleDateString() +
          ". We'll notify you when we receive responses.";
      } else {
        response = "I'm here to help! You can ask me about your dispute status, credit score, or any other questions about the process.";
      }

      // Add empathetic response based on sentiment
      if (sentimentScore < 40) {
        response = `I understand this process can be frustrating. ${response} We're here to support you every step of the way.`;
      } else if (sentimentScore < 60) {
        response = `I hear your concerns. ${response} Let me know if you have any questions or need clarification.`;
      } else if (sentimentScore >= 80) {
        response = `Great to see your positive outlook! ${response} Keep up the good work!`;
      }

      // Add risk warning if user is flagged
      if (isAtRisk) {
        response += "\n\nI notice you might be feeling overwhelmed. Would you like to speak with one of our support specialists? They're here to help guide you through this process.";
      }

      return response;
    } catch (error) {
      console.error("Error generating AI response:", error);
      return "I'm here to help! You can ask me about your dispute status, credit score, or any other questions about the process.";
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {!isOpen && (
        <Button
          onClick={() => setIsOpen(true)}
          className="rounded-full h-12 w-12 shadow-lg"
        >
          <MessageSquare className="h-6 w-6" />
        </Button>
      )}

      {isOpen && (
        <Card className="w-[400px] shadow-xl">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle>AI Assistant</CardTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <SentimentAnalysis userId={userId} className="mb-4" />
              <ScrollArea className="h-[300px] pr-4">
                <div className="space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={cn(
                        "flex",
                        message.isUser ? "justify-end" : "justify-start"
                      )}
                    >
                      <div
                        className={cn(
                          "max-w-[80%] rounded-lg p-3",
                          message.isUser
                            ? "bg-blue-500 text-white"
                            : "bg-gray-100"
                        )}
                      >
                        {message.content}
                      </div>
                    </div>
                  ))}
                  {isLoading && (
                    <div className="flex justify-start">
                      <div className="bg-gray-100 rounded-lg p-3">
                        <div className="flex space-x-2">
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100" />
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200" />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </ScrollArea>
              <div className="flex space-x-2">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask me anything..."
                  onKeyPress={(e) => e.key === "Enter" && handleSend()}
                />
                <Button
                  onClick={handleSend}
                  disabled={isLoading || !input.trim()}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 