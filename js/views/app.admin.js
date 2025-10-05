// ---- Admin-siden ----

import {navigation} from "../main.js";
import { getActivities } from "../api.js";

// Mock skal være false, når backend kører
const useMock = true;

export function mount(container) {
    container.innerHTML = `
    <selection class="admin">
        <h1>Adminpanel</h1>
        <p>Se og administrer bookinger på denne labre side.<p>
        
        <div class="admin-controls">
            <label for="date">Vælg dato:</label>
            <input type="date" id="datePicker" /> <!-- ID bruges til evenListener -->
            <button id="loadScheduleBtn">Indlæs skema</button> <!-- ID bruges til evenListener -->
        </div>
        
        <div id="schedule"></div>
        
        <button data-view="frontpage" class="back-btn">Tilbage til forsiden</button>   
    </selection>         
`;
    // Event listener for "tilbage på forsiden"
    const backBtn = container.querySelector(".back-btn");
    backBtn.addEventListener("click", () => navigation("frontpage"));

    // Event listener for "indlæs skema"
    const loadScheduleBtn = container.querySelector("#loadScheduleBtn");
    const dateInput = container.querySelector("#datePicker");
    loadScheduleBtn.addEventListener("click", async () => {
        const chosenDate = dateInput.value || new Date().toISOString().split("T")[0];
        await loadSchedule(chosenDate);
    });
}

// Hjælpefunktion til at indlæse skema for en bestemt dato
export async function loadSchedule(date) {

    const scheduleContainer = document.getElementById("schedule");
    scheduleContainer.innerHTML = `<p>Indlæser aktiviteter for ${date}</p>`;

    try {
        let rows;

        if (useMock) {
            console.log("Bruger mockdata i stedet for API.");

            rows = [
                { id: 1, name: "Minigolf", minAge: 6, durationMinutes: 90 },
                { id: 2, name: "Sumo wrestling", minAge: 18, durationMinutes: 60 },
                { id: 3, name: "Paintball", minAge: 18, durationMinutes: 45 }
            ];
        } else {
            console.log("Henter rigtig data fra API.");
            rows = await getActivities(); // Henter JSON fra backend
        }

        renderSchedule(rows);
    } catch (error) {
        console.log("Fejl da aktiviteter skulle hentes:", error);
        scheduleContainer.innerHTML = `<p>Kunne ikke hente aktiviteter :(</p>`;
    }
}

// Når aktiviteter hentes indsættes de i en tabel
export function renderSchedule(rows) {
    const scheduleContainer = document.getElementById("schedule");

    if (!rows || rows.length === 0) {
        scheduleContainer.innerHTML = `<p>Ingen aktiviteter fundet.</p>`;
        return;
    }

    // Bygger HTML-tabellen som en String
    const tableHTML = `
    <table class="schedule-table">
      <thead>
        <tr>
          <th>ID</th>
          <th>Navn</th>
          <th>Min. alder</th>
          <th>Varighed (min)</th>
        </tr>
      </thead>
      <tbody>
        ${rows //Itererer gennem listen af aktiviteter og indsætter værdier = eks. row.id
        .map(
            row => `
          <tr>
            <td>${row.id}</td> 
            <td>${row.name}</td>
            <td>${row.minAge}</td>
            <td>${row.durationMinutes}</td>
          </tr>`
        ) // .join samler rækkerene til én String
        .join("")} 
      </tbody>
    </table>
  `;

    scheduleContainer.innerHTML = tableHTML;



}