import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useNavigate } from "react-router-dom";
import { 
  TrendingUp, 
  FileText, 
  Upload, 
  CheckCircle, 
  Clock, 
  Users, 
  MessageSquare,
  Shield,
  Bell,
  Calendar,
  BarChart3,
  Settings,
  LogOut,
  Star,
  Target,
  Zap,
  CreditCard,
  User,
  AlertCircle,
  Download
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import ClientGuard from '@/components/guards/ClientGuard';
import { DisputeProgress } from "@/components/DisputeProgress";
import { AIDashboardAssistant } from "@/components/AIDashboardAssistant";
import { FeedbackButton } from "@/components/FeedbackButton";
import { ReferralSystem } from '@/components/ReferralSystem';
import { CreditInsuranceManager } from '@/components/CreditInsuranceManager';
import { CommunicationHub } from '@/components/CommunicationHub';
import { DocumentManager } from '@/components/DocumentManager';

interface DashboardData {
  client: any;
  creditReport: any;
  documents: any[];
}

const Dashboard = () => {
  const navigate = useNavigate();
  const [client, setClient] = useState(null);
  const [currentScore, setCurrentScore] = useState<number | null>(null);
  const [scoreChange, setScoreChange] = useState<number | null>(null);
  const [autopilotEnabled, setAutopilotEnabled] = useState(true);
  const [disputes, setDisputes] = useState<any[]>([]);
  const [referralStats, setReferralStats] = useState({
    totalReferred: 0,
    completedReferrals: 0,
    freeMonthsEarned: 0,
    referralCode: ""
  });
  const [loading, setLoading] = useState(true);
  const [documents, setDocuments] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [docType, setDocType] = useState("");
  const [disputeForm, setDisputeForm] = useState({ bureau: "", reason: "" });
  const [submittingDispute, setSubmittingDispute] = useState(false);
  const [feedback, setFeedback] = useState({ message: "", rating: 5 });
  const [submittingFeedback, setSubmittingFeedback] = useState(false);
  const [generatingLetter, setGeneratingLetter] = useState(false);
  const [letterPreview, setLetterPreview] = useState<string | null>(null);
  const [showLetterModal, setShowLetterModal] = useState(false);
  const [selectedDispute, setSelectedDispute] = useState<any>(null);
  const [tasks, setTasks] = useState<any[]>([]);
  const [tasksLoading, setTasksLoading] = useState(true);
  const [data, setData] = useState<DashboardData | null>(null);

  const fetchTasks = async (userId: string) => {
    setTasksLoading(true);
    const { data: tasksData, error } = await supabase
      .from("tasks")
      .select("*")
      .eq("user_id", userId)
      .order("due_date", { ascending: true });
    if (!error) setTasks(tasksData || []);
    setTasksLoading(false);
  };

  const handleCompleteTask = async (taskId: string) => {
    await supabase.from("tasks").update({ completed: true }).eq("id", taskId);
    if (client) fetchTasks(client.user_id);
  };

  const fetchDocuments = async (clientId: string) => {
    const { data: docData, error } = await supabase
      .from("documents")
      .select("*")
      .eq("client_id", clientId)
      .order("created_at", { ascending: false });
    if (!error) setDocuments(docData || []);
  };

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('No user found');

        const { data: clientData, error: clientError } = await supabase
          .from('clients')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (clientError) throw clientError;
        setClient(clientData);
        setCurrentScore(clientData.current_score || null);
        setScoreChange(clientData.score_change || null);

        const { data: disputesData, error: disputesError } = await supabase
          .from("disputes")
          .select("*")
          .eq("client_id", clientData.id)
          .order("created_at", { ascending: false });
        if (disputesError) throw disputesError;
        setDisputes(disputesData || []);

        const { count: totalReferred } = await supabase
          .from("referrals")
          .select("*", { count: "exact", head: true })
          .eq("referred_by", clientData.id);
        setReferralStats((prev) => ({ ...prev, totalReferred: totalReferred || 0, referralCode: clientData.referral_code || "" }));

        await fetchDocuments(clientData.id);
        await fetchTasks(user.id);

        const { data: creditData, error: creditError } = await supabase
          .from('credit_reports')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (creditError && creditError.code !== 'PGRST116') throw creditError;

        setData({
          client: clientData,
          creditReport: creditData,
          documents: documents
        });
      } catch (error) {
        console.error('Dashboard data fetch error:', error);
        toast.error('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();

    const creditReportSubscription = supabase
      .channel('credit_reports')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'credit_reports',
          filter: `user_id=eq.${supabase.auth.getUser().then(({ data }) => data.user?.id)}`
        },
        (payload) => {
          setData(prev => prev ? {
            ...prev,
            creditReport: payload.new
          } : null);
        }
      )
      .subscribe();

    return () => {
      creditReportSubscription.unsubscribe();
    };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Credit Score</CardTitle>
            <CardDescription>Current Status</CardDescription>
          </CardHeader>
          <CardContent>
            {currentScore !== null ? (
              <div className="space-y-4">
                <div className="text-4xl font-bold">{currentScore}</div>
                {scoreChange !== null && (
                  <div className={`flex items-center ${scoreChange >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    <TrendingUp className="h-4 w-4 mr-2" />
                    {scoreChange > 0 ? '+' : ''}{scoreChange} points
                  </div>
                )}
                <Progress value={currentScore} max={850} className="h-2" />
              </div>
            ) : (
              <div className="text-gray-500">No credit score data available</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Active Disputes</CardTitle>
            <CardDescription>Current Status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {disputes.length > 0 ? (
                disputes.map((dispute) => (
                  <div key={dispute.id} className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{dispute.bureau}</div>
                      <div className="text-sm text-gray-500">{dispute.status}</div>
                    </div>
                    <Badge variant={dispute.status === 'in_progress' ? 'default' : 'secondary'}>
                      {dispute.status}
                    </Badge>
                  </div>
                ))
              ) : (
                <div className="text-gray-500">No active disputes</div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Documents</CardTitle>
            <CardDescription>Required Files</CardDescription>
          </CardHeader>
          <CardContent>
            <DocumentManager />
          </CardContent>
        </Card>
      </div>

      <div className="mt-8">
        <Tabs defaultValue="overview">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="disputes">Disputes</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
          </TabsList>
          <TabsContent value="overview">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <DisputeProgress />
              <AIDashboardAssistant />
            </div>
          </TabsContent>
          <TabsContent value="disputes">
            <div className="space-y-6">
              <CreditInsuranceManager />
              <CommunicationHub />
            </div>
          </TabsContent>
          <TabsContent value="documents">
            <div className="space-y-6">
              <ReferralSystem />
              <FeedbackButton />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Dashboard; 