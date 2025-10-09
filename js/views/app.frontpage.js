// ---- View = frontpage ----
import { navigation } from "../main.js";
import { getActivities } from "../api.js";

export async function mount(container) {
    container.innerHTML = `
    <section class="frontpage">

      <header class="frontpage-header">
        <div class="frontpage-header-bar">
          <span class="frontpage-header-link active">HOME</span>
          <span class="frontpage-header-link">LOGIN</span>
        </div>
      </header>

      <div class="frontpage-hero-card">
        <h1 class="frontpage-title">ADVENTURE XP</h1>
        <div class="frontpage-divider frontpage-divider--hero"></div>
        <div class="frontpage-tagline">ADVENTURE · ADRENALINE · ACTION · ALIVE · ALL IN</div>
        <div class="frontpage-divider frontpage-divider--hero"></div>
        <div class="frontpage-hero-cta">
          <h2 class="frontpage-hero-title">FEEL THE RUSH<br>HAVE SOM FUN</h2>
          <div class="frontpage-hero-subtext">BOOK YOUR ADVENTURE HERE</div>
          <button class="btn btn--primary btn--lg frontpage-main-book-btn">BOOK</button>
        </div>
      </div>

      <section class="frontpage-activity-scroll">
        <div id="activity-list" class="activity-grid"></div>
      </section>

      <footer class="frontpage-footer">
        <div class="footer-upper">
          <div class="footer-insta">INSTA<br>EMAIL</div>
        </div>
        <div class="footer-lower">
          <span class="footer-brand">ADVENTURE XP</span>
          <span class="footer-note">ALL RIGHTS RESERVED · BIEMPIRE</span>
          <span class="footer-year">&copy;2025</span>
        </div>
      </footer>
    </section>
    `;

    // Navigation button (top)
    container.querySelector(".frontpage-main-book-btn").addEventListener("click", () => navigation("booking"));

    // Render activities
    const activities = await getActivities();
    renderActivities(activities.slice(0, 4));

    function renderActivities(activities) {
        const list = container.querySelector("#activity-list");
        if (!activities.length) {
            list.innerHTML = `<div class="activity-card empty">No activities available right now.</div>`;
            return;
        }

        list.innerHTML = activities.map((a, index) => `
          <div class="activity-card">
            <div class="activity-img" style="background-image:url('${a.imageUrl || "/assets/img/activity-placeholder.jpg"}')"></div>
            <div class="activity-title">${a.name}</div>
            <div class="activity-desc">
              <div class="activity-desc__label">${formatLabel(a)}</div>
              <div class="activity-desc__text">${formatDetails(a)}</div>
            </div>
          </div>
        `).join("");
    }

    // fetch activity details
    function formatLabel(activity) {
        if (activity.durationMinutes) {
            return `Duration · ${activity.durationMinutes} min`;
        }
        if (activity.minAge) {
            return `Minimum age · ${activity.minAge}+`;
        }
        return "Adventure Details";
    }

    function formatDetails(activity) {
        const bits = [];
        if (activity.minAge) bits.push(`Min age ${activity.minAge}+`);
        if (activity.maxParticipants) bits.push(`Max ${activity.maxParticipants} pax`);
        if (activity.minParticipants) bits.push(`Min ${activity.minParticipants} pax`);
        if (activity.description) bits.push(activity.description);
        return bits.length ? bits.join(" · ") : "Check back soon";
    }
}