import { useEffect } from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from '@/contexts/AuthContext';
import { VersionManager } from '@/utils/versionManager';
import Header from "@/components/Header";
import Home from "@/pages/Home";
import Join from "@/pages/Join";
import JoinCustomer from "@/pages/JoinCustomer";
import JoinBusiness from "@/pages/JoinBusiness";
import LoginCustomer from "@/pages/LoginCustomer";
import LoginBusiness from "@/pages/LoginBusiness";
import BusinessSetup from "@/pages/BusinessSetup";
import CalendarManagement from "@/pages/CalendarManagement";
import BusinessDashboard from "@/pages/BusinessDashboard";
import BusinessSettings from "@/pages/BusinessSettings";
import CustomerDashboard from "@/pages/CustomerDashboard";
import CustomerWallet from "@/pages/CustomerWallet";
import CustomerOffers from "@/pages/CustomerOffers";
import AllOffersPage from "@/pages/AllOffersPage";
import SalonProfile from "@/pages/SalonProfile";
import SalonBookingPage from "@/pages/SalonBookingPage";
import ServicesSelection from "@/pages/ServicesSelection";
import BookingPage from "@/pages/BookingPage";
import SuperAdminDashboard from "@/pages/SuperAdminDashboard";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/join" component={Join} />
        <Route path="/join/customer" component={JoinCustomer} />
        <Route path="/join/business" component={JoinBusiness} />
        <Route path="/login/customer" component={LoginCustomer} />
        <Route path="/login/business" component={LoginBusiness} />
        <Route path="/business/setup" component={BusinessSetup} />
        <Route path="/dashboard" component={BusinessDashboard} />
        <Route path="/business/dashboard" component={BusinessDashboard} />
        <Route path="/business/settings/:salonId">
          {(params) => <BusinessSettings key={params.salonId} salonId={params.salonId!} />}
        </Route>
        <Route path="/customer/dashboard" component={CustomerDashboard} />
        <Route path="/wallet" component={CustomerWallet} />
        <Route path="/offers" component={CustomerOffers} />
        <Route path="/all-offers" component={AllOffersPage} />
        <Route path="/calendar">
          {() => <CalendarManagement />}
        </Route>
        <Route path="/calendar-management">
          {() => <CalendarManagement />}
        </Route>
        <Route path="/calendar-management/:salonId">
          {(params) => <CalendarManagement salonId={params.salonId} />}
        </Route>
        <Route path="/salon/:salonId/book" component={SalonBookingPage} />
        <Route path="/salon/:salonId">
          {(params) => <SalonProfile salonId={params.salonId!} />}
        </Route>
        <Route path="/services" component={ServicesSelection} />
        <Route path="/booking" component={BookingPage} />
        
        {/* Super Admin Routes */}
        <Route path="/admin/:rest*" component={SuperAdminDashboard} />
        
        {/* Fallback to 404 */}
        <Route component={NotFound} />
      </Switch>
    </div>
  );
}

function App() {
  // Initialize version management on first render
  useEffect(() => {
    VersionManager.check();
    VersionManager.cleanupOldVersions();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <Toaster />
          <Router />
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
