// ---- Equipment View (for Admin) ----

import { getActivities, createEquipmentForActivity,getEquipmentByActivity, updateEquipment, deleteEquipment } from "../api.js";
import { navigation } from "../main.js";

const useMock = false; //False, når backend er klar

export async function mount(container) {
    container.innerHTML = `
        <section class="equipment-admin">
             <h1>Equipment Management</h1>
            <p>View equipment for an activity.</p>
     
                <div class="controls">
            <label for="activitySelector">Select activity:</label>
            <select id="activitySelector">
                <option value="">-- Select activity --</option>
            </select>
            </div>
            
            <div id="equipmentTableContainer"></div>
            
            <button data-view="admin" class="back-btn">Go back</button>
            
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
        activitySelector.innerHTML = `<option value="">-- Select activity --</option>`;

        // Fylder dropdown med Activities
        activities.forEach(activity => {
            const option = document.createElement("option");

            // Viser navn, minimumsalder og varighed
            option.value = activity.id;
            option.textContent = activity.name; // Viser navn på frontend
            activitySelector.appendChild(option);
        });
    } catch (error) {
        console.error("Error fetching activities:", error);
        activitySelector.innerHTML = `<option value="">Could not load activities</option>`;
    }
}

// Hjælpemetode til at hente Equipment for en given aktivitet
async function loadEquipment(activityId) {
    const container = document.getElementById("equipmentTableContainer");

    try {
        let equipmentList;

        if (useMock) {
            equipmentList = [
                { id: 1, name: "Minigolf Equipment", totalSets: 50, usableSets: 48 },
                { id: 2, name: "Sumo Wrestling Equipment", totalSets: 20, usableSets: 20 },
                { id: 3, name: "Paintball Equipment", totalSets: 30, usableSets: 25 },
                { id: 4, name: "Go-kart", totalSets: 10, usableSets: 8 }
            ];
        } else {
            equipmentList = await getEquipmentByActivity(activityId);
        }

        // Viser aktivitetens udstyr
        renderEquipmentTable(equipmentList);
    } catch (error) {
        console.error("Error loading equipment:", error);
        container.innerHTML = `<p>Could not load equipment :(</p>`;
    }
}

// Hjælpemetode til at vise Equipment i en tabel
function renderEquipmentTable(equipmentList) {
    const container = document.getElementById("equipmentTableContainer");

    if (!equipmentList || equipmentList.length === 0) {
        container.innerHTML = `
      <p>No equipment found for this activity.</p>
      <div class="add-equipment-form">
        <h3>Add new equipment</h3>
        <input type="text" id="newEquipmentName" placeholder="Equipment name">
        <input type="number" id="newEquipmentTotal" placeholder="Total sets" min="0" step="1">
        <input type="number" id="newEquipmentUsable" placeholder="Usable sets" min="0" step="1">
        <button id="addEquipmentBtn">Create equipment</button>
      </div>
    `;

        const addBtn = document.getElementById("addEquipmentBtn");
        if (addBtn) {
            addBtn.addEventListener("click", async (event) => {
                event.preventDefault();

                const name = document.getElementById("newEquipmentName").value.trim();
                const totalSets = parseInt(document.getElementById("newEquipmentTotal").value);
                const usableSets = parseInt(document.getElementById("newEquipmentUsable").value);
                const activityId = document.getElementById("activitySelector").value;

                // --- Validering ---
                if (!activityId) {
                    alert("Please select an activity first.");
                    return;
                }

                if (!name || isNaN(totalSets) || isNaN(usableSets)) {
                    alert("All fields must be filled in correctly.");
                    return;
                }

                if (usableSets > totalSets) {
                    alert(`Usable sets (${usableSets}) cannot be greater than total sets (${totalSets}).`);
                    document.getElementById("newEquipmentUsable").value = totalSets;
                    return;
                }

                try {
                    await createEquipmentForActivity(activityId, { name, totalSets, usableSets });
                    alert("Equipment created!");
                    await loadEquipment(activityId);
                } catch (err) {
                    console.error("Error creating equipment:", err);
                    alert("Could not create equipment.");
                }
            });
        }

        return;
    }


    // Bygger HTML-tabellen som en String
    const tableHTML = `
    <table class="equipment-table">
      <thead>
        <tr>
          <th>ID</th>
          <th>Name</th>
          <th>Total sets</th>
          <th>Usable sets</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        ${equipmentList
        .map(
            (equipment) => `
              <tr>
                <td>${equipment.id}</td>
                <td>
                  <input 
                    type="text" 
                    value="${equipment.name}" 
                    data-equipmentid="${equipment.id}" 
                    data-field="name"
                  >
                </td>
                <td>
                  <input 
                    type="number" 
                    value="${equipment.totalSets}" 
                    min="0"
                    data-equipmentid="${equipment.id}" 
                    data-field="totalSets"
                  >
                </td>
                <td>
                  <input 
                    type="number" 
                    value="${equipment.usableSets}" 
                    min="0" 
                    max="${equipment.totalSets}" 
                    data-equipmentid="${equipment.id}" 
                    data-field="usableSets"
                  >
                </td>
                <td>
                  <button class="save-btn" data-id="${equipment.id}">Save</button>
                  <button class="delete-btn" data-id="${equipment.id}">Delete</button>
                </td>
              </tr>
            `
        )
        .join("")}
      </tbody>
    </table>
  `;

    // Indsæt tabellen i containeren
    container.innerHTML = tableHTML;


    // SAVE + DELETE event listeners
    addEquipmentEventListeners(container);
}

// ---- Event Listeners ----
function addEquipmentEventListeners(container) {
    // SAVE
    const saveButtons = container.querySelectorAll(".save-btn");
    saveButtons.forEach((saveBtn) => {
        saveBtn.addEventListener("click", async (event) => {
            const equipmentId = event.target.dataset.id;

            // Find alle inputs i rækken med samme equipmentId
            const inputs = container.querySelectorAll(
                `input[data-equipmentid="${equipmentId}"]`
            );

            const patch = {};
            let totalSetsValue = null;
            let usableSetsValue = null;

            inputs.forEach((input) => {
                const field = input.dataset.field;
                let value;

                if (input.type === "number") {
                    value = parseInt(input.value);
                } else {
                    value = input.value;
                }

                patch[field] = value;

                // Gem værdier for kontrol
                if (field === "totalSets") totalSetsValue = value;
                if (field === "usableSets") usableSetsValue = value;
            });

            // 🔒 Tjek at usableSets ikke overstiger totalSets
            if (
                totalSetsValue !== null &&
                usableSetsValue !== null &&
                usableSetsValue > totalSetsValue
            ) {
                alert(
                    `Usable sets (${usableSetsValue}) cannot be greater than total sets (${totalSetsValue}).`
                );

                // Sæt feltet tilbage til max tilladt værdi
                const usableInput = container.querySelector(
                    `input[data-equipmentid="${equipmentId}"][data-field="usableSets"]`
                );
                usableInput.value = totalSetsValue;
                return; // stop før der sendes request til backend
            }

            try {
                await updateEquipment(equipmentId, patch);
                alert("Equipment updated!");
            } catch (error) {
                console.error("Error updating equipment:", error);
                alert("Could not update equipment!");
            }
        });
    });

    // DELETE
    const deleteButtons = container.querySelectorAll(".delete-btn");
    deleteButtons.forEach((deleteBtn) => {
        deleteBtn.addEventListener("click", async (event) => {
            const equipmentId = event.target.dataset.id;

            const confirmation = confirm(
                "Are you sure you want to delete this equipment?"
            );
            if (confirmation) {
                try {
                    await deleteEquipment(equipmentId);
                    deleteBtn.closest("tr").remove();
                    alert("Equipment deleted!");
                } catch (error) {
                    console.error("Error deleting equipment:", error);
                    alert("Could not delete equipment!");
                }
            }
        });
    });
}