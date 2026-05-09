import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { supabase } from "@/src/lib/supabase";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { 
  ShoppingCart, 
  Star, 
  ExternalLink, 
  Download, 
  Clock, 
  ShieldCheck, 
  CheckCircle2, 
  ArrowLeft,
  ChevronRight,
  Code,
  Sparkles
} from "lucide-react";
import { motion } from "motion/react";
import { toast } from "sonner";
import { useAuth } from "@/src/AuthProvider";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';

export default function ProductDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState("");
  const [isOwned, setIsOwned] = useState(false);

  useEffect(() => {
    async function fetchProduct() {
      setLoading(true);
      const { data, error } = await supabase
        .from("products")
        .select("*, categories(*)")
        .eq("slug", slug)
        .single();
      
      if (data) {
        setProduct(data);
        setActiveImage(data.thumbnail_url);
        
        // Check ownership if user is logged in
        if (user) {
          const { data: tx } = await supabase
            .from("transactions")
            .select("status")
            .eq("user_id", user.id)
            .eq("product_id", data.id)
            .eq("status", "completed")
            .maybeSingle();
          
          if (tx) setIsOwned(true);
        }
      } else {
        toast.error("Product not found");
        navigate("/explore");
      }
      setLoading(false);
    }
    fetchProduct();
  }, [slug, user]);

  const handleAddToCart = () => {
    if (!user) {
      toast.info("Silakan login untuk melanjutkan pembelian.");
      navigate("/auth");
      return;
    }
    // Redirect direct to checkout for simplicity in this demo
    navigate(`/checkout/${product.id}`);
  };

  if (loading) return (
    <div className="container mx-auto px-4 py-20 flex justify-center">
      <div className="animate-spin h-10 w-10 border-4 border-primary border-t-transparent rounded-full"></div>
    </div>
  );

  return (
    <div className="container mx-auto px-4 py-6 md:py-12 space-y-8 md:space-y-12">
      {/* Breadcrumbs */}
      <div className="flex flex-wrap items-center gap-1.5 md:gap-2 text-[10px] md:text-xs font-tech text-muted-foreground uppercase tracking-widest overflow-hidden">
        <Link to="/" className="hover:text-primary shrink-0">Beranda</Link>
        <ChevronRight className="h-2 w-2 md:h-3 md:w-3 shrink-0" />
        <Link to="/explore" className="hover:text-primary shrink-0">Eksplor</Link>
        <ChevronRight className="h-2 w-2 md:h-3 md:w-3 shrink-0" />
        <span className="text-foreground truncate max-w-[120px] sm:max-w-none">{product.name}</span>
      </div>

      <div className="flex flex-col lg:grid lg:grid-cols-3 gap-6 md:gap-12">
        {/* Main Product Column */}
        <div className="order-2 lg:order-1 lg:col-span-2 space-y-4 md:space-y-8 min-w-0 w-full">
          <div className="hidden lg:block space-y-4">
            <div className="aspect-video rounded-2xl md:rounded-3xl overflow-hidden border border-border bg-card relative group">
              <img src={activeImage || undefined} alt={product.name} className="w-full h-full object-cover" />
              {product.preview_url && (
                <Button size="sm" variant="secondary" className="absolute bottom-3 right-3 md:bottom-4 md:right-4 gap-2 backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity text-[10px] h-8" render={<a href={product.preview_url} target="_blank" rel="noopener noreferrer" />}>
                  <ExternalLink className="h-4 w-4 md:h-5 md:w-5" /> <span>DEMO LIVE</span>
                </Button>
              )}
            </div>
          </div>

          <div className="space-y-6 md:space-y-8 w-full">
            {product.preview_url && (
              <div className="p-4 md:p-6 border border-primary/20 bg-primary/5 rounded-xl md:rounded-2xl space-y-4 w-full">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 md:h-10 md:w-10 rounded-lg md:rounded-xl bg-primary/20 flex items-center justify-center text-primary shrink-0">
                      <ExternalLink className="h-4 w-4 md:h-5 md:w-5" />
                    </div>
                    <div>
                      <h4 className="font-tech text-[10px] md:text-xs uppercase tracking-widest font-bold text-primary">Demo Live Preview</h4>
                      <p className="text-[9px] md:text-[10px] text-muted-foreground uppercase">Coba aplikasi sebelum membeli</p>
                    </div>
                  </div>
                  <Button size="sm" className="font-tech text-xs w-full sm:w-auto h-9" asChild>
                    <a href={product.preview_url} target="_blank" rel="noopener noreferrer">BUKA DEMO</a>
                  </Button>
                </div>
                
                {product.demo_access && (
                  <div className="pt-4 border-t border-primary/10">
                    <div className="flex items-center gap-2 mb-2">
                       <ShieldCheck className="h-3 w-3 text-primary" />
                       <span className="text-[9px] md:text-[10px] font-tech uppercase text-primary font-bold">Kredensial Akses Demo</span>
                    </div>
                    <div className="bg-background/50 rounded-lg p-3 font-mono text-[10px] md:text-xs border border-border/50 text-muted-foreground overflow-x-auto whitespace-pre-wrap break-all leading-normal">
                      {product.demo_access}
                    </div>
                  </div>
                )}
              </div>
            )}

        <div className="space-y-8 w-full">
          {/* Section: Deskripsi */}
          <div className="space-y-6 w-full max-w-full overflow-x-hidden">
            <h3 className="font-tech text-xs md:text-sm uppercase tracking-widest text-primary font-bold border-b border-primary/20 pb-2">Deskripsi Produk</h3>
            <div className="w-full text-[9px] md:text-[10px] text-muted-foreground/90 whitespace-pre-wrap break-words [&_p]:leading-relaxed [&_p]:mb-4 [&_h1]:text-[11px] [&_h1]:md:text-[12px] [&_h1]:font-tech [&_h1]:uppercase [&_h1]:mb-3 [&_h2]:text-[10px] [&_h2]:md:text-[11px] [&_h2]:font-tech [&_h2]:uppercase [&_h2]:mb-2 [&_ul]:list-disc [&_ul]:pl-4 [&_ol]:list-decimal [&_ol]:pl-4 [&_li]:mb-1 cursor-text">
              <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]}>{product.description || "Tidak ada deskripsi."}</ReactMarkdown>
            </div>
            
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mt-6">
              <div className="p-3 md:p-4 border border-border rounded-xl bg-card/30 space-y-1">
                <span className="text-[9px] md:text-[10px] text-muted-foreground uppercase font-tech tracking-wider">Bahasa</span>
                <p className="font-mono text-xs md:text-sm">{product.tags?.[0] || 'Clean Code'}</p>
              </div>
              <div className="p-3 md:p-4 border border-border rounded-xl bg-card/30 space-y-1">
                <span className="text-[9px] md:text-[10px] text-muted-foreground uppercase font-tech tracking-wider">Versi</span>
                <p className="font-mono text-xs md:text-sm">v1.2.0</p>
              </div>
              <div className="p-3 md:p-4 border border-border rounded-xl bg-card/30 space-y-1">
                <span className="text-[9px] md:text-[10px] text-muted-foreground uppercase font-tech tracking-wider">Pembaruan</span>
                <p className="font-mono text-xs md:text-sm">{new Date(product.updated_at).toLocaleDateString()}</p>
              </div>
              <div className="p-3 md:p-4 border border-border rounded-xl bg-card/30 space-y-1">
                <span className="text-[9px] md:text-[10px] text-muted-foreground uppercase font-tech tracking-wider">File</span>
                <p className="font-mono text-xs md:text-sm">JS/TS/CSS</p>
              </div>
            </div>
          </div>

          <Separator className="bg-border/50" />

          {/* Section: Lisensi */}
          <div className="space-y-4">
            <h3 className="font-tech text-xs md:text-sm uppercase tracking-widest text-primary font-bold">Informasi Lisensi</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 md:p-6 border border-border bg-card/20 rounded-2xl space-y-3">
                <h4 className="font-bold flex items-center gap-2 text-sm"><CheckCircle2 className="text-primary h-4 w-4" /> Lisensi Standar</h4>
                <ul className="text-[10px] md:text-sm text-muted-foreground space-y-2 list-disc pl-5">
                  <li>Gunakan untuk 1 (satu) klien atau proyek pribadi.</li>
                  <li>Dilarang menjual kembali produk ini tanpa modifikasi total.</li>
                  <li>Berhak mendapatkan update gratis selamanya.</li>
                </ul>
              </div>
              <div className="p-4 md:p-6 border border-border bg-card/20 rounded-2xl space-y-3 opacity-70">
                <h4 className="font-bold flex items-center gap-2 text-sm"><Sparkles className="text-accent h-4 w-4" /> Lisensi Extended</h4>
                <p className="text-[10px] md:text-sm text-muted-foreground">Gunakan untuk proyek komersial tak terbatas atau produk SaaS yang dijual kembali.</p>
              </div>
            </div>
          </div>

          <Separator className="bg-border/50" />

          {/* Section: Ulasan */}
          <div className="space-y-4 pb-8">
            <h3 className="font-tech text-xs md:text-sm uppercase tracking-widest text-primary font-bold">Ulasan Pelanggan</h3>
            <div className="py-12 md:py-16 text-center space-y-4 border border-dashed border-border rounded-3xl">
              <Star className="h-8 w-8 text-muted-foreground mx-auto opacity-20" />
              <p className="text-[10px] md:text-sm text-muted-foreground">Belum ada ulasan untuk produk ini.</p>
            </div>
          </div>
        </div>
        </div>
      </div>

        {/* Right Column: Pricing & Purchase */}
        <div className="order-1 lg:order-2 space-y-6">
          {/* MOBILE ONLY image display at top of purchase box */}
          <div className="lg:hidden space-y-4">
            <div className="aspect-video rounded-2xl overflow-hidden border border-border bg-card relative">
              <img src={activeImage || undefined} alt={product.name} className="w-full h-full object-cover" />
               {product.preview_url && (
                <Button size="sm" variant="secondary" className="absolute bottom-3 right-3 gap-2 backdrop-blur-md text-[10px] h-8" render={<a href={product.preview_url} target="_blank" rel="noopener noreferrer" />}>
                  <ExternalLink className="h-3 w-3" /> DEMO LIVE
                </Button>
              )}
            </div>
          </div>

          <Card className="code-card border-none shadow-2xl overflow-hidden sticky top-24">
            <div className="bg-primary/10 p-6 border-b border-border">
              <span className="text-[10px] font-tech text-primary uppercase tracking-widest font-bold">Lisensi Standar</span>
              <div className="mt-1 flex flex-wrap items-baseline gap-2">
                 <span className="text-2xl sm:text-3xl md:text-4xl font-tech font-bold tracking-tighter shrink-0">Rp { (product.sale_price || product.price).toLocaleString('id-ID') }</span>
                 {product.sale_price && (
                   <span className="text-xs sm:text-sm text-muted-foreground line-through mb-1 shrink-0">Rp { product.price.toLocaleString('id-ID') }</span>
                 )}
              </div>
            </div>
            <CardContent className="p-4 md:p-6 space-y-6">
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-[10px] sm:text-sm">
                  <CheckCircle2 className="text-primary h-3 w-3 sm:h-4 sm:w-4 shrink-0" />
                  <span>Kualitas dikurasi DIKODEKU</span>
                </div>
                <div className="flex items-center gap-3 text-[10px] sm:text-sm">
                  <Clock className="text-primary h-3 w-3 sm:h-4 sm:w-4 shrink-0" />
                  <span>Termasuk update selamanya</span>
                </div>
                <div className="flex items-center gap-3 text-[10px] sm:text-sm">
                  <ShieldCheck className="text-primary h-3 w-3 sm:h-4 sm:w-4 shrink-0" />
                  <span>Pengiriman instan otomatis</span>
                </div>
              </div>

              <div className="space-y-3 pt-4">
                {isOwned ? (
                  <Button className="w-full h-12 md:h-14 text-sm md:text-lg font-tech group bg-green-500 hover:bg-green-600" asChild>
                    <a href={product.download_url} target="_blank" rel="noopener noreferrer">
                      DOWNLOAD <Download className="ml-2 h-4 w-4 md:h-5 md:w-5 animate-bounce" />
                    </a>
                  </Button>
                ) : (
                  <Button className="w-full h-12 md:h-14 text-sm md:text-lg font-tech group" onClick={handleAddToCart}>
                    BELI SEKARANG <ShoppingCart className="ml-2 h-4 w-4 md:h-5 md:w-5 group-hover:-translate-y-1 transition-transform" />
                  </Button>
                )}
                <Button variant="outline" className="w-full h-10 md:h-12 font-tech text-[10px] md:text-xs gap-2">
                   TAMBAH KE WISHLIST
                </Button>
              </div>
            </CardContent>
            <div className="bg-muted/50 p-4 border-t border-border flex justify-center gap-6">
               <div className="flex flex-col items-center gap-1 group cursor-help">
                  <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                  <span className="text-[10px] font-tech uppercase text-muted-foreground">{product.rating || "5.0"} Rating</span>
               </div>
               <div className="flex flex-col items-center gap-1 group cursor-help">
                  <Download className="h-5 w-5 text-primary" />
                  <span className="text-[10px] font-tech uppercase text-muted-foreground">120 Terjual</span>
               </div>
            </div>
          </Card>

          <div className="p-6 border border-border rounded-3xl bg-card/20 space-y-4">
             <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full border border-border bg-muted flex items-center justify-center">
                   <Code className="h-6 w-6 text-primary" />
                </div>
                <div>
                   <h5 className="font-bold text-sm">Elite Author</h5>
                   <p className="text-[10px] font-tech uppercase text-muted-foreground">Vendor Terverifikasi</p>
                </div>
             </div>
             <Separator className="bg-border" />
             <Button variant="ghost" size="sm" className="w-full text-xs font-tech text-muted-foreground">LIHAT PORTOFOLIO</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
