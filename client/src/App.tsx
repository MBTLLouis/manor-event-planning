import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch, Redirect } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { useAuth } from "@/_core/hooks/useAuth";

// Auth pages
import RoleSelection from "./pages/auth/RoleSelection";
import EmployeeLogin from "./pages/auth/EmployeeLogin";
import CoupleLogin from "./pages/auth/CoupleLogin";

// Public pages
import PublicWeddingWebsite from "./pages/PublicWeddingWebsite";

// Employee pages
import Dashboard from "./pages/Dashboard";
import EventsList from "./pages/events/EventsList";
import EventDetail from "./pages/events/EventDetail";
import GuestList from "./pages/events/GuestList";
import SaveTheDate from "./pages/events/SaveTheDate";
import FinalGuestDatabase from "./pages/events/FinalGuestDatabase";
import FloorPlans from "./pages/events/FloorPlans";
import Timeline from "./pages/events/Timeline";
import FoodChoices from "./pages/events/FoodChoices";
import SeatingPlan from "./pages/events/SeatingPlan";
import SeatingPlanV2 from "./pages/events/SeatingPlanV2";

import Budget from "./pages/events/Budget";
import VendorsModule from "./pages/events/Vendors";
import Checklist from "./pages/events/Checklist";
import Notes from "./pages/events/Notes";
import Accommodations from "./pages/events/Accommodations";
import WeddingWebsite from "./pages/events/WeddingWebsite";
import MessagesCenter from "./pages/MessagesCenter";
import Calendar from "./pages/Calendar";
import Vendors from "./pages/Vendors";

// Couple pages
import CoupleDashboard from "./pages/couple/CoupleDashboard";
import CoupleGuests from "./pages/couple/CoupleGuests";
import CoupleSeating from "./pages/couple/CoupleSeating";
import CoupleSeatingV2 from "./pages/couple/CoupleSeatingV2";
import CoupleTimeline from "./pages/couple/CoupleTimeline";
import CoupleMenu from "./pages/couple/CoupleMenu";
import CoupleNotes from "./pages/couple/CoupleNotes";
import CoupleHotels from "./pages/couple/CoupleHotels";
import CoupleWebsite from "./pages/couple/CoupleWebsite";
import PublicRSVP from "./pages/PublicRSVP";

function ProtectedRoute({ component: Component, ...rest }: any) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Redirect to="/login" />;
  }

  return <Component {...rest} />;
}

function RootRedirect() {
  const { isAuthenticated, loading, user } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return <Redirect to="/login" />;
  }
  
  // Redirect based on user role
  if (user?.role === "couple") {
    return <Redirect to="/couple/dashboard" />;
  }
  
  return <Redirect to="/dashboard" />;
}

function Router() {
  return (
    <Switch>
      {/* Public routes */}
      <Route path="/wedding/:slug" component={PublicWeddingWebsite} />
      <Route path="/rsvp" component={PublicRSVP} />

      {/* Auth routes */}
      <Route path="/login" component={RoleSelection} />
      <Route path="/login/employee" component={EmployeeLogin} />
      <Route path="/login/couple" component={CoupleLogin} />

      {/* Protected employee routes */}
      <Route path="/dashboard">
        {() => <ProtectedRoute component={Dashboard} />}
      </Route>
      <Route path="/events">
        {() => <ProtectedRoute component={EventsList} />}
      </Route>
      <Route path="/events/:id">
        {(params) => <ProtectedRoute component={EventDetail} params={params} />}
      </Route>
      <Route path="/events/:id/guests">
        {(params) => <ProtectedRoute component={GuestList} params={params} />}
      </Route>
      <Route path="/events/:id/save-the-date">
        {(params) => <ProtectedRoute component={SaveTheDate} params={params} />}
      </Route>
      <Route path="/events/:id/final-guests">
        {(params) => <ProtectedRoute component={FinalGuestDatabase} params={params} />}
      </Route>
      <Route path="/events/:id/floor-plans">
        {(params) => <ProtectedRoute component={FloorPlans} params={params} />}
      </Route>
      <Route path="/events/:id/timeline">
        {(params) => <ProtectedRoute component={Timeline} params={params} />}
      </Route>
      <Route path="/events/:id/food-choices">
        {(params) => <ProtectedRoute component={FoodChoices} params={params} />}
      </Route>
      <Route path="/events/:id/seating-plan">
        {(params) => <ProtectedRoute component={SeatingPlanV2} params={params} />}
      </Route>

      <Route path="/events/:id/budget">
        {(params) => <ProtectedRoute component={Budget} params={params} />}
      </Route>
      <Route path="/events/:id/vendors">
        {(params) => <ProtectedRoute component={VendorsModule} params={params} />}
      </Route>
      <Route path="/events/:id/checklist">
        {(params) => <ProtectedRoute component={Checklist} params={params} />}
      </Route>
      <Route path="/events/:id/notes">
        {(params) => <ProtectedRoute component={Notes} params={params} />}
      </Route>
      <Route path="/events/:id/accommodations">
        {(params) => <ProtectedRoute component={Accommodations} params={params} />}
      </Route>
      <Route path="/events/:id/wedding-website">
        {(params) => <ProtectedRoute component={WeddingWebsite} params={params} />}
      </Route>
      <Route path="/messages-center">
        {() => <ProtectedRoute component={MessagesCenter} />}
      </Route>
      <Route path="/calendar">
        {() => <ProtectedRoute component={Calendar} />}
      </Route>
      <Route path="/vendors">
        {() => <ProtectedRoute component={Vendors} />}
      </Route>

      {/* Couple routes */}
      <Route path="/couple/dashboard">
        {() => <ProtectedRoute component={CoupleDashboard} />}
      </Route>
      <Route path="/couple/guests">
        {() => <ProtectedRoute component={CoupleGuests} />}
      </Route>
      <Route path="/couple/seating">
        {() => <ProtectedRoute component={CoupleSeatingV2} />}
      </Route>
      <Route path="/couple/timeline">
        {() => <ProtectedRoute component={CoupleTimeline} />}
      </Route>
      <Route path="/couple/menu">
        {() => <ProtectedRoute component={CoupleMenu} />}
      </Route>
      <Route path="/couple/notes">
        {() => <ProtectedRoute component={CoupleNotes} />}
      </Route>
      <Route path="/couple/hotels">
        {() => <ProtectedRoute component={CoupleHotels} />}
      </Route>
      <Route path="/couple/website">
        {() => <ProtectedRoute component={CoupleWebsite} />}
      </Route>

      {/* Root redirect */}
      <Route path="/">
        {() => <RootRedirect />}
      </Route>

      {/* 404 */}
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
