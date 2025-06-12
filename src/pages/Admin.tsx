import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { autopilotService } from "@/services/autopilotService";
import { AlertCircle, MailOpen, CheckCircle2, FileText, User, Bell } from "lucide-react";
import axios from "axios";
import { useAuthStore, isAdmin } from "@/lib/authStore";
import { useNavigate } from "react-router-dom";

const Admin = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [documents, setDocuments] = useState<any[]>([]);
  const [showDocs, setShowDocs] = useState(false);
  const [bulkApproving, setBulkApproving] = useState(false);
  const [autopilotStatus, setAutopilotStatus] = useState<any>(null);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [notifLoading, setNotifLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [exportFormat, setExportFormat] = useState<'pdf' | 'csv'>('pdf');
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    if (user === null) {
      // Try to fetch from Supabase if not in store
      (async () => {
        const { data: { user: supaUser } } = await supabase.auth.getUser();
        if (!supaUser || !isAdmin(supaUser)) {
          navigate("/auth");
        } else {
          useAuthStore.getState().setUser(supaUser);
        }
        setAuthChecked(true);
      })();
    } else if (!isAdmin(user)) {
      navigate("/auth");
    } else {
      setAuthChecked(true);
    }
  }, [user, navigate]);

  if (!authChecked) return <div className="min-h-screen flex items-center justify-center">Checking admin access...</div>;

  // Fetch clients
  const fetchClients = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("clients").select("*, user:auth.users(email, user_metadata)").order("created_at", { ascending: false });
    if (!error) setClients(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchClients();
    // Fetch autopilot status
    autopilotService.getStatus().then(setAutopilotStatus);
  }, []);

  // Fetch notifications
  const fetchNotifications = async () => {
    setNotifLoading(true);
    const { data, error } = await supabase
      .from("admin_notifications")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false });
    if (!error) setNotifications(data || []);
    setNotifLoading(false);
  };

  useEffect(() => {
    fetchNotifications();
    // Subscribe to real-time updates
    const sub = supabase
      .channel('admin_notifications')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'admin_notifications' }, fetchNotifications)
      .subscribe();
    return () => { sub.unsubscribe(); };
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;
  const topUnread = notifications.filter(n => !n.read).slice(0, 3);

  const handleMarkAsRead = async (id: string) => {
    const { error } = await supabase.from("admin_notifications").update({ read: true }).eq("id", id);
    if (!error) {
      toast({ title: "Marked as read" });
      fetchNotifications();
    }
  };

  const handleClearAll = async () => {
    const { error } = await supabase.from("admin_notifications").update({ read: true }).eq("read", false);
    if (!error) {
      toast({ title: "All notifications cleared" });
      fetchNotifications();
    }
  };

  // Search filter
  const filteredClients = clients.filter((client) => {
    const name = client.full_name?.toLowerCase() || "";
    const email = client.user?.email?.toLowerCase() || "";
    const status = client.approved ? "active" : "pending";
    return (
      name.includes(searchTerm.toLowerCase()) ||
      email.includes(searchTerm.toLowerCase()) ||
      status.includes(searchTerm.toLowerCase())
    );
  });

  // Bulk approve
  const handleBulkApprove = async () => {
    setBulkApproving(true);
    try {
      const pending = clients.filter((c) => !c.approved);
      const ids = pending.map((c) => c.id);
      if (ids.length === 0) return toast({ title: "No legacy clients to approve." });
      const { error } = await supabase.from("clients").update({ approved: true }).in("id", ids);
      if (error) throw error;
      // Log to admin_log
      const { data: { user: adminUser } } = await supabase.auth.getUser();
      await supabase.from("admin_log").insert({
        admin_id: adminUser.id,
        action: "bulk_approve",
        target_user_id: null,
        details: { approved_ids: ids, count: ids.length }
      });
      toast({ title: "Approved all legacy clients!" });
      await fetchClients();
    } catch (err: any) {
      toast({ title: "Bulk approve failed", description: err.message, variant: "destructive" });
    } finally {
      setBulkApproving(false);
    }
  };

  // Toggle credit insurance
  const handleToggleInsurance = async (client: any) => {
    try {
      const { error } = await supabase.from("clients").update({ credit_insurance_enabled: !client.credit_insurance_enabled }).eq("id", client.id);
      if (error) throw error;
      // Log to admin_log
      const { data: { user: adminUser } } = await supabase.auth.getUser();
      await supabase.from("admin_log").insert({
        admin_id: adminUser.id,
        action: "insurance_toggle",
        target_user_id: client.user_id,
        details: { new_status: !client.credit_insurance_enabled }
      });
      toast({ title: `Credit insurance ${!client.credit_insurance_enabled ? "enabled" : "disabled"}` });
      await fetchClients();
    } catch (err: any) {
      toast({ title: "Toggle failed", description: err.message, variant: "destructive" });
    }
  };

  // View documents
  const handleViewDocuments = async (client: any) => {
    setSelectedClient(client);
    setShowDocs(true);
    const { data, error } = await supabase.from("documents").select("*").eq("client_id", client.id);
    setDocuments(data || []);
  };

  // Inline metadata edit (dev only)
  const handleEditMetadata = async (client: any, key: string, value: any) => {
    try {
      const { error } = await supabase.from("clients").update({ [key]: value }).eq("id", client.id);
      if (error) throw error;
      // Log to admin_log
      const { data: { user: adminUser } } = await supabase.auth.getUser();
      await supabase.from("admin_log").insert({
        admin_id: adminUser.id,
        action: "metadata_edit",
        target_user_id: client.user_id,
        details: { key, value }
      });
      toast({ title: "Metadata updated" });
      await fetchClients();
    } catch (err: any) {
      toast({ title: "Edit failed", description: err.message, variant: "destructive" });
    }
  };

  // Export client profile
  const handleExportClient = async (client: any) => {
    setExporting(true);
    try {
      const { data: { user: adminUser } } = await supabase.auth.getUser();
      const res = await axios.post("/api/export-client", {
        userId: client.user_id,
        format: exportFormat,
        adminId: adminUser.id
      }, { responseType: "blob" });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `client-profile-${client.user_id}.${exportFormat}`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      toast({ title: "Export successful!", description: `Downloaded ${exportFormat.toUpperCase()} for ${client.full_name}` });
    } catch (err: any) {
      toast({ title: "Export failed", description: err?.response?.data?.error || err.message, variant: "destructive" });
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <Button onClick={handleBulkApprove} disabled={bulkApproving} variant="outline">
          {bulkApproving ? "Approving..." : "Bulk Approve Legacy Clients"}
        </Button>
      </div>
      {/* Autopilot Status UI */}
      {autopilotStatus && (
        <Card className="mb-4">
          <CardHeader>
            <CardTitle>Autopilot Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex space-x-8">
              <div>Disputes Run: <span className="font-bold">{autopilotStatus.disputesRun}</span></div>
              <div>Errors: <span className="font-bold">{autopilotStatus.errors}</span></div>
              <div>Status: <span className={`font-bold ${autopilotStatus.paused ? 'text-red-600' : 'text-green-600'}`}>{autopilotStatus.paused ? 'Paused' : 'Active'}</span></div>
            </div>
          </CardContent>
        </Card>
      )}
      <div className="flex flex-col md:flex-row gap-6">
        {/* Admin Inbox Card */}
        <Card className="w-full md:max-w-lg mb-4">
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-yellow-500" />
              <CardTitle>Admin Inbox</CardTitle>
              {unreadCount > 0 && <span className="ml-2 px-2 py-0.5 rounded-full bg-red-500 text-white text-xs">{unreadCount} Unread</span>}
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={handleClearAll} disabled={notifLoading || unreadCount === 0}>Clear All</Button>
            </div>
          </CardHeader>
          <CardContent>
            {notifLoading ? (
              <div className="text-gray-500">Loading notifications...</div>
            ) : notifications.length === 0 ? (
              <div className="text-gray-500">No notifications yet.</div>
            ) : (
              <ul className="divide-y divide-gray-200">
                {notifications.slice(0, 10).map((notif) => (
                  <li key={notif.id} className="py-3 flex items-start gap-3">
                    <span>
                      {notif.type === 'dispute' && <FileText className="w-4 h-4 text-blue-500" />}
                      {notif.type === 'legacy_signup' && <User className="w-4 h-4 text-purple-500" />}
                      {notif.type === 'upload' && <MailOpen className="w-4 h-4 text-green-500" />}
                      {notif.type === 'flag' && <AlertCircle className="w-4 h-4 text-red-500" />}
                      {notif.type === 'warning' && <AlertCircle className="w-4 h-4 text-yellow-500" />}
                      {notif.type === 'autopilot' && <CheckCircle2 className="w-4 h-4 text-orange-500" />}
                    </span>
                    <div className="flex-1">
                      <div className="text-sm font-medium">{notif.message}</div>
                      <div className="text-xs text-gray-500">{new Date(notif.created_at).toLocaleString()}</div>
                    </div>
                    {!notif.read && (
                      <Button size="xs" variant="ghost" onClick={() => handleMarkAsRead(notif.id)}>Mark as Read</Button>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
        <div className="flex-1">
          <Input
            placeholder="Search by name, email, or status"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="mb-4 max-w-md"
          />
          <Card>
            <CardHeader>
              <CardTitle>Clients</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Referral Code</TableHead>
                    <TableHead>Signup Method</TableHead>
                    <TableHead>Credit Insurance</TableHead>
                    <TableHead>Documents</TableHead>
                    <TableHead>Metadata (dev)</TableHead>
                    <TableHead>Export</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredClients.map((client) => (
                    <TableRow key={client.id}>
                      <TableCell>{client.full_name}</TableCell>
                      <TableCell>{client.user?.email}</TableCell>
                      <TableCell>
                        {client.approved ? <Badge className="bg-green-100 text-green-800">Active</Badge> : <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>}
                      </TableCell>
                      <TableCell>{new Date(client.created_at).toLocaleDateString()}</TableCell>
                      <TableCell>{client.referral_code || "-"}</TableCell>
                      <TableCell>{client.signup_method || "manual"}</TableCell>
                      <TableCell>
                        <Switch checked={client.credit_insurance_enabled} onCheckedChange={() => handleToggleInsurance(client)} />
                      </TableCell>
                      <TableCell>
                        <Button size="sm" variant="outline" onClick={() => handleViewDocuments(client)}>View</Button>
                      </TableCell>
                      <TableCell>
                        <Input
                          defaultValue={client.dev_note || ""}
                          onBlur={(e) => handleEditMetadata(client, "dev_note", e.target.value)}
                          placeholder="Edit dev note"
                          className="max-w-xs"
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <label htmlFor={`export-format-${client.id}`} className="text-xs mb-1">Export Format</label>
                          <select
                            id={`export-format-${client.id}`}
                            value={exportFormat}
                            onChange={e => setExportFormat(e.target.value as 'pdf' | 'csv')}
                            className="border rounded px-2 py-1 mr-2"
                          >
                            <option value="pdf">PDF</option>
                            <option value="csv">CSV</option>
                          </select>
                        </div>
                        <Button size="sm" variant="outline" onClick={() => handleExportClient(client)} disabled={exporting}>
                          {exporting ? "Exporting..." : "Export Client Profile"}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
          <Sheet open={showDocs} onOpenChange={setShowDocs}>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>Documents for {selectedClient?.full_name}</SheetTitle>
              </SheetHeader>
              <ul className="mt-4 space-y-2">
                {documents.map((doc) => (
                  <li key={doc.id} className="flex items-center justify-between border-b pb-2">
                    <span>{doc.type}</span>
                    <a href={doc.file_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">View File</a>
                  </li>
                ))}
                {documents.length === 0 && <li>No documents found.</li>}
              </ul>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </div>
  );
};

export default Admin;