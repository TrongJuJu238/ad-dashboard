// ============================================================
//  DASHBOARD LOGIC
// ============================================================

let BACKEND_URL = '';
let currentUser = null;

// ---- Initialize ----
document.addEventListener('DOMContentLoaded', async () => {
    // Get backend URL
    BACKEND_URL = await window.electronAPI.getBackendUrl();

    // Load user info from session storage
    const userStr = sessionStorage.getItem('user');
    if (userStr) {
        currentUser = JSON.parse(userStr);
        document.getElementById('userName').textContent = currentUser.username || 'Unknown';
        document.getElementById('userAvatar').textContent = (currentUser.username || 'U').charAt(0).toUpperCase();
        
        // Load groups or role if available
        if (currentUser.groups && currentUser.groups.length > 0) {
            document.getElementById('userRole').textContent = 'Admin / IT Support';
        }
    } else {
        // Fallback or debug
        document.getElementById('userName').textContent = 'Dev Mode';
    }

    // Default tab
    switchTab('users');

    // Setup sidebar navigation via JS (more reliable in Electron)
    setupSidebarNavigation();
});

// ---- Sidebar Navigation ----
function setupSidebarNavigation() {
    document.querySelectorAll('.menu-item').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const tabId = item.dataset.tab;
            if (tabId) {
                switchTab(tabId);
            }
        });
    });
}

// ---- Window Controls ----
document.getElementById('btnMinimize').addEventListener('click', () => {
    window.electronAPI.minimize();
});

document.getElementById('btnMaximize').addEventListener('click', () => {
    window.electronAPI.maximize();
});

document.getElementById('btnClose').addEventListener('click', () => {
    window.electronAPI.close();
});

// ---- Navigation (Tab Switching) ----
function switchTab(tabId) {
    // Update active menu item
    document.querySelectorAll('.menu-item').forEach(item => {
        item.classList.remove('active');
    });
    
    const activeItem = document.querySelector(`.menu-item[data-tab="${tabId}"]`);
    if (activeItem) activeItem.classList.add('active');

    // Update Header
    const headers = {
        'users': { title: 'User Management', desc: 'Quản lý Active Directory Users hiệu quả.' },
        'computers': { title: 'Computer Management', desc: 'Quản lý máy tính và Remote Desktop.' },
        'tasks': { title: 'Task & Call Log', desc: 'Theo dõi yêu cầu hỗ trợ và công việc.' },
        'calendar': { title: 'Shift Calendar', desc: 'Lịch trực IT Helpdesk.' },
        'logs': { title: 'Audit Logs', desc: 'Lịch sử thao tác hệ thống.' },
        'settings': { title: 'Settings', desc: 'Cấu hình ứng dụng.' }
    };

    if (headers[tabId]) {
        document.getElementById('dashboardHeader').innerHTML = `
            <h1>${headers[tabId].title}</h1>
            <p>${headers[tabId].desc}</p>
        `;
    }

    // Update Content
    const contentArea = document.getElementById('contentArea');
    contentArea.innerHTML = `<div style="padding: 20px; color: var(--text-muted);">
        <i class="fas fa-spinner fa-spin"></i> Đang tải dữ liệu module ${tabId}...
    </div>`;

    // Dispatch custom event for modules to listen to
    const event = new CustomEvent('tabChanged', { detail: { tabId } });
    window.dispatchEvent(event);
    
    setTimeout(() => {
        if (tabId === 'users') {
            renderUsersTab();
        } else if (tabId === 'computers') {
            renderComputersTab();
        } else if (tabId === 'tasks') {
            renderTasksTab();
        } else if (tabId === 'calendar') {
            renderCalendarTab();
        } else if (tabId === 'logs') {
            renderLogsTab();
        } else if (tabId === 'settings') {
            renderSettingsTab();
        } else {
            renderPlaceholderContent(tabId, contentArea);
        }
    }, 50);
}

function renderPlaceholderContent(tabId, container) {
    container.innerHTML = `
        <div style="background: var(--bg-card); padding: 24px; border-radius: 8px; border: 1px solid var(--border-light);">
            <h3>Module ${tabId.toUpperCase()}</h3>
            <p style="color: var(--text-muted); margin-top: 10px;">Chức năng này sẽ được cài đặt trong các bước tiếp theo.</p>
        </div>
    `;
}

function refreshCurrentTab() {
    const activeTab = document.querySelector('.menu-item.active').dataset.tab;
    showToast(`Đang làm mới ${activeTab}...`, 'info');
    if (activeTab === 'users') {
        searchUsers(document.getElementById('globalSearch').value.trim());
    } else if (activeTab === 'computers') {
        searchComputers(document.getElementById('globalSearch').value.trim());
    } else if (activeTab === 'tasks') {
        loadTasks();
    } else if (activeTab === 'calendar') {
        renderCalendarTab();
    } else if (activeTab === 'logs') {
        renderLogsTab();
    } else if (activeTab === 'settings') {
        renderSettingsTab();
    } else {
        switchTab(activeTab);
    }
}

// ---- Modals ----
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('active');
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('active');
    }
}

// Close modals when clicking outside
window.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal-overlay')) {
        e.target.classList.remove('active');
    }
});

// ---- UI Utilities ----
function showToast(message, type = 'success') {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    let icon = 'info-circle';
    if (type === 'success') icon = 'check-circle';
    if (type === 'error') icon = 'exclamation-circle';
    if (type === 'warning') icon = 'exclamation-triangle';

    toast.innerHTML = `
        <i class="fas fa-${icon}"></i>
        <div class="toast-content">${message}</div>
    `;

    container.appendChild(toast);

    // Trigger animation
    requestAnimationFrame(() => {
        toast.style.opacity = '1';
        toast.style.transform = 'translateY(0)';
    });

    // Auto remove
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(10px)';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

function showLoading() {
    document.getElementById('loadingOverlay').classList.add('active');
}

function hideLoading() {
    document.getElementById('loadingOverlay').classList.remove('active');
}

// ============================================================
//  USER MANAGEMENT MODULE (Part 4)
// ============================================================

let currentUsers = [];

document.getElementById('globalSearch')?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        const keyword = e.target.value.trim();
        const activeTab = document.querySelector('.menu-item.active')?.dataset.tab;
        
        if (activeTab === 'users') {
            searchUsers(keyword);
        } else if (activeTab === 'computers') {
            searchComputers(keyword);
        }
    }
});

function renderUsersTab() {
    const contentArea = document.getElementById('contentArea');
    contentArea.innerHTML = `
        <div class="table-controls" style="margin-bottom: 16px; display: flex; justify-content: space-between;">
            <div class="filters" style="display:flex; gap: 10px;">
                <select id="userFilter" class="form-select" onchange="filterUsers()" style="padding: 8px; border-radius: 6px; background: var(--bg-card); color: var(--text-primary); border: 1px solid var(--border-light);">
                    <option value="all">Tất cả trạng thái</option>
                    <option value="active">Active</option>
                    <option value="locked">Locked</option>
                </select>
            </div>
            <div class="actions">
                <button class="btn btn-primary btn-sm" onclick="openCompareDialog()">
                    <i class="fas fa-code-compare"></i> So sánh 2 User
                </button>
            </div>
        </div>
        <div class="table-responsive">
            <table class="data-table" id="usersTable">
                <thead>
                    <tr>
                        <th>Name / ID</th>
                        <th>Account</th>
                        <th>Description</th>
                        <th>Status</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody id="usersTableBody">
                    <tr>
                        <td colspan="5" style="text-align:center; color: var(--text-muted); padding: 30px;">
                            <i class="fas fa-search" style="font-size: 24px; opacity: 0.5; margin-bottom: 10px; display: block;"></i>
                            Nhập từ khóa và nhấn Enter để tìm kiếm User
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    `;
    
    // Auto search with current search bar value
    searchUsers(document.getElementById('globalSearch').value.trim());
}

async function searchUsers(keyword) {
    showLoading();
    try {
        const response = await fetch(`${BACKEND_URL}/api/users/search`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ keyword })
        });
        const res = await response.json();
        if (res.success) {
            currentUsers = res.data;
            filterUsers();
        } else {
            showToast(res.error || "Lỗi tìm kiếm", "error");
        }
    } catch (e) {
        showToast("Lỗi kết nối Backend", "error");
    } finally {
        hideLoading();
    }
}

function filterUsers() {
    const filter = document.getElementById('userFilter')?.value || 'all';
    const tbody = document.getElementById('usersTableBody');
    if (!tbody) return;

    let filtered = currentUsers;
    if (filter === 'active') {
        filtered = currentUsers.filter(u => !u.LockedOut);
    } else if (filter === 'locked') {
        filtered = currentUsers.filter(u => u.LockedOut);
    }

    if (filtered.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding: 20px;">Không tìm thấy user nào</td></tr>`;
        return;
    }

    tbody.innerHTML = filtered.map(u => `
        <tr>
            <td>
                <div style="font-weight: 600; color: var(--text-primary);">${u.DisplayName}</div>
                <div style="font-size: 12px; color: var(--text-muted); margin-top: 4px;">ID: ${u.employeeID}</div>
            </td>
            <td>
                <div style="color: var(--accent-blue);">${u.SamAccountName}</div>
                <div style="font-size: 12px; color: var(--text-muted); margin-top: 4px;">${u.DepartmentOU}</div>
            </td>
            <td>${u.Description}</td>
            <td>
                ${u.LockedOut 
                    ? '<span class="badge" style="background: rgba(239,68,68,0.2); color: #ef4444; padding: 4px 8px; border-radius: 4px;"><i class="fas fa-lock"></i> Locked</span>' 
                    : '<span class="badge" style="background: rgba(34,197,94,0.2); color: #22c55e; padding: 4px 8px; border-radius: 4px;"><i class="fas fa-check-circle"></i> Active</span>'}
            </td>
            <td>
                <div style="display: flex; gap: 8px;">
                    <button class="btn btn-sm btn-ghost" onclick="viewGroups('${u.SamAccountName}')" title="Xem Groups">
                        <i class="fas fa-layer-group"></i>
                    </button>
                    ${u.LockedOut 
                        ? `<button class="btn btn-sm btn-primary" onclick="unlockUser('${u.SamAccountName}')" title="Unlock">
                            <i class="fas fa-unlock"></i>
                           </button>` 
                        : ''}
                </div>
            </td>
        </tr>
    `).join('');
}

async function unlockUser(sam) {
    if (!confirm(`Bạn có chắc muốn unlock account ${sam}?`)) return;
    
    showLoading();
    try {
        const response = await fetch(`${BACKEND_URL}/api/users/unlock`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sam })
        });
        const res = await response.json();
        if (res.success) {
            showToast(`Unlock ${sam} thành công!`, "success");
            searchUsers(document.getElementById('globalSearch').value.trim());
        } else {
            showToast(res.error || "Unlock thất bại", "error");
        }
    } catch (e) {
        showToast("Lỗi kết nối", "error");
    } finally {
        hideLoading();
    }
}

async function viewGroups(sam) {
    showLoading();
    try {
        const response = await fetch(`${BACKEND_URL}/api/users/groups/${sam}`);
        const res = await response.json();
        if (res.success) {
            const list = document.getElementById('groupList');
            if (res.groups.length === 0) {
                list.innerHTML = '<p style="color:var(--text-muted);">User không thuộc group nào.</p>';
            } else {
                list.innerHTML = res.groups.map(g => `<div style="padding: 10px; border-bottom: 1px solid var(--border-light); color: var(--text-primary);"><i class="fas fa-users" style="color:var(--accent-purple); margin-right: 10px;"></i> ${g}</div>`).join('');
            }
            openModal('groupModal');
        } else {
            showToast("Lỗi lấy thông tin groups", "error");
        }
    } catch (e) {
        showToast("Lỗi kết nối", "error");
    } finally {
        hideLoading();
    }
}

function openCompareDialog() {
    const user1 = prompt("Nhập SAM Account User 1:");
    if (!user1) return;
    const user2 = prompt("Nhập SAM Account User 2:");
    if (!user2) return;
    
    compareUsers(user1.trim(), user2.trim());
}

async function compareUsers(user1, user2) {
    showLoading();
    try {
        const response = await fetch(`${BACKEND_URL}/api/users/compare/${user1}/${user2}`);
        const res = await response.json();
        if (res.success) {
            document.getElementById('compareUserA').textContent = user1;
            document.getElementById('compareUserB').textContent = user2;
            
            const tbody = document.getElementById('compareTable');
            tbody.innerHTML = res.data.map(item => `
                <tr>
                    <td style="color: var(--text-primary);">${item.group}</td>
                    <td style="text-align:center;">${item.user1 ? '<i class="fas fa-check" style="color: #22c55e;"></i>' : '<i class="fas fa-times" style="color: #ef4444; opacity: 0.5;"></i>'}</td>
                    <td style="text-align:center;">${item.user2 ? '<i class="fas fa-check" style="color: #22c55e;"></i>' : '<i class="fas fa-times" style="color: #ef4444; opacity: 0.5;"></i>'}</td>
                </tr>
            `).join('');
            
            openModal('compareModal');
        } else {
            showToast("Lỗi so sánh", "error");
        }
    } catch (e) {
        showToast("Lỗi kết nối", "error");
    } finally {
        hideLoading();
    }
}

// ============================================================
//  COMPUTER MANAGEMENT MODULE (Part 5)
// ============================================================

let currentComputers = [];

function renderComputersTab() {
    const contentArea = document.getElementById('contentArea');
    contentArea.innerHTML = `
        <div class="table-controls" style="margin-bottom: 16px; display: flex; justify-content: space-between;">
            <div class="filters" style="display:flex; gap: 10px;">
                <select id="compSort" class="form-select" onchange="filterComputers()" style="padding: 8px; border-radius: 6px; background: var(--bg-card); color: var(--text-primary); border: 1px solid var(--border-light);">
                    <option value="name">Sắp xếp: Tên A-Z</option>
                    <option value="dept">Sắp xếp: Phòng ban</option>
                    <option value="ip">Sắp xếp: IP (Online trước)</option>
                </select>
            </div>
        </div>
        <div class="table-responsive">
            <table class="data-table" id="computersTable">
                <thead>
                    <tr>
                        <th>Computer Name</th>
                        <th>IP Address</th>
                        <th>Department / OU</th>
                        <th>Description</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody id="computersTableBody">
                    <tr>
                        <td colspan="5" style="text-align:center; color: var(--text-muted); padding: 30px;">
                            <i class="fas fa-desktop" style="font-size: 24px; opacity: 0.5; margin-bottom: 10px; display: block;"></i>
                            Nhập từ khóa và nhấn Enter để tìm kiếm Computer
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    `;
    
    // Auto search with current search bar value
    searchComputers(document.getElementById('globalSearch')?.value.trim() || '');
}

async function searchComputers(keyword) {
    showLoading();
    try {
        const response = await fetch(`${BACKEND_URL}/api/computers/search`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ keyword })
        });
        const res = await response.json();
        if (res.success) {
            currentComputers = res.data;
            filterComputers();
        } else {
            showToast(res.error || "Lỗi tìm kiếm Computer", "error");
        }
    } catch (e) {
        showToast("Lỗi kết nối Backend", "error");
    } finally {
        hideLoading();
    }
}

function filterComputers() {
    const sort = document.getElementById('compSort')?.value || 'name';
    const tbody = document.getElementById('computersTableBody');
    if (!tbody) return;

    let filtered = [...currentComputers];
    
    // Sorting
    if (sort === 'name') {
        filtered.sort((a, b) => (a.Name || '').localeCompare(b.Name || ''));
    } else if (sort === 'dept') {
        filtered.sort((a, b) => (a.Department || '').localeCompare(b.Department || ''));
    } else if (sort === 'ip') {
        filtered.sort((a, b) => {
            if (a.IP === 'Offline' && b.IP !== 'Offline') return 1;
            if (a.IP !== 'Offline' && b.IP === 'Offline') return -1;
            return (a.IP || '').localeCompare(b.IP || '');
        });
    }

    if (filtered.length === 0) {
        tbody.innerHTML = \`<tr><td colspan="5" style="text-align:center; padding: 20px;">Không tìm thấy computer nào</td></tr>\`;
        return;
    }

    tbody.innerHTML = filtered.map(c => \`
        <tr>
            <td>
                <div style="font-weight: 600; color: var(--text-primary);"><i class="fas fa-desktop" style="color:var(--text-muted); margin-right:6px;"></i>\${c.Name}</div>
            </td>
            <td>
                \${c.IP === 'Offline' 
                    ? '<span class="badge" style="background: rgba(239,68,68,0.2); color: #ef4444; padding: 4px 8px; border-radius: 4px;">Offline</span>' 
                    : \`<span class="badge" style="background: rgba(34,197,94,0.2); color: #22c55e; padding: 4px 8px; border-radius: 4px;">\${c.IP}</span>\`}
            </td>
            <td>
                <div style="color: var(--accent-blue); font-weight:500;">\${c.Department}</div>
                <div style="font-size: 12px; color: var(--text-muted); margin-top: 4px;">\${c.OU}</div>
            </td>
            <td>\${c.Description}</td>
            <td>
                <button class="btn btn-sm btn-primary" onclick="remoteComputer('\${c.Name}')" title="DameWare Remote" \${c.IP === 'Offline' ? 'disabled style="opacity:0.5; cursor:not-allowed;"' : ''}>
                    <i class="fas fa-satellite-dish"></i> Remote
                </button>
            </td>
        </tr>
    \`).join('');
}

async function remoteComputer(host) {
    showToast(\`Đang khởi động DameWare kết nối tới \${host}...\`, "info");
    try {
        const response = await fetch(\`\${BACKEND_URL}/api/computers/remote\`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ host })
        });
        const res = await response.json();
        if (!res.success) {
            showToast(res.error || "Không thể mở DameWare", "error");
        }
    } catch (e) {
        showToast("Lỗi kết nối", "error");
    }
}

// ============================================================
//  TASK MANAGEMENT MODULE (Part 6)
// ============================================================

function renderTasksTab() {
    const contentArea = document.getElementById('contentArea');
    contentArea.innerHTML = `
        <div class="table-controls" style="margin-bottom: 16px; display: flex; justify-content: space-between;">
            <div></div>
            <div class="actions">
                <button class="btn btn-primary" onclick="openModal('taskModal')">
                    <i class="fas fa-plus"></i> New Task
                </button>
            </div>
        </div>
        <div class="table-responsive">
            <table class="data-table" id="tasksTable">
                <thead>
                    <tr>
                        <th>Task / EID</th>
                        <th>Staff / Dept</th>
                        <th>EXT / Note</th>
                        <th>Priority</th>
                        <th>Status</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody id="tasksTableBody">
                    <tr><td colspan="6" style="text-align:center;">Loading tasks...</td></tr>
                </tbody>
            </table>
        </div>
    `;

    // Submit new task
    const form = document.getElementById('newTaskForm');
    if (form) {
        form.onsubmit = async (e) => {
            e.preventDefault();
            const formData = new FormData(form);
            const data = Object.fromEntries(formData.entries());
            data.task = data.description || 'New Task';
            
            showLoading();
            try {
                const res = await fetch(`${BACKEND_URL}/api/tasks`, {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify(data)
                });
                const out = await res.json();
                if (out.success) {
                    showToast("Tạo task thành công", "success");
                    closeModal('taskModal');
                    form.reset();
                    loadTasks();
                } else {
                    showToast("Lỗi tạo task", "error");
                }
            } catch(e) {
                showToast("Lỗi kết nối", "error");
            } finally { hideLoading(); }
        };
    }

    loadTasks();
}

async function loadTasks() {
    showLoading();
    try {
        const res = await fetch(`${BACKEND_URL}/api/tasks`);
        const data = await res.json();
        if (data.success) {
            const tbody = document.getElementById('tasksTableBody');
            if(data.data.length === 0) {
                tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;">Không có task nào</td></tr>';
                return;
            }
            tbody.innerHTML = data.data.map(t => {
                let prioColor = t.priority === 'High' ? 'var(--accent-red)' : (t.priority === 'Low' ? 'var(--text-muted)' : 'var(--accent-purple)');
                let statusColor = t.status === 'Done' ? 'var(--accent-green)' : (t.status === 'In Progress' ? 'var(--accent-blue)' : 'var(--text-muted)');
                return `
                <tr>
                    <td>
                        <div style="font-weight:600;">${t.task || t.description || 'Task'}</div>
                        <div style="font-size:12px; color:var(--text-muted);">${t.eid || '-'}</div>
                    </td>
                    <td>
                        <div>${t.name || 'Unknown'}</div>
                        <div style="font-size:12px; color:var(--text-muted);">${t.dept || '-'}</div>
                    </td>
                    <td>
                        <div>EXT: ${t.ext || '-'}</div>
                        <div style="font-size:12px; color:var(--text-muted);">${t.note || ''}</div>
                    </td>
                    <td style="color:${prioColor}; font-weight:500;">${t.priority || 'Medium'}</td>
                    <td style="color:${statusColor}; font-weight:500;">${t.status || 'Todo'}</td>
                    <td>
                        <button class="btn btn-sm btn-ghost"><i class="fas fa-edit"></i></button>
                    </td>
                </tr>
            `}).join('');
            
            // Update badge
            const badge = document.getElementById('taskBadge');
            if (badge) {
                badge.textContent = data.data.filter(t => t.status !== 'Done').length;
                badge.style.display = badge.textContent > 0 ? 'inline-block' : 'none';
            }
        }
    } catch(e) {
        showToast("Lỗi tải tasks", "error");
    } finally {
        hideLoading();
    }
}

// ============================================================
//  CALENDAR MODULE (Part 6)
// ============================================================

function renderCalendarTab() {
    const contentArea = document.getElementById('contentArea');
    contentArea.innerHTML = `
        <div class="calendar-container" style="background:var(--bg-card); padding:20px; border-radius:8px;">
            <div style="display:flex; justify-content:space-between; margin-bottom:20px;">
                <h3>Ca Trực (Tháng hiện tại)</h3>
                <button class="btn btn-primary btn-sm" onclick="loadCalendar()">Làm mới</button>
            </div>
            <div id="calendarGrid" style="display:grid; grid-template-columns: repeat(7, 1fr); gap:10px;">
                <!-- Calendar cells generated here -->
            </div>
        </div>
    `;
    loadCalendar();
}

async function loadCalendar() {
    showLoading();
    try {
        const res = await fetch(`${BACKEND_URL}/api/calendar/load?staff=${encodeURIComponent(currentUser?.username || 'PHAN HUU TRONG')}`);
        const events = await res.json();
        
        const grid = document.getElementById('calendarGrid');
        if(!grid) return;
        
        // Simple 30-day view
        let html = '';
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        
        for(let i = 1; i <= 31; i++) {
            const dateStr = `${year}-${month}-${String(i).padStart(2, '0')}`;
            const shift = (events.data && events.data[dateStr]) || 'OFF';
            let color = 'var(--bg-lighter)';
            if(shift === 'M') color = 'rgba(59,130,246,0.2)'; // Morning
            if(shift === 'A') color = 'rgba(245,158,11,0.2)'; // Afternoon
            if(shift === 'N') color = 'rgba(139,92,246,0.2)'; // Night
            
            html += `
                <div style="background:${color}; padding:15px; border-radius:6px; border:1px solid var(--border-light); text-align:center; cursor:pointer;"
                     onclick="setShift('${dateStr}')">
                    <div style="font-weight:bold; margin-bottom:5px;">${i}</div>
                    <div style="font-size:14px; color:var(--text-primary);">${shift}</div>
                </div>
            `;
        }
        grid.innerHTML = html;
        
    } catch(e) {
        showToast("Lỗi tải lịch trực", "error");
    } finally {
        hideLoading();
    }
}

async function setShift(dateStr) {
    const shift = prompt(`Nhập ca trực cho ngày ${dateStr} (M, A, N, OFF):`, "M");
    if (!shift) return;
    
    showLoading();
    try {
        await fetch(`${BACKEND_URL}/api/calendar/save`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                date: dateStr,
                shift: shift.toUpperCase(),
                staff: currentUser?.username || 'PHAN HUU TRONG'
            })
        });
        loadCalendar();
    } catch(e) {
        showToast("Lỗi lưu lịch trực", "error");
        hideLoading();
    }
}

// ============================================================
//  AUDIT LOGS & SETTINGS MODULE (Part 8)
// ============================================================

function renderLogsTab() {
    const contentArea = document.getElementById('contentArea');
    contentArea.innerHTML = `
        <div style="background: var(--bg-card); padding: 20px; border-radius: 8px; height: 100%;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 16px;">
                <h3 style="color: var(--text-primary);"><i class="fas fa-history" style="color: var(--accent-blue); margin-right: 8px;"></i>System Audit Logs</h3>
                <button class="btn btn-sm btn-ghost" onclick="renderLogsTab()"><i class="fas fa-sync-alt"></i> Refresh</button>
            </div>
            <pre id="logsContent" style="background: var(--bg-dark); color: var(--text-muted); padding: 16px; border-radius: 6px; height: 60vh; overflow-y: auto; font-family: 'JetBrains Mono', monospace; font-size: 13px; white-space: pre-wrap;">Loading logs...</pre>
        </div>
    `;
    loadLogs();
}

async function loadLogs() {
    showLoading();
    try {
        const res = await fetch(`${BACKEND_URL}/api/logs`);
        const data = await res.json();
        if (data.success) {
            const logsContent = document.getElementById('logsContent');
            if (logsContent) {
                logsContent.textContent = data.data || "No logs found.";
                // scroll to bottom
                logsContent.scrollTop = logsContent.scrollHeight;
            }
        }
    } catch (e) {
        showToast("Lỗi tải logs", "error");
    } finally {
        hideLoading();
    }
}

function renderSettingsTab() {
    const contentArea = document.getElementById('contentArea');
    contentArea.innerHTML = `
        <div style="background: var(--bg-card); padding: 20px; border-radius: 8px; max-width: 600px;">
            <h3 style="color: var(--text-primary); margin-bottom: 20px;"><i class="fas fa-cog" style="color: var(--text-muted); margin-right: 8px;"></i>System Settings</h3>
            <form id="settingsForm">
                <div class="form-group" style="margin-bottom: 16px;">
                    <label style="display: block; margin-bottom: 6px; color: var(--text-secondary); font-size: 13px;">AD Domain / LDAP Server</label>
                    <input type="text" name="AD_DOMAIN" id="set_domain" style="width: 100%; padding: 10px; border-radius: 6px; background: var(--bg-dark); border: 1px solid var(--border-light); color: var(--text-primary);">
                </div>
                <div class="form-group" style="margin-bottom: 16px;">
                    <label style="display: block; margin-bottom: 6px; color: var(--text-secondary); font-size: 13px;">DameWare Executable Path</label>
                    <input type="text" name="DAMEWARE_PATH" id="set_dw" style="width: 100%; padding: 10px; border-radius: 6px; background: var(--bg-dark); border: 1px solid var(--border-light); color: var(--text-primary);">
                </div>
                <div class="form-group" style="margin-bottom: 24px;">
                    <label style="display: block; margin-bottom: 6px; color: var(--text-secondary); font-size: 13px;">PowerShell Timeout (seconds)</label>
                    <input type="number" name="POWERSHELL_TIMEOUT" id="set_timeout" style="width: 100%; padding: 10px; border-radius: 6px; background: var(--bg-dark); border: 1px solid var(--border-light); color: var(--text-primary);">
                </div>
                <button type="submit" class="btn btn-primary" style="width: 100%;"><i class="fas fa-save"></i> Save Settings</button>
            </form>
        </div>
    `;
    loadSettings();

    setTimeout(() => {
        const form = document.getElementById('settingsForm');
        if (form) {
            form.onsubmit = async (e) => {
                e.preventDefault();
                const formData = new FormData(form);
                const data = {
                    AD_DOMAIN: formData.get('AD_DOMAIN'),
                    LDAP_SERVER: formData.get('AD_DOMAIN'),
                    DAMEWARE_PATH: formData.get('DAMEWARE_PATH'),
                    POWERSHELL_TIMEOUT: parseInt(formData.get('POWERSHELL_TIMEOUT'), 10)
                };
                
                showLoading();
                try {
                    const res = await fetch(`${BACKEND_URL}/api/settings`, {
                        method: 'POST',
                        headers: {'Content-Type': 'application/json'},
                        body: JSON.stringify(data)
                    });
                    const out = await res.json();
                    if (out.success) {
                        showToast("Lưu cấu hình thành công", "success");
                    } else {
                        showToast("Lỗi lưu cấu hình", "error");
                    }
                } catch(e) {
                    showToast("Lỗi kết nối", "error");
                } finally { hideLoading(); }
            };
        }
    }, 100);
}

async function loadSettings() {
    showLoading();
    try {
        const res = await fetch(`${BACKEND_URL}/api/settings`);
        const data = await res.json();
        if (data.success && data.data) {
            document.getElementById('set_domain').value = data.data.AD_DOMAIN || '';
            document.getElementById('set_dw').value = data.data.DAMEWARE_PATH || '';
            document.getElementById('set_timeout').value = data.data.POWERSHELL_TIMEOUT || 25;
        }
    } catch (e) {
        showToast("Lỗi tải cấu hình", "error");
    } finally {
        hideLoading();
    }
}

