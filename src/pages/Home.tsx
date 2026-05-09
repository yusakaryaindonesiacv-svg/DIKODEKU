import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Code2, ShieldCheck, Zap, Terminal as TerminalIcon, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "motion/react";
import { Badge } from "@/components/ui/badge";
import { ProductCard } from "@/src/components/Shared";
import { supabase } from "@/src/lib/supabase";

export default function Home() {
  const [featuredProducts, setFeaturedProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      const [productsRes, categoriesRes] = await Promise.all([
        supabase.from("products").select("*, categories(*)").limit(4),
        supabase.from("categories").select("*").limit(5)
      ]);

      if (productsRes.data) setFeaturedProducts(productsRes.data);
      if (categoriesRes.data) setCategories(categoriesRes.data);
      setLoading(false);
    }
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="font-mono text-xs text-muted-foreground animate-pulse">Menghubungkan ke DIKODEKU...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-4">
      {/* Bento Layout Grid */}
      <div className="grid grid-cols-12 gap-4 auto-rows-[120px] md:auto-rows-[160px]">
        {/* Large Hero Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="col-span-12 lg:col-span-8 row-span-3 bento-card relative overflow-hidden bg-gradient-to-br from-[#0f1115] to-[#050506] flex flex-col justify-end p-6 md:p-12"
        >
          <div className="absolute top-8 right-8">
            <Badge variant="outline" className="gap-2 px-3 py-1 border-primary/20 bg-primary/10 text-primary font-mono text-[10px]">
              <Sparkles className="h-3 w-3" /> v2.4.0 RELEASED
            </Badge>
          </div>
          
          <div className="max-w-xl z-10 w-full">
            <h1 className="text-xl md:text-2xl lg:text-4xl font-bold leading-tight mb-3 tracking-tighter uppercase">
              Eksplore aplikasimu <br/>
              <span className="text-primary">di</span> DIKODEKU.
            </h1>
            <p className="text-muted-foreground text-[10px] md:text-sm max-w-sm md:max-w-md mb-6 md:mb-8 leading-relaxed">
              Marketplace premium untuk Source Code. Dipercaya oleh 1000+ developer.
            </p>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 mt-4 md:mt-6">
              <Button size="lg" className="rounded-xl px-6 md:px-8 font-bold text-[10px] md:text-sm h-11 md:h-14" render={<Link to="/explore" />}>
                Eksplor Sekarang
              </Button>
              <Button size="lg" variant="outline" className="rounded-xl px-6 md:px-8 font-bold text-[10px] md:text-sm h-11 md:h-14 bg-[#111114]" render={<Link to="/auth?mode=register" />}>
                Gabung Komunitas
              </Button>
            </div>
          </div>

          <div className="absolute bottom-12 right-12 opacity-5 font-mono text-[10px] hidden md:block">
            <pre>{`const config = {
  provider: 'pakasir',
  mode: 'production'
};`}</pre>
          </div>
        </motion.div>

        {/* Categories Card */}
        <div className="col-span-12 md:col-span-6 lg:col-span-4 row-span-2 bento-card flex flex-col gap-4">
          <p className="text-muted-foreground text-[10px] uppercase tracking-widest font-bold">Kategori Tech</p>
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <Link 
                key={cat.id} 
                to={`/explore?cat=${cat.slug}`}
                className="px-3 py-1.5 rounded-full border border-border bg-[#111114] hover:border-primary text-[10px] font-mono transition-colors"
              >
                {cat.name}
              </Link>
            ))}
          </div>
        </div>

        {/* Integration Status Card */}
        <div className="col-span-6 md:col-span-3 lg:col-span-2 row-span-2 bg-primary bento-card text-black flex flex-col justify-between border-none">
          <div>
            <h4 className="font-black text-xl leading-none">PAKASIR<br/>SIAP.</h4>
            <p className="text-[10px] font-medium opacity-80 mt-2 italic">Webhook otomatis aktif.</p>
          </div>
          <div className="flex justify-between items-center mt-4">
            <div className="flex -space-x-2">
              <div className="w-5 h-5 rounded-full bg-black/10 border border-black/5"></div>
              <div className="w-5 h-5 rounded-full bg-black/20 border border-black/5"></div>
              <div className="w-5 h-5 rounded-full bg-black/30 border border-black/5"></div>
            </div>
          </div>
        </div>

        {/* Small Featured card */}
        <div className="col-span-6 md:col-span-3 lg:col-span-2 row-span-2 bento-card flex flex-col items-center justify-center text-center gap-3">
          <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
            <Zap className="h-6 w-6" />
          </div>
          <span className="font-mono text-[10px] font-bold uppercase tracking-widest">Pengiriman Instan</span>
        </div>
      </div>

      {/* Featured Products Secton */}
      <div className="pt-12 space-y-8">
        <div className="flex items-end justify-between border-b border-border pb-4">
          <div>
            <h2 className="text-2xl font-tech font-bold uppercase tracking-tighter">Sorotan <span className="text-primary">Marketplace</span></h2>
          </div>
          <Button variant="ghost" className="text-xs font-tech" render={<Link to="/explore" />}>
            Lihat Semua Item
          </Button>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {featuredProducts.map((p, i) => (
            <ProductCard key={p.id} product={p} index={i} />
          ))}
        </div>
      </div>
    </div>
  );
}
