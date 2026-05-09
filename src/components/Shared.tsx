import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ShoppingCart, Star, Code, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion } from "motion/react";

interface ProductCardProps {
  product: any;
  index: number;
  key?: any;
}

export function ProductCard({ product, index }: ProductCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <Card className="bento-card !p-0 overflow-hidden group border-border/50 hover:border-primary/50">
        <CardHeader className="p-0 h-32 md:h-44 relative overflow-hidden bg-muted">
          <img 
            src={product.thumbnail_url || undefined} 
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <Badge className="absolute top-3 left-3 bg-primary/90 text-primary-foreground font-mono text-[9px] border-none">
            {product.categories?.name || "SCRIPT"}
          </Badge>
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-4 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button size="sm" variant="secondary" className="w-full gap-2 border-border/50 bg-background/50 backdrop-blur-md rounded-lg" render={<Link to={`/product/${product.slug}`} />}>
              <Code className="h-3 w-3" /> Detail
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-3 md:p-4 space-y-2 md:space-y-3">
          <h3 className="font-bold text-sm tracking-tight line-clamp-1">{product.name}</h3>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-2">
              <div className="flex flex-wrap items-center gap-1">
                <span className="text-primary font-mono text-[11px] sm:text-sm font-bold">
                  Rp {product.sale_price ? product.sale_price.toLocaleString('id-ID') : product.price.toLocaleString('id-ID')}
                </span>
                {product.sale_price && (
                  <span className="text-[9px] sm:text-[10px] text-muted-foreground line-through opacity-50">
                     Rp {product.price.toLocaleString('id-ID')}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1 text-[9px] md:text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full w-fit">
                <Star className="h-2 w-2 fill-primary text-primary" />
                <span>{product.rating?.toFixed(1) || "5.0"}</span>
              </div>
            </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export function Footer() {
  return (
    <footer className="w-full border-t border-border mt-20 bg-background">
      <div className="container mx-auto px-4 py-12 flex flex-col items-center gap-10">
        <div className="flex flex-col md:flex-row items-center justify-between w-full gap-8">
           <div className="flex items-center gap-3">
            <div className="bg-primary w-8 h-8 rounded flex items-center justify-center">
              <span className="text-black font-black text-lg">D</span>
            </div>
            <h1 className="text-2xl font-mono tracking-tighter font-bold">DIKODEKU<span className="text-primary">_</span></h1>
          </div>
          
          <nav className="flex gap-8 text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
            <Link to="/explore" className="hover:text-primary transition-colors">Katalog</Link>
            <Link to="/dashboard" className="hover:text-primary transition-colors">Dashboard</Link>
            <Link to="/support" className="hover:text-primary transition-colors">Bantuan</Link>
            <Link to="/tos" className="hover:text-primary transition-colors">Legal</Link>
          </nav>
        </div>

        <div className="w-full flex flex-col md:flex-row justify-between items-center text-[10px] text-muted-foreground font-mono gap-4">
          <p>© 2024 DIKODEKU DIGITAL LTD // DIBANGUN OLEH SENIOR ARCHITECTS</p>
          <div className="flex space-x-6 uppercase tracking-tighter">
            <span>Status: <span className="text-primary">Operasional</span></span>
            <span>Wilayah: <span className="text-foreground">ID-JKT</span></span>
          </div>
        </div>
      </div>
    </footer>
  );
}
