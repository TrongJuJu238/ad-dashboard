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
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keyword })
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
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hostname })
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
let currentMonth = new Date().getMonth();
let currentYear = new Date().getFullYear();
let calendarData = {};

function drag(ev) {
    ev.dataTransfer.setData(
        "shift",
        ev.target.getAttribute("data-shift"),
    );
}

function allowDrop(ev) {
    ev.preventDefault();
}

async function drop(ev) {
    ev.preventDefault();
    const shift = ev.dataTransfer.getData("shift");
    const date = ev.target
        .closest(".calendar-cell")
        .getAttribute("data-date");
    const staff = document.getElementById("staffSelect").value;

    const response = await fetch("/api/calendar/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date, shift, staff }),
    });

    if ((await response.json()).success) {
        renderCalendar();
    }
}

async function loadCalendarEvents() {
    const staff = document.getElementById("staffSelect").value;
    const response = await fetch(
        `/api/calendar/load?staff=${staff}`,
    );
    calendarData = await response.json();
    renderCalendar();
}

function changeMonth(delta) {
    currentMonth += delta;
    if (currentMonth > 11) {
        currentMonth = 0;
        currentYear++;
    }
    if (currentMonth < 0) {
        currentMonth = 11;
        currentYear--;
    }
    renderCalendar();
}

function renderCalendar() {
    const grid = document.getElementById("calendarGrid");
    if (!grid) return;

    const monthNames = [
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December",
    ];
    document.getElementById("currentMonthYear").innerText =
        `${monthNames[currentMonth]} ${currentYear}`;

    // Clear cells except headers
    const headers = Array.from(grid.querySelectorAll(".day-name"));
    grid.innerHTML = "";
    headers.forEach((h) => grid.appendChild(h));

    const firstDay = new Date(
        currentYear,
        currentMonth,
        1,
    ).getDay();
    const daysInMonth = new Date(
        currentYear,
        currentMonth + 1,
        0,
    ).getDate();

    // Padding
    for (let i = 0; i < firstDay; i++) {
        const empty = document.createElement("div");
        empty.className = "calendar-cell empty";
        grid.appendChild(empty);
    }

    for (let i = 1; i <= daysInMonth; i++) {
        const cell = document.createElement("div");
        cell.className = "calendar-cell";
        const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(i).padStart(2, "0")}`;
        cell.setAttribute("data-date", dateStr);
        cell.ondrop = drop;
        cell.ondragover = allowDrop;

        const dayNum = document.createElement("span");
        dayNum.className = "day-num";
        dayNum.innerText = i;
        cell.appendChild(dayNum);

        if (calendarData[dateStr]) {
            const tag = document.createElement("div");
            tag.className = `shift-tag shift-${calendarData[dateStr].toLowerCase()}`;
            tag.innerText = calendarData[dateStr];
            cell.appendChild(tag);
        }

        grid.appendChild(cell);
    }
}

document.addEventListener("DOMContentLoaded", () => {
    if (window.location.pathname === "/calendar") {
        loadCalendarEvents();
    }
});

async function updateTask(id, field, value) {
    const response = await fetch("/task/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, field, value }),
    });
    const result = await response.json();
    if (result.success) {
        console.log("Task updated");
    } else {
        alert("Update failed");
    }
}

async function unlockUser(sam) {
    const response = await fetch("/api/unlock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sam }),
    });
    const result = await response.json();
    if (result.success) {
        alert("User Unlocked Successfully");
        location.reload();
    } else {
        alert("Error: " + result.error);
    }
}