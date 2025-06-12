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
  Zap
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";

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

  const upcomingTasks = [
    {
      id: 1,
      task: "Review dispute responses",
      dueDate: "2024-01-25",
      priority: "high",
      daysLeft: 3
    },
    {
      id: 2,
      task: "Upload bank statements",
      dueDate: "2024-01-28",
      priority: "medium",
      daysLeft: 6
    },
    {
      id: 3,
      task: "Second round disputes ready",
      dueDate: "2024-02-01",
      priority: "low",
      daysLeft: 10
    }
  ];

  // Fetch documents
  const fetchDocuments = async (clientId: string) => {
    const { data, error } = await supabase
      .from("documents")
      .select("*")
      .eq("client_id", clientId)
      .order("created_at", { ascending: false });
    if (!error) setDocuments(data || []);
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) throw new Error("Not authenticated");
        const { data: clientData, error: clientError } = await supabase
          .from("clients")
          .select("*")
          .eq("user_id", user.id)
          .single();
        if (clientError || !clientData) throw new Error("Client record not found");
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
      } catch (err: any) {
        toast({ title: "Error loading dashboard", description: err.message, variant: "destructive" });
      } finally {
        setLoading(false);
      }
    };
    fetchData();
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
      setLetterPreview(letterContent);
      setShowLetterModal(true);
      toast({ title: "Letter generated!" });
    } catch (err: any) {
      toast({ title: "Letter generation failed", description: err.message, variant: "destructive" });
    } finally {
      setGeneratingLetter(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <span className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              SAINTRIX
            </span>
            <div className="h-8 w-px bg-gray-300"></div>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">Welcome back, John</h1>
              <p className="text-sm text-gray-500">Let's continue improving your credit</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm">
              <Bell className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm">
              <Settings className="w-4 h-4" />
            </Button>
            <Avatar>
              <AvatarImage src="/placeholder-avatar.jpg" />
              <AvatarFallback>JD</AvatarFallback>
            </Avatar>
            <Button variant="ghost" size="sm" onClick={() => navigate("/auth")}>
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      <div className="p-6">
        {/* Autopilot Status Banner */}
        <div className={`mb-6 p-4 rounded-lg border ${autopilotEnabled ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className={`w-3 h-3 rounded-full ${autopilotEnabled ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <div>
                <h3 className="font-semibold text-gray-900">
                  SAINTRIX Autopilot is {autopilotEnabled ? 'ON' : 'OFF'}
                </h3>
                <p className="text-sm text-gray-600">
                  {autopilotEnabled 
                    ? 'Your credit repair is running automatically' 
                    : 'Your credit repair has been paused'
                  }
                </p>
              </div>
            </div>
            <Button 
              variant={autopilotEnabled ? "outline" : "default"}
              className={autopilotEnabled ? "" : "btn-glossy text-white border-0"}
              onClick={() => setAutopilotEnabled(!autopilotEnabled)}
            >
              {autopilotEnabled ? 'Pause' : 'Resume'}
            </Button>
          </div>
        </div>

        {/* Main Grid */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column - Credit Score & Progress */}
          <div className="lg:col-span-2 space-y-6">
            {/* Credit Score Card */}
            <Card className="relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 to-pink-500"></div>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">Current Credit Score</CardTitle>
                    <CardDescription>Updated 2 days ago</CardDescription>
                  </div>
                  <Badge className={scoreChange && scoreChange > 0 ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                    {scoreChange && scoreChange > 0 ? '+' : ''}{scoreChange} points
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-6">
                  <div className="text-center">
                    <div className="text-4xl font-bold text-gray-900 animate-score-count">{currentScore}</div>
                    <div className="text-sm text-gray-500">FICO Score</div>
                  </div>
                  <div className="flex-1">
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div 
                        className="h-3 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-500"
                        style={{ width: `${(currentScore && currentScore / 850) * 100}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>300</span>
                      <span>Fair</span>
                      <span>850</span>
                    </div>
                  </div>
                  <Button 
                    variant="outline"
                    onClick={() => navigate("/letters")}
                    className="flex items-center space-x-2"
                  >
                    <TrendingUp className="w-4 h-4" />
                    <span>View Details</span>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Active Disputes */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Active Disputes</CardTitle>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => navigate("/letters")}
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    Generate Letters
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {disputes.map((dispute) => (
                    <div key={dispute.id} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-gray-900">{dispute.item}</h4>
                        <Badge variant={dispute.status === 'Completed' ? 'default' : 'secondary'}>
                          {dispute.status}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between text-sm text-gray-500 mb-2">
                        <span>Bureau: {dispute.bureau}</span>
                        <span>Filed: {dispute.date}</span>
                      </div>
                      <Progress value={dispute.progress} className="h-2" />
                      <div className="text-xs text-gray-500 mt-1">{dispute.progress}% complete</div>
                      <Button onClick={() => handleGenerateLetter(dispute)} disabled={generatingLetter}>Generate Dispute Letter</Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Progress Timeline */}
            <Card>
              <CardHeader>
                <CardTitle>Progress Timeline</CardTitle>
                <CardDescription>Your credit improvement journey</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center space-x-4">
                    <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium">Profile Setup Complete</h4>
                      <p className="text-sm text-gray-500">Documents verified and account activated</p>
                    </div>
                    <span className="text-sm text-gray-400">Jan 1</span>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                      <FileText className="w-4 h-4 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium">First Dispute Round Sent</h4>
                      <p className="text-sm text-gray-500">3 items disputed across all bureaus</p>
                    </div>
                    <span className="text-sm text-gray-400">Jan 5</span>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                      <Star className="w-4 h-4 text-purple-600" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium">First Item Removed</h4>
                      <p className="text-sm text-gray-500">+23 point score increase</p>
                    </div>
                    <span className="text-sm text-gray-400">Jan 20</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Tasks & Tools */}
          <div className="space-y-6">
            {/* Smart To-Do List */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Target className="w-5 h-5 mr-2" />
                  Smart To-Do List
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {upcomingTasks.map((task) => (
                    <div key={task.id} className="p-3 border rounded-lg">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="font-medium text-sm">{task.task}</h4>
                        <Badge 
                          variant={task.priority === 'high' ? 'destructive' : task.priority === 'medium' ? 'secondary' : 'outline'}
                          className="text-xs"
                        >
                          {task.daysLeft}d
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-500">Due: {task.dueDate}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* AI Assistant */}
            <Card className="border-2 border-dashed border-purple-200">
              <CardHeader>
                <CardTitle className="flex items-center text-purple-600">
                  <MessageSquare className="w-5 h-5 mr-2" />
                  AI Credit Assistant
                </CardTitle>
                <CardDescription>Coming Soon</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <div className="w-16 h-16 rounded-full bg-purple-100 flex items-center justify-center mx-auto mb-4">
                    <Zap className="w-8 h-8 text-purple-600" />
                  </div>
                  <p className="text-sm text-gray-600 mb-4">
                    Get instant answers about your credit repair progress
                  </p>
                  <Button variant="outline" className="text-purple-600 border-purple-200">
                    Join Waitlist
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Referral System */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="w-5 h-5 mr-2" />
                  Referral Program
                </CardTitle>
                <CardDescription>Invite friends, earn free months</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold text-purple-600">{referralStats.totalReferred}</div>
                      <div className="text-xs text-gray-500">Total Referred</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-green-600">{referralStats.completedReferrals}</div>
                      <div className="text-xs text-gray-500">Completed</div>
                    </div>
                  </div>
                  
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <div className="text-xs text-gray-500 mb-1">Your Referral Code</div>
                    <div className="font-mono text-sm">{referralStats.referralCode}</div>
                  </div>
                  
                  <Progress value={(referralStats.completedReferrals / 3) * 100} className="h-2" />
                  <p className="text-xs text-gray-600">
                    {3 - referralStats.completedReferrals} more referrals for a free month!
                  </p>
                  
                  <Button className="w-full btn-glossy text-white border-0">
                    Share Referral Link
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => navigate("/letters")}
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Generate Dispute Letters
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Documents
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                >
                  <BarChart3 className="w-4 h-4 mr-2" />
                  View Credit Report
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                >
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Contact Support
                </Button>
              </CardContent>
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
    </div>
  );
};

export default Dashboard;