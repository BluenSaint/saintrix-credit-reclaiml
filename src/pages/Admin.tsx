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

const Admin = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [documents, setDocuments] = useState<any[]>([]);
  const [showDocs, setShowDocs] = useState(false);
  const [bulkApproving, setBulkApproving] = useState(false);
  const [autopilotStatus, setAutopilotStatus] = useState<any>(null);

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
      toast({ title: "Metadata updated" });
      await fetchClients();
    } catch (err: any) {
      toast({ title: "Edit failed", description: err.message, variant: "destructive" });
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
  );
};

export default Admin;