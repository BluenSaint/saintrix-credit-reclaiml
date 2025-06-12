import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { MessageSquare } from "lucide-react";

interface FeedbackButtonProps {
  userId: string;
}

export function FeedbackButton({ userId }: FeedbackButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [feedback, setFeedback] = useState({
    type: "experience",
    message: "",
    rating: 5,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const { error } = await supabase.from("client_feedback").insert({
        user_id: userId,
        type: feedback.type,
        message: feedback.message,
        rating: feedback.rating,
      });

      if (error) throw error;

      toast({
        title: "Thank you!",
        description: "Your feedback has been submitted successfully.",
      });

      setFeedback({
        type: "experience",
        message: "",
        rating: 5,
      });
      setIsOpen(false);
    } catch (error) {
      console.error("Error submitting feedback:", error);
      toast({
        title: "Error",
        description: "Failed to submit feedback. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <MessageSquare className="h-4 w-4" />
          Feedback
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Share Your Feedback</DialogTitle>
          <DialogDescription>
            Help us improve your experience with SAINTRIX.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Feedback Type</Label>
            <RadioGroup
              value={feedback.type}
              onValueChange={(value) =>
                setFeedback((prev) => ({ ...prev, type: value }))
              }
              className="flex space-x-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="experience" id="experience" />
                <Label htmlFor="experience">Rate Experience</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="feature" id="feature" />
                <Label htmlFor="feature">Suggest Feature</Label>
              </div>
            </RadioGroup>
          </div>

          {feedback.type === "experience" && (
            <div className="space-y-2">
              <Label>Rating</Label>
              <div className="flex space-x-2">
                {[1, 2, 3, 4, 5].map((rating) => (
                  <Button
                    key={rating}
                    type="button"
                    variant={feedback.rating === rating ? "default" : "outline"}
                    onClick={() =>
                      setFeedback((prev) => ({ ...prev, rating }))
                    }
                    className="w-10 h-10"
                  >
                    {rating}
                  </Button>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="message">
              {feedback.type === "experience"
                ? "Tell us about your experience"
                : "Describe your feature suggestion"}
            </Label>
            <Textarea
              id="message"
              value={feedback.message}
              onChange={(e) =>
                setFeedback((prev) => ({ ...prev, message: e.target.value }))
              }
              placeholder={
                feedback.type === "experience"
                  ? "What went well? What could be better?"
                  : "What feature would you like to see?"
              }
              required
            />
          </div>

          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Submitting..." : "Submit Feedback"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
} 