import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./AuthProvider";
import { Navbar } from "./components/Navbar";
import BottomNav from "./components/BottomNav";
import InstallPWA from "./components/InstallPWA";
import { Footer } from "./components/Shared";
import { Toaster } from "@/components/ui/sonner";

// Pages
import Home from "./pages/Home";
import Explore from "./pages/Explore";
import AuthPage from "./pages/Auth";
import ProductDetail from "./pages/ProductDetail";
import Checkout from "./pages/Checkout";
import Dashboard from "./pages/Dashboard";
import AdminPage from "./pages/Admin";
import AdminAddProduct from "./pages/AdminAddProduct";
import AuthCallback from "./pages/AuthCallback";

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="min-h-screen flex flex-col selection:bg-primary selection:text-primary-foreground pb-20 md:pb-0">
          <InstallPWA />
          <Navbar />
          <main className="flex-1">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/explore" element={<Explore />} />
              <Route path="/auth" element={<AuthPage />} />
              <Route path="/auth/callback" element={<AuthCallback />} />
              <Route path="/product/:slug" element={<ProductDetail />} />
              <Route path="/checkout/:id" element={<Checkout />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/admin" element={<AdminPage />} />
              <Route path="/admin/add-product" element={<AdminAddProduct />} />
            </Routes>
          </main>
          <Footer />
          <BottomNav />
          <Toaster position="bottom-right" theme="dark" />
        </div>
      </AuthProvider>
    </Router>
  );
}
