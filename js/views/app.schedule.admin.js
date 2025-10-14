// ---- Admin Schedule ----

import { getDailySchedule } from "../api.js";

// Mock skal være false, når backend kører
const useMock =  false;

export async function mount(container) {
    container.innerHTML = `
    <section class="admin-schedule">
      <h1>Today's Schedule</h1>
      <p>Select a date to see reservations.</p>

      <div class="admin-controls">
        <label for="datePicker">Date:</label>
        <input type="date" id="datePicker" />
        <button id="loadScheduleBtn">Get schedule</button>
      </div>

      <div id="schedule"></div>

      <button data-view="admin" class="back-btn">Go back</button>
    </section>
  `;

    // --- Event listener for "Indlæs skema" ---
    const loadBtn = container.querySelector("#loadScheduleBtn");
    const dateInput = container.querySelector("#datePicker");

    // Hvis brugeren vælger dato = dateInput, hvis ikke = new String med dagens dato i samme format, som input type="date"
    loadBtn.addEventListener("click", async () => {
                                        // "T" splitter dato og klokkeslæt (ISO-format), dato ligger på indeks 0
        const chosenDate = dateInput.value || new Date().toISOString().split("T")[0];
        await loadSchedule(chosenDate);
    });

    // --- Event listener for tilbage-knap ---
    container.querySelector(".back-btn").addEventListener("click", () => {
        import("../main.js").then(module => module.navigation("admin"));
    });
}


// Hjælpefunktion til at indlæse skema for en bestemt dato
export async function loadSchedule(date) {

    const scheduleContainer = document.getElementById("schedule");
    scheduleContainer.innerHTML = `<p>Getting schedule for: ${date}</p>`;

    try {
        let rows;

        if (useMock) {
            console.log("Using mock data instead of API.");
            rows = [
                {
                    id: 1,
                    activityId: 2,
                    participants: 8,
                    totalParticipants: 12,
                    startsAt: `${date}T09:00:00`
                },
                {
                    id: 2,
                    activityId: 1,
                    participants: 4,
                    totalParticipants: 8,
                    startsAt: `${date}T11:00:00`
                }
            ];
        } else {
            console.log("Fetching data from API.");
            rows = await getDailySchedule(date); // Henter JSON fra backend
        }

        // Sorterer efter tid
        rows.sort((a, b) => new Date(a.startsAt) - new Date(b.startsAt));

        renderSchedule(rows); //Indsætter i html-tabel

    } catch (error) {
        console.log("Error occurred while loading reservations:", error);
        scheduleContainer.innerHTML = `<p>Could not load reservations:(</p>`;
    }
}

// Når aktiviteter hentes indsættes de i en tabel
export function renderSchedule(rows) {
    const scheduleContainer = document.getElementById("schedule");

    if (!rows || rows.length === 0) {
        scheduleContainer.innerHTML = `<p>No reservations found.</p>`;
        return;
    }

// Bygger HTML-tabellen som en String
    const tableHTML = `
    <table class="schedule-table">
      <thead>
        <tr>
          <th>Booking ID</th>
          <th>Name of activity</th>
          <th>Start time</th>
          <th>End time</th>
          <th>Participants</th>
          <th>Customer name</th>
          <th>Capacity</th>
          
        </tr>
      </thead>
      <tbody>
        ${rows //Itererer gennem listen af aktiviteter og indsætter værdier = eks. row.id
        .map(
            row => `
              <tr>
                <td>${row.bookingId}</td>
                <td>${row.activityName}</td>
                <td>${formatDateTime(row.startsAt)}</td>
                <td>${formatDateTime(row.endsAt)}</td>
                <td>${row.participants}</td>
                <td>${row.contactName}</td>
                <td>${row.totalParticipants}</td>
              </tr>
            `
        )// .join samler rækkerene til én String
        .join("")}
      </tbody>
    </table>
  `;

    scheduleContainer.innerHTML = tableHTML;
}

// Konverterer backend-dato til en JS Date-objekt (læsbar)
function formatDateTime(dateTimeStr) {
    const date = new Date(dateTimeStr);
    return `${date.toLocaleDateString()} ${date.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})}`;
}
