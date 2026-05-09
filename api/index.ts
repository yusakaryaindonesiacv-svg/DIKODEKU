import { createServer } from "../server.js";

let cachedApp: any = null;

export default async function handler(req: any, res: any) {
  try {
    if (!cachedApp) {
      console.log("[Vercel] Sedang menginisialisasi server Express...");
      cachedApp = await createServer();
      console.log("[Vercel] Server Express berhasil diinisialisasi.");
    }
    
    return cachedApp(req, res);
  } catch (error: any) {
    console.error("[Vercel Handler Error]:", error);
    if (!res.headersSent) {
      res.status(500).json({ 
        error: "Kesalahan Internal Server", 
        message: error.message,
        help: "Silakan periksa log Vercel untuk informasi lebih lanjut."
      });
    }
  }
}
