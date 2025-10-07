// ---- Admin-siden ----

import { navigation } from "../main.js";
import { getReservations } from "../api.js";

// Mock skal være false, når backend kører
const useMock = true;

export function mount(container) {
    container.innerHTML = `
    <section class="admin">
      <h1>Adminpanel</h1>
      <p>Her kan du se dagens skema for reservationer.</p>

      <div class="admin-controls">
        <label for="datePicker">Vælg dato:</label>
        <input type="date" id="datePicker" />
        <button id="loadScheduleBtn">Indlæs skema</button>
      </div>

      <div id="schedule"></div>
      
      <di>
      <button data-view="equipment" class="equipment-btn">Se Udstyr</button>
      </div>
      

      <button data-view="frontpage" class="back-btn">Tilbage til Forsiden</button>
    </section>
  `;

    // Event listener for "Se udstyr"
    container.querySelector("[data-view='equipment']").addEventListener("click", () => navigation("equipment"));

    // Event listener for "indlæs skema"
    const loadScheduleBtn = container.querySelector("#loadScheduleBtn");
    const dateInput = container.querySelector("#datePicker");
    loadScheduleBtn.addEventListener("click", async () => {
        const chosenDate = dateInput.value || new Date().toISOString().split("T")[0];
        await loadSchedule(chosenDate);
    });


    // Event listener for "tilbage på forsiden"
    const backBtn = container.querySelector(".back-btn");
    backBtn.addEventListener("click", () => navigation("frontpage"));


}

// Hjælpefunktion til at indlæse skema for en bestemt dato
export async function loadSchedule(date) {

    const scheduleContainer = document.getElementById("schedule");
    scheduleContainer.innerHTML = `<p>Indlæser skema for ${date}</p>`;

    try {
        let rows;

        if (useMock) {
            console.log("Bruger mockdata i stedet for API.");
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
            console.log("Henter rigtig data fra API.");
            rows = await getReservations(); // Henter JSON fra backend
        }

        renderSchedule(rows); //Indsætter i html-tabel

    } catch (error) {
        console.log("Fejl da reservationer skulle hentes:", error);
        scheduleContainer.innerHTML = `<p>Kunne ikke hente reservationer :(</p>`;
    }
}

// Når aktiviteter hentes indsættes de i en tabel
export function renderSchedule(rows) {
    const scheduleContainer = document.getElementById("schedule");

    if (!rows || rows.length === 0) {
        scheduleContainer.innerHTML = `<p>Ingen reservationer fundet.</p>`;
        return;
    }

// Bygger HTML-tabellen som en String
    const tableHTML = `
    <table class="schedule-table">
      <thead>
        <tr>
          <th>ID</th>
          <th>Aktivitets-ID</th>
          <th>Starttidspunkt</th>
          <th>Deltagere</th>
          <th>Kapacitet</th>
        </tr>
      </thead>
      <tbody>
        ${rows //Itererer gennem listen af aktiviteter og indsætter værdier = eks. row.id
        .map(
            row => `
              <tr>
                <td>${row.id}</td>
                <td>${row.activityId}</td>
                <td>${formatDateTime(row.startsAt)}</td>
                <td>${row.participants}</td>
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
