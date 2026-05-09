import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/src/lib/supabase";
import { useAuth } from "@/src/AuthProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Upload, FileText, Globe, Tag, DollarSign, Package, Check, Loader2, Terminal } from "lucide-react";
import { toast } from "sonner";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';

export default function AdminAddProduct() {
  const { isAdmin, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [uploadingThumbnail, setUploadingThumbnail] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    price: "", // Original Price (Harga Coret)
    sale_price: "", // Selling Price
    category_id: "",
    thumbnail_url: "",
    download_url: "",
    preview_url: "",
    demo_access: "",
    description: "",
  });

  const [previewMode, setPreviewMode] = useState(false);
  const [downloadMethod, setDownloadMethod] = useState<'upload' | 'url'>('upload');

  useEffect(() => {
    if (!authLoading && !isAdmin) {
      toast.error("Akses tidak diizinkan");
      navigate("/");
    }
    fetchCategories();
  }, [isAdmin, authLoading]);

  async function fetchCategories() {
    const { data } = await supabase.from("categories").select("*").order("name");
    if (data) setCategories(data);
  }

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

      // We assume a 'products' bucket exists
      const { error: uploadError } = await supabase.storage
        .from('products')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('products')
        .getPublicUrl(filePath);

      setFormData(prev => ({
        ...prev,
        [isThumbnail ? 'thumbnail_url' : 'download_url']: publicUrl
      }));

      toast.success(`${isThumbnail ? 'Thumbnail' : 'File'} berhasil diunggah!`);
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error(`Gagal mengunggah ${isThumbnail ? 'Thumbnail' : 'File'}: ${error.message}. Pastikan bucket 'products' sudah dibuat di Supabase Storage.`);
    } finally {
      if (isThumbnail) setUploadingThumbnail(false);
      else setUploadingFile(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.thumbnail_url || !formData.download_url) {
      toast.error("Thumbnail dan File Produk wajib diunggah!");
      return;
    }

    setLoading(true);
    try {
      const slug = formData.name.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');
      
      const { error } = await supabase.from("products").insert([{
        ...formData,
        slug,
        price: parseFloat(formData.price) || 0,
        sale_price: formData.sale_price ? parseFloat(formData.sale_price) : null,
      }]);

      if (error) throw error;
      
      toast.success("Produk berhasil diterbitkan!");
      navigate("/admin");
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) return null;

  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <Button 
        variant="ghost" 
        className="mb-8 gap-2 font-tech text-xs" 
        onClick={() => navigate("/admin")}
      >
        <ArrowLeft className="h-4 w-4" /> KEMBALI KE PANEL ADMIN
      </Button>

      <div className="space-y-8">
        <div>
          <h1 className="text-4xl font-tech font-bold uppercase tracking-tighter">Tambah <span className="text-primary">Produk Baru</span></h1>
          <p className="text-muted-foreground">Isi manifest produk untuk diunggah ke jaringan DIKODEKU.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Informasi Dasar */}
          <Card className="code-card">
            <CardHeader>
              <CardTitle className="font-tech text-sm uppercase flex items-center gap-2">
                <Tag className="h-4 w-4 text-primary" /> Informasi Dasar
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2 col-span-full">
                <Label>Nama Produk</Label>
                <Input 
                  placeholder="Misal: Website Portofolio Clean" 
                  value={formData.name || ""}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Kategori</Label>
                <select 
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={formData.category_id || ""}
                  onChange={e => setFormData({...formData, category_id: e.target.value})}
                  required
                >
                  <option value="">Pilih Kategori</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <Label>Link Demo (Live Preview)</Label>
                <div className="relative">
                  <Globe className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input 
                    className="pl-9" 
                    placeholder="https://demo.anda.com" 
                    value={formData.preview_url || ""}
                    onChange={e => setFormData({...formData, preview_url: e.target.value})}
                  />
                </div>
              </div>
              <div className="space-y-2 col-span-full">
                <Label className="flex items-center gap-2">
                  <Terminal className="h-4 w-4 text-primary" /> Akses Demo (Username/Password/Instruksi)
                </Label>
                <textarea 
                  className="w-full min-h-[80px] bg-background border border-border rounded-lg p-3 font-mono text-xs focus:ring-1 focus:ring-primary/50 focus:outline-none"
                  placeholder="Contoh: Username: admin, Password: admin123"
                  value={formData.demo_access || ""}
                  onChange={e => setFormData({...formData, demo_access: e.target.value})}
                />
              </div>
            </CardContent>
          </Card>

          {/* Harga & Penawaran */}
          <Card className="code-card">
            <CardHeader>
              <CardTitle className="font-tech text-sm uppercase flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-primary" /> Harga & Penawaran
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>Harga Asli (Harga Coret)</Label>
                <Input 
                  type="number" 
                  placeholder="Misal: 150000" 
                  value={formData.price || ""}
                  onChange={e => setFormData({...formData, price: e.target.value})}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Harga Diskon / Jual (Opsional)</Label>
                <Input 
                  type="number" 
                  placeholder="Misal: 99000" 
                  value={formData.sale_price || ""}
                  onChange={e => setFormData({...formData, sale_price: e.target.value})}
                />
              </div>
              <p className="text-[10px] text-muted-foreground col-span-full italic">
                *Jika Harga Diskon diisi, maka Harga Asli akan ditampilkan dengan coretan (strikethrough).
              </p>
            </CardContent>
          </Card>

          {/* Media & Files */}
          <Card className="code-card">
            <CardHeader>
              <CardTitle className="font-tech text-sm uppercase flex items-center gap-2">
                <Package className="h-4 w-4 text-primary" /> Media & Unduhan
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Thumbnail Upload */}
              <div className="space-y-4">
                <Label>Thumbnail Produk (Gambar)</Label>
                <div className="relative aspect-video rounded-xl border-2 border-dashed border-border overflow-hidden flex items-center justify-center bg-muted/20">
                  {formData.thumbnail_url ? (
                    <>
                      <img src={formData.thumbnail_url} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none text-white text-[10px] font-tech uppercase">GANTI GAMBAR</div>
                    </>
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-muted-foreground text-xs font-tech">
                      {uploadingThumbnail ? <Loader2 className="h-6 w-6 animate-spin text-primary" /> : <Upload className="h-6 w-6" />}
                      <span>UPLOAD IMAGE</span>
                    </div>
                  )}
                  <input 
                    type="file" 
                    accept="image/*" 
                    className="absolute inset-0 opacity-0 cursor-pointer" 
                    onChange={(e) => handleFileUpload(e, 'thumbnail')}
                    disabled={uploadingThumbnail}
                  />
                </div>
                {formData.thumbnail_url && (
                   <div className="flex items-center gap-2 text-[10px] text-green-500 font-tech">
                      <Check className="h-3 w-3" /> THUMBNAIL READY
                   </div>
                )}
              </div>

              {/* File Upload / Link */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>File Produk / Source Code</Label>
                  <div className="flex bg-muted p-0.5 rounded-md scale-90 origin-right">
                    <button 
                      type="button"
                      onClick={() => setDownloadMethod('upload')}
                      className={`px-2 py-1 text-[9px] font-tech rounded-sm transition-all ${downloadMethod === 'upload' ? 'bg-background shadow-sm text-primary' : 'text-muted-foreground'}`}
                    >
                      UPLOAD
                    </button>
                    <button 
                      type="button"
                      onClick={() => setDownloadMethod('url')}
                      className={`px-2 py-1 text-[9px] font-tech rounded-sm transition-all ${downloadMethod === 'url' ? 'bg-background shadow-sm text-primary' : 'text-muted-foreground'}`}
                    >
                      LINK URL
                    </button>
                  </div>
                </div>

                {downloadMethod === 'upload' ? (
                  <div className="h-full min-h-[140px] rounded-xl border border-border bg-card/50 flex flex-col items-center justify-center p-6 text-center space-y-4 relative overflow-hidden group">
                    {formData.download_url ? (
                      <div className="space-y-3">
                        <div className="h-12 w-12 rounded-full bg-green-500/10 flex items-center justify-center mx-auto text-green-500">
                          <Check className="h-6 w-6" />
                        </div>
                        <p className="text-xs font-tech uppercase truncate max-w-[200px]">
                          {formData.download_url.split('/').pop()?.substring(0, 20)}...
                        </p>
                      </div>
                    ) : (
                      <>
                        <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                          {uploadingFile ? <Loader2 className="h-6 w-6 animate-spin" /> : <Package className="h-6 w-6" />}
                        </div>
                        <p className="text-xs font-tech uppercase text-muted-foreground">UPLOAD ZIP / SOURCE CODE</p>
                      </>
                    )}
                    <input 
                      type="file" 
                      className="absolute inset-0 opacity-0 cursor-pointer" 
                      onChange={(e) => handleFileUpload(e, 'document')}
                      disabled={uploadingFile}
                    />
                  </div>
                ) : (
                  <div className="space-y-4 h-full min-h-[140px] flex flex-col justify-center">
                    <div className="relative">
                      <Globe className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input 
                        className="pl-9 h-12" 
                        placeholder="https://gdrive.com/file-anda" 
                        value={formData.download_url || ""}
                        onChange={e => setFormData({...formData, download_url: e.target.value})}
                      />
                    </div>
                    <p className="text-[10px] text-muted-foreground italic">
                      *Masukkan link Google Drive, Dropbox, atau server private Anda.
                    </p>
                  </div>
                )}
                
                {formData.download_url && (
                   <div className="flex items-center gap-2 text-[10px] text-green-500 font-tech">
                      <Check className="h-3 w-3" /> {downloadMethod === 'upload' ? 'DOWNLOAD LINK GENERATED' : 'EXTERNAL LINK ADDED'}
                   </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Deskripsi */}
          <Card className="code-card">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="font-tech text-sm uppercase flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" /> Deskripsi Produk
              </CardTitle>
              <div className="flex bg-muted p-1 rounded-lg">
                <button 
                  type="button"
                  onClick={() => setPreviewMode(false)}
                  className={`px-3 py-1 text-[10px] font-tech rounded-md transition-all ${!previewMode ? 'bg-background shadow-sm text-primary' : 'text-muted-foreground'}`}
                >
                  EDITOR
                </button>
                <button 
                  type="button"
                  onClick={() => setPreviewMode(true)}
                  className={`px-3 py-1 text-[10px] font-tech rounded-md transition-all ${previewMode ? 'bg-background shadow-sm text-primary' : 'text-muted-foreground'}`}
                >
                  PREVIEW
                </button>
              </div>
            </CardHeader>
            <CardContent>
              {previewMode ? (
                <div className="prose prose-invert prose-sm max-w-none border border-border rounded-lg p-4 min-h-[200px] bg-background/50 overflow-x-hidden break-words [word-break:break-word] prose-p:mb-4 prose-ul:list-disc prose-ul:pl-5 prose-ol:list-decimal prose-ol:pl-5">
                  <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]}>{formData.description || "Tulis deskripsi untuk melihat pratinjau..."}</ReactMarkdown>
                </div>
              ) : (
                <textarea 
                  className="w-full min-h-[250px] bg-background border border-border rounded-lg p-4 font-mono text-sm focus:ring-2 focus:ring-primary/20 focus:outline-none resize-y"
                  placeholder="Gunakan Markdown untuk hasil yang rapi. 
Contoh:
## Fitur
- Modern UI
- Responsive Design

## Cara Penggunaan
1. Extract file zip
2. Jalankan npm install"
                  value={formData.description || ""}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                  required
                />
              )}
              <p className="text-[10px] text-muted-foreground mt-2">Dukungan Markdown: gunakan # untuk header, - untuk list, **bold** untuk tebal.</p>
            </CardContent>
          </Card>

          <Button 
            type="submit" 
            className="w-full h-16 font-tech font-bold text-lg" 
            disabled={loading || uploadingThumbnail || uploadingFile}
          >
            {loading ? (
               <>
                 <Loader2 className="mr-2 h-5 w-5 animate-spin" /> MENERBITKAN PRODUK...
               </>
            ) : "TERBITKAN PRODUK KE ETALASE"}
          </Button>
        </form>
      </div>
    </div>
  );
}
