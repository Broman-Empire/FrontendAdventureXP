// ---- View = frontpage ----

import { navigation } from "../main.js";
import { getActivities } from "../api.js";

// Mount function to display the frontpage
export async function mount(container) {
    container.innerHTML = `
    <section class="frontpage">
      <section class="frontpage-hero-area">
        <div class="container text-center">
          <h1 class="frontpage-title">ADVENTURE XP</h1>
          <div class="frontpage-divider frontpage-divider--thick"></div>
          <p class="frontpage-tagline">ADVENTURE · ADRENALINE · ACTION · ALIVE · ALL IN</p>
          <div class="frontpage-divider frontpage-divider--thin"></div>
          <div class="frontpage-hero">
            <h2 class="frontpage-hero-title">FEEL THE RUSH<br>HAVE SOME FUN</h2>
            <button class="btn btn--primary btn--lg" id="main-booking-btn">BOOK</button>
          </div>
        </div>
      </section>
      <div class="container text-center">
        <div id="activity-list"></div>
        <footer class="frontpage-footer">
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
      <div class="activity-grid-wrapper">
        <div class="grid grid--2">
          ${activities.map(a => `
            <div class="card">
              <div class="card__body">
                <div class="card__img card__img--circle" style="background-image:url('${a.imageUrl || "/assets/img/activity-placeholder.jpg"}');"></div>
                <h3 class="card__title">${a.name}</h3>
                <p>${a.description || ""}</p>
                <button class="btn btn--primary btn--block btn--sm" data-activity-id="${a.id}">Book</button>
              </div>
            </div>
          `).join("")}
        </div>
      </div>
    `;
        list.querySelectorAll(".btn-book-activity").forEach(btn => 
            btn.addEventListener("click", (e) => navigation("booking"))
        );
    }
}
