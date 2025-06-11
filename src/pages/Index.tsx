import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { CheckCircle, Shield, FileText, TrendingUp, Star, ChevronDown } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const navigate = useNavigate();
  const [activePrice, setActivePrice] = useState("pro");

  const features = [
    {
      icon: <FileText className="w-8 h-8 text-white" />,
      title: "AI-Powered Dispute Letters",
      description: "Generate legally compliant dispute letters that cite specific FCRA violations and increase your success rate."
    },
    {
      icon: <Shield className="w-8 h-8 text-white" />,
      title: "Document Security & Organization",
      description: "Securely upload and organize all your credit documents in one encrypted, FCRA-compliant vault."
    },
    {
      icon: <TrendingUp className="w-8 h-8 text-white" />,
      title: "Real-Time Progress Tracking",
      description: "Watch your credit score improve with detailed analytics, dispute timelines, and success predictions."
    }
  ];

  const testimonials = [
    {
      name: "Maria Rodriguez",
      score: "+127 points",
      text: "SAINTRIX helped me remove 12 negative items and qualify for my dream home loan. The AI letters were incredible!",
      rating: 5
    },
    {
      name: "James Mitchell",
      score: "+89 points", 
      text: "After 6 months with SAINTRIX, I went from 520 to 609. Now I can finally get approved for credit cards again.",
      rating: 5
    },
    {
      name: "Sarah Chen",
      score: "+156 points",
      text: "The automated dispute process saved me months of work. Worth every penny for my financial freedom.",
      rating: 5
    }
  ];

  const pricingTiers = [
    {
      id: "basic",
      name: "Credit Boost",
      price: "$85",
      description: "Essential credit repair for beginners",
      features: [
        "AI dispute letter generation",
        "Basic progress tracking",
        "Document upload & storage",
        "Email support",
        "Monthly credit score updates"
      ],
      popular: false
    },
    {
      id: "pro",
      name: "Full Service",
      price: "$185",
      description: "Complete credit transformation",
      features: [
        "Everything in Credit Boost",
        "Advanced AI letter optimization",
        "Real-time credit monitoring",
        "Priority phone support",
        "Personalized action plans",
        "Legal consultation access"
      ],
      popular: true
    },
    {
      id: "premium",
      name: "Credit Mastery",
      price: "$250",
      description: "Personal + business credit repair",
      features: [
        "Everything in Full Service",
        "Business credit repair",
        "Identity theft protection",
        "White-glove concierge service",
        "Guaranteed results program",
        "Direct attorney access"
      ],
      popular: false
    }
  ];

  const faqs = [
    {
      question: "How quickly will I see results?",
      answer: "Most clients see initial improvements within 30-45 days. Significant score increases typically occur within 3-6 months, depending on your unique situation."
    },
    {
      question: "Is SAINTRIX legal and compliant?",
      answer: "Absolutely. All our dispute letters are based on legitimate FCRA (Fair Credit Reporting Act) violations and consumer protection laws. We never use illegal tactics."
    },
    {
      question: "What if my credit doesn't improve?",
      answer: "We offer a 90-day money-back guarantee. If you don't see any positive changes to your credit report within 90 days, we'll refund your investment."
    },
    {
      question: "Can I cancel anytime?",
      answer: "Yes, you can cancel your subscription at any time. No long-term contracts or hidden fees. Your account remains active until the end of your billing cycle."
    },
    {
      question: "Do you work with all credit bureaus?",
      answer: "Yes, we dispute items with all three major credit bureaus: Equifax, Experian, and TransUnion, as well as original creditors when necessary."
    }
  ];

  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 glass-dark border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <span className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                SAINTRIX
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <Button 
                variant="ghost" 
                className="text-white hover:bg-white/10"
                onClick={() => navigate("/auth")}
              >
                Log In
              </Button>
              <Button 
                className="btn-glossy text-white border-0"
                onClick={() => navigate("/auth")}
              >
                Get Started
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden" 
               style={{ background: 'var(--saintrix-gradient)' }}>
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="animate-slide-in-up">
            <Badge className="mb-6 bg-white/20 text-white border-white/30 hover:bg-white/30">
              ✨ Trusted by 50,000+ Americans
            </Badge>
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight">
              Fix Your Credit.
              <br />
              <span className="bg-gradient-to-r from-yellow-300 to-orange-300 bg-clip-text text-transparent">
                Reclaim Your Life.
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-white/90 mb-8 max-w-3xl mx-auto leading-relaxed">
              AI-powered credit repair that removes negative items legally and permanently. 
              Get approved for loans, credit cards, and your dream home.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button 
                size="lg" 
                className="btn-glossy text-white border-0 px-8 py-4 text-lg"
                onClick={() => navigate("/auth")}
              >
                Start Free Analysis
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="bg-white/10 text-white border-white/30 hover:bg-white/20 px-8 py-4 text-lg"
              >
                Watch Demo
              </Button>
            </div>
          </div>
        </div>
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-float">
          <ChevronDown className="w-6 h-6 text-white/60" />
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Everything You Need to Fix Your Credit
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Our AI-powered platform combines legal expertise with cutting-edge technology 
              to deliver results that traditional credit repair companies can't match.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="relative overflow-hidden group hover:shadow-xl transition-all duration-300">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 to-pink-500"></div>
                <CardHeader>
                  <div className="w-16 h-16 rounded-lg mb-4 flex items-center justify-center"
                       style={{ background: 'var(--saintrix-gradient)' }}>
                    {feature.icon}
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-gray-600 leading-relaxed">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20" style={{ background: 'var(--saintrix-gradient)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Real People, Real Results
            </h2>
            <p className="text-xl text-white/90 max-w-3xl mx-auto">
              Join thousands of Americans who've transformed their financial lives with SAINTRIX
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="glass text-white border-white/20">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-white">{testimonial.name}</CardTitle>
                      <Badge className="bg-green-500 text-white mt-1">
                        {testimonial.score}
                      </Badge>
                    </div>
                    <div className="flex">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 fill-yellow-300 text-yellow-300" />
                      ))}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-white/90 italic">"{testimonial.text}"</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 relative" style={{ background: 'var(--saintrix-gradient-dark)' }}>
        <div className="absolute inset-0 bg-black/40"></div>
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Choose the Plan That's Right for You
            </h2>
            <p className="text-xl text-white/80 max-w-3xl mx-auto">
              No hidden fees. No long-term contracts. Cancel anytime.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {pricingTiers.map((tier) => (
              <div key={tier.id} className={`relative rounded-xl border-2 transition-all duration-300 ${
                tier.popular 
                  ? 'border-amber-400 bg-black/30 scale-105 shadow-2xl' 
                  : 'border-white/20 bg-black/20 hover:border-white/40'
              }`}>
                {tier.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-amber-400 text-black px-4 py-1 rounded-full text-sm font-semibold">
                      Most Popular
                    </span>
                  </div>
                )}
                <div className="p-8">
                  <div className="text-center mb-8">
                    <h3 className="text-2xl font-bold text-white mb-2">{tier.name}</h3>
                    <p className="text-white/70 mb-6">{tier.description}</p>
                    <div className="mb-6">
                      <span className="text-4xl font-bold text-white">{tier.price}</span>
                      <span className="text-white/60 ml-1">/month</span>
                    </div>
                  </div>
                  
                  <div className="mb-8">
                    <h4 className="text-white font-semibold mb-4">What's included</h4>
                    <ul className="space-y-3">
                      {tier.features.map((feature, index) => (
                        <li key={index} className="flex items-start">
                          <CheckCircle className="w-5 h-5 text-green-400 mr-3 mt-0.5 flex-shrink-0" />
                          <span className="text-white/80 text-sm">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <Button 
                    className={`w-full ${
                      tier.popular 
                        ? 'btn-glossy text-white border-0' 
                        : 'bg-white/10 text-white border border-white/30 hover:bg-white/20'
                    }`}
                    onClick={() => navigate("/auth")}
                  >
                    Get Started
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-xl text-gray-600">
              Get answers to common questions about credit repair and SAINTRIX
            </p>
          </div>
          <Accordion type="single" collapsible className="space-y-4">
            {faqs.map((faq, index) => (
              <AccordionItem key={index} value={`item-${index}`} className="border rounded-lg px-6">
                <AccordionTrigger className="text-left font-semibold">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-gray-600 leading-relaxed">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <span className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                SAINTRIX
              </span>
              <p className="mt-4 text-gray-400">
                Empowering Americans to reclaim their financial freedom through AI-powered credit repair.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Product</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-white transition-colors">How It Works</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Success Stories</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Support</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact Us</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Live Chat</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Phone Support</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Legal</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
                <li><a href="#" className="hover:text-white transition-colors">FCRA Compliance</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Refund Policy</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-12 pt-8 text-center text-gray-400">
            <p>&copy; 2024 SAINTRIX. All rights reserved. FCRA compliant credit repair services.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;