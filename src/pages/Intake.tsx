import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { Upload, FileText, CheckCircle, Shield, Calendar, MapPin, CreditCard } from "lucide-react";

const Intake = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<{[key: string]: File}>({});
  const [formData, setFormData] = useState({
    fullName: "",
    dateOfBirth: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
    lastFourSSN: "",
    phone: ""
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, fileType: string) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedFiles({ ...uploadedFiles, [fileType]: file });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Simulate form submission
    setTimeout(() => {
      navigate("/dashboard");
      setIsLoading(false);
    }, 2000);
  };

  const progress = (step / 3) * 100;

  return (
    <div className="min-h-screen py-8" style={{ background: 'var(--saintrix-gradient)' }}>
      <div className="absolute inset-0 bg-black/20"></div>
      
      <div className="relative z-10 max-w-2xl mx-auto px-4">
        <div className="text-center mb-8">
          <span className="text-3xl font-bold bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent">
            SAINTRIX
          </span>
          <p className="text-white/80 mt-2">Complete your profile to start fixing your credit</p>
        </div>

        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-white font-medium">Step {step} of 3</span>
            <span className="text-white/80">{Math.round(progress)}% Complete</span>
          </div>
          <Progress value={progress} className="h-2 bg-white/20" />
        </div>

        <Card className="glass border-white/20">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              {step === 1 && <><Calendar className="w-5 h-5 mr-2" />Personal Information</>}
              {step === 2 && <><MapPin className="w-5 h-5 mr-2" />Address & Contact</>}
              {step === 3 && <><Upload className="w-5 h-5 mr-2" />Document Upload</>}
            </CardTitle>
            <CardDescription className="text-white/80">
              {step === 1 && "We need your basic information to create your credit profile"}
              {step === 2 && "Your address information helps us verify your identity"}
              {step === 3 && "Upload required documents to verify your identity"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={step === 3 ? handleSubmit : (e) => { e.preventDefault(); setStep(step + 1); }}>
              {step === 1 && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="fullName" className="text-white">Full Legal Name</Label>
                    <Input
                      id="fullName"
                      name="fullName"
                      placeholder="Enter your full legal name"
                      value={formData.fullName}
                      onChange={handleInputChange}
                      className="bg-white/10 border-white/20 text-white placeholder:text-white/60"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="dateOfBirth" className="text-white">Date of Birth</Label>
                    <Input
                      id="dateOfBirth"
                      name="dateOfBirth"
                      type="date"
                      value={formData.dateOfBirth}
                      onChange={handleInputChange}
                      className="bg-white/10 border-white/20 text-white"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="lastFourSSN" className="text-white">Last 4 Digits of SSN</Label>
                    <Input
                      id="lastFourSSN"
                      name="lastFourSSN"
                      placeholder="XXXX"
                      maxLength={4}
                      value={formData.lastFourSSN}
                      onChange={handleInputChange}
                      className="bg-white/10 border-white/20 text-white placeholder:text-white/60"
                      required
                    />
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="address" className="text-white">Street Address</Label>
                    <Input
                      id="address"
                      name="address"
                      placeholder="123 Main Street"
                      value={formData.address}
                      onChange={handleInputChange}
                      className="bg-white/10 border-white/20 text-white placeholder:text-white/60"
                      required
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="city" className="text-white">City</Label>
                      <Input
                        id="city"
                        name="city"
                        placeholder="City"
                        value={formData.city}
                        onChange={handleInputChange}
                        className="bg-white/10 border-white/20 text-white placeholder:text-white/60"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="state" className="text-white">State</Label>
                      <Input
                        id="state"
                        name="state"
                        placeholder="State"
                        value={formData.state}
                        onChange={handleInputChange}
                        className="bg-white/10 border-white/20 text-white placeholder:text-white/60"
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="zipCode" className="text-white">ZIP Code</Label>
                      <Input
                        id="zipCode"
                        name="zipCode"
                        placeholder="12345"
                        value={formData.zipCode}
                        onChange={handleInputChange}
                        className="bg-white/10 border-white/20 text-white placeholder:text-white/60"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone" className="text-white">Phone Number</Label>
                      <Input
                        id="phone"
                        name="phone"
                        placeholder="(555) 123-4567"
                        value={formData.phone}
                        onChange={handleInputChange}
                        className="bg-white/10 border-white/20 text-white placeholder:text-white/60"
                        required
                      />
                    </div>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-6">
                  <div>
                    <Label className="text-white mb-3 block">Government-Issued ID</Label>
                    <div className="border-2 border-dashed border-white/30 rounded-lg p-6 text-center">
                      {uploadedFiles.id ? (
                        <div className="flex items-center justify-center space-x-2 text-green-400">
                          <CheckCircle className="w-5 h-5" />
                          <span>{uploadedFiles.id.name}</span>
                        </div>
                      ) : (
                        <div>
                          <Upload className="w-8 h-8 text-white/60 mx-auto mb-2" />
                          <p className="text-white/80 mb-2">Driver's License or State ID</p>
                          <input
                            type="file"
                            accept=".jpg,.jpeg,.png,.pdf"
                            onChange={(e) => handleFileUpload(e, 'id')}
                            className="hidden"
                            id="id-upload"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            className="bg-white/10 text-white border-white/30 hover:bg-white/20"
                            onClick={() => document.getElementById('id-upload')?.click()}
                          >
                            Choose File
                          </Button>
                          <p className="text-white/60 text-sm mt-2">JPG, PNG, or PDF (max 10MB)</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <Label className="text-white mb-3 block">Proof of Address</Label>
                    <div className="border-2 border-dashed border-white/30 rounded-lg p-6 text-center">
                      {uploadedFiles.address ? (
                        <div className="flex items-center justify-center space-x-2 text-green-400">
                          <CheckCircle className="w-5 h-5" />
                          <span>{uploadedFiles.address.name}</span>
                        </div>
                      ) : (
                        <div>
                          <FileText className="w-8 h-8 text-white/60 mx-auto mb-2" />
                          <p className="text-white/80 mb-2">Utility Bill or Bank Statement</p>
                          <input
                            type="file"
                            accept=".jpg,.jpeg,.png,.pdf"
                            onChange={(e) => handleFileUpload(e, 'address')}
                            className="hidden"
                            id="address-upload"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            className="bg-white/10 text-white border-white/30 hover:bg-white/20"
                            onClick={() => document.getElementById('address-upload')?.click()}
                          >
                            Choose File
                          </Button>
                          <p className="text-white/60 text-sm mt-2">JPG, PNG, or PDF (max 10MB)</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <Alert className="bg-blue-500/20 border-blue-500/50">
                    <Shield className="w-4 h-4" />
                    <AlertDescription className="text-white">
                      Your documents are encrypted and stored securely. We use bank-level security to protect your information.
                    </AlertDescription>
                  </Alert>
                </div>
              )}

              <div className="flex justify-between mt-6">
                {step > 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    className="bg-white/10 text-white border-white/30 hover:bg-white/20"
                    onClick={() => setStep(step - 1)}
                  >
                    Previous
                  </Button>
                )}
                <Button
                  type="submit"
                  className="btn-glossy text-white border-0 ml-auto"
                  disabled={isLoading || (step === 3 && (!uploadedFiles.id || !uploadedFiles.address))}
                >
                  {isLoading ? "Processing..." : step === 3 ? "Complete Setup" : "Continue"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <div className="mt-6 p-4 rounded-lg bg-white/10 border border-white/20">
          <div className="flex items-center space-x-2 mb-2">
            <CreditCard className="w-4 h-4 text-green-400" />
            <span className="text-white font-medium">What Happens Next?</span>
          </div>
          <ul className="text-white/80 text-sm space-y-1">
            <li>• We'll analyze your credit profile within 24 hours</li>
            <li>• You'll receive a personalized action plan</li>
            <li>• Our AI will generate your first dispute letters</li>
            <li>• Start seeing results in 30-45 days</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Intake;