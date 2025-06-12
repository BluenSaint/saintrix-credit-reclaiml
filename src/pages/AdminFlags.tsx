import { useAuthStore, isAdmin } from "@/lib/authStore";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableHead, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";

const AdminFlags = () => {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    if (user === null) {
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

  const [flags, setFlags] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("");
  const [search, setSearch] = useState("");

  const fetchFlags = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("flagged_clients")
      .select("*, client:clients(full_name, user_id, user:auth.users(email))")
      .order("created_at", { ascending: false });
    if (!error) setFlags(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchFlags(); }, []);

  const handleStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("flagged_clients").update({ status }).eq("id", id);
    if (!error) {
      toast({ title: `Flag marked as ${status}` });
      fetchFlags();
    }
  };

  const filtered = flags.filter(f =>
    (!filterStatus || f.status === filterStatus) &&
    (f.client?.full_name?.toLowerCase().includes(search.toLowerCase()) ||
     f.client?.user?.email?.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <h1 className="text-2xl font-bold mb-4">Flagged Clients</h1>
      <Card className="mb-4">
        <CardHeader>
          <CardTitle>Flags</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-4">
            <Input placeholder="Search by name or email" value={search} onChange={e => setSearch(e.target.value)} className="max-w-xs" />
            <div className="flex flex-col">
              <label htmlFor="status-filter" className="text-xs mb-1">Status</label>
              <select id="status-filter" value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="border rounded px-2 py-1">
                <option value="">All Statuses</option>
                <option value="open">Open</option>
                <option value="acknowledged">Acknowledged</option>
                <option value="follow_up">Follow Up</option>
                <option value="resolved">Resolved</option>
              </select>
            </div>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Client</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(flag => (
                <TableRow key={flag.id}>
                  <TableCell>{flag.client?.full_name}</TableCell>
                  <TableCell>{flag.client?.user?.email}</TableCell>
                  <TableCell>{flag.reason}</TableCell>
                  <TableCell><Badge>{flag.status}</Badge></TableCell>
                  <TableCell>{new Date(flag.created_at).toLocaleString()}</TableCell>
                  <TableCell className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => handleStatus(flag.id, "acknowledged")} disabled={flag.status !== "open"}>Acknowledge</Button>
                    <Button size="sm" variant="outline" onClick={() => handleStatus(flag.id, "follow_up")} disabled={flag.status === "resolved"}>Follow Up</Button>
                    <Button size="sm" variant="outline" onClick={() => handleStatus(flag.id, "resolved")} disabled={flag.status === "resolved"}>Resolved</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {filtered.length === 0 && <div className="text-gray-500 mt-4">No flags found.</div>}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminFlags; 