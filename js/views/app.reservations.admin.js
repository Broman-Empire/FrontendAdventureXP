// --- Admin Reservation ---
import { searchReservation, getSchedule, deleteReservation } from "../api.js";
import { navigation } from "../main.js";

export async function mount(container) {
    container.innerHTML = `
    <section class="admin-reservation">
    <h1>Reservationer</h1>
    <p>Søg via telefonnummer eller vælg en dato.</p>
    
    <div class="controls">
        <input type="text" id="searchInput" placeholder="Indtast telefonummer og tryk Enter">
        <input type="date" id="dateFilter">
        <button id="searchBtn">Søg</button>
    </div>

    <p id="statusBox"></p>

    <p id="emptyState" class="empty-state">
            Søg efter en reservation for at se resultater
    </p>
    
    <table id="resultTable" class="result-table" style="display:none;">
        <thead>
            <tr>
                <th>ID</th>
                <th>Navn</th>
                <th>Email</th>
                <th>Telefon</th>
                <th>Kundetype</th>
                <th>Booking(s)</th>
            </tr>
        </thead>
        <tbody></tbody>
    </table>
    
    <button data-view="admin" class="back-btn">Tilbage til adminpanel</button>
    </section>
    `;

    // Event listener for tilbageknap til adminpanel
    container.querySelector(".back-btn").addEventListener("click", () => navigation("admin"));

    // --- Event listener for søgeknap ---
    const searchInput = container.querySelector("#searchInput");
    const dateFilter = container.querySelector("#dateFilter");
    const searchBtn = container.querySelector("#searchBtn");
    const statusBox = container.querySelector("#statusBox");

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
        if (!phone) return alert("Indtast et telefonnummer!");

        // Ryd status og tom-state inden ny søgning
        statusBox.textContent = "";
        container.querySelector("#emptyState").style.display = "none";

        // Valider telefonnummer (skal være 8 cifre)
        const phoneRegex = /^\d{8}$/;
        if (!phoneRegex.test(phone)) {
            alert("Indtast et gyldigt dansk telefonnummer (8 cifre).");
            return;
        }

        searchBtn.disabled = true;
        searchBtn.textContent = "Søger...";

        try {
            const reservations = await searchReservation(phone);
            renderResults(reservations);

            // Formateres nummeret til "xx xx xx xx"
            const formattedPhone = phone.replace(/(\d{2})(?=\d)/g, '$1 ').trim();
            statusBox.textContent = `Viser resultater for telefonnummer: ${formattedPhone}`;

            console.log("Reservations loaded:", reservations); // Konsol log for at sikre at reservationer bliver loaded
            searchInput.value = ""; // Nulstil søgefæltet efter succesfuld søgning
        } catch (err) {
            alert("Fejl ved søgning: " + err.message);
        } finally {
            searchBtn.disabled = false;
            searchBtn.textContent = "Søg";
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
            const schedule = await getSchedule(date);
            renderResults(schedule);
            statusBox.textContent = `Viser skema for dato: ${date}`;
        } catch (err) {
            alert("Fejl ved hentning af schedule: " + err.message);
        } finally {
            dateFilter.disabled = false;
        }
    });

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
            emptyState.textContent = "Ingen resultater fundet - prøv et andet telefonnummer eller dato.";
            return;
        }

        // Der er resultater → vis tabellen
        resultTable.style.display = "table";
        emptyState.style.display ="none";

        // Fyld tabellen med rækker
        reservations.forEach(result => {
            const bookings = result.bookings
                ?.map(b => `${b.activityName}: ${b.timeSlot}`)
                .join("<br>") || "Ingen bookinger";

            const row = document.createElement("tr");
            row.innerHTML = `
                <td>${result.id}</td>
                <td>${result.contactName}</td>
                <td>${result.email}</td>
                <td>${result.phone}</td>
                <td>${result.customerType}</td>
                <td>${bookings}</td>
            `;
            resultBody.appendChild(row);
        });
    }
}