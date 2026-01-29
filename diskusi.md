# Diskusi Pengembangan: Temp Email Gratis (Domain Sendiri)

## Topik Diskusi
Pengembangan layanan email sementara (temporary email) menggunakan domain sendiri tanpa biaya sepeserpun (100% Free Tier).

## Solusi Arsitektur
1.  **Backend (API & Mail Processor)**: Cloudflare Workers (Wajib di sini karena fitur Email Routing cuma ada di Cloudflare).
2.  **Database**: Cloudflare D1.
3.  **Frontend (Web UI)**: **Deploy di Vercel**.

### Kenapa Vercel?
-   Gratis.
-   Integrasi sempurna dengan Next.js.
-   Domain frontend bisa pakai subdomain vercel (`app-anda.vercel.app`) atau custom domain.

## Rencana Deployment
-   **Backend**: `wrangler deploy` ke Cloudflare.
-   **Frontend**: Push ke GitHub -> Connect ke Vercel.

**Apakah sudah punya akun GitHub?** (Vercel butuh repo GitHub/GitLab untuk deploy otomatis). Jika belum, tenang, kita bisa setup lokal dulu.
