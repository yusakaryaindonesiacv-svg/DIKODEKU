import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/src/lib/supabase";
import { useAuth } from "@/src/AuthProvider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Download, 
  Clock, 
  Code, 
  Settings, 
  User as UserIcon, 
  History, 
  ExternalLink,
  ChevronRight,
  Package,
  CreditCard,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { motion } from "motion/react";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function Dashboard() {
  const { user, profile, signOut, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  
  const [transactions, setTransactions] = useState<any[]>([]);
  const [purchasedProducts, setPurchasedProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    if (!user) return;
    setRefreshing(true);
    
    const [txRes, productsRes] = await Promise.all([
      supabase
        .from("transactions")
        .select("*, products(name, thumbnail_url)")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false }),
      supabase
        .from("transactions")
        .select("*, products(*)")
        .eq("user_id", user.id)
        .eq("status", "completed")
    ]);

    if (txRes.data) setTransactions(txRes.data);
    if (productsRes.data) {
      // Unique products only
      const unique = Array.from(new Set(productsRes.data.map(p => p.product_id)))
        .map(id => productsRes.data?.find((p: any) => p.product_id === id)?.products);
      setPurchasedProducts(unique.filter(p => p !== null));
    }
    setRefreshing(false);
    setLoading(false);
  };

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth");
    if (user) fetchData();
  }, [user, authLoading]);

  if (authLoading || loading) return (
    <div className="container mx-auto px-4 py-20 flex justify-center">
      <div className="animate-spin h-10 w-10 border-4 border-primary border-t-transparent rounded-full"></div>
    </div>
  );

  return (
    <div className="container mx-auto px-4 py-12 space-y-12">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex items-center gap-6">
          <div className="h-20 w-20 rounded-3xl border-2 border-primary bg-muted overflow-hidden">
            {profile?.avatar_url ? (
               <img src={profile.avatar_url || undefined} alt="Profile" className="h-full w-full object-cover" />
            ) : (
               <div className="h-full w-full flex items-center justify-center text-primary bg-primary/10">
                  <UserIcon className="h-10 w-10" />
               </div>
            )}
          </div>
          <div>
            <h1 className="text-3xl font-tech font-bold uppercase tracking-tighter">{profile?.full_name || "Code Explorer"}</h1>
            <p className="text-muted-foreground flex items-center gap-2">
              <span className="font-mono text-sm">{user?.email}</span>
              <Badge variant="outline" className="text-[10px] font-tech py-0 border-primary/20 text-primary">MEMBER ELIT</Badge>
            </p>
          </div>
        </div>
        <div className="flex gap-2">
            <Button variant="outline" size="sm" className="gap-2 font-tech text-[10px]" onClick={fetchData} disabled={refreshing}>
              <History className={`h-3 w-3 ${refreshing ? 'animate-spin' : ''}`} /> REFRESH DATA
            </Button>
            <Button variant="outline" className="gap-2 font-tech text-xs" render={<Link to="/settings" />}>
              <Settings className="h-4 w-4" /> PENGATURAN AKUN
            </Button>
           <Button variant="destructive" className="gap-2 font-tech text-xs" onClick={signOut}>
             <span className="opacity-0 w-0 md:opacity-100 md:w-auto">KELUAR</span>
           </Button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Stat Cards */}
        <div className="col-span-1 md:col-span-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
           <Card className="bg-card/50 border-border p-4 flex flex-col gap-1">
              <span className="text-[10px] font-tech text-muted-foreground uppercase tracking-widest">Total Belanja</span>
              <span className="text-xl md:text-2xl font-tech font-bold">Rp {transactions.reduce((acc, tx) => tx.status === 'completed' ? acc + tx.amount : acc, 0).toLocaleString('id-ID')}</span>
           </Card>
           <Card className="bg-card/50 border-border p-4 flex flex-col gap-1">
              <span className="text-[10px] font-tech text-muted-foreground uppercase tracking-widest">Koleksi Produk</span>
              <span className="text-2xl font-tech font-bold">{purchasedProducts.length} <span className="text-xs text-muted-foreground">Items</span></span>
           </Card>
           <Card className="bg-card/50 border-border p-4 flex flex-col gap-1">
              <span className="text-[10px] font-tech text-muted-foreground uppercase tracking-widest">Reviews Diberikan</span>
              <span className="text-2xl font-tech font-bold">0</span>
           </Card>
           <Card className="bg-card/50 border-border p-4 flex flex-col gap-1">
              <span className="text-[10px] font-tech text-muted-foreground uppercase tracking-widest">Saldo Akun</span>
              <span className="text-2xl font-tech font-bold">Rp 0</span>
           </Card>
        </div>

        {/* Main Dashboard Tabs */}
        <div className="md:col-span-4 overflow-hidden">
          <Tabs defaultValue="downloads" className="w-full">
            <TabsList className="bg-transparent border-b border-border w-full justify-start rounded-none h-auto gap-4 md:gap-8 px-0 overflow-x-auto overflow-y-hidden no-scrollbar">
               <TabsTrigger value="downloads" className="px-0 py-4 font-tech tracking-wider uppercase text-[10px] md:text-xs rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary whitespace-nowrap">UNDUHAN SAYA</TabsTrigger>
               <TabsTrigger value="history" className="px-0 py-4 font-tech tracking-wider uppercase text-[10px] md:text-xs rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary whitespace-nowrap">RIWAYAT TRANSAKSI</TabsTrigger>
               <TabsTrigger value="wishlist" className="px-0 py-4 font-tech tracking-wider uppercase text-[10px] md:text-xs rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary whitespace-nowrap">WISHLIST</TabsTrigger>
            </TabsList>

            <div className="py-8">
              <TabsContent value="downloads" className="mt-0 space-y-6">
                {purchasedProducts.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {purchasedProducts.map((p) => (
                      <Card key={p.id} className="code-card overflow-hidden group">
                         <div className="aspect-video relative overflow-hidden bg-muted">
                            <img src={p.thumbnail_url || undefined} alt={p.name} className="h-full w-full object-cover" />
                            <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                               <Button variant="default" className="gap-2 font-tech" render={<a href={p.download_url} target="_blank" rel="noopener noreferrer" />}>
                                  <Download className="h-4 w-4" /> DOWNLOAD ZIP
                               </Button>
                            </div>
                         </div>
                         <CardContent className="p-4 flex flex-col gap-2">
                             <h4 className="font-bold text-sm line-clamp-1">{p.name}</h4>
                             <div className="flex items-center justify-between text-[10px] text-muted-foreground font-tech uppercase tracking-widest">
                                <span>Versi 1.2.0</span>
                                <Link to={`/product/${p.slug}`} className="hover:text-primary">Lihat Produk</Link>
                             </div>
                         </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="py-20 text-center border-2 border-dashed border-border rounded-[3rem] bg-card/10 space-y-4">
                     <Package className="h-10 w-10 text-muted-foreground mx-auto opacity-20" />
                     <div className="space-y-1">
                        <h3 className="font-bold font-tech uppercase">Koleksi Masih Kosong</h3>
                        <p className="text-muted-foreground text-sm">Anda belum membeli produk apapun. Mulai kembangkan proyek Anda dengan koleksi kami.</p>
                     </div>
                     <Button render={<Link to="/explore" />}>BELANJA SEKARANG</Button>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="history" className="mt-0">
                 <div className="border border-border rounded-2xl overflow-x-auto bg-card/20 no-scrollbar">
                   <div className="min-w-[800px]">
                     <Table>
                        <TableHeader className="bg-muted/50">
                        <TableRow className="hover:bg-transparent border-border">
                          <TableHead className="font-tech uppercase text-[10px] py-4">Transaction ID</TableHead>
                          <TableHead className="font-tech uppercase text-[10px] py-4">Product</TableHead>
                          <TableHead className="font-tech uppercase text-[10px] py-4">Date</TableHead>
                          <TableHead className="font-tech uppercase text-[10px] py-4">Amount</TableHead>
                          <TableHead className="font-tech uppercase text-[10px] py-4">Status</TableHead>
                          <TableHead className="font-tech uppercase text-[10px] py-4 text-right">Action</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {transactions.map((tx) => (
                           <TableRow key={tx.id} className="border-border hover:bg-muted/20">
                              <TableCell className="font-mono text-xs">{tx.order_id}</TableCell>
                              <TableCell>
                                <span className="text-sm font-medium line-clamp-1">{tx.products?.name}</span>
                              </TableCell>
                              <TableCell className="text-xs text-muted-foreground">{new Date(tx.created_at).toLocaleDateString()}</TableCell>
                              <TableCell className="font-tech text-sm">Rp {tx.amount.toLocaleString('id-ID')}</TableCell>
                              <TableCell>
                                {tx.status === 'completed' ? (
                                  <Badge className="bg-green-500/10 text-green-500 hover:bg-green-500/10 border-green-500/20 font-tech text-[9px] uppercase">BERHASIL</Badge>
                                ) : tx.status === 'pending' ? (
                                  <Badge className="bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/10 border-yellow-500/20 font-tech text-[9px] uppercase">MENUNGGU</Badge>
                                ) : (
                                  <Badge className="bg-red-500/10 text-red-500 hover:bg-red-500/10 border-red-500/20 font-tech text-[9px] uppercase">DIBATALKAN</Badge>
                                )}
                              </TableCell>
                              <TableCell className="text-right">
                                 {tx.status === 'pending' ? (
                                   <Button variant="ghost" size="sm" className="h-8 text-primary font-tech text-[10px]" render={<Link to={`/checkout/${tx.product_id}`} />}>
                                      BAYAR SEKARANG
                                   </Button>
                                 ) : (
                                   <Button variant="ghost" size="sm" className="h-8 font-tech text-[10px]">INVOICE</Button>
                                 )}
                              </TableCell>
                           </TableRow>
                        ))}
                        {transactions.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={6} className="text-center py-20 text-muted-foreground italic">Anda belum memiliki riwayat transaksi.</TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                   </Table>
                 </div>
               </div>
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
