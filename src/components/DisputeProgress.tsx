import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, Clock, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";

interface DisputeProgressProps {
  clientId: string;
  disputeId: string;
}

interface Milestone {
  id: string;
  milestone: string;
  status: "pending" | "in_progress" | "completed";
  completed_at: string | null;
}

const milestoneLabels: Record<string, string> = {
  intake_complete: "✅ Intake Complete",
  credit_report_synced: "✅ Credit Report Synced",
  first_round_letters_sent: "✅ First Round Letters Sent",
  awaiting_bureau_response: "🔄 Awaiting Bureau Response",
  repair_complete: "🟢 Repair Complete"
};

export function DisputeProgress({ clientId, disputeId }: DisputeProgressProps) {
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProgress = async () => {
      try {
        const { data, error } = await supabase
          .from("dispute_progress")
          .select("*")
          .eq("client_id", clientId)
          .eq("dispute_id", disputeId)
          .order("created_at", { ascending: true });

        if (error) throw error;
        setMilestones(data || []);
      } catch (err) {
        console.error("Error fetching dispute progress:", err);
        toast({
          title: "Error",
          description: "Failed to load dispute progress",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchProgress();

    // Subscribe to changes
    const subscription = supabase
      .channel("dispute_progress_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "dispute_progress",
          filter: `client_id=eq.${clientId}`,
        },
        (payload) => {
          setMilestones((current) => {
            const index = current.findIndex((m) => m.id === payload.new.id);
            if (index === -1) return [...current, payload.new];
            const updated = [...current];
            updated[index] = payload.new;
            return updated;
          });
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [clientId, disputeId]);

  const completedCount = milestones.filter(
    (m) => m.status === "completed"
  ).length;
  const progress = (completedCount / milestones.length) * 100;

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Dispute Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Dispute Progress</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <Progress value={progress} className="h-2" />
          <div className="space-y-4">
            {milestones.map((milestone) => (
              <div
                key={milestone.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  {milestone.status === "completed" ? (
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                  ) : milestone.status === "in_progress" ? (
                    <Clock className="h-5 w-5 text-blue-500" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-gray-400" />
                  )}
                  <span className="font-medium">
                    {milestoneLabels[milestone.milestone]}
                  </span>
                </div>
                {milestone.completed_at && (
                  <span className="text-sm text-gray-500">
                    {new Date(milestone.completed_at).toLocaleDateString()}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 