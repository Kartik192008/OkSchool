import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import { Marquee } from "./components/layout/Marquee";
import { Navbar } from "./components/layout/Navbar";
import { Footer } from "./components/layout/Footer";
import { supabase } from "./lib/supabase";
import { useEffect } from "react";
import { ErrorBoundary } from "@/components/ErrorBoundary";

// We'll define these pages next
import { Home } from "./pages/Home";
import { Login } from "./pages/Login";
import { AdminDashboard } from "./pages/AdminDashboard";
import { StudyMaterialDetail } from "./pages/StudyMaterialDetail";
import { MockTestList } from "./pages/MockTestList";
import { MockTestExam } from "./pages/MockTestExam";
import { AmazonStore } from "./pages/AmazonStore";
import { SearchResults } from "./pages/SearchResults";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-[100dvh] flex flex-col flex-1">
      <Marquee />
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/admin" component={AdminDashboard} />
      
      <Route path="/login">
        <PublicLayout><Login /></PublicLayout>
      </Route>
      <Route path="/study-material/:id">
        <PublicLayout><StudyMaterialDetail /></PublicLayout>
      </Route>
      <Route path="/mock-test/:id">
        <MockTestExam />
      </Route>
      <Route path="/mock-tests">
        <PublicLayout><MockTestList /></PublicLayout>
      </Route>
      <Route path="/amazon-store">
        <PublicLayout><AmazonStore /></PublicLayout>
      </Route>
      <Route path="/search">
        <PublicLayout><SearchResults /></PublicLayout>
      </Route>
      <Route path="/">
        <PublicLayout><Home /></PublicLayout>
      </Route>
      <Route>
        <PublicLayout><NotFound /></PublicLayout>
      </Route>
    </Switch>
  );
}

function App() {
  useEffect(() => {
    console.log('App mounted, environment check:', {
      VITE_API_TARGET: import.meta.env.VITE_API_TARGET,
      VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
      NODE_ENV: import.meta.env.NODE_ENV,
      BASE_URL: import.meta.env.BASE_URL,
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state changed:', event, session?.user?.email);
      
      if (event === 'SIGNED_IN') {
        console.log('User signed in successfully');
        // Check if user is admin
        if (session?.user?.email === 'kartik1911k@gmail.com') {
          window.location.href = '/admin';
        } else {
          window.location.href = '/';
        }
      } else if (event === 'SIGNED_OUT') {
        console.log('User signed out');
        window.location.href = '/';
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
