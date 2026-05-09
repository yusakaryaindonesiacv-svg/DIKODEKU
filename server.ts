import express from "express";
import path from "path";
import axios from "axios";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import fs from "fs";

dotenv.config();

// Supabase Admin Client - Lazy initialized
let supabaseInstance: any = null;
function getSupabase() {
  if (!supabaseInstance) {
    // Collect all possible keys from environment
    const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    // Prefer Service Role Key for backend bypass, fall back to Anon
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY || 
                process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || 
                process.env.SUPABASE_ANON_KEY || 
                process.env.VITE_SUPABASE_ANON_KEY;

    if (!url || !key) {
      console.warn(`[Supabase] Backend initialization waiting for environment variables.`);
      return null;
    }
    try {
      supabaseInstance = createClient(url, key, {
        auth: { 
          persistSession: false,
          autoRefreshToken: false 
        }
      });
    } catch (e) {
      console.error("[Supabase] createClient Exception:", e);
      return null;
    }
  }
  return supabaseInstance;
}

// Pakasir Helper
async function getPakasirConfig(supabase: any) {
  const envKey = process.env.PAKASIR_API_KEY;
  const envSlug = process.env.PAKASIR_PROJECT_SLUG;

  if (envKey && envSlug) {
    return { payment_api_key: envKey, payment_project_slug: envSlug };
  }

  const { data: settings } = await supabase
    .from("settings")
    .select("payment_api_key, payment_project_slug")
    .single();

  return settings;
}

export async function createServer() {
  const app = express();

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Logging Middleware
  app.use((req, res, next) => {
    const isApi = req.path.startsWith('/api');
    if (isApi) {
      console.log(`[LOG DIKODEKU] ${req.method} ${req.path}`);
    }
    next();
  });

  // API ROUTES
  const apiRouter = express.Router();

  apiRouter.get("/health", (req, res) => {
    const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    const sKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
    const aKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
    
    res.json({ 
      status: "ok", 
      supabase: {
        hasUrl: !!url,
        hasServiceRole: !!sKey,
        hasAnonKey: !!aKey,
        initialized: !!getSupabase()
      },
      pakasir: {
        hasApiKey: !!process.env.PAKASIR_API_KEY,
        hasSlug: !!process.env.PAKASIR_PROJECT_SLUG
      },
      vercel: !!process.env.VERCEL,
      node_env: process.env.NODE_ENV,
      env_keys: Object.keys(process.env).filter(k => k.includes("SUPABASE") || k.includes("VITE") || k.includes("PAKASIR"))
    });
  });

  // Proxy: Create Transaction
  apiRouter.post("/pakasir/create", async (req, res) => {
    const { method, order_id, amount } = req.body;
    console.log(`[Proxy] Create: ${method} | ${order_id} | ${amount}`);

    if (!method || !order_id || !amount) {
      return res.status(400).json({ error: "Data pesanan tidak lengkap (method/id/amount)." });
    }

    try {
      const supabase = getSupabase();
      if (!supabase) {
        return res.status(500).json({ 
          error: "Konfigurasi Server Belum Siap", 
          details: "Supabase URL atau API Key belum terdeteksi di Environment Variables Vercel."
        });
      }

      // 1. Get Payment Settings
      let settings;
      try {
        settings = await getPakasirConfig(supabase);
      } catch (configErr: any) {
        console.error("[Config Error]:", configErr);
        return res.status(500).json({ error: "Gagal mengambil konfigurasi pembayaran", details: configErr.message });
      }
      
      if (!settings?.payment_api_key || !settings?.payment_project_slug) {
        console.warn("[PAKASIR] Missing keys:", settings);
        return res.status(500).json({ 
          error: "Pengaturan Pembayaran Belum Lengkap",
          details: "Pastikan 'PAKASIR_PROJECT_SLUG' dan 'PAKASIR_API_KEY' sudah diatur di Environment Variables atau Tabel Settings."
        });
      }

      // 2. Request Tranksaksi dari Pakasir (Dokumentasi C.2)
      const pakasirUrl = `https://app.pakasir.com/api/transactioncreate/${method}`;
      const payload = {
        project: settings.payment_project_slug,
        order_id,
        amount: Math.round(Number(amount)),
        api_key: settings.payment_api_key
      };

      console.log(`[PAKASIR REQ] ${pakasirUrl}`, JSON.stringify(payload));
      
      try {
        const response = await axios.post(pakasirUrl, payload, { timeout: 8000 });

        console.log(`[DIKODEKU -> PAKASIR] Transaksi ${order_id} dibuat:`, response.data);
        return res.json(response.data);
      } catch (pakasirError: any) {
        const errorData = pakasirError.response?.data;
        console.error("[ERROR API PAKASIR]:", errorData || pakasirError.message);
        
        // Tangani "already exists" dengan cek status (Dokumentasi E)
        if (errorData?.message?.toLowerCase().includes("exists") || errorData?.message?.toLowerCase().includes("already")) {
          const verifyUrl = `https://app.pakasir.com/api/transactiondetail?project=${settings.payment_project_slug}&amount=${amount}&order_id=${encodeURIComponent(order_id)}&api_key=${settings.payment_api_key}`;
          const verifyRes = await axios.get(verifyUrl);
          
          if (verifyRes.data?.transaction?.status === "completed") {
            await supabase.from("transactions").update({ 
               status: "completed", 
               completed_at: verifyRes.data?.transaction?.completed_at || new Date().toISOString() 
            }).eq("order_id", order_id);
            
            return res.json({ 
              status: "success", 
              already_completed: true, 
              message: "Transaksi ini sudah dibayar." 
            });
          } else {
            // Jika status masih pending di Pakasir, ambil data pembayaran (QR/VA) dari DB lokal kita
            const { data: localTx } = await supabase
              .from("transactions")
              .select("payment_number, payment_method, amount")
              .eq("order_id", order_id)
              .single();
            
            if (localTx?.payment_number) {
              return res.json({
                payment: {
                  order_id,
                  amount: localTx.amount || amount,
                  fee: 0,
                  total_payment: localTx.amount || amount,
                  payment_number: localTx.payment_number,
                  payment_method: localTx.payment_method,
                  expired_at: new Date(Date.now() + 3600000).toISOString() // Estimasi 1 jam
                },
                message: "Melanjutkan transaksi yang sudah ada."
              });
            }
          }
        }
        
        return res.status(500).json({ 
          error: "Gagal menghubungkan ke Pakasir",
          details: errorData?.message || "Cek Project Slug dan API Key Anda di Admin."
        });
      }
    } catch (error: any) {
      console.error("[Proxy] Unexpected Error:", error);
      return res.status(500).json({ error: "Internal Server Error", details: error.message });
    }
  });

  // Endpoint Verifikasi Manual
  apiRouter.post("/pakasir/verify", async (req, res) => {
    const { order_id, amount } = req.body;
    if (!order_id || !amount) return res.status(400).json({ error: "Data tidak lengkap." });

    try {
      const supabase = getSupabase();
      if (!supabase) return res.status(500).json({ error: "Database tidak tersedia" });

      const settings = await getPakasirConfig(supabase);
      if (!settings?.payment_api_key) return res.status(500).json({ error: "Pengaturan API tidak ditemukan" });

      const encodedId = encodeURIComponent(order_id);
      const verifyUrl = `https://app.pakasir.com/api/transactiondetail?project=${settings.payment_project_slug}&amount=${amount}&order_id=${encodedId}&api_key=${settings.payment_api_key}`;
      
      console.log(`[VERIFIKASI MANUAL] Memeriksa status ${order_id}...`);
      const verifyRes = await axios.get(verifyUrl, { timeout: 10000 });
      const status = verifyRes.data?.transaction?.status;

      if (status === "completed") {
        const { error: updateError } = await supabase
          .from("transactions")
          .update({ 
            status: "completed", 
            completed_at: verifyRes.data.transaction.completed_at || new Date().toISOString() 
          })
          .eq("order_id", order_id);
        
        if (updateError) throw updateError;
        return res.json({ success: true, status: "completed", message: "Pembayaran terverifikasi!" });
      }

      return res.json({ success: true, status: status || "pending", message: "Pembayaran belum diterima oleh Pakasir." });
    } catch (error: any) {
      console.error("[VERIFIKASI MANUAL ERROR]:", error.response?.data || error.message);
      return res.status(500).json({ error: "Gagal verifikasi status pembayaran ke Pakasir." });
    }
  });

  // Webhook: Menerima notifikasi pembayaran (Dokumentasi D)
  apiRouter.post("/pakasir/webhook", async (req, res) => {
    console.log("[PAKASIR WEBHOOK]:", req.body);
    const { order_id, amount, status, project } = req.body;

    if (!order_id || !amount) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    if (status !== "completed") {
      return res.json({ status: "ignored", message: "Hanya status 'completed' yang diproses" });
    }

    try {
      const supabase = getSupabase();
      if (!supabase) return res.status(500).send("Database tidak tersedia");

      // 1. Verifikasi dengan Pakasir detail API untuk keamanan (Dokumentasi E)
      const settings = await getPakasirConfig(supabase);
      if (!settings?.payment_api_key) return res.status(500).send("Konfigurasi server tidak lengkap");

      // Validasi bahwa project slug cocok
      if (project !== settings.payment_project_slug) {
        console.warn(`[PAKASIR WEBHOOK] Percobaan spoofing? Slug tidak cocok: ${project}`);
        return res.status(403).send("Forbidden");
      }

      // 2. Cek lokal dulu apakah transaksi ini ada dan pending
      const { data: localTx, error: localTxError } = await supabase
        .from("transactions")
        .select("status, amount")
        .eq("order_id", order_id)
        .single();
      
      if (localTxError || !localTx) {
        console.warn(`[PAKASIR WEBHOOK] Transaksi tidak ditemukan di DB Lokal: ${order_id}`);
        return res.status(404).json({ error: "Transaction not found locally" });
      }

      // 3. Panggil API Detail Pakasir untuk pastikan valid (Anti-Spoofing)
      const verifyUrl = `https://app.pakasir.com/api/transactiondetail?project=${settings.payment_project_slug}&amount=${amount}&order_id=${encodeURIComponent(order_id)}&api_key=${settings.payment_api_key}`;
      const verifyRes = await axios.get(verifyUrl, { timeout: 10000 });
      const pakasirStatus = verifyRes.data?.transaction?.status;
      const pakasirAmount = verifyRes.data?.transaction?.amount;

      if (pakasirStatus === "completed" && Number(pakasirAmount) === Number(amount)) {
        const { error: updateError } = await supabase
          .from("transactions")
          .update({ 
            status: "completed", 
            completed_at: req.body.completed_at || new Date().toISOString() 
          })
          .eq("order_id", order_id);
        
        if (updateError) {
          console.error("[PAKASIR WEBHOOK] Gagal update database:", updateError);
          return res.status(500).send("Update DB Gagal");
        }
        
        console.log(`[PAKASIR WEBHOOK] Transaksi ${order_id} BERHASIL diperbarui menjadi SELESAI.`);
        return res.json({ status: "ok", message: "Status diperbarui menjadi completed" });
      }
      
      console.warn(`[PAKASIR WEBHOOK] Verifikasi gagal. Pakasir Status: ${pakasirStatus}, Amount Match: ${Number(pakasirAmount) === Number(amount)}`);
      return res.status(400).json({ error: "Verifikasi gagal/mismatch dengan Pakasir" });
    } catch (error: any) {
      console.error("[PAKASIR WEBHOOK ERROR]:", error.message);
      return res.status(500).send("Proses webhook gagal");
    }
  });

  // Proxy: Payment Simulation (Sandbox only - Dokumentasi C.4)
  apiRouter.post("/pakasir/simulate", async (req, res) => {
    const { order_id, amount } = req.body;
    if (!order_id || !amount) return res.status(400).json({ error: "Data tidak lengkap." });

    try {
      const supabase = getSupabase();
      const settings = await getPakasirConfig(supabase);
      if (!settings?.payment_api_key) return res.status(500).json({ error: "Config missing" });

      const response = await axios.post("https://app.pakasir.com/api/paymentsimulation", {
        project: settings.payment_project_slug,
        order_id,
        amount,
        api_key: settings.payment_api_key
      });

      return res.json(response.data);
    } catch (error: any) {
      return res.status(500).json({ error: error.response?.data || error.message });
    }
  });

  // Use a more robust prefix handling for Vercel
  app.use((req, res, next) => {
    // If the path starts with /api but isn't being handled, or if it's already handled, we log it
    if (req.path.startsWith('/api')) {
      console.log(`[Vercel Routing] Incoming API req: ${req.method} ${req.path}`);
    }
    next();
  });

  // Standard Vercel routing
  app.use("/api", apiRouter);
  
  // Health check fallback
  app.get("/api-status", (req, res) => {
    const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
    
    res.json({ 
      status: "online", 
      host: "kodekode.vercel.app",
      server_time: new Date().toISOString(),
      env: {
        supabase_ready: !!(url && key),
        node_env: process.env.NODE_ENV,
        is_vercel: !!process.env.VERCEL
      }
    });
  });

  // Global Error Handler
  app.use((err: any, req: any, res: any, next: any) => {
    console.error("[Express Error Handler]:", err);
    if (!res.headersSent) {
      res.status(500).json({ 
        error: "Internal Server Error", 
        message: err.message,
        path: req.path
      });
    }
  });

  // Vite/Static middleware
  if (process.env.NODE_ENV !== "production") {
    try {
      const { createServer: createViteServer } = await import("vite");
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: "spa",
      });
      app.use(vite.middlewares);
    } catch (e) {
      console.warn("[Vite] Could not initialize Vite middleware:", e);
    }
  } else {
    // Di Vercel atau Production, handle static files agar SPA routing (seperti /auth/callback) tidak 404
    const distPath = path.join(process.cwd(), "dist");
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
      app.get("*", (req, res) => {
        res.sendFile(path.join(distPath, "index.html"));
      });
    } else {
      console.warn("[Server] Folder 'dist' tidak ditemukan. Pastikan 'npm run build' sudah dijalankan.");
    }
  }

  return app;
}

// Start listener only when running the script directly
if (process.env.NODE_ENV !== "production" || !process.env.VERCEL) {
  const PORT = 3000;
  createServer().then(app => {
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`DIKODEKU Server running on http://localhost:${PORT}`);
    });
  }).catch((err) => {
    console.error("FATAL: Server failed to start:", err);
    process.exit(1);
  });
}

