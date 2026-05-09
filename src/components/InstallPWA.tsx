import React, { useEffect, useState } from 'react';
import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const InstallPWA = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstall, setShowInstall] = useState(false);

  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstall(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      toast.success("Terima kasih telah menginstal DIKODEKU!");
    }
    
    setDeferredPrompt(null);
    setShowInstall(false);
  };

  if (!showInstall) return null;

  return (
    <div className="fixed top-20 left-4 right-4 z-[100] md:max-w-md md:left-auto md:right-4 animate-in fade-in slide-in-from-top-4">
      <div className="bg-card border border-primary/20 p-4 rounded-2xl shadow-2xl flex items-center justify-between gap-4 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold">D</div>
          <div>
            <h4 className="text-sm font-bold">Instal DIKODEKU</h4>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-tech">Akses lebih cepat & mudah</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" className="text-[10px]" onClick={() => setShowInstall(false)}>NANTI</Button>
          <Button variant="default" size="sm" className="text-[10px] gap-2" onClick={handleInstall}>
            <Download className="h-3 w-3" /> INSTAL
          </Button>
        </div>
      </div>
    </div>
  );
};

export default InstallPWA;
