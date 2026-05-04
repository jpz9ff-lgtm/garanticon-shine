import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index.tsx";
import NotFound from "./pages/NotFound.tsx";
import PolicyArea from "./pages/PolicyArea.tsx";
import AssistanceArea from "./pages/AssistanceArea.tsx";
import ProfessionalsArea from "./pages/ProfessionalsArea.tsx";
import Login from "./pages/Login.tsx";
import ForgotPassword from "./pages/ForgotPassword.tsx";
import ResetPassword from "./pages/ResetPassword.tsx";
import DealerDashboard from "./pages/dealer/DealerDashboard.tsx";
import NewWarranty from "./pages/dealer/NewWarranty.tsx";
import WarrantyDetail from "./pages/dealer/WarrantyDetail.tsx";
import DealerAccount from "./pages/dealer/DealerAccount.tsx";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/dealer/ProtectedRoute";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/mi-poliza" element={<PolicyArea />} />
            <Route path="/asistencia" element={<AssistanceArea />} />
            <Route path="/profesionales" element={<ProfessionalsArea />} />
            <Route path="/login" element={<Login />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route
              path="/dealer/dashboard"
              element={<ProtectedRoute><DealerDashboard /></ProtectedRoute>}
            />
            <Route
              path="/dealer/nueva"
              element={<ProtectedRoute><NewWarranty /></ProtectedRoute>}
            />
            <Route
              path="/dealer/garantia/:id/editar"
              element={<ProtectedRoute><NewWarranty /></ProtectedRoute>}
            />
            <Route
              path="/dealer/garantia/:id"
              element={<ProtectedRoute><WarrantyDetail /></ProtectedRoute>}
            />
            <Route
              path="/dealer/cuenta"
              element={<ProtectedRoute><DealerAccount /></ProtectedRoute>}
            />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
