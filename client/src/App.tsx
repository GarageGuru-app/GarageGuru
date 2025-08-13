import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/lib/theme";
import { AuthProvider } from "@/lib/auth";
import Layout from "@/components/Layout";
import ProtectedRoute from "@/components/ProtectedRoute";

// Pages
import Login from "@/pages/login";
import Register from "@/pages/register";
import Dashboard from "@/pages/dashboard";
import JobCard from "@/pages/job-card";
import PendingServices from "@/pages/pending-services";
import Invoice from "@/pages/invoice";
import Invoices from "@/pages/invoices";
import Customers from "@/pages/customers";
import SpareParts from "@/pages/spare-parts";
import Sales from "@/pages/sales";
import Profile from "@/pages/profile";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <AuthProvider>
      <Switch>
        <Route path="/login" component={Login} />
        <Route path="/register" component={Register} />
        
        <Route path="/">
          <ProtectedRoute>
            <Layout>
              <Dashboard />
            </Layout>
          </ProtectedRoute>
        </Route>
      
      <Route path="/dashboard">
        <ProtectedRoute>
          <Layout>
            <Dashboard />
          </Layout>
        </ProtectedRoute>
      </Route>
      
      <Route path="/job-card">
        <ProtectedRoute>
          <Layout showFab={false}>
            <JobCard />
          </Layout>
        </ProtectedRoute>
      </Route>
      
      <Route path="/pending-services">
        <ProtectedRoute>
          <Layout>
            <PendingServices />
          </Layout>
        </ProtectedRoute>
      </Route>
      
      <Route path="/invoice/:jobCardId">
        <ProtectedRoute>
          <Layout showFab={false}>
            <Invoice />
          </Layout>
        </ProtectedRoute>
      </Route>
      
      <Route path="/invoices">
        <ProtectedRoute>
          <Layout>
            <Invoices />
          </Layout>
        </ProtectedRoute>
      </Route>
      
      <Route path="/customers">
        <ProtectedRoute>
          <Layout>
            <Customers />
          </Layout>
        </ProtectedRoute>
      </Route>
      
      <Route path="/spare-parts">
        <ProtectedRoute roles={["garage_admin"]}>
          <Layout>
            <SpareParts />
          </Layout>
        </ProtectedRoute>
      </Route>
      
      <Route path="/sales">
        <ProtectedRoute roles={["garage_admin"]}>
          <Layout>
            <Sales />
          </Layout>
        </ProtectedRoute>
      </Route>
      
      <Route path="/profile">
        <ProtectedRoute>
          <Layout>
            <Profile />
          </Layout>
        </ProtectedRoute>
      </Route>
      
      <Route component={NotFound} />
    </Switch>
    </AuthProvider>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light" storageKey="garage-guru-theme">
        <TooltipProvider>
          <Router />
          <Toaster />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}