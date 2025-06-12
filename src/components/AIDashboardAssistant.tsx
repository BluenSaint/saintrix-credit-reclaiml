import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageSquare, Send, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";

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
      // Store message in chat history
      await supabase.from("ai_chat_history").insert({
        user_id: userId,
        message: input,
        response: "", // Will be updated after AI response
      });

      // Get AI response based on context
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
    // TODO: Replace with actual OpenAI integration
    // For now, return mock responses based on keywords
    const lowerMessage = message.toLowerCase();

    if (lowerMessage.includes("dispute")) {
      return "Your dispute is currently in progress. We've sent the first round of letters and are awaiting bureau responses.";
    }

    if (lowerMessage.includes("score")) {
      return `Your current credit score is ${clientData?.current_score || "not available"}. We're working on improving it through our dispute process.`;
    }

    if (lowerMessage.includes("letter")) {
      return "The first round of dispute letters was sent on " +
        new Date(disputeData?.created_at).toLocaleDateString() +
        ". We'll notify you when we receive responses.";
    }

    return "I'm here to help! You can ask me about your dispute status, credit score, or any other questions about the process.";
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {!isOpen ? (
        <Button
          onClick={() => setIsOpen(true)}
          className="rounded-full p-4 shadow-lg"
        >
          <MessageSquare className="h-6 w-6" />
        </Button>
      ) : (
        <Card className="w-96 shadow-xl">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Dashboard Assistant</h3>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <ScrollArea
              ref={scrollRef}
              className="h-96 mb-4 pr-4"
            >
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
          </CardContent>
        </Card>
      )}
    </div>
  );
} 