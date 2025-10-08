// --- Admin Reservation (samlet) ---
import { searchReservations, getSchedule } from "../api.js";
import { navigation } from "../main.js";

export async function mount(container) {
    container.innerHTML = `
    <section class="admin-reservation">
      <h1>Reservationer</h1>
      <p>Søg via telefonnummer eller vælg en dato.</p>

      <div class="controls">
        <input type="text" id="searchInput" placeholder="Indtast telefonnummer og tryk Enter">
        <input type="date" id="dateFilter">
        <button id="searchBtn">Søg</button>
      </div>

      <p id="statusBox"></p>
      <p id="emptyState" class="empty-state">Søg efter en reservation for at se resultater</p>

      <table id="resultTable" class="result-table" style="display:none;">
        <thead><tr id="theadRow"></tr></thead>
        <tbody></tbody>
      </table>

      <button data-view="admin" class="back-btn">Tilbage til adminpanel</button>
    </section>
  `;

    // Navigation tilbage
    container.querySelector(".back-btn").addEventListener("click", () => navigation("admin"));

    const searchInput = container.querySelector("#searchInput");
    const dateFilter  = container.querySelector("#dateFilter");
    const searchBtn   = container.querySelector("#searchBtn");
    const statusBox   = container.querySelector("#statusBox");
    const emptyState  = container.querySelector("#emptyState");
    const table       = container.querySelector("#resultTable");
    const theadRow    = container.querySelector("#theadRow");
    const tbody       = table.querySelector("tbody");

    // Enter på søgefelt = klik Søg
    searchInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
            e.preventDefault();
            searchBtn.click();
        }
    });

    // Klik Søg (telefon)
    searchBtn.addEventListener("click", async () => {
        const phone = searchInput.value.trim();
        if (!phone) return alert("Indtast et telefonnummer!");

        const phoneRegex = /^\d{8}$/;
        if (!phoneRegex.test(phone)) {
            alert("Indtast et gyldigt dansk telefonnummer (8 cifre).");
            return;
        }

        clearUI();
        setLoading(searchBtn, "Søger...");

        try {
            const list = await searchReservations(phone); // ← PLURAL + admin-endpoint bagved
            renderSearchResults(list, theadRow, tbody, table, emptyState);

            const formatted = phone.replace(/(\d{2})(?=\d)/g, "$1 ").trim();
            statusBox.textContent = `Viser resultater for telefonnummer: ${formatted}`;
            searchInput.value = "";
        } catch (err) {
            alert("Fejl ved søgning: " + err.message);
        } finally {
            unsetLoading(searchBtn, "Søg");
        }
    });

    // Ændring af dato = hent admin-skema
    dateFilter.addEventListener("change", async () => {
        const date = dateFilter.value;
        if (!date) return;

        clearUI();
        dateFilter.disabled = true;

        try {
            const list = await getSchedule(date); // ← ADMIN schedule
            renderScheduleResults(list, theadRow, tbody, table, emptyState);
            statusBox.textContent = `Viser skema for dato: ${date}`;
        } catch (err) {
            alert("Fejl ved hentning af skema: " + err.message);
        } finally {
            dateFilter.disabled = false;
        }
    });

    // --- helpers ---
    function clearUI() {
        statusBox.textContent = "";
        emptyState.style.display = "none";
        table.style.display = "none";
        tbody.innerHTML = "";
        theadRow.innerHTML = "";
    }

    function setLoading(btn, text) {
        if (!btn) return;
        btn.disabled = true;
        btn.dataset.orig = btn.textContent;
        btn.textContent = text;
    }
    function unsetLoading(btn, text) {
        if (!btn) return;
        btn.disabled = false;
        btn.textContent = text ?? btn.dataset.orig ?? btn.textContent;
    }
}

// --------- rendering: to forskellige datasæt (search vs. schedule) ---------
function renderSearchResults(list, theadRow, tbody, table, emptyState) {
    if (!list || list.length === 0) {
        emptyState.style.display = "block";
        emptyState.textContent = "Ingen resultater fundet - prøv et andet telefonnummer.";
        return;
    }

    // Kolonner til SØG (kontaktinfo + bookings)
    theadRow.innerHTML = `
    <th>ID</th>
    <th>Navn</th>
    <th>Email</th>
    <th>Telefon</th>
    <th>Kundetype</th>
    <th>Booking(s)</th>
  `;

    list.forEach(r => {
        const bookingsHtml = r.bookings?.map(b => `${b.activityName}: ${b.timeSlot}`).join("<br>") ?? "Ingen bookinger";
        const tr = document.createElement("tr");
        tr.innerHTML = `
      <td>${r.id}</td>
      <td>${r.contactName ?? "-"}</td>
      <td>${r.email ?? "-"}</td>
      <td>${r.phone ?? "-"}</td>
      <td>${r.customerType ?? "-"}</td>
      <td>${bookingsHtml}</td>
    `;
        tbody.appendChild(tr);
    });

    table.style.display = "table";
}

function renderScheduleResults(list, theadRow, tbody, table, emptyState) {
    if (!list || list.length === 0) {
        emptyState.style.display = "block";
        emptyState.textContent = "Ingen skemaresultater for den valgte dato.";
        return;
    }

    // Kolonner til SKEMA (admin dagsschedule DTO)
    theadRow.innerHTML = `
    <th>ID</th>
    <th>Aktivitet</th>
    <th>Hold</th>
    <th>I alt</th>
    <th>Start</th>
  `;

    list.forEach(r => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
      <td>${r.id}</td>
      <td>${r.activityId ?? "-"}</td>
      <td>${r.participants ?? "-"}</td>
      <td>${r.totalParticipants ?? "-"}</td>
      <td>${r.startsAt ? r.startsAt.replace("T"," ").slice(0,16) : "-"}</td>
    `;
        tbody.appendChild(tr);
    });

    table.style.display = "table";
}
