// ---- Admin Activities ----

import { getAdminActivities, createActivity, updateActivity, deleteActivity } from "../api.js";
import { navigation } from "../main.js";


// Formular: opret aktivitet
export async function mount(container) {
    container.innerHTML = `
    <section class="admin-activities">
      <h1>Activity Management</h1>
      <p>Create, edit, or delete activities.</p>

      <!-- Formular til at oprette ny aktivitet -->
      <div class="form-section">
          <h3>Create new activity</h3>
        <input id="name" placeholder="Name">
        <input id="minAge" type="number" placeholder="Min. age">
        <input id="minParticipants" type="number" placeholder="Min. participants">
        <input id="maxParticipants" type="number" placeholder="Max. participants">
        <input id="durationMinutes" type="number" placeholder="Duration (minutes)">
        <input id="parallelCourts" type="number" placeholder="Parallel courts">
       
       
          <h4><Required>Equipment</Required></h4>
            <input id="equipmentName" placeholder="Equipment name">
            <input id="equipmentTotal" type="number" placeholder="Total sets">
            <input id="equipmentUsable" type="number" placeholder="Usable sets">
    
            <button id="createBtn">Create activity</button>
      </div>

      <!-- Container til aktivitets-tabel -->
      <div id="activitiesTableContainer"></div>

      <!-- Tilbageknap til admin.js -->
      <button data-view="admin" class="back-btn">Go back</button>
    </section>
  `;

    // Navigér tilbage
    container.querySelector(".back-btn").addEventListener("click", () => navigation("admin"));

    // Opret aktivitet
    container.querySelector("#createBtn").addEventListener("click", async () => {
        const newActivity = {
            name: document.getElementById("name").value,
            minAge: parseInt(document.getElementById("minAge").value),
            minParticipants: parseInt(document.getElementById("minParticipants").value),
            maxParticipants: parseInt(document.getElementById("maxParticipants").value),
            durationMinutes: parseInt(document.getElementById("durationMinutes").value),
            parallelCourts: parseInt(document.getElementById("parallelCourts").value)
        };

        // Udstyrsinfo
        const equipmentName = document.getElementById("equipmentName").value.trim();
        const totalSets = parseInt(document.getElementById("equipmentTotal").value);
        const usableSets = parseInt(document.getElementById("equipmentUsable").value);

        // Validering af udstyrsinput
        if (!newActivity.name) {
            alert("Please enter an activity name.");
            return;
        }

        if (
            isNaN(newActivity.minAge) ||
            isNaN(newActivity.minParticipants) ||
            isNaN(newActivity.maxParticipants) ||
            isNaN(newActivity.durationMinutes) ||
            isNaN(newActivity.parallelCourts)
        ) {
            alert("All activity fields must be filled in correctly.");
            return;
        }

        // --- Valider udstyr, hvis angivet ---
        if (equipmentName) {
            if (isNaN(totalSets) || isNaN(usableSets)) {
                alert("Equipment quantities must be valid numbers.");
                return;
            }

            if (usableSets > totalSets) {
                alert(`Usable sets (${usableSets}) cannot be greater than total sets (${totalSets}).`);
                document.getElementById("equipmentUsable").value = totalSets;
                return;
            }


            // Hvis der er angivet udstyr, tilføj det til objektet

            newActivity.equipmentList = [
                {
                    name: equipmentName,
                    totalSets,
                    usableSets,
                },
            ];
        }

        try {
            await createActivity(newActivity);
            alert("Activity created!");
            resetForm();
            await loadActivities();
        } catch (err) {
            console.error("Error creating activity:", err);
            alert("Could not create activity.");
        }
    });

    // Indlæs aktiviteter i tabel
    await loadActivities();
}

// Tømmer inputfelter efter oprettelse
function resetForm() {
    [
        "name",
        "minAge",
        "minParticipants",
        "maxParticipants",
        "durationMinutes",
        "parallelCourts",
        "equipmentName",
        "equipmentTotal",
        "equipmentUsable"
    ].forEach(id => (document.getElementById(id).value = ""));
}

// Hent og vis aktiviteter
async function loadActivities() {
    const container = document.getElementById("activitiesTableContainer");

    try {
        const activities = await getAdminActivities();

        if (!activities || activities.length === 0) {
            container.innerHTML = "<p>No activities found.</p>";
            return;
        }

        // Byg tabel med inline edit
        const tableHTML = `
      <table class="activities-table">
        <thead>
          <tr>
             <th>ID</th>
            <th>Name</th>
            <th>Min. age</th>
            <th>Min. participants</th>
            <th>Max. participants</th>
            <th>Duration (min)</th>
            <th>Parallel courts</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          ${activities.map(a => `
            <tr>
              <td>${a.id}</td>
              <td><input type="text" value="${a.name}" data-id="${a.id}" data-field="name"></td>
              <td><input type="number" value="${a.minAge}" data-id="${a.id}" data-field="minAge"></td>
              <td><input type="number" value="${a.minParticipants}" data-id="${a.id}" data-field="minParticipants"></td>
              <td><input type="number" value="${a.maxParticipants}" data-id="${a.id}" data-field="maxParticipants"></td>
              <td><input type="number" value="${a.durationMinutes}" data-id="${a.id}" data-field="durationMinutes"></td>
              <td><input type="number" value="${a.parallelCourts}" data-id="${a.id}" data-field="parallelCourts"></td>
              <td>
                <button class="save-btn" data-id="${a.id}">Save</button>
                <button class="delete-btn" data-id="${a.id}">Delete</button>
              </td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    `;
        container.innerHTML = tableHTML;

        addActivityEventListeners();
    } catch (error) {
        console.error("Error loading activities:", error);
        container.innerHTML = `<p>Could not load activities.</p>`;
    }
}

// Event listeners for SAVE og DELETE
function addActivityEventListeners() {
    const container = document.getElementById("activitiesTableContainer");

    // GEM
    container.querySelectorAll(".save-btn").forEach(btn => {
        btn.addEventListener("click", async e => {
            const id = e.target.dataset.id;
            const inputs = container.querySelectorAll(`input[data-id="${id}"]`);
            const patch = {};

            inputs.forEach(input => {
                const field = input.dataset.field;
                let value = input.value;

                if (input.type === "number") {
                    value = parseInt(value);
                }

                patch[field] = value;
            });

            try {
                await updateActivity(id, patch);
                alert("Activity updated!");
            } catch (err) {
                console.error("Error updating activity:", err);
                alert("Could not update activity.");
            }
        });
    });

    // SLET
    container.querySelectorAll(".delete-btn").forEach(btn => {
        btn.addEventListener("click", async e => {
            const id = e.target.dataset.id;
            if (confirm("Are you sure you want to delete this activity?")) {
                try {
                    await deleteActivity(id);
                    alert("Activity deleted!");
                    await loadActivities();
                } catch (err) {
                    console.error("Error deleting activity:", err);
                    alert("Could not delete activity.");
                }
            }
        });
    });
}
