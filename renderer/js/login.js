// ============================================================
//  LOGIN PAGE LOGIC
// ============================================================

let BACKEND_URL = '';

// ---- Initialize ----
document.addEventListener('DOMContentLoaded', async () => {
    // Get backend URL
    BACKEND_URL = await window.electronAPI.getBackendUrl();

    // Auto-fill Windows username
    const userInfo = await window.electronAPI.getWindowsUser();
    const usernameInput = document.getElementById('username');
    const domainInfo = document.getElementById('domainInfo');

    if (userInfo.username) {
        usernameInput.value = userInfo.username;
        usernameInput.placeholder = userInfo.username;
    }

    if (userInfo.domain) {
        domainInfo.textContent = `${userInfo.domain}\\${userInfo.username}`;
    } else {
        domainInfo.textContent = 'Local Machine';
    }

    // Focus password field
    document.getElementById('password').focus();

    // Animate login card entrance
    const card = document.getElementById('loginCard');
    card.style.opacity = '0';
    card.style.transform = 'translateY(30px) scale(0.95)';
    requestAnimationFrame(() => {
        card.style.transition = 'all 0.8s cubic-bezier(0.16, 1, 0.3, 1)';
        card.style.opacity = '1';
        card.style.transform = 'translateY(0) scale(1)';
    });
});

// ---- Window Controls ----
document.getElementById('btnMinimize').addEventListener('click', () => {
    window.electronAPI.minimize();
});

document.getElementById('btnClose').addEventListener('click', () => {
    window.electronAPI.close();
});

// ---- Toggle Password Visibility ----
document.getElementById('togglePassword').addEventListener('click', () => {
    const pwd = document.getElementById('password');
    const icon = document.querySelector('#togglePassword i');

    if (pwd.type === 'password') {
        pwd.type = 'text';
        icon.classList.remove('fa-eye');
        icon.classList.add('fa-eye-slash');
    } else {
        pwd.type = 'password';
        icon.classList.remove('fa-eye-slash');
        icon.classList.add('fa-eye');
    }
});

// ---- Login Form Submit ----
document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;
    const loginBtn = document.getElementById('loginBtn');
    const btnText = loginBtn.querySelector('.btn-text');
    const btnLoading = loginBtn.querySelector('.btn-loading');
    const errorDiv = document.getElementById('loginError');

    if (!password) {
        showError('Vui lòng nhập mật khẩu.');
        return;
    }

    // Show loading state
    btnText.style.display = 'none';
    btnLoading.style.display = 'inline-flex';
    loginBtn.disabled = true;
    errorDiv.style.display = 'none';

    try {
        const response = await fetch(`${BACKEND_URL}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        const result = await response.json();

        if (result.success) {
            // Success animation
            const card = document.getElementById('loginCard');
            card.style.transition = 'all 0.5s cubic-bezier(0.16, 1, 0.3, 1)';
            card.style.opacity = '0';
            card.style.transform = 'translateY(-20px) scale(0.95)';

            // Store user info in sessionStorage for dashboard
            sessionStorage.setItem('user', JSON.stringify(result.user));

            // Navigate to dashboard
            setTimeout(() => {
                window.electronAPI.navigateToDashboard();
            }, 500);
        } else {
            showError(result.error || 'Sai mật khẩu hoặc tài khoản bị khóa.');
        }

    } catch (err) {
        console.error('Login error:', err);
        showError('Không thể kết nối đến server. Backend đang khởi động...');
    } finally {
        btnText.style.display = 'inline';
        btnLoading.style.display = 'none';
        loginBtn.disabled = false;
    }
});

// ---- Show Error ----
function showError(message) {
    const errorDiv = document.getElementById('loginError');
    const errorMsg = document.getElementById('errorMessage');

    errorMsg.textContent = message;
    errorDiv.style.display = 'flex';

    // Shake animation
    const card = document.getElementById('loginCard');
    card.style.animation = 'shake 0.4s ease';
    setTimeout(() => {
        card.style.animation = '';
    }, 400);
}
