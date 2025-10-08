// ---- Admin-siden ----

import { navigation } from "../main.js";

export function mount(container) {
    container.innerHTML = `
    <section class="admin">
      <h1>Adminpanel</h1>
      <p>Vælg hvad du vil administrere.</p>

      <nav class="admin-menu">
        <button data-view="schedule">Skema</button>
        <button data-view="reservations">Reservationer</button>
        <button data-view="equipment">Udstyr</button>
        <button data-view="activities">Aktiviteter</button>
        <button data-view="frontpage">Forside</button>
      </nav>
    </section>
  `;

    // --- Navigation event listeners ---
    container.querySelectorAll("[data-view]").forEach(btn => {
        btn.addEventListener("click", e => {
            const view = e.target.dataset.view;
            navigation(view);
        });
    });
}
