import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/src/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Terminal, Github, Mail, Lock, User as UserIcon, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { motion } from "motion/react";

export default function AuthPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const initialMode = searchParams.get("mode") === "register" ? "register" : "login";
  
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");

  const handleAuth = async (isRegister: boolean) => {
    setLoading(true);
    try {
      if (isRegister) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
              username: username,
            }
          }
        });
        if (error) throw error;
        toast.success("Registrasi Berhasil! Silakan cek email Anda untuk verifikasi.");
        setLoading(false);
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        toast.success("Berhasil Masuk! Mengalihkan...");
        navigate("/dashboard");
      }
    } catch (error: any) {
      toast.error(error.message);
      setLoading(false);
    } finally {
    }
  };

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      
      if (event.data?.type === 'SUPABASE_AUTH_COMPLETED') {
        if (event.data.error) {
          toast.error(event.data.error);
          setLoading(false);
        } else if (event.data.session) {
          toast.success("Berhasil Masuk! Mengalihkan...");
          // Wait a bit to ensure the session is properly loaded in the main window
          setTimeout(() => navigate("/dashboard"), 1000);
        } else {
          setLoading(false);
        }
      }
    };
    
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [navigate]);

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          skipBrowserRedirect: true,
        }
      });
      
      if (error) throw error;
      
      if (data?.url) {
        const width = 600;
        const height = 700;
        const left = window.screenX + (window.outerWidth - width) / 2;
        const top = window.screenY + (window.outerHeight - height) / 2;
        
        const popup = window.open(
          data.url, 
          'google-auth', 
          `width=${width},height=${height},left=${left},top=${top},status=no,menubar=no,toolbar=no`
        );
        
        if (!popup) {
          toast.error("Popup terblokir! Harap izinkan popup untuk masuk.");
          setLoading(false);
        }
      }
    } catch (error: any) {
      toast.error(error.message);
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto flex items-center justify-center min-h-[calc(100vh-80px)] py-10 px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md"
      >
        <Card className="code-card border-2">
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary">
              <Terminal className="h-8 w-8 text-primary-foreground" />
            </div>
            <div className="space-y-1">
              <CardTitle className="text-2xl font-mono uppercase tracking-tighter">AKSES KODE<span className="text-primary">KU</span></CardTitle>
              <CardDescription>Bergabung dengan elit developer marketplace Indonesia.</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue={initialMode} className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-8 bg-muted/50 p-1">
                <TabsTrigger value="login" className="font-tech uppercase text-xs">MASUK</TabsTrigger>
                <TabsTrigger value="register" className="font-tech uppercase text-xs">DAFTAR</TabsTrigger>
              </TabsList>

              <div className="space-y-4">
                <Button 
                  variant="outline" 
                  className="w-full h-11 bg-card hover:bg-muted border-border group" 
                  onClick={handleGoogleLogin}
                  disabled={loading}
                >
                  {loading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin text-primary" />
                  ) : (
                    <img src="https://www.google.com/favicon.ico" alt="Google" className="mr-2 h-4 w-4 grayscale group-hover:grayscale-0 transition-all" />
                  )}
                  {loading ? "Menghubungkan..." : "Lanjutkan dengan Google"}
                </Button>
                
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-border" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card px-2 text-muted-foreground font-tech">ATAU GUNAKAN EMAIL</span>
                  </div>
                </div>

                <TabsContent value="login" className="space-y-4 mt-0">
                  <div className="space-y-2">
                    <Label htmlFor="email">Alamat Email</Label>
                    <div className="relative">
                       <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                       <Input id="email" type="email" placeholder="nama@domain.com" className="pl-10" value={email} onChange={(e) => setEmail(e.target.value)} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="password">Password</Label>
                      <Button variant="link" size="sm" className="px-0 font-normal text-xs text-primary">Lupa password?</Button>
                    </div>
                    <div className="relative">
                       <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                       <Input id="password" type="password" className="pl-10" value={password} onChange={(e) => setPassword(e.target.value)} />
                    </div>
                  </div>
                  <Button className="w-full h-11 font-tech" onClick={() => handleAuth(false)} disabled={loading}>
                    {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "MASUK KE SISTEM"}
                  </Button>
                </TabsContent>

                <TabsContent value="register" className="space-y-4 mt-0">
                  <div className="space-y-2">
                    <Label htmlFor="reg-name">Nama Lengkap</Label>
                    <div className="relative">
                       <UserIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                       <Input id="reg-name" placeholder="Budi Utomo" className="pl-10" value={fullName} onChange={(e) => setFullName(e.target.value)} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reg-user">Username</Label>
                    <div className="relative">
                       <Terminal className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                       <Input id="reg-user" placeholder="codemaker_pro" className="pl-10" value={username} onChange={(e) => setUsername(e.target.value)} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reg-email">Alamat Email</Label>
                    <div className="relative">
                       <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                       <Input id="reg-email" type="email" placeholder="nama@domain.com" className="pl-10" value={email} onChange={(e) => setEmail(e.target.value)} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reg-pass">Password</Label>
                    <div className="relative">
                       <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                       <Input id="reg-pass" type="password" className="pl-10" value={password} onChange={(e) => setPassword(e.target.value)} />
                    </div>
                  </div>
                  <Button className="w-full h-11 font-tech" onClick={() => handleAuth(true)} disabled={loading}>
                    {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "INISIALISASI AKUN"}
                  </Button>
                  <p className="text-[10px] text-center text-muted-foreground mt-4 uppercase font-tech">
                    Dengan mendaftar, Anda menyetujui Ketentuan Layanan kami.
                  </p>
                </TabsContent>
              </div>
            </Tabs>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
