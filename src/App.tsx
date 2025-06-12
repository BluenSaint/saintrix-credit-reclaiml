import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Intake from "./pages/Intake";
import Dashboard from "./pages/Dashboard";
import Letters from "./pages/Letters";
import Admin from "./pages/Admin";
import NotFound from "./pages/NotFound";
import AdminLogs from "./pages/AdminLogs";
import AdminFlags from "./pages/AdminFlags";
import AdminRevenue from "./pages/AdminRevenue";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/intake" element={<Intake />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/letters" element={<Letters />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/admin/logs" element={<AdminLogs />} />
          <Route path="/admin/flags" element={<AdminFlags />} />
          <Route path="/admin/revenue" element={<AdminRevenue />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
