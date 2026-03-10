import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AppLayout } from "@/components/AppLayout";
import Login from "./pages/Login";
import ThemeSelection from "./pages/ThemeSelection";
import ThemeDetail from "./pages/ThemeDetail";
import Index from "./pages/Index";
import AdminUsers from "./pages/AdminUsers";
import AdminProfiles from "./pages/AdminProfiles";
import AdminImport from "./pages/AdminImport";
import AdminScoreColors from "./pages/AdminScoreColors";
import AdminLookupTable from "./pages/AdminLookupTable";
import AdminActionStatuses from "./pages/AdminActionStatuses";
import AllActionPlans from "./pages/AllActionPlans";
import AdminClients from "./pages/AdminClients";
import AdminActionResponsibles from "./pages/AdminActionResponsibles";
import AdminVerticals from "./pages/AdminVerticals";
import AdminQuestions from "./pages/AdminQuestions";
import BookBoard from "./pages/BookBoard";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<ProtectedRoute><AppLayout><ThemeSelection /></AppLayout></ProtectedRoute>} />
            <Route path="/theme/:theme" element={<ProtectedRoute><AppLayout><ThemeDetail /></AppLayout></ProtectedRoute>} />
            <Route path="/dashboard" element={<ProtectedRoute><AppLayout><Index /></AppLayout></ProtectedRoute>} />
            <Route path="/admin/users" element={<ProtectedRoute adminOnly><AppLayout><AdminUsers /></AppLayout></ProtectedRoute>} />
            <Route path="/admin/profiles" element={<ProtectedRoute adminOnly><AppLayout><AdminProfiles /></AppLayout></ProtectedRoute>} />
            <Route path="/admin/import" element={<ProtectedRoute adminOnly><AppLayout><AdminImport /></AppLayout></ProtectedRoute>} />
            <Route path="/admin/score-colors" element={<ProtectedRoute adminOnly><AppLayout><AdminScoreColors /></AppLayout></ProtectedRoute>} />
            <Route path="/admin/contract-managers" element={<ProtectedRoute adminOnly><AppLayout><AdminLookupTable tableName="contract_managers" titleKey="nav.contractManagers" /></AppLayout></ProtectedRoute>} />
            <Route path="/admin/regional-managers" element={<ProtectedRoute adminOnly><AppLayout><AdminLookupTable tableName="regional_managers" titleKey="nav.regionalManagers" /></AppLayout></ProtectedRoute>} />
            <Route path="/admin/directories" element={<ProtectedRoute adminOnly><AppLayout><AdminLookupTable tableName="directories" titleKey="nav.directories" /></AppLayout></ProtectedRoute>} />
            <Route path="/admin/action-statuses" element={<ProtectedRoute adminOnly><AppLayout><AdminActionStatuses /></AppLayout></ProtectedRoute>} />
            <Route path="/admin/clients" element={<ProtectedRoute adminOnly><AppLayout><AdminClients /></AppLayout></ProtectedRoute>} />
            <Route path="/admin/action-responsibles" element={<ProtectedRoute adminOnly><AppLayout><AdminActionResponsibles /></AppLayout></ProtectedRoute>} />
            <Route path="/admin/verticals" element={<ProtectedRoute adminOnly><AppLayout><AdminVerticals /></AppLayout></ProtectedRoute>} />
            <Route path="/action-plans" element={<ProtectedRoute><AppLayout><AllActionPlans /></AppLayout></ProtectedRoute>} />
            <Route path="/book-board" element={<ProtectedRoute><AppLayout><BookBoard /></AppLayout></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
