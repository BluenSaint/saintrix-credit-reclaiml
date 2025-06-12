import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { useAuthStore, isAdmin } from "@/lib/authStore";
import { useNavigate } from "react-router-dom";

const AdminRevenue = () => {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const [authChecked, setAuthChecked] = useState(false);
  const [subs, setSubs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState({
    totalRevenue: 0,
    activePlans: 0,
    planBreakdown: {} as Record<string, number>,
    growth: 0
  });

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

  useEffect(() => {
    const fetchSubs = async () => {
      setLoading(true);
      const { data, error } = await supabase.from("subscriptions").select("*");
      if (!error && data) {
        setSubs(data);
        // Calculate metrics
        const now = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const thisMonth = data.filter((s: any) => new Date(s.started_at) >= monthStart && (!s.ended_at || new Date(s.ended_at) > now));
        const totalRevenue = thisMonth.reduce((sum: number, s: any) => sum + Number(s.amount), 0);
        const activePlans = data.filter((s: any) => s.status === "active").length;
        const planBreakdown: Record<string, number> = {};
        data.forEach((s: any) => { planBreakdown[s.plan] = (planBreakdown[s.plan] || 0) + 1; });
        // Growth: compare active plans this month vs last month
        const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
        const lastMonth = data.filter((s: any) => new Date(s.started_at) >= lastMonthStart && new Date(s.started_at) <= lastMonthEnd);
        const growth = lastMonth.length ? ((thisMonth.length - lastMonth.length) / lastMonth.length) * 100 : 0;
        setMetrics({ totalRevenue, activePlans, planBreakdown, growth });
      }
      setLoading(false);
    };
    fetchSubs();
  }, []);

  if (!authChecked) return <div className="min-h-screen flex items-center justify-center">Checking admin access...</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <h1 className="text-2xl font-bold mb-4">Admin Revenue Dashboard</h1>
      <div className="flex flex-wrap gap-6 mb-6">
        <Card className="w-64">
          <CardHeader><CardTitle>Total Revenue (This Month)</CardTitle></CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${metrics.totalRevenue.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card className="w-64">
          <CardHeader><CardTitle>Active Plans</CardTitle></CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.activePlans}</div>
          </CardContent>
        </Card>
        <Card className="w-64">
          <CardHeader><CardTitle>Growth</CardTitle></CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${metrics.growth >= 0 ? 'text-green-600' : 'text-red-600'}`}>{metrics.growth.toFixed(1)}%</div>
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader><CardTitle>Plan Breakdown</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Plan</TableHead>
                <TableHead>Count</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Object.entries(metrics.planBreakdown).map(([plan, count]) => (
                <TableRow key={plan}>
                  <TableCell>{plan}</TableCell>
                  <TableCell>{count}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <Card className="mt-6">
        <CardHeader><CardTitle>All Subscriptions</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Client ID</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Started</TableHead>
                <TableHead>Ended</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {subs.map((s: any) => (
                <TableRow key={s.id}>
                  <TableCell>{s.client_id}</TableCell>
                  <TableCell>{s.plan}</TableCell>
                  <TableCell>{s.status}</TableCell>
                  <TableCell>${Number(s.amount).toLocaleString()}</TableCell>
                  <TableCell>{new Date(s.started_at).toLocaleDateString()}</TableCell>
                  <TableCell>{s.ended_at ? new Date(s.ended_at).toLocaleDateString() : '-'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminRevenue; 