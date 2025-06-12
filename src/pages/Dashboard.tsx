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
  AlertCircle
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useRouter } from 'next/router'
import ClientGuard from '@/components/guards/ClientGuard'

interface DashboardData {
  client: any
  creditReport: any
  documents: any[]
}

const Dashboard = () => {
  const navigate = useNavigate();
  const router = useRouter();
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

  // Fetch documents
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
        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('No user found');

        // Fetch client data
        const { data: clientData, error: clientError } = await supabase
          .from('clients')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (clientError) throw clientError;
        setClient(clientData);
        setCurrentScore(clientData.current_score || null);
        setScoreChange(clientData.score_change || null);
        // Disputes
        const { data: disputesData, error: disputesError } = await supabase
          .from("disputes")
          .select("*")
          .eq("client_id", clientData.id)
          .order("created_at", { ascending: false });
        if (disputesError) throw disputesError;
        setDisputes(disputesData || []);
        // Referrals
        const { count: totalReferred } = await supabase
          .from("referrals")
          .select("*", { count: "exact", head: true })
          .eq("referred_by", clientData.id);
        setReferralStats((prev) => ({ ...prev, totalReferred: totalReferred || 0, referralCode: clientData.referral_code || "" }));
        // Documents
        await fetchDocuments(clientData.id);
        // Tasks
        await fetchTasks(user.id);

        // Fetch latest credit report
        const { data: creditData, error: creditError } = await supabase
          .from('credit_reports')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single()

        if (creditError && creditError.code !== 'PGRST116') throw creditError

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

    // Set up real-time subscription for credit reports
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
          } : null)
        }
      )
      .subscribe()

    return () => {
      creditReportSubscription.unsubscribe()
    }
  }, []);

  // Document upload handler
  const handleDocumentUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile || !docType || !client) return;
    setUploading(true);
    try {
      const filePath = `${client.id}/${Date.now()}_${selectedFile.name}`;
      const { error: uploadError } = await supabase.storage.from("documents").upload(filePath, selectedFile);
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from("documents").getPublicUrl(filePath);
      const { error: insertError } = await supabase.from("documents").insert([
        { client_id: client.id, type: docType, file_url: publicUrl, created_at: new Date().toISOString() }
      ]);
      if (insertError) throw insertError;
      // Add notification
      await supabase.from("admin_notifications").insert({
        type: "upload",
        message: `Document uploaded by ${client.full_name}`,
        user_id: client.user_id
      });
      toast({ title: "Document uploaded!" });
      setSelectedFile(null);
      setDocType("");
      await fetchDocuments(client.id);
    } catch (err: any) {
      toast({ title: "Upload failed", description: err.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  // Dispute submission handler
  const handleDisputeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!disputeForm.bureau || !disputeForm.reason || !client) return;
    setSubmittingDispute(true);
    try {
      const { error } = await supabase.from("disputes").insert([
        { client_id: client.id, bureau: disputeForm.bureau, reason: disputeForm.reason, status: "draft", created_at: new Date().toISOString() }
      ]);
      if (error) throw error;
      // Add notification
      await supabase.from("admin_notifications").insert({
        type: "dispute",
        message: `New Dispute from ${client.full_name}`,
        user_id: client.user_id
      });
      toast({ title: "Dispute submitted!" });
      setDisputeForm({ bureau: "", reason: "" });
      // Re-fetch disputes
      const { data: disputesData } = await supabase
        .from("disputes")
        .select("*")
        .eq("client_id", client.id)
        .order("created_at", { ascending: false });
      setDisputes(disputesData || []);
    } catch (err: any) {
      toast({ title: "Submission failed", description: err.message, variant: "destructive" });
    } finally {
      setSubmittingDispute(false);
    }
  };

  // Feedback submission handler
  const handleFeedbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedback.message || !client) return;
    setSubmittingFeedback(true);
    try {
      const { error } = await supabase.from("feedback").insert([
        { client_id: client.id, message: feedback.message, rating: feedback.rating, created_at: new Date().toISOString() }
      ]);
      if (error) throw error;
      toast({ title: "Feedback submitted!" });
      setFeedback({ message: "", rating: 5 });
    } catch (err: any) {
      toast({ title: "Feedback failed", description: err.message, variant: "destructive" });
    } finally {
      setSubmittingFeedback(false);
    }
  };

  // Add API call for letter generation
  async function callGenerateLetterAPI(payload: any) {
    const res = await fetch("/api/generate-letter", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error("Failed to generate letter");
    const data = await res.json();
    return data.letter;
  }

  // Generate dispute letter handler
  const handleGenerateLetter = async (dispute: any) => {
    setGeneratingLetter(true);
    setSelectedDispute(dispute);
    try {
      const letterContent = await callGenerateLetterAPI({
        clientName: client.full_name,
        itemName: dispute.item,
        bureau: dispute.bureau,
        violationType: dispute.reason,
        evidence: dispute.evidence_url
      });
      // Save to letters table
      const { error } = await supabase.from("letters").insert([
        {
          client_id: client.id,
          content: letterContent,
          bureau: dispute.bureau,
          item_name: dispute.item,
          created_at: new Date().toISOString(),
          status: "generated"
        }
      ]);
      if (error) throw error;
      // Log to admin_log
      const { data: { user: adminUser } } = await supabase.auth.getUser();
      await supabase.from("admin_log").insert({
        admin_id: adminUser.id,
        action: "generate_letter",
        target_user_id: client.user_id,
        details: {
          bureau: dispute.bureau,
          item_name: dispute.item,
          reason: dispute.reason
        }
      });
      setLetterPreview(letterContent);
      setShowLetterModal(true);
      toast({ title: "Letter generated!" });
    } catch (err: any) {
      toast({ title: "Letter generation failed", description: err.message, variant: "destructive" });
    } finally {
      setGeneratingLetter(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900" />
      </div>
    );
  }

  return (
    <ClientGuard>
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Client Info Card */}
            <Card className="p-6">
              <div className="flex items-center space-x-3 mb-4">
                <User className="h-6 w-6 text-blue-500" />
                <h3 className="text-lg font-medium">Client Information</h3>
              </div>
              {data?.client && (
                <div className="space-y-2">
                  <p><span className="font-medium">Name:</span> {data.client.full_name}</p>
                  <p><span className="font-medium">DOB:</span> {new Date(data.client.dob).toLocaleDateString()}</p>
                  <p><span className="font-medium">Address:</span> {data.client.address}</p>
                </div>
              )}
            </Card>

            {/* Credit Report Card */}
            <Card className="p-6">
              <div className="flex items-center space-x-3 mb-4">
                <CreditCard className="h-6 w-6 text-green-500" />
                <h3 className="text-lg font-medium">Credit Report</h3>
              </div>
              {data?.creditReport ? (
                <div className="space-y-2">
                  <p><span className="font-medium">Score:</span> {data.creditReport.score}</p>
                  <p><span className="font-medium">Last Updated:</span> {new Date(data.creditReport.synced_at).toLocaleDateString()}</p>
                  <Button
                    onClick={() => router.push('/credit-report')}
                    variant="outline"
                    className="w-full mt-4"
                  >
                    View Full Report
                  </Button>
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-gray-500">No credit report available</p>
                  <Button
                    onClick={() => router.push('/credit-sync')}
                    variant="outline"
                    className="w-full mt-4"
                  >
                    Sync Credit Report
                  </Button>
                </div>
              )}
            </Card>

            {/* Documents Card */}
            <Card className="p-6">
              <div className="flex items-center space-x-3 mb-4">
                <FileText className="h-6 w-6 text-purple-500" />
                <h3 className="text-lg font-medium">Documents</h3>
              </div>
              {data?.documents && data.documents.length > 0 ? (
                <div className="space-y-2">
                  {data.documents.map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between p-2 bg-gray-50 rounded"
                    >
                      <span className="text-sm">{doc.type}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => window.open(doc.file_url, '_blank')}
                      >
                        View
                      </Button>
                    </div>
                  ))}
                  <Button
                    onClick={() => router.push('/documents')}
                    variant="outline"
                    className="w-full mt-4"
                  >
                    Manage Documents
                  </Button>
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-gray-500">No documents uploaded</p>
                  <Button
                    onClick={() => router.push('/documents')}
                    variant="outline"
                    className="w-full mt-4"
                  >
                    Upload Documents
                  </Button>
                </div>
              )}
            </Card>

            {/* Disputes Card */}
            <Card className="p-6">
              <div className="flex items-center space-x-3 mb-4">
                <AlertCircle className="h-6 w-6 text-red-500" />
                <h3 className="text-lg font-medium">Active Disputes</h3>
              </div>
              <div className="text-center py-4">
                <p className="text-gray-500">No active disputes</p>
                <Button
                  onClick={() => router.push('/disputes/new')}
                  variant="outline"
                  className="w-full mt-4"
                >
                  Start New Dispute
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Letter Preview Modal */}
      {showLetterModal && (
        <Sheet open={showLetterModal} onOpenChange={setShowLetterModal}>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>Letter Preview</SheetTitle>
            </SheetHeader>
            <SheetContent className="p-4">
              {letterPreview && (
                <div className="prose">
                  {letterPreview}
                </div>
              )}
            </SheetContent>
          </SheetContent>
        </Sheet>
      )}
    </ClientGuard>
  );
};

export default Dashboard;