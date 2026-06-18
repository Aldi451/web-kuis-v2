// js/supabase.js

(function () {
  // Use environment variables if available, otherwise check localStorage
  let supabaseUrl = localStorage.getItem('supabase_url') || window.ENV_SUPABASE_URL || 'https://qtcdtudnzlvrvtyyygwa.supabase.co';
  let supabaseKey = localStorage.getItem('supabase_key') || window.ENV_SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF0Y2R0dWRuemx2cnZ0eXl5Z3dhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMyMjEzMzAsImV4cCI6MjA4ODc5NzMzMH0.gVHcnBmD06MAMf7kw4QqHZZapuLqZ03Bqh4lFCPCu3k';

  window.initSupabase = function(url, key) {
    const { createClient } = window.supabase;
    window.supabaseClient = createClient(url, key);
    console.log("Supabase Client initialized successfully!");
  };

  if (!supabaseUrl || !supabaseKey) {
    // Inject custom modal style if not already present
    if (!document.getElementById('supabase-config-style')) {
      const style = document.createElement('style');
      style.id = 'supabase-config-style';
      style.textContent = `
        .config-overlay {
          position: fixed;
          top: 0; left: 0; width: 100vw; height: 100vh;
          background: rgba(11, 15, 25, 0.9);
          backdrop-filter: blur(20px);
          z-index: 99999;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .config-modal {
          max-width: 480px;
          width: 90%;
        }
      `;
      document.head.appendChild(style);
    }

    // Render configuration modal
    const overlay = document.createElement('div');
    overlay.className = 'config-overlay';
    overlay.innerHTML = `
      <div class="glass-panel config-modal p-6 text-center">
        <h2 class="mb-4 text-gradient" style="font-size: 1.8rem;">Setup Supabase</h2>
        <p class="text-muted mb-6" style="font-size: 0.9rem;">Masukkan Supabase Project URL dan Anon Key untuk menghubungkan aplikasi kuis ini dengan database Anda.</p>
        <div class="flex flex-col gap-4 text-left">
          <div>
            <label style="font-size: 0.8rem; color: var(--text-muted); font-weight: 600;">SUPABASE URL</label>
            <input type="text" id="setup-url" class="input-field mt-4" placeholder="https://xxxxxx.supabase.co" />
          </div>
          <div>
            <label style="font-size: 0.8rem; color: var(--text-muted); font-weight: 600;">SUPABASE ANON KEY</label>
            <input type="password" id="setup-key" class="input-field mt-4" placeholder="eyJhbGciOi..." />
          </div>
          <button id="btn-save-config" class="btn btn-primary w-full mt-4">Hubungkan Database</button>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    document.getElementById('btn-save-config').addEventListener('click', () => {
      const urlInput = document.getElementById('setup-url').value.trim();
      const keyInput = document.getElementById('setup-key').value.trim();

      if (urlInput && keyInput) {
        localStorage.setItem('supabase_url', urlInput);
        localStorage.setItem('supabase_key', keyInput);
        window.location.reload();
      } else {
        alert('Mohon isi kedua kolom konfigurasi!');
      }
    });

    return;
  }

  // Initialize Supabase client safely
  if (window.supabase && typeof window.supabase.createClient === 'function') {
    const { createClient } = window.supabase;
    window.supabaseClient = createClient(supabaseUrl, supabaseKey);
    console.log("Supabase Client initialized successfully!");
  } else {
    console.error("Supabase SDK not loaded. Ensure supabase-js script is included before supabase.js.");
    // Do not clear credentials; keep them for retry after SDK loads.
  }
})();
