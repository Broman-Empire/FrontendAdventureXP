// --- Admin Reservation (med mock-mode) ---
import {
    // rigtige API-kald
    searchReservation as apiSearchReservations,
    getSchedule as apiGetSchedule,
    deleteReservation as apiDeleteReservation,
    patchReservation as apiPatchReservation
} from "../api.js";
import { navigation } from "../main.js";

// Tænd/sluk mock
const useMock = true;

/* ---------- MOCK DATA ---------- */
const mockDb = {
    reservations: [
        {
            id: 101,
            contactName: "Anna Jensen",
            email: "anna@example.com",
            phone: "12345678",
            customerType: "PRIVATE",
            bookings: [
                { activityName: "Klatring",    timeSlot: "2025-10-09T09:00:00" },
                { activityName: "Escape Room", timeSlot: "2025-10-09T11:00:00" }
            ]
        },
        {
            id: 102,
            contactName: "Café ApS",
            email: "kontakt@cafe.dk",
            phone: "87654321",
            customerType: "BUSINESS",
            bookings: [
                { activityName: "Paintball", timeSlot: "2025-10-10T14:00:00" }
            ]
        }
    ]
};

// Mock helpers
function mockSearchReservations(phone) {
    const p = String(phone).trim();
    return Promise.resolve(mockDb.reservations.filter(r => r.phone === p));
}
function mockGetSchedule(date) {
    const rows = mockDb.reservations.filter(r =>
        (r.bookings || []).some(b => b.timeSlot?.startsWith(date))
    );
    return Promise.resolve(rows);
}
function mockPatchReservation(id, body) {
    const idx = mockDb.reservations.findIndex(r => String(r.id) === String(id));
    if (idx === -1) return Promise.reject(new Error("Reservation not found"));
    mockDb.reservations[idx] = { ...mockDb.reservations[idx], ...body };
    return Promise.resolve(true);
}
function mockDeleteReservation(id) {
    const i = mockDb.reservations.findIndex(r => String(r.id) === String(id));
    if (i !== -1) mockDb.reservations.splice(i, 1);
    return Promise.resolve(true);
}

/* Vælg backend eller mock */
const searchReservations = useMock ? mockSearchReservations : apiSearchReservations;
const getSchedule       = useMock ? mockGetSchedule       : apiGetSchedule;
const patchReservation  = useMock ? mockPatchReservation  : apiPatchReservation;
const deleteReservationApi = useMock ? mockDeleteReservation : apiDeleteReservation;

/* ---------- VIEW ---------- */
export async function mount(container) {
    container.innerHTML = `
    <section class="admin-reservation">
      <h1>Reservationer ${useMock ? '(MOCK)' : ''}</h1>
      <p>Søg via telefonnummer eller vælg en dato.</p>

      <div class="controls">
        <input type="text" id="searchInput" placeholder="Indtast telefonnummer og tryk Enter">
        <input type="date" id="dateFilter">
        <button id="searchBtn">Søg</button>
      </div>

      <p id="statusBox"></p>
      <p id="emptyState" class="empty-state">Søg efter en reservation for at se resultater</p>

      <table id="resultTable" class="result-table" style="display:none;">
        <thead>
          <tr>
            <th>ID</th><th>Navn</th><th>Email</th><th>Telefon</th>
            <th>Kundetype</th><th>Booking(s)</th><th></th>
          </tr>
        </thead>
        <tbody></tbody>
      </table>

      <button data-view="admin" class="back-btn">Tilbage til adminpanel</button>
    </section>
  `;

    container.querySelector(".back-btn").addEventListener("click", () => navigation("admin"));

    const searchInput = container.querySelector("#searchInput");
    const dateFilter  = container.querySelector("#dateFilter");
    const searchBtn   = container.querySelector("#searchBtn");
    const statusBox   = container.querySelector("#statusBox");
    const resultTable = container.querySelector("#resultTable");
    const resultBody  = resultTable.querySelector("tbody");

    // holder sidst viste resultater så vi kan re-render ved mock updates/deletes
    let lastResults = [];

    // delegér knapper i tabellen
    resultBody.addEventListener("click", async (e) => {
        const delBtn = e.target.closest(".btn-delete");
        const saveBtn = e.target.closest(".btn-save");

        if (delBtn) {
            const id = delBtn.dataset.id;
            await deleteReservation(id);
            return;
        }
        if (saveBtn) {
            const id = saveBtn.dataset.id;
            const row = saveBtn.closest("tr");
            const updateBody = {
                contactName:  row.querySelector('input[name="contactName"]')?.value,
                email:        row.querySelector('input[name="email"]')?.value,
                phone:        row.querySelector('input[name="phone"]')?.value,
                customerType: row.querySelector('select[name="customerType"]')?.value,
            };
            await applyUpdate(id, updateBody);
        }
    });

    // Enter = søg
    searchInput.addEventListener("keydown", (ev) => {
        if (ev.key === "Enter") {
            ev.preventDefault();
            searchBtn.click();
        }
    });

    // Søg via telefonnummer
    searchBtn.addEventListener("click", async () => {
        const phone = searchInput.value.trim();
        if (!phone) return alert("Indtast et telefonnummer!");

        // valider dansk nummer (8 cifre)
        const phoneRegex = /^\d{8}$/;
        if (!phoneRegex.test(phone)) {
            alert("Indtast et gyldigt dansk telefonnummer (8 cifre).");
            return;
        }

        statusBox.textContent = "";
        container.querySelector("#emptyState").style.display = "none";
        searchBtn.disabled = true;
        searchBtn.textContent = "Søger...";

        try {
            const reservations = await searchReservations(phone);
            lastResults = reservations.slice();
            renderResults(container, reservations);

            const formattedPhone = phone.replace(/(\d{2})(?=\d)/g, '$1 ').trim();
            statusBox.textContent = `Viser resultater for telefonnummer: ${formattedPhone}`;
            searchInput.value = "";
        } catch (err) {
            alert("Fejl ved søgning: " + err.message);
        } finally {
            searchBtn.disabled = false;
            searchBtn.textContent = "Søg";
        }
    });

    // Hent dags-skema (via dato)
    dateFilter.addEventListener("change", async () => {
        const date = dateFilter.value;
        if (!date) return;

        statusBox.textContent = "";
        container.querySelector("#emptyState").style.display = "none";

        dateFilter.disabled = true;
        try {
            const schedule = await getSchedule(date);
            lastResults = schedule.slice();
            renderResults(container, schedule);
            statusBox.textContent = `Viser skema for dato: ${date}`;
        } catch (err) {
            alert("Fejl ved hentning af schedule: " + err.message);
        } finally {
            dateFilter.disabled = false;
        }
    });

    async function deleteReservation(reservationId) {
        if (!reservationId) return;
        if (!confirm(`Slet reservation #${reservationId}?`)) return;

        try {
            await deleteReservationApi(reservationId);
            if (useMock) {
                // opdatér visningen uden reload
                lastResults = lastResults.filter(r => String(r.id) !== String(reservationId));
                renderResults(container, lastResults);
            } else {
                location.reload();
            }
        } catch (err) {
            alert("Kunne ikke slette: " + (err?.message || err));
        }
    }

    async function applyUpdate(reservationId, updateBody) {
        if (!reservationId) return;
        try {
            await patchReservation(reservationId, updateBody);
            if (useMock) {
                // sync lastResults og re-render
                lastResults = lastResults.map(r =>
                    String(r.id) === String(reservationId) ? { ...r, ...updateBody } : r
                );
                renderResults(container, lastResults);
                alert(`Reservation #${reservationId} er opdateret (mock).`);
            } else {
                alert(`Reservation #${reservationId} er opdateret.`);
                location.reload();
            }
        } catch (err) {
            alert("Kunne ikke opdatere: " + (err?.message || err));
        }
    }
}

/* ---------- RENDER ---------- */
function renderResults(container, reservations) {
    const resultTable = container.querySelector("#resultTable");
    const resultBody  = resultTable.querySelector("tbody");
    const emptyState  = container.querySelector("#emptyState");

    resultTable.style.display = "none";
    emptyState.style.display  = "none";
    resultBody.innerHTML = "";

    if (!reservations || reservations.length === 0) {
        emptyState.style.display = "block";
        emptyState.textContent = "Ingen resultater fundet - prøv et andet telefonnummer eller dato.";
        return;
    }

    resultTable.style.display = "table";
    reservations.forEach(result => {
        const bookings = (result.bookings || [])
            .map(b => `${b.activityName}: ${formatDateTime(b.timeSlot)}`)
            .join("<br>") || "Ingen bookinger";

        const row = document.createElement("tr");
        row.innerHTML = `
      <td>${result.id}</td>
      <td><input name="contactName" type="text" value="${result.contactName ?? ""}"></td>
      <td><input name="email" type="email" value="${result.email ?? ""}"></td>
      <td><input name="phone" type="tel" value="${result.phone ?? ""}"></td>
      <td>
        <select name="customerType">
          <option value="PRIVATE" ${result.customerType === "PRIVATE" ? "selected" : ""}>PRIVATE</option>
          <option value="BUSINESS" ${result.customerType === "BUSINESS" ? "selected" : ""}>BUSINESS</option>
        </select>
      </td>
      <td>${bookings}</td>
      <td>
        <button class="btn-save" data-id="${result.id}">Gem</button>
        <button class="btn-delete" data-id="${result.id}">Slet</button>
      </td>
    `;
        resultBody.appendChild(row);
    });
}

function formatDateTime(dateTimeStr) {
    if (!dateTimeStr) return "";
    const date = new Date(dateTimeStr);
    return `${date.toLocaleDateString()} ${date.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})}`;
}
