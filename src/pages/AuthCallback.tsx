import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/src/lib/supabase";
import { Loader2 } from "lucide-react";

export default function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    const handleCallback = async () => {
      // Supabase auto-detects the session from the URL
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error("Auth callback error:", error);
      }

      if (window.opener) {
        // We are in a popup
        window.opener.postMessage({ 
          type: 'SUPABASE_AUTH_COMPLETED',
          error: error?.message,
          session: !!session
        }, window.location.origin);
        
        // Wait a bit to ensure the message is sent before closing
        setTimeout(() => window.close(), 1000);
      } else {
        // We are in the main window (fallback)
        navigate("/dashboard");
      }
    };

    handleCallback();
  }, [navigate]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4">
      <Loader2 className="h-10 w-10 animate-spin text-primary" />
      <p className="font-mono text-sm uppercase tracking-widest animate-pulse">Menyelesaikan Autentikasi...</p>
    </div>
  );
}
