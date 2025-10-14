// ---- Equipment View (for Admin) ----

import { getActivities, createEquipmentForActivity,getEquipmentByActivity, updateEquipment, deleteEquipment } from "../api.js";
import { navigation } from "../main.js";

const useMock = false; //False, når backend er klar

export async function mount(container) {
    container.innerHTML = `
    <section class="admin view-shell">
      <header class="view-shell__header">
        <div class="view-shell__title-group">
          <h1 class="view-shell__title">Equipment</h1>
          <p class="view-shell__subtitle">Select an activity to view and manage its equipment.</p>
        </div>
        <div class="view-shell__actions">
          <button type="button" class="booking-close" data-action="close">×</button>
          <nav class="view-shell__nav" data-role="admin-nav">
            <button class="btn btn--ghost" data-target="admin">Dashboard</button>
            <button class="btn btn--ghost" data-target="activities">Activities</button>
          </nav>
        </div>
      </header>

      <section class="view-shell__layout">
        <section class="panel">
          <header class="panel__header">
            <h2 class="panel__title">Choose activity</h2>
            <p class="panel__subtitle">Load equipment for a specific activity.</p>
          </header>

          <div class="form-grid">
            <label class="form-field">
              <span class="form-label">Activity</span>
              <select id="activitySelector">
                <option value="">Select activity…</option>
              </select>
            </label>
          </div>

          <div class="panel__body" id="equipmentTableContainer">
            <p class="panel__empty">Pick an activity to view its equipment.</p>
          </div>
        </section>
      </section>
    </section>
    `;

    container.querySelector("[data-action='close']").addEventListener("click", () => navigation("admin"));
    container.querySelector("[data-role='admin-nav']").addEventListener("click", (event) => {
        const btn = event.target.closest("button[data-target]");
        if (!btn) return;
        navigation(btn.dataset.target);
    });

    await loadActivities();

    // Admin vælger en aktivitet, sker der et "skift"
    const activitySelector = container.querySelector("#activitySelector");
    activitySelector.addEventListener("change", async (equipment) => {
        const activityId = equipment.target.value;
        if (activityId) {
            await loadEquipment(activityId);
        } else {
            document.getElementById("equipmentTableContainer").innerHTML = `<p class="panel__empty">Pick an activity to view its equipment.</p>`;
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

        activitySelector.innerHTML = `<option value="">Select activity…</option>`;
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

        renderEquipmentTable(equipmentList, activityId);
    } catch (error) {
        console.error("Error loading equipment:", error);
        container.innerHTML = `<p>Could not load equipment :(</p>`;
    }
}

function renderEquipmentTable(equipmentList, activityId) {
    const container = document.getElementById("equipmentTableContainer");

    if (!equipmentList || equipmentList.length === 0) {
        container.innerHTML = `
      <p class="panel__empty">No equipment found for this activity.</p>
      <section class="panel">
        <header class="panel__header">
          <h3 class="panel__title">Add new equipment</h3>
          <p class="panel__subtitle">Provide equipment details below.</p>
        </header>
        <form class="form-grid" data-role="new-equipment">
          <label class="form-field"><span class="form-label">Name</span><input type="text" id="newEquipmentName" placeholder="Equipment name"></label>
          <label class="form-field"><span class="form-label">Total sets</span><input type="number" id="newEquipmentTotal" min="0" placeholder="Total sets"></label>
          <label class="form-field"><span class="form-label">Usable sets</span><input type="number" id="newEquipmentUsable" min="0" placeholder="Usable sets"></label>
        </form>
        <div class="form-actions">
          <button id="addEquipmentBtn" class="btn btn--primary">Create equipment</button>
        </div>
      </section>
    `;

        const addBtn = document.getElementById("addEquipmentBtn");
        if (addBtn) {
            addBtn.addEventListener("click", async (event) => {
                event.preventDefault();

                const name = document.getElementById("newEquipmentName").value.trim();
                const totalSets = parseInt(document.getElementById("newEquipmentTotal").value);
                const usableSets = parseInt(document.getElementById("newEquipmentUsable").value);

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
    <table class="table panel__table">
      <thead>
        <tr>
          <th>ID</th>
          <th>Name</th>
          <th>Total sets</th>
          <th>Usable sets</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        ${equipmentList
            .map(
                (equipment) => `
              <tr>
                <td>${equipment.id}</td>
                <td><input class="table-input" type="text" value="${equipment.name}" data-equipmentid="${equipment.id}" data-field="name"></td>
                <td><input class="table-input" type="number" min="0" value="${equipment.totalSets}" data-equipmentid="${equipment.id}" data-field="totalSets"></td>
                <td><input class="table-input" type="number" min="0" max="${equipment.totalSets}" value="${equipment.usableSets}" data-equipmentid="${equipment.id}" data-field="usableSets"></td>
                <td class="panel__actions panel__actions--gap">
                  <button class="btn btn--primary btn--sm" data-action="save" data-id="${equipment.id}">Save</button>
                  <button class="btn btn--ghost btn--sm" data-action="delete" data-id="${equipment.id}">Delete</button>
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
    addEquipmentEventListeners(container, activityId);
}

function addEquipmentEventListeners(container, activityId) {
    container.querySelectorAll("[data-action='save']").forEach((saveBtn) => {
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

    container.querySelectorAll("[data-action='delete']").forEach((deleteBtn) => {
        deleteBtn.addEventListener("click", async (event) => {
            const equipmentId = event.target.dataset.id;

            if (!confirm("Are you sure you want to delete this equipment?")) return;
                try {
                    await deleteEquipment(equipmentId);
                    deleteBtn.closest("tr").remove();
                    alert("Equipment deleted!");
                } catch (error) {
                    console.error("Error deleting equipment:", error);
                    alert("Could not delete equipment!");
                }
        });
    });
}