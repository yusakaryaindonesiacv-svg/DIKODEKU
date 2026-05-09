import { useState, useEffect } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { Terminal, ShoppingCart, User as UserIcon, LogOut, LayoutDashboard, Search, Menu, X } from "lucide-react";
import { useAuth } from "@/src/AuthProvider";
import { supabase } from "@/src/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { motion, AnimatePresence } from "motion/react";

export function Navbar() {
  const { user, profile, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [settings, setSettings] = useState<any>(null);

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    async function fetchSettings() {
      const { data } = await supabase.from("settings").select("*").single();
      if (data) setSettings(data);
    }
    fetchSettings();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/explore?q=${encodeURIComponent(searchQuery)}`);
      setIsSearchOpen(false);
      setSearchQuery("");
      setIsMobileMenuOpen(false);
    }
  };

  const siteName = settings?.site_name || "DIKODEKU";
  const siteLogo = settings?.site_logo;

  return (
    <nav className="sticky top-4 z-50 w-full container mx-auto px-4">
      <div className="glass-header flex h-16 items-center justify-between px-6">
        <Link to="/" className="flex items-center gap-3">
          {siteLogo ? (
            <img src={siteLogo} alt={siteName} className="h-8 w-auto object-contain" />
          ) : (
            <div className="flex h-8 w-8 items-center justify-center rounded bg-primary">
              <span className="text-primary-foreground font-black text-lg">{siteName[0]}</span>
            </div>
          )}
          <span className="text-xl font-mono font-bold tracking-tighter uppercase">
            {siteName}
            {!siteLogo && <span className="text-primary">_</span>}
          </span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-8 text-sm font-medium">
          <NavLink to="/" className={({ isActive }) => isActive ? "text-primary" : "text-muted-foreground hover:text-primary"}>Beranda</NavLink>
          <NavLink to="/explore" className={({ isActive }) => isActive ? "text-primary" : "text-muted-foreground hover:text-primary"}>Eksplor</NavLink>
          <NavLink to="/solutions" className={({ isActive }) => isActive ? "text-primary" : "text-muted-foreground hover:text-primary"}>Solusi</NavLink>
        </div>

        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon" 
            className="text-muted-foreground hover:text-primary"
            onClick={() => setIsSearchOpen(true)}
          >
            <Search className="h-5 w-5" />
          </Button>
          
          <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary relative">
            <ShoppingCart className="h-5 w-5" />
            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">0</span>
          </Button>

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger className="relative h-10 w-10 rounded-full border border-primary/20 bg-muted/50 overflow-hidden hover:border-primary/50 transition-colors flex items-center justify-center outline-hidden focus-visible:ring-2 focus-visible:ring-primary">
                  {profile?.avatar_url ? (
                    <img src={profile.avatar_url} alt="Profile" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-primary/10 text-primary font-bold">
                       {profile?.full_name?.[0] || user.email?.[0].toUpperCase() || "U"}
                    </div>
                  )}
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64 bg-card/95 backdrop-blur-xl border-border p-2">
                <DropdownMenuGroup>
                  <DropdownMenuLabel className="font-normal p-4">
                    <div className="flex flex-col space-y-2">
                      <p className="text-sm font-bold leading-none">{profile?.full_name || "Code Explorer"}</p>
                      <p className="text-xs leading-none text-muted-foreground truncate font-mono">{user.email}</p>
                    </div>
                  </DropdownMenuLabel>
                </DropdownMenuGroup>
                <DropdownMenuSeparator className="bg-border/50" />
                <DropdownMenuItem onClick={() => navigate("/dashboard")} className="cursor-pointer py-3 rounded-lg focus:bg-primary/10 focus:text-primary transition-colors">
                  <LayoutDashboard className="mr-3 h-4 w-4" />
                  <span className="font-tech text-xs uppercase tracking-wider">Dashboard Saya</span>
                </DropdownMenuItem>
                {isAdmin && (
                  <DropdownMenuItem onClick={() => navigate("/admin")} className="cursor-pointer py-3 rounded-lg bg-primary/5 text-primary focus:bg-primary/20 transition-colors border border-primary/10 mt-1">
                    <Terminal className="mr-3 h-4 w-4" />
                    <span className="font-tech text-xs uppercase tracking-wider font-bold">Panel Kontrol Admin</span>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator className="bg-border/50" />
                <DropdownMenuItem onClick={signOut} className="cursor-pointer py-3 rounded-lg text-destructive focus:bg-destructive/10 transition-colors">
                  <LogOut className="mr-3 h-4 w-4" />
                  <span className="font-tech text-xs uppercase tracking-wider">Keluar Sesi</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="hidden sm:flex items-center gap-2">
              <Button variant="ghost" render={<Link to="/auth" />}>
                Masuk
              </Button>
              <Button render={<Link to="/auth?mode=register" />}>
                Daftar
              </Button>
            </div>
          )}

          {/* Mobile Menu Toggle */}
          <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
            {isMobileMenuOpen ? <X /> : <Menu />}
          </Button>
        </div>
      </div>

      {/* Search Overlay */}
      <AnimatePresence>
        {isSearchOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-background/80 backdrop-blur-md flex items-start justify-center pt-20 px-4"
            onClick={(e) => {
              if (e.target === e.currentTarget) setIsSearchOpen(false);
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              className="w-full max-w-2xl bg-card border border-border shadow-2xl rounded-3xl overflow-hidden"
            >
              <form onSubmit={handleSearch} className="flex items-center p-4 gap-4">
                <Search className="h-6 w-6 text-primary" />
                <Input 
                  autoFocus
                  placeholder="Cari source code..." 
                  className="flex-1 bg-transparent border-none text-base sm:text-lg h-12 focus-visible:ring-0 px-0"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <Button type="button" variant="ghost" size="icon" onClick={() => setIsSearchOpen(false)}>
                  <X className="h-5 w-5" />
                </Button>
              </form>
              <div className="bg-muted/30 p-4 border-t border-border flex items-center justify-between">
                <p className="text-[10px] text-muted-foreground font-tech uppercase tracking-widest italic">Tekan ENTER untuk mencari</p>
                <div className="flex gap-2">
                   <Badge 
                     variant="outline" 
                     className="font-tech text-[8px] bg-background/50 cursor-pointer hover:bg-primary/20 transition-colors"
                     onClick={() => {
                        setSearchQuery("WEB");
                        navigate("/explore?q=WEB");
                        setIsSearchOpen(false);
                        setSearchQuery("");
                     }}
                   >WEB</Badge>
                   <Badge 
                     variant="outline" 
                     className="font-tech text-[8px] bg-background/50 cursor-pointer hover:bg-primary/20 transition-colors"
                     onClick={() => {
                        setSearchQuery("MOBILE");
                        navigate("/explore?q=MOBILE");
                        setIsSearchOpen(false);
                        setSearchQuery("");
                     }}
                   >MOBILE</Badge>
                   <Badge 
                     variant="outline" 
                     className="font-tech text-[8px] bg-background/50 cursor-pointer hover:bg-primary/20 transition-colors"
                     onClick={() => {
                        setSearchQuery("SAAS");
                        navigate("/explore?q=SAAS");
                        setIsSearchOpen(false);
                        setSearchQuery("");
                     }}
                   >SAAS</Badge>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-t border-border bg-background"
          >
            <div className="flex flex-col p-4 space-y-4">
              <Button 
                variant="outline" 
                className="justify-start gap-4 h-12 rounded-xl text-muted-foreground border-border bg-muted/20"
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  setIsSearchOpen(true);
                }}
              >
                <Search className="h-5 w-5 text-primary" />
                <span className="font-tech text-xs uppercase tracking-widest text-left">Cari Sesuatu...</span>
              </Button>
              <Link to="/" className="text-muted-foreground" onClick={() => setIsMobileMenuOpen(false)}>Beranda</Link>
              <Link to="/explore" className="text-muted-foreground" onClick={() => setIsMobileMenuOpen(false)}>Eksplor</Link>
              <Link to="/solutions" className="text-muted-foreground" onClick={() => setIsMobileMenuOpen(false)}>Solusi</Link>
              {isAdmin && (
                <Link to="/admin" className="text-primary font-bold" onClick={() => setIsMobileMenuOpen(false)}>Panel Admin</Link>
              )}
              {!user && (
                <div className="flex flex-col gap-2 pt-2">
                  <Button variant="outline" render={<Link to="/auth" />} onClick={() => setIsMobileMenuOpen(false)}>
                    Masuk
                  </Button>
                  <Button render={<Link to="/auth?mode=register" />} onClick={() => setIsMobileMenuOpen(false)}>
                    Daftar
                  </Button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
