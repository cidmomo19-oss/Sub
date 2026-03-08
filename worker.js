/**
 * Direct Link Opener - Cloudflare Worker
 * Features: Ultra Clean White UI, Direct Link, Popunder Ad, 1-Month Caching
 */

// Konfigurasi durasi cache: 30 Hari (dalam detik) = 2.592.000 detik
const CACHE_TTL = 2592000; 

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;

    // 1. Bypass Cache untuk API POST
    if (path === "/api/generate" && request.method === "POST") return handleGenerateApi(request, env);
    
    // 2. CEK CACHE EDGE CLOUDFLARE
    const cache = caches.default;
    if (request.method === "GET") {
        const cachedResponse = await cache.match(request);
        if (cachedResponse) {
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

    // 4. SIMPAN KE CACHE EDGE
    if (request.method === "GET" && response.status === 200) {
        ctx.waitUntil(cache.put(request, response.clone()));
    }

    return response;
  }
};

// --- HALAMAN CREATE (Tampilan Admin Tetap Gelap & Elegan) ---
function handleCreatePage(request) {
  const html = `
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Link Generator</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <style>
        body { background: #0f172a; color: #e2e8f0; font-family: sans-serif; min-height: 100vh; display: flex; align-items: center; justify-content: center; }
        .card-custom { background: #1e293b; border: 1px solid #334155; border-radius: 16px; width: 100%; max-width: 500px; padding: 2rem; }
        .form-control { background: #0f172a; border: 1px solid #334155; color: #fff; padding: 12px; }
        .btn-primary { background: #2563eb; border: none; padding: 12px; width: 100%; border-radius: 50px; font-weight: bold; }
        .btn-primary:hover { background: #1d4ed8; }
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
                    <b>Info Sistem:</b><br>
                    Tampilan pengunjung kini putih bersih hanya ada 1 tombol "Lanjutkan". Fitur cache 1 bulan aktif.
                </div>
                <button type="submit" id="btnSubmit" class="btn btn-primary">BUAT LINK</button>
            </form>
            <div id="result-area" class="mt-3 text-center" style="display:none;">
                <input type="text" id="finalUrl" class="form-control text-center mb-2" readonly>
                <button class="btn btn-secondary w-100 mb-2" style="border-radius: 50px;" onclick="copyLink()">Salin Link</button>
                <a href="#" id="previewLink" target="_blank" class="btn btn-outline-light w-100 btn-sm" style="border-radius: 50px;">Coba Link</a>
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
                    body: JSON.stringify({ target: document.getElementById('target').value })
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
  return new Response(html, { 
      status: 200,
      headers: { "Content-Type": "text/html", "Cache-Control": `public, max-age=${CACHE_TTL}, s-maxage=${CACHE_TTL}` } 
  });
}

// --- API GENERATE ---
async function handleGenerateApi(request, env) {
  try {
    const data = await request.json();
    const id = Math.random().toString(36).substring(2, 8);
    await env.DATABASE.put(id, JSON.stringify(data));
    return new Response(JSON.stringify({ success: true, id: id }), { 
        headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } 
    });
  } catch (e) { return new Response(JSON.stringify({ success: false }), { status: 500 }); }
}

// --- HALAMAN USER (Putih Bersih & Super Ringan) ---
async function handleUserPage(id, env) {
  const dataRaw = await env.DATABASE.get(id);
  
  if (!dataRaw) {
      return new Response("Halaman tidak ditemukan.", { 
          status: 404, 
          headers: { "Cache-Control": "no-store" } 
      });
  }
  
  const data = JSON.parse(dataRaw);
  
  // Tampilan Super Clean, tanpa Bootstrap/Library luar agar load 0 detik
  const html = `
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <meta name="referrer" content="no-referrer">
    <title>Lanjutkan</title>
    <style>
        body {
            margin: 0;
            padding: 0;
            background-color: #ffffff; /* Putih Bersih */
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
        }
        .btn-lanjut {
            background-color: #2563eb; /* Warna Biru Elegan */
            color: #ffffff;
            border: none;
            padding: 16px 48px;
            font-size: 18px;
            font-weight: 600;
            border-radius: 50px;
            cursor: pointer;
            box-shadow: 0 4px 10px rgba(37, 99, 235, 0.3);
            transition: all 0.2s ease;
            letter-spacing: 0.5px;
        }
        .btn-lanjut:hover {
            background-color: #1d4ed8;
            transform: translateY(-2px);
            box-shadow: 0 6px 15px rgba(37, 99, 235, 0.4);
        }
        .btn-lanjut:active {
            transform: translateY(1px);
            box-shadow: 0 2px 5px rgba(37, 99, 235, 0.3);
        }
    </style>
</head>
<body>

    <button class="btn-lanjut" onclick="finalLink()">Lanjutkan</button>

    <script>
        const _0xTarget = "${encodeURIComponent(data.target)}";

        function finalLink() {
            // Link iklan untuk menggantikan tab lama
            const adUrl = "https://conductivebreeds.com/bmaye227ji?key=21143f6352edf65a6b64615e9bb37bb9";
            
            // Link target asli di tab baru
            const targetUrl = decodeURIComponent(_0xTarget);
            
            // Buka tab baru
            window.open(targetUrl, '_blank');
            
            // Pindahkan halaman ini ke iklan
            window.location.href = adUrl;
        }
    </script>
</body>
</html>
  `;
  
  return new Response(html, { 
      status: 200,
      headers: { 
          "Content-Type": "text/html",
          "Cache-Control": `public, max-age=${CACHE_TTL}, s-maxage=${CACHE_TTL}`
      } 
  });
}
