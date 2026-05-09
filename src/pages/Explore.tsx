import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/src/lib/supabase";
import { ProductCard } from "@/src/components/Shared";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Filter, SlidersHorizontal, PackageSearch } from "lucide-react";
import { motion } from "motion/react";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

export default function Explore() {
  const [searchParams, setSearchParams] = useSearchParams();
  const catParam = searchParams.get("cat");
  const qParam = searchParams.get("q") || "";

  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(qParam);

  useEffect(() => {
    async function fetchCategories() {
      const { data } = await supabase.from("categories").select("*");
      if (data) setCategories(data);
    }
    fetchCategories();
  }, []);

  useEffect(() => {
    async function fetchProducts() {
      setLoading(true);
      let query = supabase.from("products").select("*, categories(*)");

      if (catParam) {
        // Find category ID by slug
        const { data: catData } = await supabase.from("categories").select("id").eq("slug", catParam).single();
        if (catData) {
          query = query.eq("category_id", catData.id);
        }
      }

      if (qParam) {
        query = query.ilike("name", `%${qParam}%`);
      }

      const { data, error } = await query;
      if (data) setProducts(data);
      setLoading(false);
    }
    fetchProducts();
  }, [catParam, qParam]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchParams({ q: searchQuery, cat: catParam || "" });
  };

  const setCategory = (slug: string | null) => {
    if (slug) setSearchParams({ q: qParam, cat: slug });
    else setSearchParams({ q: qParam });
  };

  return (
    <div className="container mx-auto px-4 py-12 space-y-12">
      <div className="flex flex-col gap-6 md:gap-8">
        <div className="space-y-2 md:space-y-4">
          <h1 className="text-2xl md:text-4xl font-tech font-bold tracking-tighter uppercase">Katalog <span className="text-primary">Marketplace</span></h1>
          <p className="text-xs md:text-sm text-muted-foreground">Temukan ribuan kode dan aset digital untuk proyek Anda berikutnya.</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <form onSubmit={handleSearch} className="relative flex-1">
            <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
            <Input 
              placeholder="Cari source code..." 
              className="pl-10 pr-20 h-11 bg-card/50 border-border text-xs md:text-sm" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Button type="submit" className="absolute right-1.5 top-1.5 h-8 font-tech text-[9px]">CARI</Button>
          </form>

          <Button variant="outline" className="gap-2 h-11 border-border font-tech text-[10px] sm:text-xs">
            <SlidersHorizontal className="h-3.5 w-3.5" /> FILTER
          </Button>
        </div>

        <ScrollArea className="w-full whitespace-nowrap">
          <div className="flex w-max space-x-2 pb-4">
            <Button 
              variant={!catParam ? "default" : "outline"} 
              size="sm" 
              className="rounded-full font-tech px-6 h-9"
              onClick={() => setCategory(null)}
            >
              SEMUA PRODUK
            </Button>
            {categories.map((cat) => (
              <Button 
                key={cat.id} 
                variant={catParam === cat.slug ? "default" : "outline"} 
                size="sm" 
                className="rounded-full font-tech px-6 h-9 uppercase"
                onClick={() => setCategory(cat.slug)}
              >
                {cat.name}
              </Button>
            ))}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="h-[400px] rounded-2xl bg-card/50 animate-pulse border border-border"></div>
          ))}
        </div>
      ) : (
        <div className="space-y-12">
          {products.length > 0 ? (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
              {products.map((p, i) => (
                <ProductCard key={p.id} product={p} index={i} />
              ))}
            </div>
          ) : (
            <div className="py-32 flex flex-col items-center justify-center text-center gap-6 border-2 border-dashed border-border rounded-[3rem] bg-card/10">
              <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                <PackageSearch className="h-10 w-10" />
              </div>
              <div className="space-y-1">
                <h3 className="text-xl font-bold font-tech uppercase">Hasil Tidak Ditemukan</h3>
                <p className="text-muted-foreground">Maaf, kami tidak menemukan produk yang sesuai dengan kriteria Anda.</p>
              </div>
              <Button variant="outline" onClick={() => { setSearchQuery(""); setSearchParams({}); }}>RESET FILTER</Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
