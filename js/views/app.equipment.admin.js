// ---- Equipment View (for Admin) ----

import { getActivities, getEquipmentByActivity, updateEquipment, deleteEquipment } from "../api.js";
import { navigation } from "../main.js";

const useMock = true //False, når backend er klar

export async function mount(container) {
    container.innerHTML = `
        <section class="equipment-admin">
            <h1>Udstyrshåndtering</h1>
            <p>Se udstyr for en aktivitet.</p>
        
            <div class="controls">
            <label for="activitySelector">Vælg aktivitet:</label>
            <select id="activitySelector">
                <option value="">--Vælg aktivitet --</option>
            </select>
            </div>
            
            <div id="equipmentTableContainer"></div>
            
            <button data-view="admin" class="back-btn">Tilbage til adminpanel</button>
            
            </section>
    `;

    // Event listener for tilbageknap til adminpanel
    container.querySelector(".back-btn").addEventListener("click", () => navigation("admin"))


    // Fylder dropdown menu med Activities
    await loadActivities();

    // Admin vælger en aktivitet, sker der et "skift"
    const activitySelector = container.querySelector("#activitySelector");
    activitySelector.addEventListener("change", async (equipment) => {
        const activityId = equipment.target.value;
        if (activityId) {
            await loadEquipment(activityId);
        } else {
            document.getElementById("equipmentTableContainer").innerHTML = "";
        }
    });
}

// Hjælpemetode til at fylde aktiviteter i en dropdown menu
async function loadActivities() {
    const activitySelector = document.getElementById("activitySelector");

    try {
        let activities;

        if (useMock) {

            activities = [
                {id: 1, name: "Minigolf"},
                {id: 2, name: "Sumo Wrestling"},
                {id: 3, name: "Paintball"},
                {id: 4, name: "Gokart"}
            ];
        } else {
            activities = await getActivities(); // Henter ActivityDTO fra backend
        }

        // Rydder dropdown menu for ingen duplikater
        activitySelector.innerHTML = `<option value="">-- Vælg aktivitet --</option>`;

        // Fylder dropdown med Activities
        activities.forEach(activity => {
            const option = document.createElement("option");

            // Viser navn, minimumsalder og varighed
            option.value = activity.id;
            option.textContent = activity.name; // Viser navn på frontend
            activitySelector.appendChild(option);
        });
    } catch (error) {
        console.error("Fejl da aktiviteter skulle hentes", error);
        activitySelector.innerHTML = `<option value="">Kunne ikke hente aktiviteter</option>`;
    }
}

// Hjælpemetode til at hente Equipment for en given aktivitet
async function loadEquipment(activityId) {
    const container = document.getElementById("equipmentTableContainer");

    try {
        let equipmentList;

        if (useMock) {
            equipmentList = [
                { id: 1, name: "Minigolfudstyr", totalSets: 50, usableSets: 48},
                { id: 2, name: "Sumo Wrestling udstyr", totalSets: 20, usableSets: 20},
                { id: 3, name: "Paintballudstyr", totalSets: 30, usableSets: 25},
                { id: 4, name: "Gokart", totalSets: 10, usableSets: 8}
            ];
        } else {
            equipmentList = await getEquipmentByActivity(activityId);
        }

        // Viser aktivitetens udstyr
        renderEquipmentTable(equipmentList);
    } catch (error) {
        console.error("Fejl opstod, da der skulle hentes udstyr:", error);
        container.innerHTML = `<p>Kunne ikke hente udstyr :(</p>`;
    }
}

// Hjælpemetode til at vise Equipment i en tabel
function renderEquipmentTable(equipmentList) {
    const container = document.getElementById("equipmentTableContainer");

    if (!equipmentList || equipmentList.length === 0) {
        container.innerHTML = `<p>Ingen udstyr fundet for denne aktivitet.</p>`;
        return;
    }
    // Bygger HTML-tabellen som en String
    const tableHTML = `
    <table class="equipment-table">
      <thead>
        <tr>
          <th>ID</th>
          <th>Navn</th>
          <th>Antal sæt udstyr</th>
          <th>Antal brugbare sæt udstyr</th>
          <th>Handling</th>
        </tr>
      </thead>
      <tbody>
        ${equipmentList // Itererer gennem listen af udstyr og indsætter værdier
        .map(
            equipment => `
              <tr>
                <td>${equipment.id}</td>
                <td>${equipment.name}</td>
                <td>${equipment.totalSets}</td>
                <td>
                  <input 
                    type="number" 
                    value="${equipment.usableSets}" 
                    min="0" 
                    max="${equipment.totalSets}" 
                    data-equipmentid="${equipment.id}" 
                    class="usableSetsInput"
                  >
                </td>
                <td>
                  <button class="save-btn" data-id="${equipment.id}">Gem</button>
                  <button class="delete-btn" data-id="${equipment.id}">Slet</button>
                </td>
              </tr>
            `
        )
        // .join samler rækkerne til én samlet string
        .join("")}
      </tbody>
    </table>
  `;

    // Indsæt tabellen i containeren
    container.innerHTML = tableHTML;

    // Event listener for SAVE
    container.querySelectorAll(".save-btn").forEach(saveBtn => {
        saveBtn.addEventListener("click", async (event) => {
            const equipmentId = event.target.dataset.id;
            const usableSets = container.querySelector(`input[data-equipmentid="${equipmentId}"]`)
            const newUsableSet = parseInt(usableSets.value);

            try {
                await updateEquipment(equipmentId, { usableSets: newUsableSet})
                alert("Udstyr opdateret!");
            } catch (error) {
                console.error("Fejl ved opdatering af udstyr:", error);
                alert("Udstyret kunne ikke opdateres!");
            }
        })
    });

    // Event listener for DELETE
    container.querySelectorAll(".delete-btn").forEach(deleteBtn => {
        deleteBtn.addEventListener("click", async (event) => {
            const equipmentId = event.target.dataset.id;

            if (confirm("Er du inderligt sikker på, at du vil slette dette sæt udstyr?")) {
                try {
                    await deleteEquipment(equipmentId);
                    deleteBtn.closest("tr").remove();
                    alert("Udstyret blev slettet!");
                } catch (error) {
                    console.error("Fejl ved sletning:", error);
                    alert("Udstyret kunne ikke slettes!");
                }
            }
        })
    });
}


