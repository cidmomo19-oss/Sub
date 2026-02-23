/**
 * SUB4UNLOCK PRO V3 - Cloudflare Worker
 * Advanced Visibility Detection & Security
 */

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;

    if (path === "/create") return handleCreatePage();
    if (path === "/api/generate" && request.method === "POST") return handleGenerateApi(request, env);
    
    // API Unlock (Ambil link dari KV)
    if (path.startsWith("/api/unlock/") && request.method === "POST") {
      const id = path.split("/")[3];
      const dataRaw = await env.DATABASE.get(id);
      if (!dataRaw) return new Response(JSON.stringify({ error: true }), { status: 404 });
      return new Response(JSON.stringify({ url: JSON.parse(dataRaw).target }), {
        headers: { "Content-Type": "application/json" }
      });
    }

    const slug = path.slice(1);
    if (slug && slug.length > 0) return handleUserPage(slug, env);

    return Response.redirect(url.origin + "/create", 302);
  }
};

async function handleGenerateApi(request, env) {
  try {
    const data = await request.json();
    const id = crypto.randomUUID().split('-')[0]; 
    await env.DATABASE.put(id, JSON.stringify(data));
    return new Response(JSON.stringify({ success: true, id: id }), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (e) {
    return new Response(JSON.stringify({ success: false }), { status: 500 });
  }
}

async function handleUserPage(id, env) {
  const dataRaw = await env.DATABASE.get(id);
  if (!dataRaw) return new Response("Error: Link Expired", { status: 404 });
  const data = JSON.parse(dataRaw);

  const html = `
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="referrer" content="no-referrer">
    <title>Selesaikan Tugas</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.10.0/font/bootstrap-icons.css">
    <style>
        :root { --primary: #6366f1; --bg: #0f172a; --card: #1e293b; }
        body { background: var(--bg); color: #fff; font-family: 'Inter', sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 20px; }
        .wrapper { background: var(--card); border: 1px solid #334155; border-radius: 24px; width: 100%; max-width: 400px; padding: 32px; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5); }
        .task-item { background: #0f172a; border: 1px solid #334155; border-radius: 16px; padding: 16px; margin-bottom: 12px; display: flex; align-items: center; cursor: pointer; transition: all 0.2s; position: relative; overflow: hidden; }
        .task-item:active { transform: scale(0.98); }
        .task-item.completed { border-color: #10b981; background: rgba(16, 185, 129, 0.05); cursor: default; }
        .task-item.error { border-color: #ef4444; animation: shake 0.4s; }
        @keyframes shake { 0%, 100% {transform: translateX(0);} 25% {transform: translateX(-5px);} 75% {transform: translateX(5px);} }
        
        .icon-box { width: 44px; height: 44px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 1.25rem; margin-right: 16px; }
        .yt { background: #ef4444; color: white; }
        .wa { background: #25d366; color: white; }
        
        .task-info { flex: 1; }
        .task-title { font-weight: 600; font-size: 0.95rem; }
        .task-status { font-size: 0.75rem; color: #94a3b8; }
        
        .btn-main { width: 100%; padding: 16px; border-radius: 16px; border: none; font-weight: 700; background: #334155; color: #64748b; margin-top: 12px; transition: 0.3s; }
        .btn-main.ready { background: linear-gradient(135deg, #6366f1, #a855f7); color: white; box-shadow: 0 10px 20px rgba(99, 102, 241, 0.3); cursor: pointer; }
        
        /* Progress Overlay */
        .verifying-overlay { position: absolute; top:0; left:0; height:100%; background: rgba(99, 102, 241, 0.2); width: 0%; transition: width 3s linear; }
    </style>
</head>
<body>
    <div class="wrapper">
        <h3 class="text-center fw-bold mb-1">Tugas Terkunci</h3>
        <p class="text-center text-muted small mb-4">Ikuti langkah untuk membuka link</p>
        
        <div class="task-item" id="task-sub" onclick="startTask('sub', '${data.yt_sub}')">
            <div class="verifying-overlay" id="overlay-sub"></div>
            <div class="icon-box yt"><i class="bi bi-youtube"></i></div>
            <div class="task-info">
                <div class="task-title">Subscribe Channel</div>
                <div class="task-status" id="txt-sub">Klik untuk memulai</div>
            </div>
            <div id="check-sub"><i class="bi bi-chevron-right"></i></div>
        </div>

        <div class="task-item" id="task-like" onclick="startTask('like', '${data.yt_vid}')">
            <div class="verifying-overlay" id="overlay-like"></div>
            <div class="icon-box yt" style="background:#dc2626;"><i class="bi bi-heart-fill"></i></div>
            <div class="task-info">
                <div class="task-title">Like & Comment</div>
                <div class="task-status" id="txt-like">Klik untuk memulai</div>
            </div>
            <div id="check-like"><i class="bi bi-chevron-right"></i></div>
        </div>

        <div class="task-item" id="task-wa" onclick="startTask('wa', '${data.wa_link}')">
            <div class="verifying-overlay" id="overlay-wa"></div>
            <div class="icon-box wa"><i class="bi bi-whatsapp"></i></div>
            <div class="task-info">
                <div class="task-title">Join WA Channel</div>
                <div class="task-status" id="txt-wa">Klik untuk memulai</div>
            </div>
            <div id="check-wa"><i class="bi bi-chevron-right"></i></div>
        </div>

        <button id="btnUnlock" class="btn-main" disabled onclick="unlock()">BUKA LINK TUJUAN</button>
    </div>

    <script>
        let tasks = { sub: false, like: false, wa: false };
        let activeTask = null;
        let leaveTime = 0;
        let hasLeft = false;

        function startTask(type, url) {
            if (tasks[type]) return;
            
            activeTask = type;
            hasLeft = false;
            leaveTime = 0;
            
            document.getElementById('task-'+type).classList.remove('error');
            document.getElementById('txt-'+type).innerText = "Membuka link...";
            
            window.open(url, '_blank');
        }

        // Deteksi Visibility
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'hidden') {
                // User benar-benar keluar halaman
                hasLeft = true;
                leaveTime = Date.now();
            } else {
                // User kembali ke halaman
                if (activeTask && !tasks[activeTask]) {
                    verifyAction();
                }
            }
        });

        function verifyAction() {
            const now = Date.now();
            const duration = (now - leaveTime) / 1000;

            const txt = document.getElementById('txt-' + activeTask);
            const overlay = document.getElementById('overlay-' + activeTask);

            if (!hasLeft || duration < 3) {
                // Gagal: User tidak keluar halaman atau terlalu sebentar
                txt.innerText = "Gagal! Silakan ulangi & selesaikan.";
                document.getElementById('task-'+activeTask).classList.add('error');
                activeTask = null;
            } else {
                // Berhasil: User keluar minimal 3 detik
                txt.innerText = "Memverifikasi...";
                overlay.style.width = "100%";
                
                setTimeout(() => {
                    markDone(activeTask);
                    activeTask = null;
                }, 2000); // Simulasi loading verifikasi
            }
        }

        function markDone(type) {
            tasks[type] = true;
            const item = document.getElementById('task-' + type);
            item.classList.add('completed');
            document.getElementById('txt-' + type).innerText = "Tugas Selesai";
            document.getElementById('check-' + type).innerHTML = '<i class="bi bi-check-circle-fill text-success"></i>';
            
            if (tasks.sub && tasks.like && tasks.wa) {
                const btn = document.getElementById('btnUnlock');
                btn.disabled = false;
                btn.classList.add('ready');
                btn.innerText = "KLIK UNTUK MEMBUKA";
            }
        }

        async function unlock() {
            const btn = document.getElementById('btnUnlock');
            btn.innerText = "Mengambil link...";
            
            try {
                const res = await fetch('/api/unlock/${id}', { method: 'POST' });
                const data = await res.json();
                if (data.url) {
                    window.location.replace(data.url);
                }
            } catch (e) {
                btn.innerText = "Error, Coba Lagi";
            }
        }
    </script>
</body>
</html>
  `;
  return new Response(html, { headers: { "Content-Type": "text/html" } });
}

function handleCreatePage() {
    return new Response("Silakan gunakan form dashboard sebelumnya untuk generate API.", { status: 200 });
}
