// ---- View = Reservationer (admin) ----

import { getReservations, updateReservation } from "../api.js";

let _container; // gemmer container så vi kan genindlæse efter PATCH

export function mount(container) {
    _container = container;

    container.innerHTML = `
    <section class="reservations-view">
      <h1>Reservationer</h1>

      <div class="toolbar" style="display:flex; gap:8px; align-items:center; margin-bottom:12px;">
        <input id="datePicker" type="date" />
        <button id="btnRefresh">Opdater</button>
      </div>

      <div id="reservationsTable"></div>
    </section>
  `;

    const dateInput  = container.querySelector("#datePicker");
    const btnRefresh = container.querySelector("#btnRefresh");

    // default: i dag
    dateInput.value = new Date().toISOString().slice(0, 10);

    const reload = async () => {
        try {
            const data = await getReservations(dateInput.value);
            renderTable(data);
        } catch (e) {
            console.error(e);
            container.querySelector("#reservationsTable").innerHTML = `<p>Kunne ikke hente reservationer.</p>`;
        }
    };

    btnRefresh.addEventListener("click", reload);
    dateInput.addEventListener("change", reload);

    // første load
    reload();
}

function renderTable(list) {
    const host = _container.querySelector("#reservationsTable");

    if (!list || list.length === 0) {
        host.innerHTML = `<p>Ingen reservationer for den valgte dato.</p>`;
        return;
    }

    const rows = list.map(r => `
    <tr>
      <td>${r.id}</td>
      <td>${r.activityId ?? "-"}</td>
      <td>${r.participants ?? "-"}</td>
      <td>${r.totalParticipants ?? "-"}</td>
      <td>${r.startsAt ? r.startsAt.replace("T"," ").slice(0,16) : "-"}</td>
      <td><button class="btn-edit" data-id="${r.id}">Redigér</button></td>
    </tr>
  `).join("");

    host.innerHTML = `
    <table class="table-reservations" style="width:100%; border-collapse:collapse;">
      <thead>
        <tr>
          <th>ID</th>
          <th>Aktivitet</th>
          <th>Hold</th>
          <th>I alt</th>
          <th>Start</th>
          <th></th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  `;

    // Knyt "Redigér" til openEdit (forventes at være global eller importeret i app.js)
    host.querySelectorAll(".btn-edit").forEach(btn => {
        btn.addEventListener("click", () => {
            const id = btn.dataset.id;
            if (typeof window.openEdit === "function") {
                window.openEdit(id);
            } else if (typeof openEdit === "function") {
                openEdit(id);
            } else {
                console.warn("openEdit ikke fundet. Eksponér den globalt i app.js (window.openEdit = openEdit).");
            }
        });
    });
}

// ---- PATCH + genindlæs ----
export async function applyUpdate(reservationId, updateBody) {
    const form  = document.getElementById("editReservationForm");
    const modal = document.getElementById("editModal");

    const submitBtn = form?.querySelector('button[type="submit"]');
    const originalText = submitBtn?.textContent;
    if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = "Gemmer..."; }

    try {
        // 1) PATCH
        await updateReservation({ reservationId, ...updateBody });

        // 2) Luk modal
        if (modal) modal.style.display = "none";

        // 3) Genindlæs visningen
        // Prøv specifikke hooks hvis de findes:
        if (typeof window.refreshReservations === "function") {
            await window.refreshReservations();
        } else if (typeof window.loadReservationsForDate === "function") {
            const selectedDate = document.querySelector('#datePicker')?.value;
            await window.loadReservationsForDate(selectedDate);
        } else if (typeof window.searchReservations === "function") {
            await window.searchReservations();
        } else {
            // Fallback: hård reload
            window.location.reload();
        }

    } catch (err) {
        console.error(err);
        alert("Kunne ikke opdatere reservationen. Tjek felterne og prøv igen.");
    } finally {
        if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = originalText; }
    }
}
