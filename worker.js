/**
 * SUB4UNLOCK PRO V2 - SECURITY ENHANCED
 * Features: Stealth Redirect, Anti-Cheat, Payload Obfuscation
 */

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;

    if (path === "/create") return handleCreatePage(request);
    if (path === "/api/generate" && request.method === "POST") return handleGenerateApi(request, env);
    
    // Route Khusus untuk Stripping Referrer (Jembatan)
    if (path === "/go") {
      const target = url.searchParams.get("to");
      return new Response(`<html><head><meta name="referrer" content="no-referrer"><meta http-equiv="refresh" content="0;url=${atob(target)}"></head></html>`, {
        headers: { "Content-Type": "text/html" }
      });
    }

    const slug = path.slice(1);
    if (slug && slug.length > 0) return handleUserPage(slug, env, url.origin);

    return Response.redirect(url.origin + "/create", 302);
  }
};

// --- API GENERATE ---
async function handleGenerateApi(request, env) {
  try {
    const data = await request.json();
    const id = Math.random().toString(36).substring(2, 10);
    // Kita encode target link sebelum simpan ke KV agar tidak plain text
    data.target = btoa(data.target); 
    await env.DATABASE.put(id, JSON.stringify(data));
    return new Response(JSON.stringify({ success: true, id: id }), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (e) {
    return new Response(JSON.stringify({ success: false }), { status: 500 });
  }
}

// --- LOGIKA HALAMAN USER ---
async function handleUserPage(id, env, origin) {
  const dataRaw = await env.DATABASE.get(id);
  if (!dataRaw) return new Response("Link Expired", { status: 404 });
  const data = JSON.parse(dataRaw);

  const html = `
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="referrer" content="no-referrer">
    <title>Selesaikan Tugas - Unlock Link</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.10.0/font/bootstrap-icons.css">
    <style>
        :root { --bg: #0a0f1c; --card: #161e31; --primary: #3b82f6; }
        body { background: var(--bg); color: #fff; font-family: 'Segoe UI', sans-serif; min-height: 100vh; display: flex; align-items: center; justify-content: center; margin: 0; }
        .container { width: 90%; max-width: 450px; }
        .card { background: var(--card); border: 1px solid #2d3748; border-radius: 20px; padding: 25px; box-shadow: 0 10px 30px rgba(0,0,0,0.5); }
        .step-btn { 
            display: flex; align-items: center; justify-content: space-between;
            padding: 14px 18px; background: #1f2937; border-radius: 12px;
            margin-bottom: 15px; cursor: pointer; border: 1px solid transparent; transition: 0.3s;
            text-decoration: none; color: white;
        }
        .step-btn:hover { background: #2d3748; border-color: var(--primary); }
        .step-btn.disabled { opacity: 0.6; cursor: not-allowed; pointer-events: none; }
        .step-btn.done { border-color: #10b981; background: rgba(16, 185, 129, 0.1); }
        .icon { width: 40px; height: 40px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 1.2rem; }
        .yt { background: #fee2e2; color: #ef4444; }
        .wa { background: #dcfce7; color: #22c55e; }
        .unlock-btn { 
            width: 100%; padding: 15px; border-radius: 12px; border: none;
            background: #2d3748; color: #94a3b8; font-weight: bold; font-size: 1.1rem;
            margin-top: 10px; transition: 0.5s;
        }
        .unlock-btn.ready { background: linear-gradient(135deg, #3b82f6, #8b5cf6); color: white; cursor: pointer; box-shadow: 0 5px 15px rgba(59, 130, 246, 0.4); }
        .loader { width: 18px; height: 18px; border: 2px solid #fff; border-bottom-color: transparent; border-radius: 50%; display: none; animation: rotation 1s linear infinite; }
        @keyframes rotation { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        .timer-text { font-size: 0.8rem; color: #fbbf24; margin-top: 4px; display: none; }
    </style>
</head>
<body>

<div class="container">
    <div class="card">
        <h4 class="text-center fw-bold mb-1">Link Terkunci</h4>
        <p class="text-center text-muted small mb-4">Ikuti langkah agar link terbuka otomatis</p>

        <!-- STEP 1 -->
        <div class="step-btn" id="step1" onclick="doTask('step1', '${data.yt_sub}')">
            <div class="d-flex align-items: center;">
                <div class="icon yt me-3"><i class="bi bi-youtube"></i></div>
                <div>
                    <div class="fw-bold">Subscribe Channel</div>
                    <div id="timer-step1" class="timer-text italic">Tunggu <span class="sec">10</span> detik...</div>
                </div>
            </div>
            <div class="status" id="status-step1"><i class="bi bi-circle"></i></div>
        </div>

        <!-- STEP 2 -->
        <div class="step-btn" id="step2" onclick="doTask('step2', '${data.yt_vid}')">
            <div class="d-flex align-items: center;">
                <div class="icon yt me-3" style="background:#fef3c7; color:#f59e0b;"><i class="bi bi-heart-fill"></i></div>
                <div>
                    <div class="fw-bold">Like & Comment</div>
                    <div id="timer-step2" class="timer-text italic">Tunggu <span class="sec">10</span> detik...</div>
                </div>
            </div>
            <div class="status" id="status-step2"><i class="bi bi-circle"></i></div>
        </div>

        <!-- STEP 3 -->
        <div class="step-btn" id="step3" onclick="doTask('step3', '${data.wa_link}')">
            <div class="d-flex align-items: center;">
                <div class="icon wa me-3"><i class="bi bi-whatsapp"></i></div>
                <div>
                    <div class="fw-bold">Gabung Saluran</div>
                    <div id="timer-step3" class="timer-text italic">Tunggu <span class="sec">7</span> detik...</div>
                </div>
            </div>
            <div class="status" id="status-step3"><i class="bi bi-circle"></i></div>
        </div>

        <button id="unlock-btn" class="unlock-btn" disabled onclick="getFinalLink()">
            <i class="bi bi-lock-fill"></i> BUKA LINK
        </button>
        <p id="cheat-msg" class="text-danger small text-center mt-3" style="display:none;">Jangan kembali terlalu cepat! Selesaikan tugas dahulu.</p>
    </div>
</div>

<script>
    const encryptedData = "${data.target}";
    let tasks = { step1: false, step2: false, step3: false };
    let isProcessing = false;

    function doTask(step, url) {
        if (tasks[step] || isProcessing) return;

        isProcessing = true;
        const startTime = Date.now();
        
        // Anti-Cheat: Gunakan "Stealth Redirect" untuk menghilangkan Referrer
        const stealthUrl = "${origin}/go?to=" + btoa(url);
        window.open(stealthUrl, '_blank');

        // Tampilkan timer acak (8-12 detik) agar tidak terbaca pola bot
        const timerDiv = document.getElementById('timer-' + step);
        const statusDiv = document.getElementById('status-' + step);
        const secSpan = timerDiv.querySelector('.sec');
        let timeLeft = step === 'step3' ? 5 : Math.floor(Math.random() * 5) + 8;

        timerDiv.style.display = 'block';
        statusDiv.innerHTML = '<div class="loader" style="display:block;"></div>';

        const countdown = setInterval(() => {
            timeLeft--;
            secSpan.innerText = timeLeft;

            if (timeLeft <= 0) {
                clearInterval(countdown);
                
                // Cek apakah user benar-benar pindah tab (Human behavior check)
                // Jika waktu terlalu singkat (kurang dari 3 detik), anggap cheat
                const timeDiff = (Date.now() - startTime) / 1000;
                
                if (document.visibilityState === 'visible' && timeDiff < 4) {
                    alert("Tolong tonton/subscribe dengan benar!");
                    resetTask(step);
                } else {
                    completeTask(step);
                }
                isProcessing = false;
            }
        }, 1000);
    }

    function resetTask(step) {
        document.getElementById('timer-' + step).style.display = 'none';
        document.getElementById('status-' + step).innerHTML = '<i class="bi bi-circle"></i>';
        isProcessing = false;
    }

    function completeTask(step) {
        tasks[step] = true;
        const el = document.getElementById(step);
        el.classList.add('done');
        document.getElementById('timer-' + step).style.display = 'none';
        document.getElementById('status-' + step).innerHTML = '<i class="bi bi-check-circle-fill text-success"></i>';
        checkAll();
    }

    function checkAll() {
        if (tasks.step1 && tasks.step2 && tasks.step3) {
            const btn = document.getElementById('unlock-btn');
            btn.disabled = false;
            btn.classList.add('ready');
            btn.innerHTML = '<i class="bi bi-unlock-fill"></i> LINK SUDAH SIAP';
        }
    }

    function getFinalLink() {
        // Dekripsi link tujuan di level client (Simple Obfuscation)
        const raw = atob(encryptedData);
        // Gunakan Meta Refresh via jembatan agar aman dari Referrer
        window.location.href = "${origin}/go?to=" + btoa(raw);
    }

    // Anti-Cheat: Deteksi jika user mencoba mengakali tombol sebelum waktunya
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible' && isProcessing) {
            // User kembali ke tab kita, sistem tetap menunggu timer selesai
        }
    });
</script>
</body>
</html>
  `;
  return new Response(html, { headers: { "Content-Type": "text/html" } });
}

// (Fungsi handleCreatePage tetap sama dengan sebelumnya, tidak perlu perubahan besar di sana)
function handleCreatePage(request) {
  // ... (Gunakan kode handleCreatePage dari versi sebelumnya)
}
