/* =============================================
   SiKeuangan - Modul Autentikasi
   File: assets/js/auth.js
   Bergantung pada: utils.js
   ============================================= */

let currentUser = null;

// ---- Ganti tab Login / Daftar ----
function switchTab(tab) {
    document.querySelectorAll('.auth-tab').forEach((t, i) => {
        t.classList.toggle('active', (i === 0 && tab === 'login') || (i === 1 && tab === 'register'));
    });
    document.getElementById('login-form').style.display    = tab === 'login'    ? 'block' : 'none';
    document.getElementById('register-form').style.display = tab === 'register' ? 'block' : 'none';
}

// ---- Login ----
async function doLogin() {
    const username = document.getElementById('login-username').value.trim();
    const password = document.getElementById('login-password').value;
    if (!username || !password) return showAlert('auth-alert', 'Username dan password wajib diisi');

    const r = await api('auth.php?action=login', {
        method: 'POST',
        body: JSON.stringify({ username, password })
    });
    if (r.error) return showAlert('auth-alert', r.error);

    currentUser = r.user;
    enterApp();
}

// ---- Register ----
async function doRegister() {
    const nama     = document.getElementById('reg-nama').value.trim();
    const username = document.getElementById('reg-username').value.trim();
    const password = document.getElementById('reg-password').value;
    if (!nama || !username || !password) return showAlert('auth-alert', 'Semua field wajib diisi');

    const r = await api('auth.php?action=register', {
        method: 'POST',
        body: JSON.stringify({ nama, username, password })
    });
    if (r.error) return showAlert('auth-alert', r.error);

    showAlert('auth-alert', 'Berhasil daftar! Silakan login.', 'success');
    switchTab('login');
}

// ---- Logout ----
async function doLogout() {
    await api('auth.php?action=logout');
    document.getElementById('auth-page').style.display = 'flex';
    document.getElementById('app').style.display       = 'none';
    currentUser = null;
}

// ---- Cek session saat halaman dibuka ----
async function checkAuth() {
    const r = await api('auth.php?action=check');
    if (r.loggedIn) {
        currentUser = r.user;
        enterApp();
    }
}

// ---- Masuk ke aplikasi setelah auth berhasil ----
function enterApp() {
    document.getElementById('auth-page').style.display = 'none';
    document.getElementById('app').style.display       = 'block';
    document.getElementById('sidebar-user').textContent = currentUser.nama;

    // Set nilai default tanggal di semua halaman
    document.getElementById('pm-tanggal').value  = todayDate();
    document.getElementById('pg-tanggal').value  = todayDate();
    document.getElementById('hpp-tanggal').value = todayDate();
    document.getElementById('bep-tanggal').value = todayDate();
    document.getElementById('lap-bulan').value   = currentMonth();

    loadDashboard();
}
