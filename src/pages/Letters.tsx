import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNavigate } from "react-router-dom";
import { 
  FileText, 
  Download, 
  Printer, 
  RefreshCw, 
  ArrowLeft, 
  Calendar,
  Building,
  Shield,
  CheckCircle,
  Eye,
  Zap
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";

const Letters = () => {
  const navigate = useNavigate();
  const [selectedLetter, setSelectedLetter] = useState(null);
  const [disputes, setDisputes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDisputes = async () => {
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
        const { data: disputesData, error: disputesError } = await supabase
          .from("disputes")
          .select("*")
          .eq("client_id", clientData.id)
          .order("created_at", { ascending: false });
        if (disputesError) throw disputesError;
        setDisputes(disputesData || []);
      } catch (err: any) {
        toast({ title: "Error loading disputes", description: err.message, variant: "destructive" });
      } finally {
        setLoading(false);
      }
    };
    fetchDisputes();
  }, []);

  const letterTemplate = `Dear Credit Bureau,

I am writing to formally dispute the following item(s) appearing on my credit report:

ACCOUNT DETAILS:
• Creditor: [CREDITOR_NAME]
• Account Number: [ACCOUNT_NUMBER]  
• Date Reported: [DATE_REPORTED]
• Type: [ACCOUNT_TYPE]

DISPUTE REASON:
[DISPUTE_REASON]

LEGAL BASIS:
This item violates the Fair Credit Reporting Act (FCRA) [FCRA_SECTION]. Under federal law, you are required to investigate this dispute within 30 days and remove any information that cannot be verified as accurate and complete.

SUPPORTING EVIDENCE:
[EVIDENCE_LIST]

I respectfully request that you:
1. Conduct a thorough investigation of this disputed item
2. Remove this inaccurate information from my credit report
3. Provide written confirmation of the removal
4. Send updated credit reports to all parties who have received reports containing this error

Please note that failure to investigate or respond within the required timeframe constitutes a violation of federal law. I reserve the right to pursue legal action if this matter is not resolved appropriately.

Thank you for your prompt attention to this matter.

Sincerely,
[YOUR_NAME]
[YOUR_ADDRESS]
[DATE]

Enclosures: Supporting documentation`;

  const generateLetter = (item) => {
    return letterTemplate
      .replace('[CREDITOR_NAME]', item.creditor)
      .replace('[ACCOUNT_NUMBER]', item.account)
      .replace('[DATE_REPORTED]', item.date)
      .replace('[ACCOUNT_TYPE]', item.type)
      .replace('[DISPUTE_REASON]', item.dispute.reason)
      .replace('[FCRA_SECTION]', item.dispute.fcraSection)
      .replace('[EVIDENCE_LIST]', item.dispute.evidence.join(', '))
      .replace('[YOUR_NAME]', 'John Doe')
      .replace('[YOUR_ADDRESS]', '123 Main St, Anytown, ST 12345')
      .replace('[DATE]', new Date().toLocaleDateString());
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button 
              variant="ghost" 
              onClick={() => navigate("/dashboard")}
              className="mr-2"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
            <div className="h-8 w-px bg-gray-300"></div>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">Dispute Letter Generator</h1>
              <p className="text-sm text-gray-500">AI-powered FCRA compliant letters</p>
            </div>
          </div>
          <span className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            SAINTRIX
          </span>
        </div>
      </header>

      <div className="p-6">
        {!selectedLetter ? (
          // Items List View
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Negative Items</h2>
                <p className="text-gray-600">Select an item to generate or view dispute letters</p>
              </div>
              <Badge className="bg-purple-100 text-purple-800">
                {disputes.length} items to dispute
              </Badge>
            </div>

            <div className="grid gap-4">
              {disputes.map((item) => (
                <Card key={item.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                          <Building className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">{item.creditor}</CardTitle>
                          <CardDescription>{item.type} • {item.account}</CardDescription>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Badge 
                          variant={item.status === 'Verified' ? 'destructive' : item.status === 'Disputed' ? 'secondary' : 'outline'}
                        >
                          {item.status}
                        </Badge>
                        <Badge className="bg-red-100 text-red-800">
                          {item.amount}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">Date Reported:</span>
                          <div className="font-medium">{item.date}</div>
                        </div>
                        <div>
                          <span className="text-gray-500">Dispute Reason:</span>
                          <div className="font-medium">{item.dispute.reason}</div>
                        </div>
                        <div>
                          <span className="text-gray-500">FCRA Section:</span>
                          <div className="font-medium">{item.dispute.fcraSection}</div>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        {item.dispute.letterGenerated ? (
                          <Button 
                            onClick={() => setSelectedLetter(item)}
                            className="btn-glossy text-white border-0"
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            View Letter
                          </Button>
                        ) : (
                          <Button 
                            onClick={() => setSelectedLetter(item)}
                            variant="outline"
                          >
                            <Zap className="w-4 h-4 mr-2" />
                            Generate Letter
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Mailing Information */}
            <Card className="border-2 border-purple-200">
              <CardHeader>
                <CardTitle className="flex items-center text-purple-600">
                  <Shield className="w-5 h-5 mr-2" />
                  Credit Bureau Addresses
                </CardTitle>
                <CardDescription>Send your dispute letters to these verified addresses</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <h4 className="font-semibold">Equifax</h4>
                    <div className="text-sm text-gray-600">
                      Equifax Information Services LLC<br />
                      P.O. Box 740256<br />
                      Atlanta, GA 30374
                    </div>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-semibold">Experian</h4>
                    <div className="text-sm text-gray-600">
                      Experian<br />
                      P.O. Box 4500<br />
                      Allen, TX 75013
                    </div>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-semibold">TransUnion</h4>
                    <div className="text-sm text-gray-600">
                      TransUnion LLC<br />
                      Consumer Dispute Center<br />
                      P.O. Box 2000<br />
                      Chester, PA 19016
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          // Letter Detail View
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <Button 
                  variant="ghost" 
                  onClick={() => setSelectedLetter(null)}
                  className="mb-2"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Items
                </Button>
                <h2 className="text-2xl font-bold text-gray-900">Dispute Letter</h2>
                <p className="text-gray-600">{selectedLetter.creditor} • {selectedLetter.type}</p>
              </div>
              <div className="flex space-x-2">
                <Button variant="outline">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Regenerate
                </Button>
                <Button variant="outline">
                  <Download className="w-4 h-4 mr-2" />
                  Download PDF
                </Button>
                <Button className="btn-glossy text-white border-0">
                  <Printer className="w-4 h-4 mr-2" />
                  Print
                </Button>
              </div>
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Generated Letter</CardTitle>
                    <CardDescription>
                      This letter cites specific FCRA violations and includes your evidence
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-white border rounded-lg p-6 font-mono text-sm leading-relaxed">
                      <pre className="whitespace-pre-wrap">{generateLetter(selectedLetter)}</pre>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Item Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <span className="text-sm text-gray-500">Creditor</span>
                      <div className="font-medium">{selectedLetter.creditor}</div>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500">Account</span>
                      <div className="font-medium">{selectedLetter.account}</div>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500">Type</span>
                      <div className="font-medium">{selectedLetter.type}</div>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500">Amount</span>
                      <div className="font-medium">{selectedLetter.amount}</div>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500">Date Reported</span>
                      <div className="font-medium">{selectedLetter.date}</div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Legal Foundation</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <span className="text-sm text-gray-500">FCRA Section Cited</span>
                      <div className="font-medium">{selectedLetter.dispute.fcraSection}</div>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500">Dispute Reason</span>
                      <div className="font-medium">{selectedLetter.dispute.reason}</div>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500">Supporting Evidence</span>
                      <div className="space-y-1">
                        {selectedLetter.dispute.evidence.map((evidence, index) => (
                          <div key={index} className="flex items-center">
                            <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                            <span className="text-sm">{evidence}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-green-200">
                  <CardHeader>
                    <CardTitle className="text-green-600">Next Steps</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-center">
                        <Calendar className="w-4 h-4 text-green-500 mr-2" />
                        Print and mail within 7 days
                      </li>
                      <li className="flex items-center">
                        <FileText className="w-4 h-4 text-green-500 mr-2" />
                        Include supporting documents
                      </li>
                      <li className="flex items-center">
                        <Shield className="w-4 h-4 text-green-500 mr-2" />
                        Send via certified mail
                      </li>
                      <li className="flex items-center">
                        <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                        Response expected in 30 days
                      </li>
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Letters;