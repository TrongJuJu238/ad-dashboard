async function searchComputers() {

    const keyword = document.getElementById("computerSearchInput").value;

    showLoading();

    const response = await fetch("/api/computers/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keyword })
    });

    const result = await response.json();

    hideLoading();

    if (result.success) {
        renderComputerTable(result.data);
    } else {
        showToast(result.error, false);
    }
}


async function openRemote(hostname) {

    showLoading();

    const response = await fetch("/api/computers/remote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hostname })
    });

    const result = await response.json();

    hideLoading();

    if (result.success) {
        showToast("Remote launched", true);
    } else {
        showToast(result.error, false);
    }
}
async function unlockUser(sam) {

    const response = await fetch("/api/unlock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sam })
    });

    const result = await response.json();

    if (result.success) {
        alert("Unlocked");
        location.reload();
    } else {
        alert(result.error);
    }
}
function showLoading() {
    document.getElementById("loadingOverlay").classList.remove("hidden");
}

function hideLoading() {
    document.getElementById("loadingOverlay").classList.add("hidden");
}

async function searchComputer() {
    const keyword = document.getElementById("computerSearch").value;

    showLoading();

    const response = await fetch("/api/computers/search", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({keyword})
    });

    const result = await response.json();
    hideLoading();

    if (!result.success) {
        alert("Error");
        return;
    }

    const container = document.getElementById("computerResult");
    container.innerHTML = "";

    result.data.forEach(c => {
        container.innerHTML += `
            <div>
                <strong>${c.Name}</strong> (${c.DNSHostName || ""})
                <button onclick="remoteComputer('${c.Name}')">Remote</button>
            </div>
        `;
    });
}

async function remoteComputer(hostname) {
    showLoading();

    await fetch("/api/computers/remote", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({hostname})
    });

    hideLoading();
    alert("Remote launched");
}
const input = document.getElementById("searchInput");
const dropdown = document.getElementById("searchDropdown");
const historyContainer = document.getElementById("searchHistory");
const loadingBox = document.getElementById("searchLoading");

let searchHistory = JSON.parse(localStorage.getItem("searchHistory")) || [];

if (input) {

    input.addEventListener("focus", () => {
        renderHistory();
        dropdown.style.display = "block";
    });

    document.addEventListener("click", (e) => {
        if (!e.target.closest(".search-container")) {
            dropdown.style.display = "none";
        }
    });

    document.querySelector(".top-search").addEventListener("submit", () => {
        const value = input.value.trim();
        if (value) {
            searchHistory = searchHistory.filter(item => item !== value);
            searchHistory.unshift(value);
            searchHistory = searchHistory.slice(0, 5);
            localStorage.setItem("searchHistory", JSON.stringify(searchHistory));
        }

        loadingBox.style.display = "block";
    });

    function renderHistory() {
        historyContainer.innerHTML = "";

        if (searchHistory.length === 0) {
            historyContainer.innerHTML = "<div style='font-size:13px;color:#888'>Chưa có lịch sử</div>";
            return;
        }

        searchHistory.forEach(item => {
            const div = document.createElement("div");
            div.className = "history-chip";
            div.textContent = item;

            div.onclick = () => {
                input.value = item;
                input.closest("form").submit();
            };

            historyContainer.appendChild(div);
        });
    }
}
let selectedSam = null;

function confirmUnlock(sam, name) {
    selectedSam = sam;
    document.getElementById("modalText").innerText =
        "You are about to unlock account: " + name +
        " (" + sam + ").\n\nThis action will modify Active Directory in production.\nAre you sure?";

    document.getElementById("confirmModal").style.display = "flex";
}

function closeModal() {
    document.getElementById("confirmModal").style.display = "none";
    selectedSam = null;
}

function submitUnlock() {
    if (!selectedSam) return;

    const form = document.createElement("form");
    form.method = "POST";
    form.action = "/unlock";

    const input = document.createElement("input");
    input.type = "hidden";
    input.name = "sam";
    input.value = selectedSam;

    form.appendChild(input);
    document.body.appendChild(form);
    form.submit();
}
function openRemote(hostname) {

    fetch(`/remote/${hostname}`)
        .then(response => {
            if (response.ok) {
                console.log("Remote opened");
            } else {
                alert("Failed to open remote");
            }
        })
        .catch(error => {
            alert("Error connecting to server");
        });
}
async function unlockUser(sam) {
    const response = await fetch("/api/unlock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sam })
    });
    const result = await response.json();
    if (result.success) {
        alert("User Unlocked Successfully");
        location.reload();
    } else {
        alert("Error: " + result.error);
    }
}
document.addEventListener("DOMContentLoaded", function () {

    const select = document.getElementById("sortField");
    const directionBtn = document.getElementById("sortDirection");
    const table = document.querySelector(".task-table tbody");

    if (!select || !directionBtn || !table) return;

    let sortOrder = "asc";

    directionBtn.addEventListener("click", function () {
        sortOrder = sortOrder === "asc" ? "desc" : "asc";
        directionBtn.innerText = sortOrder === "asc" ? "↑" : "↓";
    });

    window.applyComputerSort = function () {

        const field = select.value;
        const rows = Array.from(table.querySelectorAll("tr"));

        rows.sort((a, b) => {

            const getText = (row, index) =>
                row.children[index].innerText.trim();

            // NAME
            if (field === "Name") {
                return compareText(getText(a, 0), getText(b, 0));
            }

            // IP
            if (field === "IP") {
                return compareIP(getText(a, 1), getText(b, 1));
            }

            // Department
            if (field === "Department") {
                return compareText(getText(a, 2), getText(b, 2));
            }

            return 0;
        });

        rows.forEach(row => table.appendChild(row));
    };

    function compareText(a, b) {
        a = a.toLowerCase();
        b = b.toLowerCase();
        return sortOrder === "asc"
            ? a.localeCompare(b)
            : b.localeCompare(a);
    }

    function compareIP(a, b) {

        const aOffline = a.toLowerCase() === "offline";
        const bOffline = b.toLowerCase() === "offline";

        // Offline luôn nằm trên cùng khi asc
        if (aOffline && !bOffline) return sortOrder === "asc" ? -1 : 1;
        if (!aOffline && bOffline) return sortOrder === "asc" ? 1 : -1;
        if (aOffline && bOffline) return 0;

        const aNum = ipToNumber(a);
        const bNum = ipToNumber(b);

        return sortOrder === "asc"
            ? aNum - bNum
            : bNum - aNum;
    }

    function ipToNumber(ip) {
        return ip.split(".").reduce((acc, part) =>
            (acc << 8) + parseInt(part, 10), 0);
    }

});
document.addEventListener("DOMContentLoaded", function () {

    // Sidebar slide in
    anime({
        targets: '.sidebar',
        translateX: [-60, 0],
        opacity: [0, 1],
        duration: 800,
        easing: 'easeOutExpo'
    });

    // Header
    anime({
        targets: '.dashboard-header',
        translateY: [-20, 0],
        opacity: [0, 1],
        duration: 700,
        easing: 'easeOutQuad',
        delay: 200
    });

    // Stats cards stagger
    anime({
        targets: '.stat-card',
        translateY: [30, 0],
        opacity: [0, 1],
        delay: anime.stagger(120),
        duration: 700,
        easing: 'easeOutCubic'
    });

    // Main panel fade
    anime({
        targets: '.animate-panel',
        opacity: [0, 1],
        translateY: [20, 0],
        duration: 800,
        easing: 'easeOutQuad',
        delay: 300
    });

    // Table rows stagger
    anime({
        targets: '.animate-row',
        opacity: [0, 1],
        translateX: [-20, 0],
        delay: anime.stagger(50, { start: 500 }),
        duration: 600,
        easing: 'easeOutQuad'
    });

    // Calendar slide from right (only task tab)
    anime({
        targets: '.animate-calendar',
        opacity: [0, 1],
        translateX: [40, 0],
        duration: 800,
        easing: 'easeOutCubic',
        delay: 400
    });
    // System Overview panel (User/Computer tab)
    anime({
        targets: '.animate-system-panel',
        opacity: [0, 1],
        translateX: [40, 0],
        duration: 900,
        easing: 'easeOutCubic',
        delay: 400
    });

    // Animate children inside system panel
    anime({
        targets: '.calendar-panel div[style*="Connected"]',
        opacity: [1, 0.7],
        direction: 'alternate',
        loop: true,
        easing: 'easeInOutSine',
        duration: 1200
    });
});