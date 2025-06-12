import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import {
  Activity,
  AlertCircle,
  CheckCircle2,
  Clock,
  FileText,
  CreditCard,
  PauseCircle,
  PlayCircle,
} from "lucide-react";

interface SystemHealthData {
  lastOpenAISuccess: string | null;
  lastDocumentUpload: string | null;
  lastCreditSync: string | null;
  queueLength: number;
  unprocessedDisputes: number;
  systemPaused: boolean;
}

export function SystemHealth() {
  const [healthData, setHealthData] = useState<SystemHealthData>({
    lastOpenAISuccess: null,
    lastDocumentUpload: null,
    lastCreditSync: null,
    queueLength: 0,
    unprocessedDisputes: 0,
    systemPaused: false,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSystemHealth = async () => {
      try {
        // Fetch system flags
        const { data: flags } = await supabase
          .from("system_flags")
          .select("*")
          .single();

        // Fetch last OpenAI success
        const { data: openAILogs } = await supabase
          .from("admin_logs")
          .select("timestamp")
          .eq("action", "openai_success")
          .order("timestamp", { ascending: false })
          .limit(1);

        // Fetch last document upload
        const { data: lastDoc } = await supabase
          .from("documents")
          .select("created_at")
          .order("created_at", { ascending: false })
          .limit(1);

        // Fetch last credit sync
        const { data: lastSync } = await supabase
          .from("credit_reports")
          .select("synced_at")
          .order("synced_at", { ascending: false })
          .limit(1);

        // Fetch queue length
        const { count: queueLength } = await supabase
          .from("disputes")
          .select("*", { count: "exact", head: true })
          .eq("status", "queued");

        // Fetch unprocessed disputes
        const { count: unprocessedDisputes } = await supabase
          .from("disputes")
          .select("*", { count: "exact", head: true })
          .eq("status", "pending");

        setHealthData({
          lastOpenAISuccess: openAILogs?.[0]?.timestamp || null,
          lastDocumentUpload: lastDoc?.[0]?.created_at || null,
          lastCreditSync: lastSync?.[0]?.synced_at || null,
          queueLength: queueLength || 0,
          unprocessedDisputes: unprocessedDisputes || 0,
          systemPaused: flags?.system_paused || false,
        });
      } catch (error) {
        console.error("Error fetching system health:", error);
        toast({
          title: "Error",
          description: "Failed to fetch system health data",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchSystemHealth();

    // Subscribe to changes
    const subscription = supabase
      .channel("system_health_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "system_flags",
        },
        (payload) => {
          setHealthData((prev) => ({
            ...prev,
            systemPaused: payload.new.system_paused,
          }));
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const toggleSystemPause = async () => {
    try {
      const { error } = await supabase
        .from("system_flags")
        .update({ system_paused: !healthData.systemPaused })
        .eq("id", 1);

      if (error) throw error;

      toast({
        title: healthData.systemPaused ? "System Resumed" : "System Paused",
        description: healthData.systemPaused
          ? "Automation has been resumed"
          : "All automation has been paused",
      });
    } catch (error) {
      console.error("Error toggling system pause:", error);
      toast({
        title: "Error",
        description: "Failed to toggle system pause",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>System Health</CardTitle>
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
        <div className="flex items-center justify-between">
          <CardTitle>System Health</CardTitle>
          <div className="flex items-center space-x-2">
            <Label htmlFor="system-pause">
              {healthData.systemPaused ? "System Paused" : "System Active"}
            </Label>
            <Switch
              id="system-pause"
              checked={healthData.systemPaused}
              onCheckedChange={toggleSystemPause}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
              <Activity className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm font-medium">Last OpenAI Success</p>
                <p className="text-sm text-gray-500">
                  {healthData.lastOpenAISuccess
                    ? new Date(healthData.lastOpenAISuccess).toLocaleString()
                    : "Never"}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
              <FileText className="h-5 w-5 text-purple-500" />
              <div>
                <p className="text-sm font-medium">Last Document Upload</p>
                <p className="text-sm text-gray-500">
                  {healthData.lastDocumentUpload
                    ? new Date(healthData.lastDocumentUpload).toLocaleString()
                    : "Never"}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
              <CreditCard className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm font-medium">Last Credit Sync</p>
                <p className="text-sm text-gray-500">
                  {healthData.lastCreditSync
                    ? new Date(healthData.lastCreditSync).toLocaleString()
                    : "Never"}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
              <Clock className="h-5 w-5 text-orange-500" />
              <div>
                <p className="text-sm font-medium">Queue Length</p>
                <p className="text-sm text-gray-500">
                  {healthData.queueLength} items
                </p>
              </div>
            </div>
          </div>

          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <AlertCircle className="h-5 w-5 text-red-500" />
                <div>
                  <p className="text-sm font-medium">Unprocessed Disputes</p>
                  <p className="text-sm text-gray-500">
                    {healthData.unprocessedDisputes} disputes
                  </p>
                </div>
              </div>
              {healthData.unprocessedDisputes > 0 && (
                <Badge variant="destructive">Action Required</Badge>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 