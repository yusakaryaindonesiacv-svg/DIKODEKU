import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/src/lib/supabase";
import { useAuth } from "@/src/AuthProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Trash2, Edit2, LayoutDashboard, Package, ShoppingCart, Settings, Users, Link as LinkIcon, Save, Image as ImageIcon, Terminal, Upload, Loader2, X, Check, Globe, FileText, DollarSign, Tag, Info } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';

export default function AdminPage() {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("products");
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [usersList, setUsersList] = useState<any[]>([]);
  
  // Edit states
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [isEditProductOpen, setIsEditProductOpen] = useState(false);
  const [isEditCategoryOpen, setIsEditCategoryOpen] = useState(false);
  const [uploadingThumbnail, setUploadingThumbnail] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);

  const [settings, setSettings] = useState<any>({
    site_name: "DIKODEKU",
    site_logo: "",
    contact_email: "",
    payment_project_slug: "",
    payment_api_key: "",
    global_discount: 0,
    support_whatsapp: ""
  });
  const [loading, setLoading] = useState(true);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  // Form states
  const [newProduct, setNewProduct] = useState({
    name: "",
    price: 0,
    category_id: "",
    thumbnail_url: "",
    download_url: "",
    preview_url: "",
    demo_access: "",
    description: "",
  });
  
  const [newCategory, setNewCategory] = useState({ name: "", icon: "Code" });

  const webhookUrl = typeof window !== 'undefined' ? `${window.location.origin}/api/pakasir/webhook` : '';

  useEffect(() => {
    if (!authLoading && !isAdmin) {
      toast.error("Akses tidak diizinkan");
      navigate("/");
    }
    
    if (isAdmin) fetchData();
  }, [isAdmin, authLoading]);

  async function fetchData() {
    setLoading(true);
    try {
      const [pRes, cRes, tRes, sRes, uRes] = await Promise.all([
        supabase.from("products").select("*, categories(*)").order("created_at", { ascending: false }),
        supabase.from("categories").select("*").order("name"),
        supabase.from("transactions").select("*, products(name), profiles(full_name, avatar_url)").order("created_at", { ascending: false }),
        supabase.from("settings").select("*").single(),
        supabase.from("profiles").select("*").order("created_at", { ascending: false })
      ]);

      if (pRes.data) setProducts(pRes.data);
      if (cRes.data) setCategories(cRes.data);
      if (tRes.data) setTransactions(tRes.data);
      if (sRes.data) setSettings(sRes.data);
      if (uRes.data) setUsersList(uRes.data);
    } catch (error) {
      console.error("Error fetching admin data:", error);
    } finally {
      setLoading(false);
    }
  }

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const slug = newProduct.name.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');
      const { error } = await supabase.from("products").insert([{ ...newProduct, slug }]);
      if (error) throw error;
      toast.success("Produk berhasil ditambahkan!");
      fetchData();
      setNewProduct({ name: "", price: 0, category_id: "", thumbnail_url: "", download_url: "", preview_url: "", demo_access: "", description: "" });
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const slug = newCategory.name.toLowerCase().replace(/ /g, '-');
      const { error } = await supabase.from("categories").insert([{ ...newCategory, slug }]);
      if (error) throw error;
      toast.success("Kategori berhasil ditambahkan!");
      fetchData();
      setNewCategory({ name: "", icon: "Code" });
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleToggleAdmin = async (userId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase.from("profiles").update({ is_admin: !currentStatus }).eq("id", userId);
      if (error) throw error;
      toast.success("Status admin diperbarui!");
      fetchData();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleUpdateSettings = async () => {
    try {
      const { error } = await supabase.from("settings").upsert({ ...settings, id: 1 });
      if (error) throw error;
      toast.success("Konfigurasi berhasil disimpan!");
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingLogo(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `logo-${Date.now()}.${fileExt}`;
      const filePath = `logos/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('products')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('products')
        .getPublicUrl(filePath);

      setSettings({ ...settings, site_logo: publicUrl });
      toast.success("Logo berhasil diunggah! Klik 'Simpan Perubahan Sistem' untuk menerapkan.");
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error("Gagal mengunggah logo: " + error.message);
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleDeleteProduct = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm("Apakah Anda yakin ingin menghapus produk ini?")) return;
    try {
      const { error } = await supabase.from("products").delete().eq("id", id);
      if (error) throw error;
      toast.success("Produk berhasil dihapus");
      await fetchData();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleDeleteCategory = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm("Apakah Anda yakin ingin menghapus kategori ini? Semua produk yang menggunakan kategori ini mungkin terpengaruh.")) return;
    try {
      const { error } = await supabase.from("categories").delete().eq("id", id);
      if (error) throw error;
      toast.success("Kategori berhasil dihapus");
      await fetchData();
    } catch (error: any) {
      toast.error("Gagal menghapus kategori. Pastikan tidak ada produk yang menggunakan kategori ini.");
    }
  };

  const handleEditProduct = (product: any) => {
    setEditingProduct({ ...product });
    setIsEditProductOpen(true);
  };

  const handleEditCategory = (category: any) => {
    setEditingCategory({ ...category });
    setIsEditCategoryOpen(true);
  };

  const handleUpdateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { categories, _preview, ...updateData } = editingProduct;
      const { error } = await supabase.from("products").update(updateData).eq("id", editingProduct.id);
      if (error) throw error;
      toast.success("Produk berhasil diperbarui!");
      setIsEditProductOpen(false);
      fetchData();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { error } = await supabase.from("categories").update({
        name: editingCategory.name,
        icon: editingCategory.icon
      }).eq("id", editingCategory.id);
      if (error) throw error;
      toast.success("Kategori berhasil diperbarui!");
      setIsEditCategoryOpen(false);
      fetchData();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'thumbnail' | 'document') => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isThumbnail = type === 'thumbnail';
    if (isThumbnail) setUploadingThumbnail(true);
    else setUploadingFile(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
      const filePath = isThumbnail ? `thumbnails/${fileName}` : `files/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('products')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('products')
        .getPublicUrl(filePath);

      setEditingProduct((prev: any) => ({
        ...prev,
        [isThumbnail ? 'thumbnail_url' : 'download_url']: publicUrl
      }));

      toast.success(`${isThumbnail ? 'Thumbnail' : 'File'} berhasil diunggah!`);
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error(`Gagal mengunggah ${isThumbnail ? 'Thumbnail' : 'File'}: ${error.message}`);
    } finally {
      if (isThumbnail) setUploadingThumbnail(false);
      else setUploadingFile(false);
    }
  };

  if (authLoading || loading) return (
    <div className="flex flex-col items-center justify-center h-screen gap-4">
      <div className="animate-spin h-10 w-10 border-4 border-primary border-t-transparent rounded-full"></div>
      <p className="font-tech text-xs uppercase animate-pulse">Menghubungkan ke pusat data...</p>
    </div>
  );

  return (
    <div className="container mx-auto px-4 py-12 space-y-10">
      {/* Edit Product Dialog */}
      <Dialog open={isEditProductOpen} onOpenChange={setIsEditProductOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-tech uppercase">Edit Produk: <span className="text-primary">{editingProduct?.name}</span></DialogTitle>
            <DialogDescription>Perbarui detail produk ini untuk sinkronisasi di etalase.</DialogDescription>
          </DialogHeader>
          
          {editingProduct && (
            <form onSubmit={handleUpdateProduct} className="space-y-6 pt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4 col-span-full">
                  <Label>Nama Produk</Label>
                  <Input 
                    value={editingProduct.name} 
                    onChange={e => setEditingProduct({...editingProduct, name: e.target.value})}
                    required
                  />
                </div>
                
                <div className="space-y-4">
                  <Label>Kategori</Label>
                  <select 
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    value={editingProduct.category_id || ""}
                    onChange={e => setEditingProduct({...editingProduct, category_id: e.target.value})}
                    required
                  >
                    <option value="">Pilih Kategori</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>

                <div className="space-y-4">
                  <Label>Link Demo (Live Preview)</Label>
                  <Input 
                    value={editingProduct.preview_url || ""} 
                    onChange={e => setEditingProduct({...editingProduct, preview_url: e.target.value})}
                    placeholder="https://demo.example.com"
                  />
                </div>

                <div className="space-y-4 col-span-full">
                  <Label className="flex items-center gap-2">
                    <Terminal className="h-4 w-4 text-primary" /> Akses Demo
                  </Label>
                  <textarea 
                    className="w-full min-h-[80px] bg-background border border-border rounded-lg p-3 font-mono text-xs focus:ring-1 focus:ring-primary/50 focus:outline-none"
                    placeholder="Username: admin, Password: admin123"
                    value={editingProduct.demo_access || ""}
                    onChange={e => setEditingProduct({...editingProduct, demo_access: e.target.value})}
                  />
                </div>

                <div className="space-y-4">
                  <Label>Harga Asli</Label>
                  <Input 
                    type="number"
                    value={editingProduct.price} 
                    onChange={e => setEditingProduct({...editingProduct, price: Number(e.target.value)})}
                    required
                  />
                </div>

                <div className="space-y-4">
                  <Label>Harga Diskon (Opsional)</Label>
                  <Input 
                    type="number"
                    value={editingProduct.sale_price || ""} 
                    onChange={e => setEditingProduct({...editingProduct, sale_price: e.target.value ? Number(e.target.value) : null})}
                  />
                </div>

                <div className="space-y-4">
                  <Label>Thumbnail URL</Label>
                  <div className="flex gap-2">
                    <Input 
                      value={editingProduct.thumbnail_url || ""} 
                      onChange={e => setEditingProduct({...editingProduct, thumbnail_url: e.target.value})}
                    />
                    <div className="relative">
                      <Button variant="outline" size="icon" disabled={uploadingThumbnail} type="button">
                        {uploadingThumbnail ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                      </Button>
                      <input 
                        type="file" 
                        accept="image/*" 
                        className="absolute inset-0 opacity-0 cursor-pointer" 
                        onChange={e => handleFileUpload(e, 'thumbnail')}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <Label>Download URL / File</Label>
                  <div className="flex gap-2">
                    <Input 
                      value={editingProduct.download_url || ""} 
                      onChange={e => setEditingProduct({...editingProduct, download_url: e.target.value})}
                    />
                    <div className="relative">
                      <Button variant="outline" size="icon" disabled={uploadingFile} type="button">
                        {uploadingFile ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                      </Button>
                      <input 
                        type="file" 
                        className="absolute inset-0 opacity-0 cursor-pointer" 
                        onChange={e => handleFileUpload(e, 'document')}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4 col-span-full">
                  <div className="flex items-center justify-between">
                    <Label>Deskripsi (Markdown)</Label>
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="sm" 
                      className="h-7 text-[10px] font-tech"
                      onClick={() => setEditingProduct({ ...editingProduct, _preview: !editingProduct._preview })}
                    >
                      {editingProduct._preview ? "EDITOR" : "PREVIEW"}
                    </Button>
                  </div>
                  {editingProduct._preview ? (
                    <div className="prose prose-invert prose-sm max-w-none border border-border rounded-lg p-3 min-h-[150px] bg-background/50 overflow-x-hidden break-words [word-break:break-word] prose-p:mb-4 prose-ul:list-disc prose-ul:pl-5 prose-ol:list-decimal prose-ol:pl-5">
                      <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]}>{editingProduct.description || "Tulis deskripsi..."}</ReactMarkdown>
                    </div>
                  ) : (
                    <textarea 
                      className="w-full min-h-[150px] bg-background border border-border rounded-lg p-3 font-mono text-xs focus:ring-1 focus:ring-primary/50 focus:outline-none"
                      value={editingProduct.description || ""}
                      onChange={e => setEditingProduct({...editingProduct, description: e.target.value})}
                    />
                  )}
                </div>
              </div>

              <DialogFooter className="gap-2 sm:gap-0">
                <Button type="button" variant="ghost" onClick={() => setIsEditProductOpen(false)}>BATAL</Button>
                <Button type="submit" disabled={loading}>
                  {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  SIMPAN PERUBAHAN
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Category Dialog */}
      <Dialog open={isEditCategoryOpen} onOpenChange={setIsEditCategoryOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-tech uppercase">Edit Kategori</DialogTitle>
          </DialogHeader>
          
          {editingCategory && (
            <form onSubmit={handleUpdateCategory} className="space-y-6 pt-4">
              <div className="space-y-4">
                <Label>Nama Kategori</Label>
                <Input 
                  value={editingCategory.name} 
                  onChange={e => setEditingCategory({...editingCategory, name: e.target.value})}
                  required
                />
              </div>
              <div className="space-y-4">
                <Label>Icon Name (Lucide)</Label>
                <Input 
                  value={editingCategory.icon || ""} 
                  onChange={e => setEditingCategory({...editingCategory, icon: e.target.value})}
                />
              </div>
              <DialogFooter>
                <Button type="button" variant="ghost" onClick={() => setIsEditCategoryOpen(false)}>BATAL</Button>
                <Button type="submit">SIMPAN PERUBAHAN</Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      <header className="flex flex-col md:flex-row justify-between items-center gap-4 border-b border-border pb-8">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-primary flex items-center justify-center">
            <Terminal className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-3xl font-tech font-bold uppercase tracking-tighter">Orkestrasi <span className="text-primary">Sistem</span></h1>
            <p className="text-muted-foreground text-sm">Selamat datang kembali, Administrator. Status sistem: Nominal.</p>
          </div>
        </div>
        <div className="flex gap-4">
           <div className="flex items-center gap-2 px-4 py-2 border border-border rounded-xl bg-card">
              <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></span>
              <span className="text-[10px] font-tech uppercase font-bold">Encrypted Connection</span>
           </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar Nav */}
        <div className="col-span-1 space-y-1">
           <Button 
            variant={activeTab === 'products' ? 'secondary' : 'ghost'} 
            className="w-full justify-start gap-3 font-tech text-xs h-11" 
            onClick={() => setActiveTab('products')}
           >
             <Package className="h-4 w-4" /> PRODUK
           </Button>
           <Button 
            variant={activeTab === 'categories' ? 'secondary' : 'ghost'} 
            className="w-full justify-start gap-3 font-tech text-xs h-11" 
            onClick={() => setActiveTab('categories')}
           >
             <LayoutDashboard className="h-4 w-4" /> KATEGORI
           </Button>
           <Button 
            variant={activeTab === 'transactions' ? 'secondary' : 'ghost'} 
            className="w-full justify-start gap-3 font-tech text-xs h-11" 
            onClick={() => setActiveTab('transactions')}
           >
             <ShoppingCart className="h-4 w-4" /> TRANSAKSI
           </Button>
           <Button 
            variant={activeTab === 'users' ? 'secondary' : 'ghost'} 
            className="w-full justify-start gap-3 font-tech text-xs h-11" 
            onClick={() => setActiveTab('users')}
           >
             <Users className="h-4 w-4" /> PENGGUNA
           </Button>
           <Button 
            variant={activeTab === 'settings' ? 'secondary' : 'ghost'} 
            className="w-full justify-start gap-3 font-tech text-xs h-11" 
            onClick={() => setActiveTab('settings')}
           >
             <Settings className="h-4 w-4" /> KONFIGURASI
           </Button>
        </div>

        {/* Content Area */}
        <div className="lg:col-span-3">
          {!settings.payment_api_key && (
            <div className="mb-8 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Settings className="h-5 w-5 text-yellow-500 animate-spin" />
                <div>
                  <p className="text-sm font-tech font-bold text-yellow-500 uppercase">Sistem Pembayaran Belum Aktif</p>
                  <p className="text-[10px] text-muted-foreground uppercase">Anda perlu mengonfigurasi API Key Pakasir di tab Konfigurasi agar pelanggan dapat bertransaksi.</p>
                </div>
              </div>
              <Button size="sm" variant="outline" className="font-tech text-[10px] border-yellow-500/50 text-yellow-500 hover:bg-yellow-500/10" onClick={() => setActiveTab('settings')}>
                KONFIGURASI SEKARANG
              </Button>
            </div>
          )}

          {activeTab === 'products' && (
            <div className="space-y-8">
               <div className="flex justify-between items-center bg-card p-6 rounded-2xl border border-border shadow-xl">
                 <div>
                    <h2 className="text-xl font-tech font-bold uppercase">Inventaris Produk</h2>
                    <p className="text-muted-foreground text-xs">Kelola semua produk digital di etalase Anda.</p>
                 </div>
                 <Button className="font-tech gap-2" onClick={() => navigate("/admin/add-product")}>
                    <Plus className="h-4 w-4" /> TAMBAH PRODUK BARU
                 </Button>
               </div>

               <div className="border border-border rounded-2xl overflow-x-auto shadow-2xl no-scrollbar">
                 <div className="min-w-[700px]">
                   <Table>
                    <TableHeader className="bg-muted/50">
                       <TableRow className="border-border">
                          <TableHead className="font-tech text-[10px] uppercase">Produk</TableHead>
                          <TableHead className="font-tech text-[10px] uppercase">Kategori</TableHead>
                          <TableHead className="font-tech text-[10px] uppercase">Harga</TableHead>
                          <TableHead className="font-tech text-[10px] uppercase text-right">Aksi</TableHead>
                       </TableRow>
                    </TableHeader>
                    <TableBody>
                       {products.map(p => (
                         <TableRow key={p.id} className="border-border">
                            <TableCell className="font-medium">{p.name}</TableCell>
                            <TableCell><Badge variant="outline" className="text-[10px]">{p.categories?.name}</Badge></TableCell>
                            <TableCell className="font-mono text-xs">Rp {p.price.toLocaleString('id-ID')}</TableCell>
                            <TableCell className="text-right flex justify-end gap-2">
                               <Button 
                                 variant="ghost" 
                                 size="icon" 
                                 className="h-8 w-8 text-muted-foreground hover:text-primary"
                                 onClick={() => handleEditProduct(p)}
                               >
                                 <Edit2 className="h-4 w-4" />
                               </Button>
                               <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                onClick={(e) => handleDeleteProduct(p.id, e)}
                               >
                                 <Trash2 className="h-4 w-4" />
                               </Button>
                            </TableCell>
                         </TableRow>
                       ))}
                    </TableBody>
                   </Table>
                 </div>
               </div>
            </div>
          )}

          {activeTab === 'categories' && (
            <div className="space-y-8">
               <Card className="code-card">
                 <CardHeader>
                    <CardTitle className="font-tech uppercase text-sm">Kelola Kategori</CardTitle>
                 </CardHeader>
                 <CardContent>
                    <form onSubmit={handleAddCategory} className="flex gap-4">
                       <div className="flex-1 space-y-2">
                          <Label>Nama Kategori</Label>
                          <Input value={newCategory.name || ""} onChange={e => setNewCategory({...newCategory, name: e.target.value})} placeholder="e.g. Website" required />
                       </div>
                       <div className="space-y-2">
                          <Label>Icon Name</Label>
                          <Input value={newCategory.icon || ""} onChange={e => setNewCategory({...newCategory, icon: e.target.value})} placeholder="e.g. Layout" />
                       </div>
                       <Button type="submit" className="mt-8 font-tech"><Plus className="h-4 w-4 mr-2" /> TAMBAH</Button>
                    </form>
                 </CardContent>
               </Card>

               <div className="border border-border rounded-2xl overflow-x-auto no-scrollbar">
                 <div className="min-w-[600px]">
                   <Table>
                    <TableHeader className="bg-muted/50">
                       <TableRow className="border-border">
                          <TableHead className="font-tech text-[10px] uppercase">Nama Kategori</TableHead>
                          <TableHead className="font-tech text-[10px] uppercase">Slug</TableHead>
                          <TableHead className="font-tech text-[10px] uppercase text-right">Aksi</TableHead>
                       </TableRow>
                    </TableHeader>
                    <TableBody>
                       {categories.map(c => (
                         <TableRow key={c.id} className="border-border">
                            <TableCell className="font-medium">{c.name}</TableCell>
                            <TableCell className="font-mono text-xs text-muted-foreground">{c.slug}</TableCell>
                            <TableCell className="text-right flex justify-end gap-2">
                               <Button 
                                 variant="ghost" 
                                 size="icon" 
                                 className="h-8 w-8 text-muted-foreground hover:text-primary"
                                 onClick={() => handleEditCategory(c)}
                               >
                                 <Edit2 className="h-4 w-4" />
                               </Button>
                               <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8 text-destructive"
                                onClick={(e) => handleDeleteCategory(c.id, e)}
                               >
                                 <Trash2 className="h-4 w-4" />
                               </Button>
                            </TableCell>
                         </TableRow>
                       ))}
                    </TableBody>
                   </Table>
                 </div>
               </div>
            </div>
          )}

          {activeTab === 'transactions' && (
            <div className="border border-border rounded-2xl overflow-x-auto bg-card/20 no-scrollbar">
              <div className="min-w-[800px]">
                <Table>
                  <TableHeader className="bg-muted/50">
                    <TableRow className="border-border">
                      <TableHead className="font-tech text-[10px] uppercase">Order ID</TableHead>
                      <TableHead className="font-tech text-[10px] uppercase">Pelanggan</TableHead>
                      <TableHead className="font-tech text-[10px] uppercase">Produk</TableHead>
                      <TableHead className="font-tech text-[10px] uppercase">Metode</TableHead>
                      <TableHead className="font-tech text-[10px] uppercase">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.map(tx => (
                      <TableRow key={tx.id} className="border-border">
                        <TableCell className="font-mono text-xs">{tx.order_id}</TableCell>
                        <TableCell className="text-sm">{tx.profiles?.full_name || 'Pembeli Umum'}</TableCell>
                        <TableCell className="text-sm">{tx.products?.name}</TableCell>
                        <TableCell className="font-tech text-[10px] uppercase opacity-70">{tx.payment_method}</TableCell>
                        <TableCell>
                          <Badge className={tx.status === 'completed' ? 'bg-green-500/10 text-green-500' : 'bg-yellow-500/10 text-yellow-500'}>
                            {tx.status === 'completed' ? 'BERHASIL' : tx.status.toUpperCase()}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}

          {activeTab === 'users' && (
            <div className="border border-border rounded-2xl overflow-x-auto no-scrollbar">
              <div className="min-w-[600px]">
                <Table>
                  <TableHeader className="bg-muted/50">
                     <TableRow className="border-border">
                        <TableHead className="font-tech text-[10px] uppercase">User</TableHead>
                        <TableHead className="font-tech text-[10px] uppercase">Username</TableHead>
                        <TableHead className="font-tech text-[10px] uppercase">Peran</TableHead>
                        <TableHead className="font-tech text-[10px] uppercase text-right">Aksi</TableHead>
                     </TableRow>
                  </TableHeader>
                  <TableBody>
                     {usersList.map(u => (
                        <TableRow key={u.id} className="border-border">
                           <TableCell>
                              <div className="flex items-center gap-3">
                                 <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center overflow-hidden">
                                    {u.avatar_url ? <img src={u.avatar_url} /> : <Users className="h-4 w-4 text-primary" />}
                                 </div>
                                 <span className="text-sm font-medium">{u.full_name || 'Unknown'}</span>
                              </div>
                           </TableCell>
                           <TableCell className="font-mono text-xs">@{u.username || 'user'}</TableCell>
                           <TableCell>
                              {u.is_admin ? (
                                 <Badge className="bg-primary text-primary-foreground font-tech text-[9px]">ADMIN</Badge>
                              ) : (
                                 <Badge variant="outline" className="font-tech text-[9px]">MEMBER</Badge>
                              )}
                           </TableCell>
                           <TableCell className="text-right px-4">
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="font-tech text-[10px]"
                                onClick={() => handleToggleAdmin(u.id, u.is_admin)}
                              >
                                {u.is_admin ? "REVOKE ADMIN" : "MAKE ADMIN"}
                              </Button>
                           </TableCell>
                        </TableRow>
                     ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
             <div className="grid grid-cols-1 gap-6">
               <Card className="code-card">
                 <CardHeader>
                    <CardTitle className="font-tech uppercase text-sm">Konfigurasi Identitas</CardTitle>
                 </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                       <div className="space-y-2">
                          <Label>Nama Situs</Label>
                          <Input value={settings.site_name || ""} onChange={e => setSettings({...settings, site_name: e.target.value})} />
                       </div>
                       <div className="space-y-4">
                          <Label>Logo Website</Label>
                          <div className="flex flex-col gap-4">
                            <div className="h-16 w-16 rounded-xl border border-border bg-muted flex items-center justify-center overflow-hidden">
                              {settings.site_logo ? (
                                <img src={settings.site_logo} alt="Logo Preview" className="h-full w-full object-contain p-2" />
                              ) : (
                                <ImageIcon className="h-8 w-8 text-muted-foreground" />
                              )}
                            </div>
                            <div className="flex-1 space-y-2">
                               <div className="relative">
                                  <Button 
                                    variant="outline" 
                                    className="w-full font-tech text-[10px] gap-2 h-10 border-dashed"
                                    disabled={uploadingLogo}
                                    type="button"
                                  >
                                    {uploadingLogo ? <Loader2 className="h-3 w-3 animate-spin" /> : <Upload className="h-3 w-3" />}
                                    {uploadingLogo ? "MENGUNGGAH..." : "UNGGAH DARI LOKAL DRIVE"}
                                    <input 
                                      type="file" 
                                      accept="image/*" 
                                      className="absolute inset-0 opacity-0 cursor-pointer" 
                                      onChange={handleLogoUpload}
                                      disabled={uploadingLogo}
                                    />
                                  </Button>
                               </div>
                               <p className="text-[10px] text-muted-foreground italic">*Format: PNG, JPG, atau SVG. Ukuran ideal 1:1.</p>
                            </div>
                          </div>
                       </div>
                       <div className="space-y-2">
                          <Label>Email Kontak</Label>
                          <Input value={settings.contact_email || ""} onChange={e => setSettings({...settings, contact_email: e.target.value})} />
                       </div>
                       <div className="space-y-2">
                          <Label>Support WhatsApp</Label>
                          <Input value={settings.support_whatsapp || ""} onChange={e => setSettings({...settings, support_whatsapp: e.target.value})} placeholder="628123..." />
                       </div>
                    </div>
                 </CardContent>
               </Card>
 
               <Card className="code-card">
                 <CardHeader>
                    <CardTitle className="font-tech uppercase text-sm">Gerbang Pembayaran (PAKASIR)</CardTitle>
                 </CardHeader>
                 <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                       <div className="space-y-2">
                          <Label>Slug Proyek Pakasir</Label>
                          <Input value={settings.payment_project_slug || ""} onChange={e => setSettings({...settings, payment_project_slug: e.target.value})} placeholder="contoh: dikodeku-store" />
                       </div>
                       <div className="space-y-2">
                          <Label>API Key Pakasir</Label>
                          <Input type="password" value={settings.payment_api_key || ""} onChange={e => setSettings({...settings, payment_api_key: e.target.value})} />
                       </div>
                       <div className="space-y-2 col-span-full">
                          <Label className="flex items-center gap-2">
                            Webhook URL 
                            <Badge variant="outline" className="text-[9px] font-tech py-0 text-primary border-primary/20 bg-primary/5">COPY TO PAKASIR</Badge>
                          </Label>
                          <div className="flex gap-2">
                            <Input readOnly value={webhookUrl} className="bg-muted font-mono text-xs h-10 border-dashed" />
                            <Button 
                              variant="outline" 
                              className="font-tech text-[10px] gap-2 shrink-0"
                              onClick={() => {
                                navigator.clipboard.writeText(webhookUrl);
                                toast.success("Webhook URL disalin ke clipboard!");
                              }}
                            >
                              <LinkIcon className="h-3 w-3" /> SALIN URL
                            </Button>
                          </div>
                          <p className="text-[10px] text-muted-foreground italic">
                            *Masukkan URL ini ke kolom "Webhook URL" di dashboard Pakasir untuk notifikasi pembayaran otomatis.
                          </p>
                       </div>
                    </div>
                 </CardContent>
               </Card>
 
               <Card className="code-card border-accent/20">
                 <CardHeader>
                    <CardTitle className="font-tech uppercase text-sm flex items-center gap-2">
                       <ShoppingCart className="h-4 w-4 text-accent" /> Promosi & Diskon
                    </CardTitle>
                 </CardHeader>
                 <CardContent>
                    <div className="space-y-2 max-w-xs">
                       <Label>Diskon Global (%)</Label>
                       <Input 
                        type="number" 
                        min="0" 
                        max="100" 
                        value={settings.global_discount || 0} 
                        onChange={e => setSettings({...settings, global_discount: Number(e.target.value)})} 
                       />
                       <p className="text-[10px] text-muted-foreground">Potongan harga otomatis untuk semua produk.</p>
                    </div>
                 </CardContent>
               </Card>

               <Button className="w-full h-14 gap-2 font-tech text-lg" onClick={handleUpdateSettings}>
                  <Save className="h-5 w-5" /> SIMPAN PERUBAHAN SISTEM
               </Button>
             </div>
          )}
        </div>
      </div>
    </div>
  );
}
