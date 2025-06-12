import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Shield, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { useAuthStore, isAdmin } from "@/lib/authStore";

const Auth = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    firstName: "",
    lastName: "",
    agreeToTerms: false,
    accessCode: "",
    legacyCode: ""
  });

  const setUser = useAuthStore((s) => s.setUser);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    try {
      const { data, error: loginError } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password
      });
      if (loginError || !data.user) {
        setError("Invalid email or password.");
        toast({ title: "Login failed", description: loginError?.message || "Invalid credentials.", variant: "destructive" });
        setIsLoading(false);
        return;
      }
      // Email confirmation check
      if (!data.user.confirmed_at) {
        setError("Please confirm your email before logging in.");
        toast({ title: "Email not confirmed", description: "Please confirm your email before logging in.", variant: "destructive" });
        setIsLoading(false);
        return;
      }
      // Confirm user_metadata.role exists
      const role = data.user.user_metadata?.role;
      if (!role) {
        setError("Account not fully set up. Please contact support.");
        toast({ title: "Login failed", description: "Account missing role metadata.", variant: "destructive" });
        setIsLoading(false);
        return;
      }
      // Legacy client approval check
      if (role === "client" && data.user.user_metadata?.approved === false) {
        navigate("/pending-approval");
        toast({ title: "Pending Approval", description: "Your account is pending admin approval.", variant: "default" });
        setIsLoading(false);
        return;
      }
      setUser(data.user);
      if (isAdmin(data.user)) {
        navigate("/admin");
      } else {
        navigate("/dashboard");
      }
      toast({ title: "Signed in!", description: `Welcome back, ${formData.email}` });
    } catch (err: any) {
      setError("Unexpected error during login.");
      toast({ title: "Login failed", description: err.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords don't match");
      setIsLoading(false);
      return;
    }
    if (!formData.agreeToTerms) {
      setError("Please agree to the terms and conditions");
      setIsLoading(false);
      return;
    }
    try {
      const isAdmin = formData.accessCode === "SAINTRIX_ADMIN_MASTER";
      const legacyClient = formData.legacyCode === "LEGACY2024";
      const { data, error: signupError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            firstName: formData.firstName,
            lastName: formData.lastName,
            role: isAdmin ? "admin" : "client",
            access_code: formData.accessCode || null,
            legacy_access_code: legacyClient ? formData.legacyCode : null,
            approved: legacyClient ? false : true
          }
        }
      });
      if (signupError || !data.user) {
        setError(signupError?.message || "Signup failed");
        toast({ title: "Signup failed", description: signupError?.message || "Signup failed.", variant: "destructive" });
        setIsLoading(false);
        return;
      }
      // Confirm user_metadata.role exists
      const role = data.user.user_metadata?.role;
      if (!role) {
        setError("Account not fully set up. Please contact support.");
        toast({ title: "Signup failed", description: "Account missing role metadata.", variant: "destructive" });
        setIsLoading(false);
        return;
      }
      // Show correct toast and route
      if (legacyClient) {
        // Add notification
        await supabase.from("admin_notifications").insert({
          type: "legacy_signup",
          message: `Legacy Signup: ${formData.firstName} ${formData.lastName}`,
          user_id: data.user.id
        });
        toast({ title: "Signup successful!", description: "Thanks! You'll get full access after admin approval. Please check your email to confirm your account.", variant: "default" });
        navigate("/pending-approval");
      } else {
        toast({ title: "Account created!", description: "Please check your email and confirm it before logging in." });
        if (isAdmin) {
          navigate("/admin");
        } else {
          navigate("/intake");
        }
      }
    } catch (err: any) {
      setError("Unexpected error during signup.");
      toast({ title: "Signup failed", description: err.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" 
         style={{ background: 'var(--saintrix-gradient)' }}>
      <div className="absolute inset-0 bg-black/20"></div>
      
      <div className="relative z-10 w-full max-w-md">
        <div className="mb-6">
          <Button 
            variant="ghost" 
            className="text-white hover:bg-white/10 mb-4"
            onClick={() => navigate("/")}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
          <div className="text-center">
            <span className="text-3xl font-bold bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent">
              SAINTRIX
            </span>
            <p className="text-white/80 mt-2">Start your credit transformation</p>
          </div>
        </div>

        <Card className="glass border-white/20">
          <CardHeader className="text-center">
            <CardTitle className="text-white">Welcome</CardTitle>
            <CardDescription className="text-white/80">
              Sign in to your account or create a new one
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-white/10">
                <TabsTrigger value="login" className="data-[state=active]:bg-white/20 text-white">
                  Sign In
                </TabsTrigger>
                <TabsTrigger value="signup" className="data-[state=active]:bg-white/20 text-white">
                  Sign Up
                </TabsTrigger>
              </TabsList>

              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-white">Email</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="Enter your email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="bg-white/10 border-white/20 text-white placeholder:text-white/60"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-white">Password</Label>
                    <Input
                      id="password"
                      name="password"
                      type="password"
                      placeholder="Enter your password"
                      value={formData.password}
                      onChange={handleInputChange}
                      className="bg-white/10 border-white/20 text-white placeholder:text-white/60"
                      required
                    />
                  </div>

                  {error && (
                    <Alert className="bg-red-500/20 border-red-500/50">
                      <AlertDescription className="text-white">{error}</AlertDescription>
                    </Alert>
                  )}

                  <Button 
                    type="submit" 
                    className="w-full btn-glossy text-white border-0"
                    disabled={isLoading}
                  >
                    {isLoading ? "Signing In..." : "Sign In"}
                  </Button>

                  <div className="text-center">
                    <a href="#" className="text-white/80 hover:text-white text-sm">
                      Forgot your password?
                    </a>
                  </div>
                </form>
              </TabsContent>

              <TabsContent value="signup">
                <form onSubmit={handleSignup} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName" className="text-white">First Name</Label>
                      <Input
                        id="firstName"
                        name="firstName"
                        placeholder="First name"
                        value={formData.firstName}
                        onChange={handleInputChange}
                        className="bg-white/10 border-white/20 text-white placeholder:text-white/60"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName" className="text-white">Last Name</Label>
                      <Input
                        id="lastName"
                        name="lastName"
                        placeholder="Last name"
                        value={formData.lastName}
                        onChange={handleInputChange}
                        className="bg-white/10 border-white/20 text-white placeholder:text-white/60"
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-white">Email</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="Enter your email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="bg-white/10 border-white/20 text-white placeholder:text-white/60"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-white">Password</Label>
                    <Input
                      id="password"
                      name="password"
                      type="password"
                      placeholder="Create a password"
                      value={formData.password}
                      onChange={handleInputChange}
                      className="bg-white/10 border-white/20 text-white placeholder:text-white/60"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword" className="text-white">Confirm Password</Label>
                    <Input
                      id="confirmPassword"
                      name="confirmPassword"
                      type="password"
                      placeholder="Confirm your password"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      className="bg-white/10 border-white/20 text-white placeholder:text-white/60"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="accessCode" className="text-white">Access Code <span className="text-xs text-white/60">(optional, for admin)</span></Label>
                    <Input
                      id="accessCode"
                      name="accessCode"
                      placeholder="Enter admin access code (if any)"
                      value={formData.accessCode}
                      onChange={handleInputChange}
                      className="bg-white/10 border-white/20 text-white placeholder:text-white/60"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="legacyCode" className="text-white">Legacy Access Code <span className="text-xs text-white/60">(optional)</span></Label>
                    <Input
                      id="legacyCode"
                      name="legacyCode"
                      placeholder="Enter legacy access code (if any)"
                      value={formData.legacyCode}
                      onChange={handleInputChange}
                      className="bg-white/10 border-white/20 text-white placeholder:text-white/60"
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="terms" 
                      checked={formData.agreeToTerms}
                      onCheckedChange={(checked) => 
                        setFormData({ ...formData, agreeToTerms: checked as boolean })
                      }
                      className="border-white/20 data-[state=checked]:bg-purple-500"
                    />
                    <Label htmlFor="terms" className="text-white/80 text-sm">
                      I agree to the Terms of Service and Privacy Policy
                    </Label>
                  </div>

                  {error && (
                    <Alert className="bg-red-500/20 border-red-500/50">
                      <AlertDescription className="text-white">{error}</AlertDescription>
                    </Alert>
                  )}

                  <Button 
                    type="submit" 
                    className="w-full btn-glossy text-white border-0"
                    disabled={isLoading}
                  >
                    {isLoading ? "Creating Account..." : "Create Account"}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>

            <div className="mt-6 p-4 rounded-lg bg-white/10 border border-white/20">
              <div className="flex items-center space-x-2 mb-2">
                <Shield className="w-4 h-4 text-green-400" />
                <span className="text-white font-medium">Secure & Encrypted</span>
              </div>
              <p className="text-white/80 text-sm">
                Your personal information is protected with bank-level security and encryption.
              </p>
            </div>

            <div className="mt-4 text-center">
              <p className="text-white/60 text-xs">
                Protected by 256-bit SSL encryption • FCRA Compliant
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Auth;