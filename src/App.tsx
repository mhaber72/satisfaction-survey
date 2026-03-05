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
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
