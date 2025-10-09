// ---- View = frontpage ----

import { navigation } from "../main.js";
import { getActivities } from "../api.js";

// Mount function to display the frontpage
export async function mount(container) {
    container.innerHTML = `
    <section class="frontpage">
      <div class="container text-center mt-2">
        <h1 style="font-family: var(--font-heading); font-size: 3rem;">Adventure XP</h1>
        <p class="mt-1" style="font-family: var(--font-body); font-weight: 600;">ADVENTURE · ADRENALINE · ACTION · ALIVE · ALL IN</p>
        <div class="mt-2">
          <h2 style="font-size: 2rem; font-family: var(--font-heading);">FEEL THE RUSH<br>HAVE SOME FUN</h2>
          <button class="btn btn--primary btn--lg mt-2" id="main-booking-btn">BOOK</button>
        </div>
        <div id="activity-list" class="mt-3"></div>
        <footer class="mt-3" style="font-weight: 700;">
          <div>MADE BY BIEMPIRE &nbsp; INSTA EMAIL</div>
          <div>ADVENTURE XP &copy;2025</div>
        </footer>
      </div>
    </section>`;

    // Navigation buttons
    container.querySelector("#main-booking-btn").addEventListener("click", () => navigation("booking"));

    // Fetch and render activities
    const activities = await getActivities();
    renderActivities(activities);

    // Function to render activities in a grid layout
    function renderActivities(activities) {
        const list = container.querySelector("#activity-list");
        list.innerHTML = `
        <div class="grid grid--3">
          ${activities.map(a => `
            <div class="card text-center">
              <div class="card__body">
                <div class="card__img card__img--circle" style="background-image:url('${a.imageUrl || "/assets/img/activity-placeholder.jpg"}'); width: 120px; height: 120px; margin: 0 auto 1rem auto; background-size:cover; background-position:center;"></div>
                <h3 class="card__title">${a.name}</h3>
                <p>${a.description || ""}</p>
                <button class="btn btn--primary btn--block btn--sm mt-1" data-activity-id="${a.id}">Book</button>
              </div>
            </div>
          `).join("")}
        </div>
      `;
        list.querySelectorAll(".btn-book-activity").forEach(btn => 
            btn.addEventListener("click", (e) => navigation("booking"))
        );
    }
}
