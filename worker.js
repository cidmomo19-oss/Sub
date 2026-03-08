/**
 * Direct Link Opener - Cloudflare Worker
 * Features: Direct Link, Popunder Ad, 1-Month Caching (Saves Quota Limit)
 */

// Konfigurasi durasi cache: 30 Hari (dalam detik) = 2.592.000 detik
const CACHE_TTL = 2592000; 

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;

    // 1. Bypass Cache untuk API POST (Karena ini untuk membuat data baru)
    if (path === "/api/generate" && request.method === "POST") return handleGenerateApi(request, env);
    
    // 2. CEK CACHE EDGE CLOUDFLARE (Hanya untuk request GET)
    const cache = caches.default;
    if (request.method === "GET") {
        const cachedResponse = await cache.match(request);
        if (cachedResponse) {
            // Jika ada di cache, langsung kembalikan. Ini hemat limit KV & CPU!
            return cachedResponse;
        }
    }

    let response;

    // 3. Routing Halaman
    if (path === "/create") {
        response = handleCreatePage(request);
    } else {
        const slug = path.slice(1); 
        if (slug && slug.length > 0) {
            response = await handleUserPage(slug, env);
        } else {
            return Response.redirect(url.origin + "/create", 302);
        }
    }

    // 4. SIMPAN KE CACHE EDGE (Jika halaman berhasil dimuat / Status 200)
    if (request.method === "GET" && response.status === 200) {
        // Response harus di-clone karena body hanya bisa dibaca satu kali
        ctx.waitUntil(cache.put(request, response.clone()));
    }

    return response;
  }
};

// --- HALAMAN CREATE ---
function handleCreatePage(request) {
  const html = `
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Link Generator</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <link href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.10.0/font/bootstrap-icons.css" rel="stylesheet">
    <style>
        body { background: #0f172a; color: #e2e8f0; font-family: sans-serif; min-height: 100vh; display: flex; align-items: center; justify-content: center; }
        .card-custom { background: #1e293b; border: 1px solid #334155; border-radius: 16px; width: 100%; max-width: 500px; padding: 2rem; }
        .form-control { background: #0f172a; border: 1px solid #334155; color: #fff; padding: 12px; }
        .btn-gradient { background: linear-gradient(135deg, #6366f1 0%, #a855f7 100%); border: none; color: white; padding: 12px; width: 100%; border-radius: 10px; font-weight: bold; }
        .alert-custom { background: rgba(59, 130, 246, 0.1); border: 1px solid rgba(59, 130, 246, 0.2); color: #93c5fd; font-size: 0.85rem; }
    </style>
</head>
<body>
    <div class="container">
        <div class="card card-custom mx-auto">
            <h3 class="text-center mb-4 fw-bold">Link Generator</h3>
            <form id="createForm">
                <div class="mb-3">
                    <label class="mb-2">Link Tujuan (Target)</label>
                    <input type="url" id="target" class="form-control" placeholder="https://..." required>
                </div>
                
                <div class="alert alert-custom p-3 mb-3">
                    <i class="bi bi-info-circle"></i> <b>Sistem Aktif:</b><br>
                    Direct Button + Auto Popunder Ads. Halaman ini dicache otomatis untuk menghemat limit request Anda.
                </div>

                <button type="submit" id="btnSubmit" class="btn btn-gradient">BUAT LINK</button>
            </form>
            
            <div id="result-area" class="mt-3 text-center" style="display:none;">
                <input type="text" id="finalUrl" class="form-control text-center mb-2" readonly>
                <button class="btn btn-secondary w-100" onclick="copyLink()">Salin Link</button>
                <a href="#" id="previewLink" target="_blank" class="btn btn-outline-light w-100 mt-2 btn-sm">Coba Link</a>
            </div>
        </div>
    </div>
    <script>
        document.getElementById('createForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = document.getElementById('btnSubmit');
            btn.innerHTML = 'Memproses...'; btn.disabled = true;
            try {
                const req = await fetch('/api/generate', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({
                        target: document.getElementById('target').value
                    })
                });
                const res = await req.json();
                if(res.success) {
                    const fullUrl = window.location.origin + '/' + res.id;
                    document.getElementById('finalUrl').value = fullUrl;
                    document.getElementById('previewLink').href = fullUrl;
                    document.getElementById('result-area').style.display = 'block';
                }
            } catch (err) { alert('Error'); }
            btn.innerHTML = 'BUAT LINK'; btn.disabled = false;
        });
        function copyLink() {
            const copyText = document.getElementById("finalUrl");
            copyText.select(); document.execCommand("copy"); alert("Link disalin!");
        }
    </script>
</body>
</html>
  `;
  
  // Set header cache 1 Bulan
  return new Response(html, { 
      status: 200,
      headers: { 
          "Content-Type": "text/html",
          "Cache-Control": `public, max-age=${CACHE_TTL}, s-maxage=${CACHE_TTL}`
      } 
  });
}

// --- API GENERATE ---
async function handleGenerateApi(request, env) {
  try {
    const data = await request.json();
    const id = Math.random().toString(36).substring(2, 8);
    await env.DATABASE.put(id, JSON.stringify(data));
    // Jangan cache respon API POST ini
    return new Response(JSON.stringify({ success: true, id: id }), { 
        headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } 
    });
  } catch (e) { return new Response(JSON.stringify({ success: false }), { status: 500 }); }
}

// --- HALAMAN USER (Tujuan URL) ---
async function handleUserPage(id, env) {
  const dataRaw = await env.DATABASE.get(id);
  
  // Jika URL tidak ditemukan (Error 404), Jangan di-cache! Agar kalau suatu saat datanya ada, bisa dibuka lagi
  if (!dataRaw) {
      return new Response("Link Not Found / Sudah Kadaluarsa", { 
          status: 404, 
          headers: { "Cache-Control": "no-store" } 
      });
  }
  
  const data = JSON.parse(dataRaw);
  const html = `
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <meta name="referrer" content="no-referrer">
    <title>Buka Tautan</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;800&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.10.0/font/bootstrap-icons.css">
    <style>
        :root { --bg-dark: #111827; --card-bg: #1f2937; }
        body { background-color: var(--bg-dark); font-family: 'Poppins', sans-serif; color: white; min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; margin: 0; padding: 15px; }
        .main-card { background: var(--card-bg); border-radius: 24px; padding: 2rem; width: 100%; max-width: 420px; box-shadow: 0 20px 50px rgba(0,0,0,0.5); border: 1px solid #374151; position: relative; overflow: hidden; text-align: center; }
        .main-card::before { content: ''; position: absolute; top:0; left:0; right:0; height: 6px; background: linear-gradient(90deg, #3b82f6, #8b5cf6); }
        .title-text { font-weight: 800; font-size: 1.5rem; margin-bottom: 10px; }
        .subtitle { color: #9ca3af; font-size: 0.9rem; margin-bottom: 25px; }
        
        #unlock-btn { width: 100%; padding: 16px; border-radius: 14px; font-weight: 800; font-size: 1.1rem; text-transform: uppercase; letter-spacing: 1px; border: none; transition: all 0.3s; background: linear-gradient(45deg, #3b82f6, #8b5cf6); color: white; box-shadow: 0 0 20px rgba(59, 130, 246, 0.5); animation: pulse 2s infinite; cursor: pointer; }
        #unlock-btn:hover { transform: scale(1.02); }
        #unlock-btn:active { transform: scale(0.98); }
        @keyframes pulse { 0% {box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.7);} 70% {box-shadow: 0 0 0 10px rgba(59, 130, 246, 0);} 100% {box-shadow: 0 0 0 0 rgba(59, 130, 246, 0);} }
    </style>
</head>
<body>
    <div class="main-card">
        <div class="title-text">Tautan Siap <i class="bi bi-link-45deg"></i></div>
        <div class="subtitle">Klik tombol di bawah ini untuk langsung menuju ke tautan tujuan Anda.</div>

        <div class="unlock-wrapper">
            <button id="unlock-btn" onclick="finalLink()"><i class="bi bi-unlock-fill"></i> BUKA LINK</button>
        </div>
    </div>

    <script>
        const _0xTarget = "${encodeURIComponent(data.target)}";

        function finalLink() {
            // Link iklan untuk tab lama
            const adUrl = "https://conductivebreeds.com/bmaye227ji?key=21143f6352edf65a6b64615e9bb37bb9";
            
            // Link target asli di tab baru
            const targetUrl = decodeURIComponent(_0xTarget);
            
            window.open(targetUrl, '_blank');
            window.location.href = adUrl;
        }
    </script>
</body>
</html>
  `;
  
  // Set header cache 1 Bulan untuk halaman User
  return new Response(html, { 
      status: 200,
      headers: { 
          "Content-Type": "text/html",
          "Cache-Control": `public, max-age=${CACHE_TTL}, s-maxage=${CACHE_TTL}`
      } 
  });
}
