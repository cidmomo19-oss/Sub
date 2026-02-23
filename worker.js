/**
 * SUB4UNLOCK PRO - Cloudflare Worker (Enhanced Security)
 * Features: KV Storage, Double No-Referrer, URL Obfuscation, Validation Logic
 */

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;

    if (path === "/create") {
      return handleCreatePage(request);
    }

    if (path === "/api/generate" && request.method === "POST") {
      return handleGenerateApi(request, env);
    }

    const slug = path.slice(1);
    if (slug && slug.length > 0) {
      return handleUserPage(slug, env);
    }

    return Response.redirect(url.origin + "/create", 302);
  }
};

// --- LOGIKA HALAMAN CREATE ---
function handleCreatePage(request) {
  const html = `
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Dashboard - Create Locked Link</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <link href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.10.0/font/bootstrap-icons.css" rel="stylesheet">
    <style>
        body { background: #0f172a; color: #e2e8f0; font-family: 'Inter', sans-serif; min-height: 100vh; display: flex; align-items: center; justify-content: center; }
        .card-custom { background: #1e293b; border: 1px solid #334155; border-radius: 16px; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5); width: 100%; max-width: 500px; }
        .form-control { background: #0f172a; border: 1px solid #334155; color: #fff; padding: 12px; border-radius: 10px; }
        .form-control:focus { background: #0f172a; border-color: #6366f1; color: #fff; box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.2); }
        .btn-gradient { background: linear-gradient(135deg, #6366f1 0%, #a855f7 100%); border: none; color: white; font-weight: 700; padding: 12px; border-radius: 10px; width: 100%; margin-top: 10px; }
        .btn-gradient:hover { opacity: 0.9; }
        label { font-weight: 600; margin-bottom: 8px; font-size: 0.9rem; color: #94a3b8; }
        .input-group-text { background: #334155; border: 1px solid #334155; color: #cbd5e1; }
        #result-area { display: none; margin-top: 20px; background: #0f172a; padding: 15px; border-radius: 10px; border: 1px dashed #6366f1; }
    </style>
</head>
<body>
    <div class="container p-3">
        <div class="card card-custom p-4 mx-auto">
            <h3 class="text-center mb-4 fw-bold"><i class="bi bi-link-45deg"></i> Link Locker</h3>
            <form id="createForm">
                <div class="mb-3">
                    <label>Link Asli (Tujuan)</label>
                    <input type="url" id="target" class="form-control" placeholder="https://..." required>
                </div>
                <div class="mb-3">
                    <label>Channel YouTube (Subscribe)</label>
                    <div class="input-group">
                        <span class="input-group-text"><i class="bi bi-youtube"></i></span>
                        <input type="url" id="yt_sub" class="form-control" placeholder="Link Channel..." required>
                    </div>
                </div>
                <div class="mb-3">
                    <label>Video YouTube (Like & Komen)</label>
                    <div class="input-group">
                        <span class="input-group-text"><i class="bi bi-play-btn-fill"></i></span>
                        <input type="url" id="yt_vid" class="form-control" placeholder="Link Video..." required>
                    </div>
                </div>
                <div class="mb-3">
                    <label>Saluran WhatsApp (Join)</label>
                    <div class="input-group">
                        <span class="input-group-text"><i class="bi bi-whatsapp"></i></span>
                        <input type="url" id="wa_link" class="form-control" placeholder="Link Saluran..." required>
                    </div>
                </div>
                <button type="submit" id="btnSubmit" class="btn btn-gradient">BUAT LINK TERKUNCI</button>
            </form>

            <div id="result-area" class="text-center">
                <p class="small text-muted mb-2">Link Berhasil Dibuat:</p>
                <div class="input-group">
                    <input type="text" id="finalUrl" class="form-control text-center" readonly style="font-size: 0.9rem;">
                    <button class="btn btn-secondary" onclick="copyLink()"><i class="bi bi-clipboard"></i></button>
                </div>
                <a href="#" id="previewLink" target="_blank" class="btn btn-sm btn-outline-light mt-3 w-100">Coba Link</a>
            </div>
        </div>
    </div>

    <script>
        document.getElementById('createForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = document.getElementById('btnSubmit');
            btn.innerHTML = 'Memproses...'; btn.disabled = true;

            const data = {
                target: btoa(document.getElementById('target').value).split('').reverse().join(''), // Simple Obfuscation
                yt_sub: document.getElementById('yt_sub').value,
                yt_vid: document.getElementById('yt_vid').value,
                wa_link: document.getElementById('wa_link').value
            };

            try {
                const req = await fetch('/api/generate', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify(data)
                });
                const res = await req.json();
                
                if(res.success) {
                    const fullUrl = window.location.origin + '/' + res.id;
                    document.getElementById('finalUrl').value = fullUrl;
                    document.getElementById('previewLink').href = fullUrl;
                    document.getElementById('result-area').style.display = 'block';
                } else {
                    alert('Gagal membuat link.');
                }
            } catch (err) { alert('Terjadi kesalahan.'); }
            
            btn.innerHTML = 'BUAT LINK TERKUNCI'; btn.disabled = false;
        });

        function copyLink() {
            const copyText = document.getElementById("finalUrl");
            copyText.select();
            document.execCommand("copy");
            alert("Link disalin!");
        }
    </script>
</body>
</html>
  `;
  return new Response(html, { headers: { "Content-Type": "text/html" } });
}

// --- API GENERATE ID ---
async function handleGenerateApi(request, env) {
  try {
    const data = await request.json();
    const id = Math.random().toString(36).substring(2, 8);
    await env.DATABASE.put(id, JSON.stringify(data));
    return new Response(JSON.stringify({ success: true, id: id }), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (e) {
    return new Response(JSON.stringify({ success: false, error: e.message }), { status: 500 });
  }
}

// --- LOGIKA HALAMAN USER (SUB4UNLOCK) ---
async function handleUserPage(id, env) {
  const dataRaw = await env.DATABASE.get(id);
  if (!dataRaw) return new Response("Link Tidak Ditemukan.", { status: 404 });
  const data = JSON.parse(dataRaw);

  const html = `
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <meta name="referrer" content="no-referrer">
    <title>Selesaikan Langkah</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;800&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.10.0/font/bootstrap-icons.css">
    <style>
        :root { --primary: #ef4444; --wa-color: #25D366; --bg-dark: #111827; --card-bg: #1f2937; }
        body { background-color: var(--bg-dark); font-family: 'Poppins', sans-serif; color: white; min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; overflow-x: hidden; }
        .main-card { background: var(--card-bg); border-radius: 24px; padding: 2rem; width: 90%; max-width: 420px; box-shadow: 0 20px 50px rgba(0,0,0,0.5); border: 1px solid #374151; position: relative; overflow: hidden; }
        .main-card::before { content: ''; position: absolute; top:0; left:0; right:0; height: 6px; background: linear-gradient(90deg, #ef4444, #25D366); }
        .title-text { font-weight: 800; font-size: 1.5rem; text-align: center; margin-bottom: 5px; }
        .subtitle { text-align: center; color: #9ca3af; font-size: 0.9rem; margin-bottom: 25px; }
        .action-btn { display: flex; align-items: center; justify-content: space-between; padding: 15px 20px; margin-bottom: 12px; background: #374151; border-radius: 14px; cursor: pointer; transition: all 0.3s ease; text-decoration: none; color: white; border: 1px solid transparent; position: relative; }
        .action-btn:hover { background: #4b5563; transform: translateY(-2px); }
        .action-btn.completed { background: #064e3b; border-color: #10b981; cursor: default; }
        .action-btn.completed .status-icon { color: #10b981; }
        .icon-box { width: 40px; height: 40px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 1.2rem; margin-right: 15px; }
        .yt-icon { background: rgba(239, 68, 68, 0.2); color: #ef4444; }
        .wa-icon { background: rgba(37, 211, 102, 0.2); color: #25D366; }
        .btn-text { flex: 1; font-weight: 600; font-size: 0.95rem; }
        .status-icon { font-size: 1.2rem; color: #6b7280; }
        .unlock-wrapper { margin-top: 25px; }
        #unlock-btn { width: 100%; padding: 16px; border-radius: 14px; font-weight: 800; font-size: 1.1rem; text-transform: uppercase; letter-spacing: 1px; background: #374151; color: #9ca3af; border: none; transition: all 0.3s; }
        #unlock-btn.active { background: linear-gradient(45deg, #3b82f6, #8b5cf6); color: white; box-shadow: 0 0 20px rgba(59, 130, 246, 0.5); animation: pulse 2s infinite; cursor: pointer; }
        @keyframes pulse { 0% {box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.7);} 70% {box-shadow: 0 0 0 10px rgba(59, 130, 246, 0);} 100% {box-shadow: 0 0 0 0 rgba(59, 130, 246, 0);} }
        .progress-container { width: 100%; height: 6px; background: #374151; border-radius: 10px; margin-bottom: 25px; overflow: hidden; }
        #progress-fill { height: 100%; background: #10b981; width: 0%; transition: width 0.5s ease; }
        .checking-state { font-size: 0.8rem; color: #fbbf24; font-style: italic; display: none; }
    </style>
</head>
<body>

    <div class="main-card">
        <div class="title-text">Link Terkunci <i class="bi bi-lock-fill"></i></div>
        <div class="subtitle">Selesaikan langkah di bawah untuk membuka.</div>

        <div class="progress-container">
            <div id="progress-fill"></div>
        </div>

        <div class="action-btn" id="btn-sub" onclick="safeRedirect('${data.yt_sub}', 'sub')">
            <div class="icon-box yt-icon"><i class="bi bi-youtube"></i></div>
            <div class="btn-text">
                <div>Subscribe Channel</div>
                <div class="checking-state" id="msg-sub">Menunggu verifikasi...</div>
            </div>
            <div class="status-icon" id="icon-sub"><i class="bi bi-chevron-right"></i></div>
        </div>

        <div class="action-btn" id="btn-like" onclick="safeRedirect('${data.yt_vid}', 'like')">
            <div class="icon-box yt-icon" style="background: rgba(255,255,255,0.1); color:white;"><i class="bi bi-hand-thumbs-up-fill"></i></div>
            <div class="btn-text">
                <div>Like & Comment Video</div>
                <div class="checking-state" id="msg-like">Menunggu verifikasi...</div>
            </div>
            <div class="status-icon" id="icon-like"><i class="bi bi-chevron-right"></i></div>
        </div>

        <div class="action-btn" id="btn-wa" onclick="safeRedirect('${data.wa_link}', 'wa')">
            <div class="icon-box wa-icon"><i class="bi bi-whatsapp"></i></div>
            <div class="btn-text">
                <div>Gabung Saluran WA</div>
                <div class="checking-state" id="msg-wa">Menunggu verifikasi...</div>
            </div>
            <div class="status-icon" id="icon-wa"><i class="bi bi-chevron-right"></i></div>
        </div>

        <div class="unlock-wrapper">
            <button id="unlock-btn" disabled onclick="finalUnlock()">
                <i class="bi bi-lock"></i> TERKUNCI
            </button>
        </div>
    </div>

    <script>
        // Data Obfuscation: Anti-View Source
        const _0xData = "${data.target}";
        let status = { sub: false, like: false, wa: false };

        /**
         * Keamanan: Double Null Referrer Redirect
         * Menghapus jejak asal traffic agar YouTube tidak memblokir channel.
         */
        function safeRedirect(url, type) {
            if (status[type]) return;

            // Step 1: Tampilkan status checking
            document.getElementById('msg-' + type).style.display = 'block';

            // Step 2: Redirect via jendela baru tanpa referrer
            const meta = document.createElement('meta');
            meta.name = "referrer";
            meta.content = "no-referrer";
            document.getElementsByTagName('head')[0].appendChild(meta);

            const win = window.open();
            win.opener = null;
            win.referrer = null;
            win.location.href = url;

            // Step 3: Simulasi verifikasi cerdas (jeda acak agar tidak terbaca bot)
            const randomDelay = Math.floor(Math.random() * 3000) + 5000; // 5-8 detik
            setTimeout(() => {
                markComplete(type);
            }, randomDelay);
        }

        function markComplete(type) {
            status[type] = true;
            const btn = document.getElementById('btn-' + type);
            const icon = document.getElementById('icon-' + type);
            const msg = document.getElementById('msg-' + type);

            btn.classList.add('completed');
            icon.innerHTML = '<i class="bi bi-check-circle-fill"></i>';
            msg.style.display = 'none';
            updateProgress();
        }

        function updateProgress() {
            let count = Object.values(status).filter(x => x).length;
            const percent = (count / 3) * 100;
            document.getElementById('progress-fill').style.width = percent + '%';
            if (count === 3) enableUnlock();
        }

        function enableUnlock() {
            const mainBtn = document.getElementById('unlock-btn');
            mainBtn.disabled = false;
            mainBtn.classList.add('active');
            mainBtn.innerHTML = '<i class="bi bi-unlock-fill"></i> BUKA LINK';
        }

        function finalUnlock() {
            if (Object.values(status).includes(false)) return;
            
            // Decode Obfuscated URL
            const decoded = atob(_0xData.split('').reverse().join(''));
            
            // Final Safe Redirect
            const a = document.createElement('a');
            a.href = decoded;
            a.rel = 'noreferrer noopener';
            a.target = '_blank';
            a.click();
        }
    </script>
</body>
</html>
  `;
  return new Response(html, { headers: { "Content-Type": "text/html" } });
}
