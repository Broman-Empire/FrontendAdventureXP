// --- Admin Reservation ---
import { searchReservationByPhone, getReservationByDate, patchReservation, deleteReservation , } from "../api.js";
import { navigation } from "../main.js";


export async function mount(container) {
    container.innerHTML = `
    <section class="admin-reservation">
    <h1>Reservations</h1>
    <p>Get reservation by phone number or select a date</p>
    
    <div class="controls">
        <input type="text" id="searchInput" placeholder="Enter phone number and press Enter">
        <button id="searchBtn">Søg</button>
        <input type="date" id="dateFilter">
    </div>

    <p id="statusBox"></p>

    <p id="emptyState" class="empty-state">
            Search for a reservation to view results
    </p>
    
    <table id="resultTable" class="result-table" style="display:none;">
        <thead>
            <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Email</th>
                <th>Phone number</th>
                <th>Type of customer</th>
                <th>Created</th>
                <th>Booking(s)</th>
                <th></th>
            </tr>
        </thead>
        <tbody></tbody>
    </table>
    
    <button data-view="admin" class="back-btn">Go back</button>
    </section>
    `;

    // Event listener for tilbageknap til adminpanel
    container.querySelector(".back-btn").addEventListener("click", () => navigation("admin"));

    // --- Event listener for søgeknap ---
    const searchInput = container.querySelector("#searchInput");
    const dateFilter = container.querySelector("#dateFilter");
    const searchBtn = container.querySelector("#searchBtn");
    const statusBox = container.querySelector("#statusBox");
    const resultTable = container.querySelector("#resultTable");
    const resultBody  = resultTable.querySelector("tbody");

    resultBody.addEventListener("click", (e) => {
        const btn = e.target.closest(".btn-delete");
        if (!btn) return;
        const id = btn.dataset.id;
        handleDeleteReservation(id); // <-- kalder view-funktionen ovenfor
    });

    resultBody.addEventListener("click", (e) => {
        const btn = e.target.closest(".btn-save");
        if (!btn) return;

        const id = btn.dataset.id;
        const row = btn.closest("tr");
        const updateBody = {
            contactName: row.querySelector('input[name="contactName"]')?.value,
            email:       row.querySelector('input[name="email"]')?.value,
            phone:       row.querySelector('input[name="phone"]')?.value,
            customerType:row.querySelector('select[name="customerType"]')?.value,
            // ... evt. andre felter
        };

        applyUpdate(id, updateBody);
    });


    // Muligt at trykke enter for at søge
    searchInput.addEventListener("keydown", (event) => {
        if (event.key === "Enter") {
            event.preventDefault(); // Stoppet evt. formular-genindlæsning
            searchBtn.click();      // Simulere klik på søgeknappen
        }
    });

    // Søg via telefonnummer
    searchBtn.addEventListener("click", async () => {
        const phone = searchInput.value.trim();
        if (!phone) return alert("Enter a phone number.");

        // Ryd status og tom-state inden ny søgning
        statusBox.textContent = "";
        container.querySelector("#emptyState").style.display = "none";

        // Valider telefonnummer (skal være 8 cifre)
        const phoneRegex = /^\d{8}$/;
        if (!phoneRegex.test(phone)) {
            alert("Enter a valid Danish phone number (8 digits)");
            return;
        }

        searchBtn.disabled = true;
        searchBtn.textContent = "Searching...";

        try {
            const reservations = await searchReservationByPhone(phone);
            renderResults(reservations);

            // Formateres nummeret til "xx xx xx xx"
            const formattedPhone = phone.replace(/(\d{2})(?=\d)/g, '$1 ').trim();
            statusBox.textContent = `Showing result for phone number: ${formattedPhone}`;

            console.log("Reservations loaded:", reservations); // Konsol log for at sikre at reservationer bliver loaded
            searchInput.value = ""; // Nulstil søgefæltet efter succesfuld søgning
        } catch (err) {
            alert("Error during search: " + err.message);
        } finally {
            searchBtn.disabled = false;
            searchBtn.textContent = "Search";
        }
    });

    // Henter schedule ved ændring af dato
    dateFilter.addEventListener("change", async () => {
        const date = dateFilter.value;

        // Ryd status og tom-state inden ny hentning
        statusBox.textContent = "";
        container.querySelector("#emptyState").style.display = "none";

        dateFilter.disabled = true;

        try {
            const schedule = await getReservationByDate(date);
            renderResults(schedule);
            statusBox.textContent = `Displaying schedule for date: ${date}`;
        } catch (err) {
            alert("Error occurred when loading schedule: " + err.message);
        } finally {
            dateFilter.disabled = false;
        }
    });

    // Hjælpefunktion til at vise korrekt dansk datoformat
    function formatDate(isoString) {
        if (!isoString) return "-";

        const date = new Date(isoString);
        // Dansk format med dato + klokkeslæt
        return date.toLocaleDateString("da-DK", {
            day: "2-digit",
            month: "short",
            year: "numeric"
        }) + " kl. " + date.toLocaleTimeString("da-DK", {
            hour: "2-digit",
            minute: "2-digit"
        });
    }

    // Hjælpefunktion til at vise resultater
    function renderResults(reservations) {
        // Hent både <table> og <tbody>
        const resultTable = container.querySelector("#resultTable");
        const resultBody = resultTable.querySelector("tbody");
        const emptyState = container.querySelector("#emptyState");

        // Skjul tabellen som udgangspunkt og ryd indholdet
        resultTable.style.display = "none";
        emptyState.style.display = "none";
        resultBody.innerHTML = "";

        // Hvis der ikke er nogen resultater, skal tabellen forblive skjult
        if (!reservations || reservations.length === 0) {
            emptyState.style.display = "block";
            emptyState.textContent = "No reservations found. Try another phone number or select a new date";
            return;
        }

        // Der er resultater → vis tabellen
        resultTable.style.display = "table";
        emptyState.style.display ="none";

        // Fyld tabellen med rækker
        reservations.forEach(result => {
            const bookings = result.bookings
                ?.map(b => `${b.activityName}: ${b.timeSlot}`)
                .join("<br>") || "No bookings";

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
        <td>${formatDate(result.createdAt)}</td>
        <td>${bookings}</td>
        <td>
          <button class="btn-save" data-id="${result.id}">Save</button>
          <button class="btn-delete" data-id="${result.id}">Delete</button>
        </td>
      `;
            resultBody.appendChild(row);
        });
    }

    /* TODO: bruges ikke
    async function handleDeleteReservation(reservationId) {
        if (!reservationId) return;
        if (!confirm(`Delete reservation #${reservationId}?`)) return;

        try {
            await deleteReservation(reservationId); // kalder API-wrapperen
            alert(`Reservation #${reservationId} is deleted.`);
            location.reload(); // eller opdatér tabellen uden reload
        } catch (err) {
            alert("Could not delete: " + (err?.message || err));
        }
    }
*/

   async function applyUpdate(reservationId, updateBody) {
        if (!reservationId) return;
        try {
            await patchReservation(reservationId, updateBody);
            
            statusBox.textContent = `Reservation #${reservationId} is updated.`;
            setTimeout(() => statusBox.textContent = "", 2500);

            const phone = searchInput.value.trim();
            const date = dateFilter.value;

            let refreshedData;
            if (phone) {
                refreshedData = await searchReservationByPhone(phone);
            } else if (date) {
                refreshedData = await getReservationByDate(date);
            }

            if (refreshedData) renderResults(refreshedData);

        } catch (err) {
            statusBox.textContent = "Could not update reservation.";
            console.error(err);
        }
    }

    async function handleDeleteReservation(reservationId) {
    if (!reservationId) return;
    if (!confirm(`Delete reservation #${reservationId}?`)) return;

    try {
        await deleteReservation(reservationId);
        alert(`Reservation #${reservationId} is deleted.`);

        // Samme princip som ovenfor
        const phone = searchInput.value.trim();
        const date = dateFilter.value;

        let refreshedData;

        if (phone) {
            refreshedData = await searchReservationByPhone(phone);
        } else if (date) {
            refreshedData = await getReservationByDate(date);
        }

        if (refreshedData) {
            renderResults(refreshedData);
        }

    } catch (err) {
        alert("Could not delete: " + (err?.message || err));
    }
}

}