import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { formatDistanceToNow, parseISO } from "date-fns";

const ACTION_LABELS: Record<string, string> = {
  bulk_approve: "Bulk Approve",
  insurance_toggle: "Insurance Toggle",
  generate_letter: "Generate Letter",
  metadata_edit: "Metadata Edit",
  export_profile: "Export Profile"
};

const AdminLogs = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [admins, setAdmins] = useState<Record<string, any>>({});
  const [filterAction, setFilterAction] = useState("");
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [loading, setLoading] = useState(true);

  // Fetch logs and admin users
  useEffect(() => {
    const fetchLogs = async () => {
      setLoading(true);
      let query = supabase.from("admin_log").select("*, admin:admin_id(email)").order("created_at", { ascending: false });
      if (filterAction) query = query.eq("action", filterAction);
      if (dateFrom) query = query.gte("created_at", dateFrom);
      if (dateTo) query = query.lte("created_at", dateTo);
      const { data, error } = await query;
      if (!error) setLogs(data || []);
      setLoading(false);
    };
    fetchLogs();
  }, [filterAction, dateFrom, dateTo]);

  // Search filter (by user email or ID)
  const filteredLogs = logs.filter((log) => {
    if (!search) return true;
    const target = log.target_user_id || "";
    const adminEmail = log.admin?.email || "";
    return (
      target.toLowerCase().includes(search.toLowerCase()) ||
      adminEmail.toLowerCase().includes(search.toLowerCase())
    );
  });

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Admin Audit Trail</h1>
      </div>
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-4 items-center">
          <Input
            placeholder="Search by user email or ID"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-xs"
          />
          <div className="flex flex-col">
            <label htmlFor="action-filter" className="text-xs mb-1">Action Type</label>
            <select
              id="action-filter"
              value={filterAction}
              onChange={(e) => setFilterAction(e.target.value)}
              className="border rounded px-2 py-1"
            >
              <option value="">All Actions</option>
              {Object.entries(ACTION_LABELS).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label>Date From:</label>
            <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
          </div>
          <div className="flex items-center gap-2">
            <label>Date To:</label>
            <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} />
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Admin Logs</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-gray-500">Loading logs...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Action</TableHead>
                  <TableHead>Target</TableHead>
                  <TableHead>Admin</TableHead>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>
                      <Badge>{ACTION_LABELS[log.action] || log.action}</Badge>
                    </TableCell>
                    <TableCell>
                      {log.target_user_id || (log.details?.approved_ids ? `${log.details.approved_ids.length} users` : "-")}
                    </TableCell>
                    <TableCell>{log.admin?.email || log.admin_id}</TableCell>
                    <TableCell>{formatDistanceToNow(parseISO(log.created_at), { addSuffix: true })}</TableCell>
                    <TableCell>
                      <Button size="sm" variant="outline" onClick={() => setExpanded(expanded === log.id ? null : log.id)}>
                        {expanded === log.id ? "Hide" : "View"}
                      </Button>
                      {expanded === log.id && (
                        <Sheet open={true} onOpenChange={() => setExpanded(null)}>
                          <SheetContent>
                            <SheetHeader>
                              <SheetTitle>Log Details</SheetTitle>
                            </SheetHeader>
                            <pre className="bg-gray-100 p-4 rounded text-xs overflow-x-auto mt-4">
                              {JSON.stringify(log.details, null, 2)}
                            </pre>
                          </SheetContent>
                        </Sheet>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminLogs; 