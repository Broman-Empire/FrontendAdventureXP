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
}

// Hjælpemetode til at fylde aktiviteter i en dropdown menu
async function loadActivities() {
    const activitySelector = document.getElementById("activitySelector");

    try {
        let activities;

        if (useMock) {

            activities = [
                {id: 1, name: "Minigolf", minAge: 8, durationMinutes: 60},
                {id: 2, name: "Sumo Wrestling", minAge: 18, durationMinutes: 45},
                {id: 3, name: "Paintball", minAge: 18, durationMinutes: 30},
                {id: 4, name: "Gokart", minAge: 12, durationMinutes: 90}
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
            option.textContent = `${activity.name} (${activity.durationMinutes} min, fra ${activity.minAge} år)`;
            activitySelector.appendChild(option);
        });
    } catch (error) {
        console.error("Fejl da aktiviteter skulle hentes", error);
        activitySelector.innerHTML = `<option value="">Kunne ikke hente aktiviteter</option>`;
    }
}

// Loader Equipment for en given aktivitet
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


