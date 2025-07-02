import { useState, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Landing from "./components/Landing";
import LoginForm from "./components/auth/LoginForm";
import RegisterUser from "./components/auth/RegisterUser";
import RegisterMitra from "./components/auth/RegisterMitra";
import AdminDashboard from "./components/dashboard/AdminDashboard";
import UserDashboard from "./components/dashboard/UserDashboard";
import MitraDashboard from "./components/dashboard/MitraDashboard";
import { auth } from "./lib/auth";

const queryClient = new QueryClient();

const App = () => {
  const [currentView, setCurrentView] = useState<string>("loading");
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    // Check if user is already logged in
    const currentUser = auth.getCurrentUser();
    if (currentUser) {
      setUserRole(currentUser.role);
      setCurrentView("dashboard");
    } else {
      setCurrentView("landing");
    }
  }, []);

  const handleShowLogin = () => setCurrentView("login");
  const handleShowRegisterUser = () => setCurrentView("register-user");
  const handleShowRegisterMitra = () => setCurrentView("register-mitra");
  const handleBackToLanding = () => setCurrentView("landing");

  const handleLoginSuccess = (role: string) => {
    setUserRole(role);
    setCurrentView("dashboard");
  };

  const handleLogout = () => {
    auth.logout();
    setUserRole(null);
    setCurrentView("landing");
  };

  const handleRegisterSuccess = () => {
    setCurrentView("login");
  };

  if (currentView === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 to-secondary/10">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-lg font-semibold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            GetLife
          </p>
        </div>
      </div>
    );
  }

  const renderCurrentView = () => {
    switch (currentView) {
      case "landing":
        return (
          <Landing
            onShowLogin={handleShowLogin}
            onShowRegisterUser={handleShowRegisterUser}
            onShowRegisterMitra={handleShowRegisterMitra}
          />
        );
      case "login":
        return (
          <LoginForm
            onBack={handleBackToLanding}
            onLoginSuccess={handleLoginSuccess}
          />
        );
      case "register-user":
        return (
          <RegisterUser
            onBack={handleBackToLanding}
            onSuccess={handleRegisterSuccess}
          />
        );
      case "register-mitra":
        return (
          <RegisterMitra
            onBack={handleBackToLanding}
            onSuccess={handleRegisterSuccess}
          />
        );
      case "dashboard":
        if (userRole === "admin") {
          return <AdminDashboard onLogout={handleLogout} />;
        } else if (userRole === "user") {
          return <UserDashboard onLogout={handleLogout} />;
        } else if (userRole === "mitra") {
          return <MitraDashboard onLogout={handleLogout} />;
        }
        return <div>Invalid role</div>;
      default:
        return <div>Unknown view</div>;
    }
  };

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        {renderCurrentView()}
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
