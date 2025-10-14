// ---- Admin Activities ----

import { getAdminActivities, createActivity, updateActivity, deleteActivity } from "../api.js";
import { navigation } from "../main.js";


// Formular: opret aktivitet
export async function mount(container) {
    container.innerHTML = `
    <section class="admin view-shell">
      <header class="view-shell__header">
        <div class="view-shell__title-group">
          <h1 class="view-shell__title">Activities</h1>
          <p class="view-shell__subtitle">Create, edit, or delete activities.</p>
        </div>
        <div class="view-shell__actions">
          <button type="button" class="booking-close" data-action="close">×</button>
          <nav class="view-shell__nav" data-role="admin-nav">
            <button class="btn btn--ghost" data-target="admin">Dashboard</button>
            <button class="btn btn--ghost" data-target="equipment">Equipment</button>
          </nav>
        </div>
      </header>

      <section class="view-shell__layout">
        <section class="panel">
          <header class="panel__header">
            <h2 class="panel__title">Create new activity</h2>
            <p class="panel__subtitle">Fill out all activity fields and optional equipment.</p>
          </header>

          <form class="form-grid" data-role="create">
            <label class="form-field"><span class="form-label">Name</span><input id="name" placeholder="Name" required></label>
            <label class="form-field"><span class="form-label">Min age</span><input id="minAge" type="number" min="0" placeholder="Min. age" required></label>
            <label class="form-field"><span class="form-label">Min participants</span><input id="minParticipants" type="number" min="0" placeholder="Min. participants" required></label>
            <label class="form-field"><span class="form-label">Max participants</span><input id="maxParticipants" type="number" min="0" placeholder="Max. participants" required></label>
            <label class="form-field"><span class="form-label">Duration (minutes)</span><input id="durationMinutes" type="number" min="0" placeholder="Duration" required></label>
            <label class="form-field"><span class="form-label">Parallel courts</span><input id="parallelCourts" type="number" min="0" placeholder="Parallel courts" required></label>
          </form>

          <header class="panel__header">
            <h3 class="panel__title">Optional equipment</h3>
            <p class="panel__subtitle">Leave blank if no equipment is needed.</p>
          </header>
          <form class="form-grid" data-role="equipment">
            <label class="form-field"><span class="form-label">Equipment name</span><input id="equipmentName" placeholder="Equipment name"></label>
            <label class="form-field"><span class="form-label">Total sets</span><input id="equipmentTotal" type="number" min="0" placeholder="Total sets"></label>
            <label class="form-field"><span class="form-label">Usable sets</span><input id="equipmentUsable" type="number" min="0" placeholder="Usable sets"></label>
          </form>

          <div class="form-actions">
            <button id="createBtn" class="btn btn--primary">Create activity</button>
          </div>

          <div class="panel__body" id="activitiesTableContainer">
            <p class="panel__empty">Loading activities…</p>
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

        // Validering af udstyrinput
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
            container.innerHTML = `<p class="panel__empty">No activities found.</p>`;
            return;
        }

        // Byg tabel med inline edit
        const tableHTML = `
      <table class="table panel__table">
        <thead>
          <tr>
             <th>ID</th>
            <th>Name</th>
            <th>Min. age</th>
            <th>Min. participants</th>
            <th>Max. participants</th>
            <th>Duration (min)</th>
            <th>Parallel courts</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          ${activities.map(a => `
            <tr>
              <td>${a.id}</td>
              <td><input class="table-input" type="text" value="${a.name}" data-id="${a.id}" data-field="name"></td>
              <td><input class="table-input" type="number" value="${a.minAge}" data-id="${a.id}" data-field="minAge"></td>
              <td><input class="table-input" type="number" value="${a.minParticipants}" data-id="${a.id}" data-field="minParticipants"></td>
              <td><input class="table-input" type="number" value="${a.maxParticipants}" data-id="${a.id}" data-field="maxParticipants"></td>
              <td><input class="table-input" type="number" value="${a.durationMinutes}" data-id="${a.id}" data-field="durationMinutes"></td>
              <td><input class="table-input" type="number" value="${a.parallelCourts}" data-id="${a.id}" data-field="parallelCourts"></td>
              <td class="panel__actions panel__actions--gap">
                <button class="btn btn--primary btn--sm" data-action="save" data-id="${a.id}">Save</button>
                <button class="btn btn--ghost btn--sm" data-action="delete" data-id="${a.id}">Delete</button>
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
        container.innerHTML = `<p class="panel__empty">Could not load activities.</p>`;
    }
}

// Event listeners for SAVE og DELETE
function addActivityEventListeners() {
    const container = document.getElementById("activitiesTableContainer");

    container.querySelectorAll("[data-action='save']").forEach(btn => {
        btn.addEventListener("click", async e => {
            const id = e.target.dataset.id;
            const inputs = container.querySelectorAll(`input[data-id="${id}"]`);
            const patch = {};

            inputs.forEach(input => {
                const field = input.dataset.field;
                let value = input.value;
                if (input.type === "number") value = parseInt(value);
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

    container.querySelectorAll("[data-action='delete']").forEach(btn => {
        btn.addEventListener("click", async e => {
            const id = e.target.dataset.id;
            if (!confirm("Are you sure you want to delete this activity?")) return;
                try {
                    await deleteActivity(id);
                    alert("Activity deleted!");
                    await loadActivities();
                } catch (err) {
                    console.error("Error deleting activity:", err);
                    alert("Could not delete activity.");
                }
        });
    });
}
