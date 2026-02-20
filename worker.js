// --- LOGIKA HALAMAN USER (SUB4UNLOCK PRO - INSTANT VERIFY) ---
async function handleUserPage(id, env) {
  const dataRaw = await env.DATABASE.get(id);
  
  if (!dataRaw) {
    return new Response("Link Tidak Ditemukan atau Sudah Kadaluarsa.", { status: 404 });
  }
  
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
        :root {
            --primary: #ef4444; 
            --wa-color: #25D366;
            --bg-dark: #111827;
            --card-bg: #1f2937;
        }
        body {
            background-color: var(--bg-dark);
            font-family: 'Poppins', sans-serif;
            color: white;
            min-height: 100vh;
            display: flex; flex-direction: column; align-items: center; justify-content: center;
        }
        .main-card {
            background: var(--card-bg);
            border-radius: 24px; padding: 2rem; width: 90%; max-width: 420px;
            box-shadow: 0 20px 50px rgba(0,0,0,0.5); border: 1px solid #374151;
            position: relative; overflow: hidden;
        }
        .main-card::before {
            content: ''; position: absolute; top:0; left:0; right:0; height: 6px;
            background: linear-gradient(90deg, #ef4444, #25D366);
        }
        .title-text { font-weight: 800; font-size: 1.5rem; text-align: center; margin-bottom: 5px; }
        .subtitle { text-align: center; color: #9ca3af; font-size: 0.9rem; margin-bottom: 25px; }
        
        .action-btn {
            display: flex; align-items: center; justify-content: space-between;
            padding: 15px 20px; margin-bottom: 12px;
            background: #374151; border-radius: 14px; cursor: pointer;
            transition: all 0.3s ease; text-decoration: none; color: white;
            border: 1px solid transparent; user-select: none;
        }
        .action-btn:hover { background: #4b5563; transform: translateY(-2px); }
        .action-btn.completed { background: #064e3b; border-color: #10b981; cursor: default; transform: none; }
        .action-btn.completed .status-icon { color: #10b981; }
        
        .icon-box {
            width: 40px; height: 40px; border-radius: 10px;
            display: flex; align-items: center; justify-content: center;
            font-size: 1.2rem; margin-right: 15px;
        }
        .yt-icon { background: rgba(239, 68, 68, 0.2); color: #ef4444; }
        .wa-icon { background: rgba(37, 211, 102, 0.2); color: #25D366; }
        
        .btn-text { flex: 1; font-weight: 600; font-size: 0.95rem; }
        .status-icon { font-size: 1.2rem; color: #6b7280; }

        .unlock-wrapper { margin-top: 25px; }
        #unlock-btn {
            width: 100%; padding: 16px; border-radius: 14px; font-weight: 800; font-size: 1.1rem;
            text-transform: uppercase; letter-spacing: 1px;
            background: #374151; color: #9ca3af; border: none; transition: all 0.3s;
        }
        #unlock-btn.active {
            background: linear-gradient(45deg, #3b82f6, #8b5cf6); color: white;
            box-shadow: 0 0 20px rgba(59, 130, 246, 0.5); cursor: pointer;
            animation: pulse 2s infinite;
        }
        @keyframes pulse { 0% {box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.7);} 70% {box-shadow: 0 0 0 10px rgba(59, 130, 246, 0);} 100% {box-shadow: 0 0 0 0 rgba(59, 130, 246, 0);} }

        .progress-container { width: 100%; height: 6px; background: #374151; border-radius: 10px; margin-bottom: 25px; overflow: hidden; }
        #progress-fill { height: 100%; background: #10b981; width: 0%; transition: width 0.5s ease; }

        /* Pesan Error / Status */
        .checking-state { font-size: 0.8rem; color: #fbbf24; font-style: italic; display: none; }
        .error-state { font-size: 0.8rem; color: #f87171; display: none; margin-top: 2px; }
    </style>
</head>
<body>

    <div class="main-card">
        <div class="title-text">Link Terkunci <i class="bi bi-lock-fill"></i></div>
        <div class="subtitle">Selesaikan langkah untuk membuka</div>

        <div class="progress-container">
            <div id="progress-fill"></div>
        </div>

        <!-- STEP 1 -->
        <div class="action-btn" id="btn-sub" onclick="initTask('sub', '${data.yt_sub}')">
            <div class="icon-box yt-icon"><i class="bi bi-youtube"></i></div>
            <div class="btn-text">
                <div>Subscribe Channel</div>
                <div class="checking-state" id="msg-sub"></div>
                <div class="error-state" id="err-sub"></div>
            </div>
            <div class="status-icon" id="icon-sub"><i class="bi bi-chevron-right"></i></div>
        </div>

        <!-- STEP 2 -->
        <div class="action-btn" id="btn-like" onclick="initTask('like', '${data.yt_vid}')">
            <div class="icon-box yt-icon" style="background: rgba(255,255,255,0.1); color:white;"><i class="bi bi-hand-thumbs-up-fill"></i></div>
            <div class="btn-text">
                <div>Like & Comment</div>
                <div class="checking-state" id="msg-like"></div>
                <div class="error-state" id="err-like"></div>
            </div>
            <div class="status-icon" id="icon-like"><i class="bi bi-chevron-right"></i></div>
        </div>

        <!-- STEP 3 -->
        <div class="action-btn" id="btn-wa" onclick="initTask('wa', '${data.wa_link}')">
            <div class="icon-box wa-icon"><i class="bi bi-whatsapp"></i></div>
            <div class="btn-text">
                <div>Join Saluran WA</div>
                <div class="checking-state" id="msg-wa"></div>
                <div class="error-state" id="err-wa"></div>
            </div>
            <div class="status-icon" id="icon-wa"><i class="bi bi-chevron-right"></i></div>
        </div>

        <div class="unlock-wrapper">
            <button id="unlock-btn" disabled onclick="finalLink()">
                <i class="bi bi-lock"></i> TERKUNCI
            </button>
        </div>
    </div>

    <script>
        const _0xTarget = "${encodeURIComponent(data.target)}";
        let status = { sub: false, like: false, wa: false };
        
        let currentTask = null;
        let hasLeftPage = false; // Penanda user sudah pindah aplikasi atau belum

        function initTask(type, url) {
            if (status[type]) return; // Kalau sudah selesai, skip
            
            // Reset status
            currentTask = type;
            hasLeftPage = false;
            
            document.getElementById('err-' + type).style.display = 'none';
            document.getElementById('msg-' + type).innerText = "Sedang memeriksa...";
            document.getElementById('msg-' + type).style.display = 'block';

            // Buka Link
            window.open(url, '_blank');
        }

        // DETEKSI VISIBILITY
        // Cukup cek: Dia pergi -> Dia kembali -> OK
        document.addEventListener("visibilitychange", () => {
            if (!currentTask) return; 

            if (document.visibilityState === "hidden") {
                // User PINDAH TAB / BUKA APLIKASI
                hasLeftPage = true; 
            } 
            else if (document.visibilityState === "visible") {
                // User KEMBALI
                checkReturn();
            }
        });

        function checkReturn() {
            if (hasLeftPage) {
                // SUKSES: Karena user terdeteksi sempat keluar halaman (membuka app)
                markComplete(currentTask);
            } else {
                // GAGAL: User klik tapi tidak jadi buka (cancel/diam)
                showError(currentTask, "Klik link dan buka aplikasinya dulu!");
            }

            // Reset
            currentTask = null;
            hasLeftPage = false;
        }

        function showError(type, text) {
            const msgEl = document.getElementById('msg-' + type);
            const errEl = document.getElementById('err-' + type);
            
            msgEl.style.display = 'none';
            errEl.style.display = 'block';
            errEl.innerText = text;
        }

        function markComplete(type) {
            status[type] = true;
            
            const btn = document.getElementById('btn-' + type);
            const icon = document.getElementById('icon-' + type);
            const msg = document.getElementById('msg-' + type);
            const err = document.getElementById('err-' + type);

            btn.classList.add('completed');
            icon.innerHTML = '<i class="bi bi-check-circle-fill"></i>';
            msg.style.display = 'none';
            err.style.display = 'none';

            updateProgress();
        }

        function updateProgress() {
            let count = 0;
            if (status.sub) count++;
            if (status.like) count++;
            if (status.wa) count++;

            const percent = (count / 3) * 100;
            document.getElementById('progress-fill').style.width = percent + '%';

            if (count === 3) {
                enableUnlock();
            }
        }

        function enableUnlock() {
            const mainBtn = document.getElementById('unlock-btn');
            mainBtn.disabled = false;
            mainBtn.classList.add('active');
            mainBtn.innerHTML = '<i class="bi bi-unlock-fill"></i> BUKA LINK';
        }

        function finalLink() {
            if (!status.sub || !status.like || !status.wa) return;
            const realUrl = decodeURIComponent(_0xTarget);
            const link = document.createElement('a');
            link.href = realUrl;
            link.rel = 'noreferrer noopener';
            link.target = '_blank';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    </script>
</body>
</html>
  `;

  return new Response(html, { headers: { "Content-Type": "text/html" } });
}
