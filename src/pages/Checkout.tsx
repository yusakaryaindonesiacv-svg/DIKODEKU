import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { supabase } from "@/src/lib/supabase";
import { useAuth } from "@/src/AuthProvider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  CreditCard, 
  Wallet, 
  QrCode, 
  ChevronRight, 
  Loader2, 
  CheckCircle2, 
  ArrowLeft,
  Copy,
  Clock,
  ExternalLink,
  ShieldCheck
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import { QRCodeSVG } from "qrcode.react";

export default function Checkout() {
  const { id } = useParams(); // ID Produk
  const navigate = useNavigate();
  const { user, profile, isAdmin } = useAuth();
  
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [orderId, setOrderId] = useState("");
  
  const [paymentData, setPaymentData] = useState<any>(null);
  const [step, setStep] = useState<"summary" | "payment" | "success">("summary");
  const [selectedMethod, setSelectedMethod] = useState("qris");
  const [transactionData, setTransactionData] = useState<any>(null);
  const [verifying, setVerifying] = useState(false);

  const checkPaymentStatus = async () => {
    if (!orderId || verifying) return;
    setVerifying(true);
    try {
      const amount = product.sale_price || product.price;
      const response = await fetch("/api/pakasir/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order_id: orderId, amount })
      });
      const res = await response.json();
      
      if (res.status === "completed") {
        setStep("success");
        localStorage.removeItem(`order_${user?.id}_${id}`);
        toast.success("Pembayaran terverifikasi!");
        setTimeout(() => navigate("/dashboard"), 5000);
      } else {
        toast.info(res.message || "Pembayaran belum diterima oleh sistem.");
      }
    } catch (err) {
      toast.error("Gagal mengecek status.");
    } finally {
      setVerifying(false);
    }
  };

  useEffect(() => {
    if (!user) navigate("/auth");
    
    async function fetchProduct() {
      const { data } = await supabase.from("products").select("*").eq("id", id).single();
      if (data) setProduct(data);
      else navigate("/explore");
      setLoading(false);
    }
    fetchProduct();
    
    // Stabilize Order ID: Use existing persistent ID or generate new one
    const storageKey = `order_${user?.id}_${id}`;
    const savedOrderId = localStorage.getItem(storageKey);
    
    async function checkPendingTransaction() {
      if (!user) return;
      
      // 1. Check if user ALREADY OWNS this product
      const { data: existingOwnership } = await supabase
        .from("transactions")
        .select("id")
        .eq("user_id", user.id)
        .eq("product_id", id)
        .eq("status", "completed")
        .maybeSingle();
      
      if (existingOwnership) {
        toast.info("Anda sudah memiliki produk ini.");
        navigate("/dashboard");
        return;
      }

      // 2. Check for pending transaction
      const { data: pendingData } = await supabase
        .from("transactions")
        .select("*")
        .eq("user_id", user.id)
        .eq("product_id", id)
        .eq("status", "pending")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (pendingData) {
        setOrderId(pendingData.order_id);
      } else if (savedOrderId) {
        // Double check if savedOrderId is truly pending or if it's an old one
        const { data: oldTx } = await supabase
          .from("transactions")
          .select("status")
          .eq("order_id", savedOrderId)
          .maybeSingle();
        
        if (oldTx && oldTx.status !== 'pending') {
          // If it was completed or cancelled, generate new one
          const newId = `KDK-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
          setOrderId(newId);
          localStorage.setItem(storageKey, newId);
        } else {
          setOrderId(savedOrderId);
        }
      } else {
        const newId = `KDK-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        setOrderId(newId);
        localStorage.setItem(storageKey, newId);
      }
    }

    checkPendingTransaction();
  }, [id, user, navigate]);

  // Real-time listener for payment completion
  useEffect(() => {
    if (!orderId || step !== 'payment') return;

    const channel = supabase
      .channel(`order_status_${orderId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'transactions',
          filter: `order_id=eq.${orderId}`
        },
        (payload) => {
          if (payload.new && payload.new.status === 'completed') {
            setTransactionData(payload.new);
            setStep('success');
            localStorage.removeItem(`order_${user?.id}_${id}`); // Clean up
            toast.success("Pembayaran Berhasil!");
            
            // Auto redirect after 5 seconds
            setTimeout(() => {
              navigate("/dashboard");
            }, 5000);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [orderId, step, navigate, id, user?.id]);

  const handlePayment = async () => {
    setPaymentLoading(true);
    try {
      // 1. Create Transaction via our Backend Proxy
      const amount = Math.round(Number(product.sale_price || product.price));
      
      const response = await fetch("/api/pakasir/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          method: selectedMethod,
          order_id: orderId,
          amount: amount
        })
      });

      const contentType = response.headers.get("content-type");
      
      if (!contentType || !contentType.includes("application/json")) {
        const errorText = await response.text();
        console.error("API Error Response (Non-JSON):", errorText);
        
        if (response.status === 504 || response.status === 502) {
          throw new Error("Server Timeout: Pakasir tidak merespon tepat waktu. Silakan coba 1 menit lagi.");
        }
        
        // Return a cleaner message but log the full error
        throw new Error(`Gagal Menghubungkan ke API (Status ${response.status}). Silakan hubungi Admin atau cek Dashboard Pakasir.`);
      }

      const res = await response.json();

      if (!response.ok) {
        const detail = res.message || res.details || res.error || "";
        throw new Error(detail ? `Error: ${detail}` : "Gagal menginisialisasi pembayaran (500)");
      }

      if (res.already_completed) {
        setStep("success");
        return;
      }

      if (res.payment) {
        setPaymentData(res.payment);
        
        if (!user?.id) {
          throw new Error("Sesi pengguna berakhir. Silakan login kembali.");
        }

        // 2. Save/Update pending transaction to Supabase
        const { error: dbError } = await supabase.from("transactions").upsert({
          user_id: user.id,
          product_id: product.id,
          order_id: orderId,
          amount: amount,
          payment_method: selectedMethod,
          payment_number: res.payment.payment_number,
          status: 'pending'
        }, { onConflict: 'order_id' });

        if (dbError) {
          console.error("DB INSERT ERROR:", dbError);
          // If we fail to record the transaction, we shouldn't show the payment instruction
          // because we won't be able to verify it later.
          throw new Error("Gagal menyimpan data pesanan. Silakan coba lagi.");
        }

        setStep("payment");
      }
    } catch (error: any) {
      toast.error(error.message || "Gagal menghubungkan ke sistem pembayaran");
      if (error.message?.includes("dikonfigurasi") || error.message?.includes("menyimpan")) {
        console.error("Critical Payment Error:", error);
      }
    } finally {
      setPaymentLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Berhasil disalin ke clipboard");
  };

  if (loading) return (
    <div className="container mx-auto px-4 py-20 flex justify-center">
      <Loader2 className="animate-spin h-10 w-10 text-primary" />
    </div>
  );

  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <div className="flex items-center gap-4 mb-8">
        <Button variant="ghost" size="icon" className="rounded-full" onClick={() => step === 'payment' ? setStep('summary') : navigate(-1)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-3xl font-tech font-bold uppercase tracking-tighter">
          {step === 'summary' ? "Tinjau Pesanan" : step === 'payment' ? "Proses Pembayaran" : "Terima Kasih!"}
        </h1>
      </div>

      <AnimatePresence mode="wait">
        {step === "summary" && (
          <motion.div 
            key="summary"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-8"
          >
            <div className="md:col-span-2 space-y-6">
              <Card className="code-card">
                <CardHeader>
                  <CardTitle className="text-lg font-mono flex items-center gap-2">
                    <ShieldCheck className="h-5 w-5 text-primary" /> KONFIRMASI PESANAN
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex gap-4 p-4 border border-border rounded-xl bg-muted/20">
                     <div className="h-24 w-24 rounded-lg overflow-hidden bg-muted">
                        <img src={product.thumbnail_url || undefined} alt={product.name} className="h-full w-full object-cover" />
                     </div>
                     <div className="flex flex-col justify-center gap-1">
                        <h3 className="font-bold">{product.name}</h3>
                        <p className="text-xs text-muted-foreground uppercase font-tech">{product.license_type || "Lisensi Standar"}</p>
                        <p className="text-primary font-tech text-sm mt-1">Rp {(product.sale_price || product.price).toLocaleString('id-ID')}</p>
                     </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-sm font-tech uppercase text-muted-foreground tracking-widest">Metode Pembayaran</h4>
                    <div className="grid grid-cols-2 gap-3">
                       <Button 
                        variant={selectedMethod === 'qris' ? 'default' : 'outline'} 
                        className="h-16 flex flex-col items-center justify-center gap-1 border-border"
                        onClick={() => setSelectedMethod('qris')}
                       >
                          <QrCode className="h-5 w-5" />
                          <span className="text-[10px] uppercase font-tech">QRIS / E-Wallet</span>
                       </Button>
                       <Button 
                        variant={selectedMethod === 'bni_va' ? 'default' : 'outline'} 
                        className="h-16 flex flex-col items-center justify-center gap-1 border-border"
                        onClick={() => setSelectedMethod('bni_va')}
                       >
                          <CreditCard className="h-5 w-5" />
                          <span className="text-[10px] uppercase font-tech">Nomor VA</span>
                       </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="p-4 bg-primary/5 border border-primary/20 rounded-xl flex gap-3 items-start">
                 <Clock className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                 <p className="text-sm text-primary/80">Link unduhan akan dikirimkan otomatis setelah pembayaran diverifikasi oleh sistem.</p>
              </div>
            </div>

            <div className="space-y-6">
              <Card className="code-card border-primary/20">
                <CardHeader>
                  <CardTitle className="text-sm font-tech uppercase tracking-widest">Ringkasan Biaya</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Harga Asli</span>
                    <span className="font-mono">Rp {product.price.toLocaleString('id-ID')}</span>
                  </div>
                  {product.sale_price && (
                    <div className="flex justify-between text-sm text-green-500">
                      <span>Diskon</span>
                      <span className="font-mono">-Rp {(product.price - product.sale_price).toLocaleString('id-ID')}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Biaya Admin</span>
                    <span className="font-mono">Rp 0</span>
                  </div>
                  <Separator className="my-2 bg-border" />
                  <div className="flex justify-between items-end">
                    <span className="font-tech uppercase text-xs">Total Pembayaran</span>
                    <span className="text-2xl font-tech font-bold text-primary">Rp {(product.sale_price || product.price).toLocaleString('id-ID')}</span>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button className="w-full h-12 font-tech uppercase text-xs tracking-widest group" onClick={handlePayment} disabled={paymentLoading}>
                    {paymentLoading ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : "KONFIRMASI & BAYAR"}
                    {!paymentLoading && <ChevronRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />}
                  </Button>
                </CardFooter>
              </Card>
              
              <p className="text-[10px] text-center text-muted-foreground uppercase leading-relaxed font-tech">
                Transaksi aman didukung oleh <span className="text-foreground font-bold">PAKASIR</span>. 
                <br />Data Anda dienkripsi.
              </p>
            </div>
          </motion.div>
        )}

        {step === "payment" && paymentData && (
          <motion.div 
            key="payment"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center gap-8 py-8"
          >
            <Card className="w-full max-w-md code-card border-none shadow-[0_0_50px_rgba(0,0,0,0.5)]">
              <CardHeader className="text-center pb-2">
                <CardTitle className="text-xs font-tech uppercase tracking-[0.2em] text-primary mb-2">Instruksi Pembayaran</CardTitle>
                <h3 className="text-2xl font-mono font-bold">#{orderId}</h3>
                <CardDescription className="text-foreground">Selesaikan pembayaran sebelum waktu habis</CardDescription>
              </CardHeader>
              <CardContent className="space-y-8 flex flex-col items-center">
                
                {selectedMethod === 'qris' ? (
                  <div className="p-4 bg-white rounded-2xl border-4 border-primary w-full max-w-[280px] sm:max-w-none mx-auto">
                    <QRCodeSVG value={paymentData.payment_number} size={256} level="H" style={{ width: '100%', height: 'auto' }} />
                    <div className="mt-4 flex justify-center">
                      <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/a/a2/Logo_QRIS.svg/1200px-Logo_QRIS.svg.png" alt="QRIS" className="h-6" />
                    </div>
                  </div>
                ) : (
                  <div className="w-full space-y-4">
                     <div className="p-6 bg-muted/30 rounded-2xl border border-border text-center space-y-2 relative group">
                        <span className="text-[10px] font-tech text-muted-foreground uppercase tracking-widest">Virtual Account Number</span>
                        <div className="text-xl md:text-3xl font-mono font-bold tracking-widest text-primary break-all">{paymentData.payment_number}</div>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => copyToClipboard(paymentData.payment_number)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                     </div>
                     <div className="flex justify-between items-center px-2">
                        <span className="text-xs text-muted-foreground font-tech">Bank: <span className="text-foreground font-bold uppercase">{selectedMethod.split('_')[0]}</span></span>
                        <span className="text-xs text-muted-foreground font-tech">Exp: <span className="text-foreground font-bold uppercase">{new Date(paymentData.expired_at).toLocaleTimeString()}</span></span>
                     </div>
                  </div>
                )}

                <div className="w-full space-y-4">
                  <div className="flex justify-between items-center py-3 border-b border-border">
                    <span className="text-sm text-muted-foreground">Tagihan</span>
                    <span className="text-lg font-mono font-bold">Rp {paymentData.amount.toLocaleString('id-ID')}</span>
                  </div>
                  <div className="flex justify-between items-center py-3 border-b border-border">
                    <span className="text-sm text-muted-foreground">Admin Fee</span>
                    <span className="text-sm font-mono">Rp {paymentData.fee.toLocaleString('id-ID')}</span>
                  </div>
                  <div className="flex justify-between items-center py-3">
                    <span className="text-sm font-bold uppercase font-tech">Grand Total</span>
                    <span className="text-xl font-tech font-bold text-primary">Rp {paymentData.total_payment.toLocaleString('id-ID')}</span>
                  </div>
                </div>

                <div className="w-full p-4 bg-muted/20 border border-border rounded-xl space-y-2">
                   <h5 className="text-[10px] font-tech font-bold uppercase">Langkah Pembayaran:</h5>
                   <ol className="text-xs text-muted-foreground list-decimal pl-4 space-y-1">
                      <li>Buka aplikasi Bank atau E-Wallet pilihan Anda</li>
                      <li>Scan QR di atas atau masukkan nomor VA yang tertera</li>
                      <li>Pastikan nominal pembayaran Sesuai (Grand Total)</li>
                      <li>Konfirmasi pembayaran di aplikasi Anda</li>
                      <li>Tunggu 1-2 menit hingga sistem memverifikasi</li>
                      <li>Klik Cek Status Pembayaran,apabila lebih dari 3 menit</li>
                   </ol>
                </div>
              </CardContent>
              <CardFooter className="flex flex-col gap-4">
                <Button 
                  className="w-full h-12 font-tech" 
                  variant={verifying ? "secondary" : "outline"}
                  onClick={checkPaymentStatus}
                  disabled={verifying}
                >
                   {verifying ? (
                     <Loader2 className="animate-spin h-4 w-4 mr-2" />
                   ) : (
                     <ShieldCheck className="h-4 w-4 mr-2 text-primary" />
                   )}
                   {verifying ? "MEMVERIFIKASI..." : "CEK STATUS PEMBAYARAN"}
                </Button>
                
                <div className="flex flex-col items-center gap-2 w-full">
                  <div className="flex items-center gap-2 text-[10px] text-muted-foreground uppercase font-tech animate-pulse">
                     <Loader2 className="h-3 w-3 animate-spin" /> Menunggu sinyal otomatis...
                  </div>
                </div>

                <div className="flex justify-center gap-4 text-xs text-muted-foreground underline">
                   <button onClick={() => navigate("/dashboard")}>Riwayat</button>
                   <button onClick={() => setStep('summary')}>Ganti Metode</button>
                </div>
              </CardFooter>
            </Card>
          </motion.div>
        )}

        {step === "success" && (
          <motion.div 
            key="success"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-12 text-center"
          >
            <div className="h-20 w-20 rounded-full bg-green-500/20 flex items-center justify-center mb-6">
              <CheckCircle2 className="h-10 w-10 text-green-500" />
            </div>
            <h2 className="text-4xl font-tech font-bold mb-2">PEMBAYARAN BERHASIL</h2>
            <p className="text-muted-foreground mb-8 max-w-md">
              Pesanan <span className="font-mono text-primary">#{orderId}</span> telah diverifikasi. 
              Produk digital Anda sekarang tersedia di menu pembelian.
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-sm">
              <Button asChild className="font-tech py-6">
                <Link to="/dashboard">LIHAT PRODUK SAYA</Link>
              </Button>
              <Button asChild variant="outline" className="font-tech py-6">
                <Link to="/explore">LANJUT BELANJA</Link>
              </Button>
            </div>
            
            <p className="mt-8 text-xs text-muted-foreground animate-pulse">
              Mengalihkan ke halaman pembelian dalam 5 detik...
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
