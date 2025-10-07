// ---- View = forsiden ----

// Importerer navigationsfunktion fra main.js

import { navigation } from "../main.js";

export function mount(container) {
    container.innerHTML = `
    <section class="frontpage">
        <h1>AdventureXP</h1>
        <p>Hvad kunne du tænke dig allermest at gøre:</p>

        <nav class="frontpage-nav">
            <button data-view="booking">Gå til Booking</button>
            <button data-view="admin">Gå til Admin</button>
        </nav>
    </section>    
`;

    // For at kunne trykke på knapperne = 'click'
    const btns = container.querySelectorAll("button");
    btns.forEach(btn => {
        btn.addEventListener("click", () => {
            const chosenView = btn.dataset.view;
            navigation(chosenView);
        });
    });
}
