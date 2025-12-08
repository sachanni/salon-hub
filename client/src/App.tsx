import { useEffect } from "react";
import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from '@/contexts/AuthContext';
import { VersionManager } from '@/utils/versionManager';
import { useJWTAuth } from '@/lib/auth';
import { SessionExpiryWarning } from '@/components/SessionExpiryWarning';
import Header from "@/components/Header";
import Home from "@/pages/Home";
import Salons from "@/pages/Salons";
import Join from "@/pages/Join";
import Login from "@/pages/Login";
import JoinCustomer from "@/pages/JoinCustomer";
import JoinBusiness from "@/pages/JoinBusiness";
import BusinessOnboarding from "@/pages/BusinessOnboarding";
import LoginCustomer from "@/pages/LoginCustomer";
import LoginBusiness from "@/pages/LoginBusiness";
import BusinessSetup from "@/pages/BusinessSetup";
import CalendarManagement from "@/pages/CalendarManagement";
import BusinessDashboard from "@/pages/BusinessDashboard";
import BusinessSettings from "@/pages/BusinessSettings";
import CustomerDashboard from "@/pages/CustomerDashboard";
import CustomerWallet from "@/pages/CustomerWallet";
import DepositHistory from "@/pages/DepositHistory";
import SavedCards from "@/pages/SavedCards";
import CustomerOffers from "@/pages/CustomerOffers";
import AllOffersPage from "@/pages/AllOffersPage";
import SalonProfile from "@/pages/SalonProfile";
import SalonBookingPage from "@/pages/SalonBookingPage";
import ServicesSelection from "@/pages/ServicesSelection";
import BookingPage from "@/pages/BookingPage";
import SuperAdminDashboard from "@/pages/SuperAdminDashboard";
import EmailVerified from "@/pages/EmailVerified";
import EmailVerificationExpired from "@/pages/EmailVerificationExpired";
import ResetPassword from "@/pages/ResetPassword";
import AILookAdvisor from "@/pages/AILookAdvisor";
import TestMakeupRender from "@/pages/TestMakeupRender";
import InventoryManagement from "@/pages/InventoryManagement";
import ProductsManagement from "@/pages/ProductsManagement";
import ProductDetailAdmin from "@/pages/ProductDetailAdmin";
import ProductOrders from "@/pages/ProductOrders";
import OrderDetailAdmin from "@/pages/OrderDetailAdmin";
import DeliverySettings from "@/pages/DeliverySettings";
import ProductAnalytics from "@/pages/ProductAnalytics";
import ProductsList from "@/pages/ProductsList";
import ProductDetails from "@/pages/ProductDetails";
import ShoppingCart from "@/pages/ShoppingCart";
import Checkout from "@/pages/Checkout";
import OrderConfirmation from "@/pages/OrderConfirmation";
import OrderDetails from "@/pages/OrderDetails";
import OrderHistory from "@/pages/OrderHistory";
import Wishlist from "@/pages/Wishlist";
import Shop from "@/pages/Shop";
import GiftCardsPage from "@/pages/GiftCardsPage";
import EventDashboard from "@/pages/EventDashboard";
import EventsListing from "@/pages/EventsListing";
import EventReviewPage from "@/pages/EventReviewPage";
import EventDetails from "@/pages/EventDetails";
import CreateEvent from "@/pages/CreateEvent";
import DraftEventBuilder from "@/pages/DraftEventBuilder";
import ManageSpeakers from "@/pages/ManageSpeakers";
import ManageTickets from "@/pages/ManageTickets";
import ManageSchedule from "@/pages/ManageSchedule";
import ManageEvent from "@/pages/ManageEvent";
import EventRegistration from "@/pages/EventRegistration";
import RegistrationConfirmation from "@/pages/RegistrationConfirmation";
import EventCheckIn from "@/pages/EventCheckIn";
import EventAnalytics from "@/pages/EventAnalytics";
import CancelRegistration from "@/pages/CancelRegistration";
import DraftEvents from "@/pages/DraftEvents";
import NotificationCenter from "@/pages/NotificationCenter";
import PastEvents from "@/pages/PastEvents";
import NotFound from "@/pages/not-found";
import MyBeautyProfile from "@/pages/MyBeautyProfile";
import SelfCheckIn from "@/pages/SelfCheckIn";
import { AIBeautyConsultant } from "@/components/chat/AIBeautyConsultant";

function Router() {
  const [location] = useLocation();
  const isPublicKioskRoute = location.startsWith('/checkin/');
  
  return (
    <div className="min-h-screen bg-background">
      {!isPublicKioskRoute && <Header />}
      <Switch>
        {/* QR Self Check-in Route (public kiosk page without header) */}
        <Route path="/checkin/:salonId">
          {(params) => <SelfCheckIn key={params.salonId} />}
        </Route>
        
        <Route path="/" component={Home} />
        <Route path="/salons" component={Salons} />
        <Route path="/shop" component={Shop} />
        <Route path="/join" component={Join} />
        <Route path="/join/customer" component={JoinCustomer} />
        <Route path="/join/business" component={BusinessOnboarding} />
        <Route path="/join/business/register" component={JoinBusiness} />
        <Route path="/login" component={Login} />
        <Route path="/login/customer" component={LoginCustomer} />
        <Route path="/login/business" component={LoginBusiness} />
        <Route path="/business/setup" component={BusinessSetup} />
        <Route path="/dashboard" component={BusinessDashboard} />
        <Route path="/business" component={BusinessDashboard} />
        <Route path="/business/dashboard" component={BusinessDashboard} />
        <Route path="/business/settings/:salonId">
          {(params) => <BusinessSettings key={params.salonId} salonId={params.salonId!} />}
        </Route>
        <Route path="/customer/dashboard" component={CustomerDashboard} />
        <Route path="/wallet" component={CustomerWallet} />
        <Route path="/customer/wallet" component={CustomerWallet} />
        <Route path="/customer/deposits" component={DepositHistory} />
        <Route path="/customer/saved-cards" component={SavedCards} />
        <Route path="/customer/beauty-profile" component={MyBeautyProfile} />
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
        <Route path="/inventory">
          {() => <InventoryManagement />}
        </Route>
        <Route path="/inventory/:salonId">
          {(params) => <InventoryManagement salonId={params.salonId} />}
        </Route>
        
        {/* E-commerce / Product Management Routes (Business Admin) */}
        <Route path="/business/products" component={ProductsManagement} />
        <Route path="/business/products/:productId">
          {(params) => <ProductDetailAdmin key={params.productId} />}
        </Route>
        <Route path="/business/orders" component={ProductOrders} />
        <Route path="/business/orders/:orderId">
          {(params) => <OrderDetailAdmin key={params.orderId} />}
        </Route>
        <Route path="/business/delivery-settings" component={DeliverySettings} />
        <Route path="/business/analytics" component={ProductAnalytics} />
        
        {/* E-commerce / Customer Facing Routes */}
        <Route path="/salon/:salonId/products">
          {(params) => <ProductsList key={params.salonId} salonId={params.salonId!} />}
        </Route>
        <Route path="/products/:productId">
          {(params) => <ProductDetails key={params.productId} />}
        </Route>
        <Route path="/cart" component={ShoppingCart} />
        <Route path="/checkout" component={Checkout} />
        <Route path="/orders/confirmation/:orderId">
          {(params) => <OrderConfirmation key={params.orderId} />}
        </Route>
        <Route path="/orders/:orderId">
          {(params) => <OrderDetails key={params.orderId} />}
        </Route>
        <Route path="/orders" component={OrderHistory} />
        <Route path="/wishlist" component={Wishlist} />
        
        <Route path="/salon/:salonId/book" component={SalonBookingPage} />
        <Route path="/salon/:salonId/gift-cards" component={GiftCardsPage} />
        <Route path="/salon/:salonId">
          {(params) => <SalonProfile salonId={params.salonId!} />}
        </Route>
        <Route path="/services" component={ServicesSelection} />
        <Route path="/booking" component={BookingPage} />
        <Route path="/email-verified" component={EmailVerified} />
        <Route path="/email-verification-expired" component={EmailVerificationExpired} />
        <Route path="/reset-password" component={ResetPassword} />
        
        {/* Premium Features */}
        <Route path="/ai-look-advisor" component={AILookAdvisor} />
        <Route path="/premium/ai-look" component={AILookAdvisor} />
        
        {/* Event Management Routes */}
        <Route path="/events" component={EventsListing} />
        <Route path="/events/:eventId" component={EventDetails} />
        <Route path="/events/:eventId/register" component={EventRegistration} />
        <Route path="/events/:eventId/review" component={EventReviewPage} />
        <Route path="/events/registration/:registrationId/confirmation" component={RegistrationConfirmation} />
        <Route path="/registrations/:bookingId/cancel" component={CancelRegistration} />
        
        {/* Business Event Routes */}
        <Route path="/events/drafts" component={DraftEvents} />
        <Route path="/events/past" component={PastEvents} />
        <Route path="/notifications" component={NotificationCenter} />
        <Route path="/business/events" component={EventDashboard} />
        <Route path="/business/events/dashboard" component={EventDashboard} />
        <Route path="/business/events/create" component={CreateEvent} />
        <Route path="/business/events/builder" component={DraftEventBuilder} />
        <Route path="/business/events/manage-speakers" component={ManageSpeakers} />
        <Route path="/business/events/manage-tickets" component={ManageTickets} />
        <Route path="/business/events/manage-schedule" component={ManageSchedule} />
        <Route path="/business/events/drafts" component={DraftEvents} />
        <Route path="/business/events/past" component={PastEvents} />
        <Route path="/business/events/:eventId/check-in" component={EventCheckIn} />
        <Route path="/business/events/:eventId/analytics" component={EventAnalytics} />
        <Route path="/business/events/:eventId" component={ManageEvent} />
        
        {/* Test/Debug Routes */}
        <Route path="/test/makeup-render" component={TestMakeupRender} />
        
        {/* Super Admin Routes */}
        <Route path="/admin/:rest*" component={SuperAdminDashboard} />
        
        {/* Fallback to 404 */}
        <Route component={NotFound} />
      </Switch>
    </div>
  );
}

function App() {
  useJWTAuth();

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
          <SessionExpiryWarning />
          <AIBeautyConsultant />
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
