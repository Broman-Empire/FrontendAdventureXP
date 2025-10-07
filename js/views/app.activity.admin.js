// ---- Admin Activities ----

import { getAdminActivities, createActivity, updateActivity, deleteActivity } from "../api.js";
import { navigation } from "../main.js";

export async function mount(container) {
    container.innerHTML = `
    <section class="admin-activities">
      <h1>Aktivitetsadministration</h1>
      <p>Opret, redigér eller slet aktiviteter.</p>

      <!-- Formular til at oprette ny aktivitet -->
      <div class="form-section">
        <h3>Opret ny aktivitet</h3>
        <input id="name" placeholder="Navn">
        <input id="minAge" type="number" placeholder="Min. alder">
        <input id="minParticipants" type="number" placeholder="Min. deltagere">
        <input id="maxParticipants" type="number" placeholder="Max deltagere">
        <input id="durationMinutes" type="number" placeholder="Varighed">
        <input id="parallelCourts" type="number" placeholder="Parallelle baner">
        <button id="createBtn">Opret aktivitet</button>
      </div>

      <!-- Container til aktivitets-tabel -->
      <div id="activitiesTableContainer"></div>

      <!-- Tilbageknap til admin.js -->
      <button data-view="admin" class="back-btn">Tilbage</button>
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

        try {
            await createActivity(newActivity);
            alert("Aktivitet oprettet!");
            resetForm();
            await loadActivities(); // Opdater UI
        } catch (err) {
            console.error("Fejl ved oprettelse:", err);
            alert("Kunne ikke oprette aktivitet.");
        }
    });

    // Indlæs aktiviteter i tabel
    await loadActivities();
}

// Tømmer inputfelter efter oprettelse
function resetForm() {
    ["name", "minAge", "minParticipants", "maxParticipants", "durationMinutes", "parallelCourts"]
        .forEach(id => document.getElementById(id).value = "");
}

// Hent og vis aktiviteter
async function loadActivities() {
    const container = document.getElementById("activitiesTableContainer");

    try {
        const activities = await getAdminActivities();

        if (!activities || activities.length === 0) {
            container.innerHTML = "<p>Ingen aktiviteter fundet.</p>";
            return;
        }

        // Byg tabel med inline edit
        const tableHTML = `
      <table class="activities-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Navn</th>
            <th>Min. alder</th>
            <th>Min. deltagere</th>
            <th>Max deltagere</th>
            <th>Varighed</th>
            <th>Parallel Courts</th>
            <th>Handling</th>
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
                <button class="save-btn" data-id="${a.id}">Gem</button>
                <button class="delete-btn" data-id="${a.id}">Slet</button>
              </td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    `;
        container.innerHTML = tableHTML;

        addActivityEventListeners();
    } catch (error) {
        console.error("Fejl ved hentning af aktiviteter:", error);
        container.innerHTML = `<p>Kunne ikke hente aktiviteter.</p>`;
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
                const value = input.type === "number" ? parseInt(input.value) : input.value;
                patch[field] = value;
            });

            try {
                await updateActivity(id, patch);
                alert("Aktivitet opdateret!");
            } catch (err) {
                console.error("Fejl ved opdatering:", err);
                alert("Kunne ikke opdatere aktivitet.");
            }
        });
    });

    // SLET
    container.querySelectorAll(".delete-btn").forEach(btn => {
        btn.addEventListener("click", async e => {
            const id = e.target.dataset.id;
            if (confirm("Er du sikker på, du vil slette denne aktivitet?")) {
                try {
                    await deleteActivity(id);
                    alert("Aktivitet slettet!");
                    await loadActivities();
                } catch (err) {
                    console.error("Fejl ved sletning:", err);
                    alert("Kunne ikke slette aktivitet.");
                }
            }
        });
    });
}
