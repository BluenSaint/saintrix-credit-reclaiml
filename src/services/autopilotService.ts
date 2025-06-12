import { supabase } from "@/integrations/supabase/client";

export const autopilotService = {
  // Smart Dispute Sequencing: auto-run disputes 7 days apart
  async runDisputeSequencing() {
    try {
      // Fetch all clients
      const { data: clients, error } = await supabase.from("clients").select("id, user_id, full_name");
      if (error) throw error;
      for (const client of clients || []) {
        // Fetch last dispute
        const { data: lastDispute } = await supabase
          .from("disputes")
          .select("created_at")
          .eq("client_id", client.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .single();
        const lastDate = lastDispute?.created_at ? new Date(lastDispute.created_at) : null;
        const now = new Date();
        // If no dispute or last dispute is 7+ days ago, trigger next round (placeholder logic)
        if (!lastDate || (now.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24) >= 7) {
          // Log or trigger next dispute round (actual logic would go here)
          await supabase.from("autopilot_log").insert({ client_id: client.id, action: "dispute_sequencing", timestamp: now.toISOString() });
        }
      }
    } catch (err: any) {
      await autopilotService.logError("runDisputeSequencing", err.message);
    }
  },

  // Client Priority Queue: flag users stuck or without disputes in 14+ days
  async flagPriorityClients() {
    try {
      const { data: clients, error } = await supabase.from("clients").select("id, user_id, full_name");
      if (error) throw error;
      for (const client of clients || []) {
        const { data: lastDispute } = await supabase
          .from("disputes")
          .select("created_at")
          .eq("client_id", client.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .single();
        const lastDate = lastDispute?.created_at ? new Date(lastDispute.created_at) : null;
        const now = new Date();
        if (!lastDate || (now.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24) >= 14) {
          // Flag client (placeholder: update a field or log)
          await supabase.from("autopilot_log").insert({ client_id: client.id, action: "priority_flag", timestamp: now.toISOString() });
        }
      }
    } catch (err: any) {
      await autopilotService.logError("flagPriorityClients", err.message);
    }
  },

  // Daily Admin Report Bot: summarize activity and send to admin email
  async sendDailyReport() {
    try {
      // Placeholder: summarize activity (e.g., new disputes, flagged clients)
      const { data: flagged } = await supabase.from("autopilot_log").select("*").eq("action", "priority_flag").gte("timestamp", new Date(Date.now() - 24*60*60*1000).toISOString());
      // Send email (integration needed)
      await supabase.from("autopilot_log").insert({ action: "admin_report_sent", timestamp: new Date().toISOString(), details: JSON.stringify({ flaggedCount: flagged?.length || 0 }) });
    } catch (err: any) {
      await autopilotService.logError("sendDailyReport", err.message);
    }
  },

  // Emergency Pause Button: check if automation is paused
  async isAutopilotPaused() {
    const { data, error } = await supabase.from("autopilot_settings").select("paused").single();
    return !!data?.paused;
  },

  // Autopilot Status UI: get stats
  async getStatus() {
    // Placeholder: return stats (disputes run, errors, paused, etc.)
    const { data: log } = await supabase.from("autopilot_log").select("*").order("timestamp", { ascending: false }).limit(100);
    const { data: settings } = await supabase.from("autopilot_settings").select("paused").single();
    return {
      disputesRun: log?.filter((l: any) => l.action === "dispute_sequencing").length || 0,
      errors: log?.filter((l: any) => l.action === "error").length || 0,
      paused: !!settings?.paused
    };
  },

  // Log errors
  async logError(where: string, message: string) {
    await supabase.from("autopilot_log").insert({ action: "error", details: JSON.stringify({ where, message }), timestamp: new Date().toISOString() });
  },

  // Run all autopilot tasks (to be called by scheduler or manually)
  async runAll() {
    if (await autopilotService.isAutopilotPaused()) return;
    await autopilotService.runDisputeSequencing();
    await autopilotService.flagPriorityClients();
    await autopilotService.sendDailyReport();
  }
}; 