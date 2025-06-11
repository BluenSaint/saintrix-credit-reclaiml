import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useNavigate } from "react-router-dom";
import { 
  Users, 
  DollarSign, 
  TrendingUp, 
  Shield, 
  Search, 
  Filter,
  Settings,
  LogOut,
  CheckCircle,
  AlertTriangle,
  BarChart3,
  MessageSquare,
  Star,
  Zap,
  Calendar,
  ArrowUp,
  ArrowDown
} from "lucide-react";

const Admin = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [autopilotPaused, setAutopilotPaused] = useState(false);

  const stats = {
    totalUsers: 1247,
    activeDisputes: 2843,
    monthlyRevenue: 185420,
    successRate: 87.3
  };

  const clients = [
    {
      id: 1,
      name: "John Doe",
      email: "john@example.com",
      creditScore: 647,
      scoreChange: +23,
      joinDate: "2024-01-01",
      status: "Active",
      progress: 65,
      disputes: 3,
      revenue: 185
    },
    {
      id: 2,
      name: "Sarah Johnson",
      email: "sarah@example.com",
      creditScore: 702,
      scoreChange: +89,
      joinDate: "2023-11-15",
      status: "Active",
      progress: 85,
      disputes: 5,
      revenue: 370
    },
    {
      id: 3,
      name: "Mike Chen",
      email: "mike@example.com",
      creditScore: 589,
      scoreChange: -12,
      joinDate: "2024-01-10",
      status: "Pending",
      progress: 25,
      disputes: 1,
      revenue: 185
    },
    {
      id: 4,
      name: "Lisa Rodriguez",
      email: "lisa@example.com",
      creditScore: 734,
      scoreChange: +156,
      joinDate: "2023-09-20",
      status: "Active",
      progress: 95,
      disputes: 8,
      revenue: 555
    }
  ];

  const feedback = [
    {
      id: 1,
      user: "John Doe",
      type: "Testimonial",
      message: "SAINTRIX helped me increase my score by 127 points! Amazing service.",
      date: "2024-01-20",
      rating: 5
    },
    {
      id: 2,
      user: "Sarah Johnson", 
      type: "Feature Request",
      message: "Would love to see real-time credit monitoring integrated.",
      date: "2024-01-18",
      rating: 4
    },
    {
      id: 3,
      user: "Mike Chen",
      type: "Bug Report",
      message: "Letter generator isn't working for Equifax disputes.",
      date: "2024-01-15",
      rating: 2
    }
  ];

  const referrals = [
    {
      referrer: "John Doe",
      referred: 3,
      completed: 2,
      freeMonths: 0,
      revenue: 370
    },
    {
      referrer: "Sarah Johnson",
      referred: 5,
      completed: 4,
      freeMonths: 1,
      revenue: 740
    },
    {
      referrer: "Lisa Rodriguez",
      referred: 2,
      completed: 1,
      freeMonths: 0,
      revenue: 185
    }
  ];

  const filteredClients = clients.filter(client => 
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalReferralRevenue = referrals.reduce((sum, r) => sum + r.revenue, 0);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <span className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              SAINTRIX
            </span>
            <Badge className="bg-red-100 text-red-800">Admin Panel</Badge>
            <div className="h-8 w-px bg-gray-300"></div>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">Admin Dashboard</h1>
              <p className="text-sm text-gray-500">System overview and management</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <Button 
              variant={autopilotPaused ? "destructive" : "outline"}
              onClick={() => setAutopilotPaused(!autopilotPaused)}
            >
              <Zap className="w-4 h-4 mr-2" />
              {autopilotPaused ? "Resume Autopilot" : "Pause Autopilot"}
            </Button>
            <Button variant="ghost" size="sm">
              <Settings className="w-4 h-4" />
            </Button>
            <Avatar>
              <AvatarFallback>AD</AvatarFallback>
            </Avatar>
            <Button variant="ghost" size="sm" onClick={() => navigate("/auth")}>
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      <div className="p-6">
        {/* Emergency Status */}
        {autopilotPaused && (
          <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200">
            <div className="flex items-center space-x-3">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              <div>
                <h3 className="font-semibold text-red-900">⚠️ EMERGENCY: Autopilot Paused</h3>
                <p className="text-sm text-red-700">
                  All automated dispute processing has been halted. Clients will not receive new letters.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalUsers.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                <span className="text-green-600">+12%</span> from last month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Disputes</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeDisputes.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                <span className="text-green-600">+8%</span> from last month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${stats.monthlyRevenue.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                <span className="text-green-600">+23%</span> from last month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.successRate}%</div>
              <p className="text-xs text-muted-foreground">
                <span className="text-green-600">+2.1%</span> from last month
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="clients" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="clients">Client Management</TabsTrigger>
            <TabsTrigger value="feedback">Feedback</TabsTrigger>
            <TabsTrigger value="referrals">Referrals</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="clients" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Client Management</CardTitle>
                    <CardDescription>Manage user accounts and credit repair progress</CardDescription>
                  </div>
                  <div className="flex space-x-2">
                    <div className="relative">
                      <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search clients..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-8 w-[300px]"
                      />
                    </div>
                    <Button variant="outline">
                      <Filter className="w-4 h-4 mr-2" />
                      Filter
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Client</TableHead>
                      <TableHead>Credit Score</TableHead>
                      <TableHead>Progress</TableHead>
                      <TableHead>Disputes</TableHead>
                      <TableHead>Revenue</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredClients.map((client) => (
                      <TableRow key={client.id}>
                        <TableCell>
                          <div className="flex items-center space-x-3">
                            <Avatar>
                              <AvatarFallback>{client.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium">{client.name}</div>
                              <div className="text-sm text-gray-500">{client.email}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <span className="text-2xl font-bold">{client.creditScore}</span>
                            <div className={`flex items-center ${client.scoreChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {client.scoreChange >= 0 ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
                              <span className="text-xs">{Math.abs(client.scoreChange)}</span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <Progress value={client.progress} className="h-2" />
                            <span className="text-xs text-gray-500">{client.progress}%</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{client.disputes} active</Badge>
                        </TableCell>
                        <TableCell>
                          <span className="font-medium">${client.revenue}</span>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={client.status === 'Active' ? 'default' : 'secondary'}
                            className={client.status === 'Active' ? 'bg-green-100 text-green-800' : ''}
                          >
                            {client.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-1">
                            <Button size="sm" variant="outline">View</Button>
                            <Button size="sm" variant="outline">Edit</Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="feedback" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Customer Feedback</CardTitle>
                <CardDescription>User feedback, bug reports, and testimonials</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {feedback.map((item) => (
                    <div key={item.id} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-3">
                          <span className="font-medium">{item.user}</span>
                          <Badge 
                            variant={item.type === 'Testimonial' ? 'default' : item.type === 'Bug Report' ? 'destructive' : 'secondary'}
                          >
                            {item.type}
                          </Badge>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="flex">
                            {[...Array(5)].map((_, i) => (
                              <Star 
                                key={i} 
                                className={`w-3 h-3 ${i < item.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} 
                              />
                            ))}
                          </div>
                          <span className="text-sm text-gray-500">{item.date}</span>
                        </div>
                      </div>
                      <p className="text-gray-700">{item.message}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="referrals" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Referral Analytics</CardTitle>
                <CardDescription>Track referral performance and revenue</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-6 mb-6">
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">
                      {referrals.reduce((sum, r) => sum + r.referred, 0)}
                    </div>
                    <div className="text-sm text-gray-500">Total Referrals</div>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      {referrals.reduce((sum, r) => sum + r.completed, 0)}
                    </div>
                    <div className="text-sm text-gray-500">Completed</div>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">
                      ${totalReferralRevenue.toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-500">Referral Revenue</div>
                  </div>
                </div>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Referrer</TableHead>
                      <TableHead>Referred</TableHead>
                      <TableHead>Completed</TableHead>
                      <TableHead>Free Months</TableHead>
                      <TableHead>Revenue Generated</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {referrals.map((referral, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{referral.referrer}</TableCell>
                        <TableCell>{referral.referred}</TableCell>
                        <TableCell>{referral.completed}</TableCell>
                        <TableCell>
                          <Badge className="bg-green-100 text-green-800">{referral.freeMonths}</Badge>
                        </TableCell>
                        <TableCell>${referral.revenue}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Revenue Trends</CardTitle>
                  <CardDescription>Monthly revenue performance</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px] flex items-center justify-center text-gray-500">
                    Revenue chart placeholder
                    <br />
                    <small>Integration with charting library needed</small>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Credit Score Improvements</CardTitle>
                  <CardDescription>Average score increases by month</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px] flex items-center justify-center text-gray-500">
                    Score improvement chart placeholder
                    <br />
                    <small>Integration with charting library needed</small>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>System Health</CardTitle>
                <CardDescription>Key performance indicators</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-lg font-semibold text-green-600">99.8%</div>
                    <div className="text-sm text-gray-500">Uptime</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-semibold text-blue-600">1.2s</div>
                    <div className="text-sm text-gray-500">Avg Response</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-semibold text-purple-600">234ms</div>
                    <div className="text-sm text-gray-500">AI Generation</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-semibold text-orange-600">42</div>
                    <div className="text-sm text-gray-500">Active Sessions</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Admin;