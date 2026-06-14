let selectedDate = new Date().toLocaleDateString('en-CA');
let allData = JSON.parse(localStorage.getItem("carbon_footprint_awareness_platform_data")) || {};

// Initialize calendar visualization trackers to manage current view month state
let currentDisplayDate = new Date(); 

/* ---------------- INITIALIZE DATA RECORDS ---------------- */
function getDayData(date) {
    if (!allData[date]) {
        allData[date] = {
            transport: { mode: null, fuel: null, km: 0 },
            food: null,
            electricity: 0,
            consumption: null,
            score: 100
        };
    }
    return allData[date];
}

/* ---------------- ACTIVE TRACKING CONTROLS ---------------- */
function changeActiveDate() {
    const picker = document.getElementById("globalDatePicker");
    if (picker && picker.value) {
        selectedDate = picker.value;
        currentDisplayDate = new Date(selectedDate); // Sync calendar viewpoint to chosen date
        loadSelectedDay();
        renderCalendar();
    }
}

function switchCategory(catName) {
    document.querySelectorAll(".tab-btn").forEach(btn => btn.classList.remove("active"));
    document.querySelectorAll(".tracker-panel").forEach(p => p.classList.remove("active"));

    if (event && event.currentTarget) {
        event.currentTarget.classList.add("active");
    }
    document.getElementById(`panel-${catName}`).classList.add("active");
}

/* ---------------- PRACTICAL CARBON FOOTPRINT MULTIPLIERS (kg CO2e) ---------------- */
function calculateScore(data) {
    let rawCo2Emissions = 0; // Measured in kg of CO2 equivalent

    const baseTransportImpact = {
        Walk: 0.0, Bicycle: 0.0, Bus: 0.05, Train: 0.04, Bike: 0.08, Car: 0.18, Flight: 0.25
    };
    const fuelMultipliers = { Petrol: 1.1, Diesel: 1.25, Electric: 0.25 };
    const foodImpact = { PlantBased: 1.5, Mixed: 4.5, HighMeat: 8.2, Processed: 6.0 };
    const consumptionImpact = { Minimal: 0.5, Average: 3.5, Heavy: 12.0 };

    if (data.transport && data.transport.mode) {
        let baseEmission = baseTransportImpact[data.transport.mode] || 0;
        let factor = 1.0;
        if (["Car", "Bike"].includes(data.transport.mode) && data.transport.fuel) {
            factor = fuelMultipliers[data.transport.fuel] || 1.0;
        }
        let distance = Number(data.transport.km) || 0;
        rawCo2Emissions += (baseEmission * factor) * distance;
    }

    if (data.food) rawCo2Emissions += foodImpact[data.food] || 0;
    if (data.electricity) rawCo2Emissions += (Number(data.electricity) * 0.45);
    if (data.consumption) rawCo2Emissions += consumptionImpact[data.consumption] || 0;

    const score = 100 - (rawCo2Emissions * 4);
    if (!isFinite(score)) return 100;
    return Math.max(0, Math.round(score));
}

/* ---------------- GLOBAL SAVE HUB ---------------- */
function saveDay() {
    const data = getDayData(selectedDate);

    // Sync transport states
    const activeModeBtn = document.querySelector(".mode-options .selected-option");
    data.transport.mode = activeModeBtn ? activeModeBtn.dataset.mode : null;
    const activeFuelBtn = document.querySelector(".fuel-options .selected-option");
    data.transport.fuel = activeFuelBtn ? activeFuelBtn.dataset.fuel : null;
    const kmInput = document.getElementById("transportKm");
    data.transport.km = kmInput ? parseFloat(kmInput.value) || 0 : 0;

    // Sync food choices
    const activeFoodBtn = document.querySelector(".food-options .selected-option");
    data.food = activeFoodBtn ? activeFoodBtn.dataset.food : null;

    // Sync energy configurations
    const elecInput = document.getElementById("electricityKwh");
    data.electricity = elecInput ? parseFloat(elecInput.value) || 0 : 0;

    // Sync materials categories
    const activeConsBtn = document.querySelector(".consumption-options .selected-option");
    data.consumption = activeConsBtn ? activeConsBtn.dataset.consumption : null;

    data.score = calculateScore(data);
    allData[selectedDate] = data;
    localStorage.setItem("carbon_footprint_awareness_platform_data", JSON.stringify(allData));

    updateUI();
    renderCalendar();
}

/* ---------------- DATA RESTORATION MAP ENGINE ---------------- */
function loadSelectedDay() {
    const data = getDayData(selectedDate);
    
    const picker = document.getElementById("globalDatePicker");
    if (picker) picker.value = selectedDate;

    // FIX CODE: Explicitly clear the selection classes from ALL panels buttons completely
    document.querySelectorAll(".tracker-panels button").forEach(b => b.classList.remove("selected-option"));

    // 1. Restore Transport Selection Variables
    if (data.transport && data.transport.mode) {
        const modeBtn = document.querySelector(`.mode-options [data-mode="${data.transport.mode}"]`);
        if (modeBtn) modeBtn.classList.add("selected-option");
        handleDynamicTransportFields(data.transport.mode);
    } else {
        handleDynamicTransportFields(null);
    }

    if (data.transport && data.transport.fuel) {
        const fuelBtn = document.querySelector(`.fuel-options [data-fuel="${data.transport.fuel}"]`);
        if (fuelBtn) fuelBtn.classList.add("selected-option");
    }
    
    const kmField = document.getElementById("transportKm");
    if (kmField) kmField.value = (data.transport && data.transport.km) ? data.transport.km : "";

    // 2. Restore Food Selection Variables
    if (data.food) {
        const foodBtn = document.querySelector(`.food-options [data-food="${data.food}"]`);
        if (foodBtn) foodBtn.classList.add("selected-option");
    }

    // 3. Restore Electricity Fields
    const elecField = document.getElementById("electricityKwh");
    if (elecField) elecField.value = data.electricity || "";

    // 4. Restore Consumption Selection Variables
    if (data.consumption) {
        const consBtn = document.querySelector(`.consumption-options [data-consumption="${data.consumption}"]`);
        if (consBtn) consBtn.classList.add("selected-option");
    }

    updateUI();
}

function handleDynamicTransportFields(mode) {
    const fuelBox = document.getElementById("fuelContainer");
    const distanceBox = document.getElementById("distanceContainer");

    if (!mode) {
        fuelBox.classList.add("hidden");
        distanceBox.classList.add("hidden");
        return;
    }
    if (["Car", "Bike"].includes(mode)) fuelBox.classList.remove("hidden");
    else fuelBox.classList.add("hidden");
    
    distanceBox.classList.remove("hidden");
}

/* ---------------- DASHBOARD DATA INTERPOLATION ---------------- */
function updateUI() {
    const data = getDayData(selectedDate);
    const score = calculateScore(data);
    data.score = score;

    document.getElementById("dashScoreTitle").innerText = `Eco Index`;
    document.getElementById("dashSummaryTitle").innerText = `Quest Profile Logs`;
    
    document.getElementById("dashScore").innerText = `${score}%`;
    document.getElementById("dailyScore").innerText = `Calculated Day Efficiency Score: ${score}`;
    document.getElementById("dailyInsight").innerText = getInsight(score);

    const summaryBox = document.getElementById("dashSummary");
    let hasAnyData = false;
    summaryBox.innerHTML = ""; 

    const createSummaryItem = (icon, label, value) => {
        hasAnyData = true;
        const item = document.createElement("div");
        item.className = "summary-grid-item-v3";
        item.innerHTML = `
            <div class="sum-item-meta"><span>${icon}</span> <strong>${label}</strong></div>
            <div class="sum-item-value">${value}</div>
        `;
        return item;
    };

    if (data.transport && data.transport.mode) {
        let fuelInfo = data.transport.fuel ? ` (${data.transport.fuel})` : "";
        summaryBox.appendChild(createSummaryItem("🚗", "Transit Journey", `${data.transport.mode}${fuelInfo} · <strong>${data.transport.km} km</strong>`));
    }
    if (data.food) {
        summaryBox.appendChild(createSummaryItem("🍔", "Dietary Profile", data.food));
    }
    if (data.electricity > 0) {
        summaryBox.appendChild(createSummaryItem("⚡", "Energy Budget", `Logged expenditure: <strong>${data.electricity} kWh</strong>`));
    }
    if (data.consumption) {
        summaryBox.appendChild(createSummaryItem("🛍️", "Material Shopping", data.consumption));
    }

    if (!hasAnyData) {
        summaryBox.innerHTML = `<span class="empty-log-fallback">No activity variables committed for this tracking window.</span>`;
    }

    updateStreak();
}

function getInsight(score) {
    if (score > 85) return "Exceptional carbon management index! Level Clean Tier. 🍃";
    if (score > 65) return "Stable green metrics maintained. Keep it up! 👍";
    if (score > 45) return "Moderate carbon overhead tracking detected. ⚖️";
    return "High environmental footprint alert. Try tuning carbon items tomorrow. 🔴";
}

function updateStreak() {
    let streak = 0;
    let current = new Date();
    
    while (true) {
        const key = current.toLocaleDateString('en-CA');
        const data = allData[key];
        
        const hasData = data && (data.food || data.transport?.mode || data.electricity > 0 || data.consumption);
        if (hasData && data.score > 45) {
            streak++;
            current.setDate(current.getDate() - 1);
        } else {
            break;
        }
    }
    
    document.getElementById("dashStreak").innerText = `${streak} Days Active`;
    
    const fillLine = document.querySelector(".streak-progress-fill");
    if (fillLine) {
        let targetPercentage = Math.min(100, (streak / 7) * 100);
        fillLine.style.width = `${targetPercentage}%`;
    }
}

/* ---------------- MONTHLY LEETCODE-STYLE CALENDAR ENGINE ---------------- */
function navigateMonth(direction) {
    currentDisplayDate.setMonth(currentDisplayDate.getMonth() + direction);
    renderCalendar();
}

function renderCalendar() {
    const grid = document.getElementById("calendarGrid");
    if (!grid) return;
    grid.innerHTML = "";
        const year = currentDisplayDate.getFullYear();
    const month = currentDisplayDate.getMonth();

    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    document.getElementById("calendarMonthTitle").innerText = `${monthNames[month]} ${year}`;

    const firstDayOfMonth = new Date(year, month, 1).getDay();
    const totalDaysInMonth = new Date(year, month + 1, 0).getDate();

    for (let i = 0; i < firstDayOfMonth; i++) {
        const blankCell = document.createElement("div");
        blankCell.classList.add("calendar-day-blank");
        grid.appendChild(blankCell);
    }

    for (let day = 1; day <= totalDaysInMonth; day++) {
        const calendarTargetDate = new Date(year, month, day);
        const key = calendarTargetDate.toLocaleDateString('en-CA');
        
        const data = allData[key];
        const hasLogData = data && (data.food || data.transport?.mode || data.electricity > 0 || data.consumption);
        const score = hasLogData ? data.score : null;

        const cell = document.createElement("div");
        cell.classList.add("calendar-day");

        if (score === null) {
    // No data
    cell.style.background = "#1e293b";
}
else if (score >= 85) {
    // Excellent
    cell.style.background = "#16a34a";
}
else if (score >= 65) {
    // Good
    cell.style.background = "#22c55e";
}
else if (score >= 45) {
    // Moderate
    cell.style.background = "#6b7280";
}
else {
    // Bad
    cell.style.background = "#dc2626";
}

        if (key === selectedDate) {
            cell.style.outline = "2px solid #4ade80";
            cell.style.outlineOffset = "2px";
        }

        cell.innerText = day;
        cell.style.cursor = "pointer";
        if (score !== null) {
    cell.title = `${key} | Eco Score: ${score}%`;
} else {
    cell.title = `${key} | No data logged`;
}
        cell.onclick = () => {
            selectedDate = key;
            loadSelectedDay();
            renderCalendar();
        };
        grid.appendChild(cell);
    }
}

/* ---------------- INTERACTIVE EVENTS HOOK ATTACHMENTS ---------------- */
function initializeEventHandlers() {
    document.querySelectorAll(".mode-options button").forEach(button => {
        button.onclick = () => {
            const alreadySelected = button.classList.contains("selected-option");
            document.querySelectorAll(".mode-options button").forEach(b => b.classList.remove("selected-option"));
            if (!alreadySelected) {
                button.classList.add("selected-option");
                handleDynamicTransportFields(button.dataset.mode);
            } else {
                handleDynamicTransportFields(null);
            }
            saveDay();
        };
    });

    document.querySelectorAll(".fuel-options button").forEach(button => {
        button.onclick = () => {
            const alreadySelected = button.classList.contains("selected-option");
            document.querySelectorAll(".fuel-options button").forEach(b => b.classList.remove("selected-option"));
            if (!alreadySelected) button.classList.add("selected-option");
            saveDay();
        };
    });

    const kmField = document.getElementById("transportKm");
    if (kmField) kmField.oninput = saveDay;

    document.querySelectorAll(".food-options button").forEach(button => {
        button.onclick = () => {
            const alreadySelected = button.classList.contains("selected-option");
            document.querySelectorAll(".food-options button").forEach(b => b.classList.remove("selected-option"));
            if (!alreadySelected) button.classList.add("selected-option");
            saveDay();
        };
    });

    const elecField = document.getElementById("electricityKwh");
    if (elecField) elecField.oninput = saveDay;

    document.querySelectorAll(".consumption-options button").forEach(button => {
        button.onclick = () => {
            const alreadySelected = button.classList.contains("selected-option");
            document.querySelectorAll(".consumption-options button").forEach(b => b.classList.remove("selected-option"));
            if (!alreadySelected) button.classList.add("selected-option");
            saveDay();
        };
    });
}

function closeIntro() {
    document.getElementById("introOverlay").style.display = "none";
    localStorage.setItem("cfap_intro_seen", "true");
}

initializeEventHandlers();
loadSelectedDay();
renderCalendar();

if (localStorage.getItem("cfap_intro_seen") === "true") {
    document.getElementById("introOverlay").style.display = "none";
}

/* ---------------- SYSTEM PURGE CACHE UTILITY ---------------- */
function wipeLocalCache() {
    // Standard gamified confirmation popup layer check
    const confirmingPurge = confirm("🚨 WARNING: You are about to completely wipe all logged data history and reset your streak back to zero. Proceed with database wipe?");
    
    if (confirmingPurge) {
        // Clear variables completely out of the local browser cache
        localStorage.removeItem("carbon_footprint_awareness_platform_data");
        
        // Reset execution memory maps back to empty objects
        allData = {};
        
        // Re-route and load current date parameters fresh
        loadSelectedDay();
        renderCalendar();
        
        alert("Database cleared successfully! Launching fresh tracking window. 🚀");
    }
}

/* ---------------- INTERACTIVE BLUEPRINT DECK LOGIC ---------------- */
function activateBlueprintCard(cardNumber) {
    // Clear active layout style states from all deck card items safely
    document.querySelectorAll(".blueprint-deck-card").forEach(card => {
        card.classList.remove("active");
    });
    
    // Attach the active layout class to the clicked card element target
    const targetedCard = document.getElementById(`bp-card-${cardNumber}`);
    if (targetedCard) {
        targetedCard.classList.add("active");
    }
}

/* DASHBOARD SPOTLIGHT EFFECT */

document.querySelectorAll(
    ".score-card-v3, .streak-card-v3, .summary-card-v3, .calendar-card-v3"
).forEach(card => {

    card.addEventListener("mousemove", e => {
        const rect = card.getBoundingClientRect();

        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        card.style.setProperty("--mouse-x", `${x}px`);
        card.style.setProperty("--mouse-y", `${y}px`);
    });

});
