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
document.addEventListener("DOMContentLoaded", function () {

    let currentDirection = "asc";

    window.toggleDirection = function () {
        currentDirection = currentDirection === "asc" ? "desc" : "asc";

        const icon = document.querySelector("#sort-direction-btn i");
        icon.className = currentDirection === "asc"
            ? "fa-solid fa-arrow-up"
            : "fa-solid fa-arrow-down";
    }

    window.applyComputerSort = function () {

        const field = document.getElementById("sort-field").value;
        const container = document.querySelector("#computer-table");

        if (!container) {
            console.log("Không tìm thấy computer-table");
            return;
        }

        // Lấy tất cả row TRỪ header
        const rows = Array.from(
            container.querySelectorAll(".row:not(.header)")
        );

        rows.sort((a, b) => {

            let valA = a.getAttribute("data-" + field) || "";
            let valB = b.getAttribute("data-" + field) || "";

            if (!isNaN(valA) && !isNaN(valB)) {
                valA = Number(valA);
                valB = Number(valB);
            }

            if (valA < valB) return currentDirection === "asc" ? -1 : 1;
            if (valA > valB) return currentDirection === "asc" ? 1 : -1;
            return 0;
        });

        rows.forEach(row => container.appendChild(row));
    }

});