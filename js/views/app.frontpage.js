// ---- View = frontpage ----
import { navigation } from "../main.js";
import { getActivities } from "../api.js";

export async function mount(container) {
    const activityImages = {
        gokart: "/assets/images/activities/gokart.jpg",
        paintball: "/assets/images/activities/paintball.jpg",
        minigolf: "/assets/images/activities/minigolf.jpg",
        sumowrestling: "/assets/images/activities/sumo_wrestling.jpg",
        sumo_wrestling: "/assets/images/activities/sumo_wrestling.jpg"
    };

    container.innerHTML = `
    <section class="frontpage">

      <header class="frontpage-header">
        <div class="frontpage-header-bar">
          <span class="frontpage-header-link active" data-nav="frontpage">HOME</span>
          <span class="frontpage-header-link" data-nav="login">LOGIN</span>
        </div>
      </header>

      <div class="frontpage-hero-card">
        <h1 class="frontpage-title">ADVENTURE XP</h1>
        <div class="frontpage-divider frontpage-divider--hero"></div>
        <div class="frontpage-tagline">ADVENTURE · ADRENALINE · ACTION · ALIVE · ALL IN</div>
        <div class="frontpage-divider frontpage-divider--hero"></div>
        <div class="frontpage-hero-cta">
          <h2 class="frontpage-hero-title">FEEL THE RUSH<br>HAVE SOME FUN</h2>
          <div class="frontpage-hero-subtext">BOOK YOUR ADVENTURE HERE</div>
          <button class="btn btn--primary btn--lg frontpage-main-book-btn">BOOK</button>
        </div>
      </div>

      <section class="frontpage-activity-scroll">
        <div id="activity-list" class="activity-grid"></div>
      </section>

      <footer class="frontpage-footer">
        <div class="footer-content">
          <h4 class="footer-heading">ADVENTURE XP</h4>
          <p class="footer-tagline">Unleash the fun. Embrace the thrill.</p>
          <div class="footer-details">
            <p>📍 Copenhagen, Denmark</p>
            <p>📞 +45 1234 5678</p>
            <p>✉️ info@adventurexp.com</p>
          </div>
        </div>
        <p class="footer-bottom">© 2025 Adventure XP · All Rights Reserved</p>
      </footer>
    </section>
    `;

    // Navigation buttons (header)
    const navLinks = container.querySelectorAll(".frontpage-header-link[data-nav]");
    const navMap = {
        home: "frontpage",
        admin: "admin",
        login: "admin" // TODO: temporary switch as no login is handled yet
    };
    navLinks.forEach(link => {
        link.addEventListener("click", () => {
            const target = (link.dataset.nav || "").toLowerCase();
            const view = navMap[target] || target;
            if (view) {
                navigation(view);
            }
        });
    });

        // Booking button (top)
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
          <div class="activity-card ${resolveClass(a)}">
            <div class="activity-img" style="background-image:url('${resolveImage(a)}')"></div>
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
        if (activity.description) bits.push(activity.description);
        return bits.length ? bits.join(" · ") : "Check back soon";
    }


    // resolve image
    function resolveImage(activity) {
        if (activity.imageUrl) return activity.imageUrl;
        const key = (activity.name || "").toLowerCase().replace(/\s+/g, "");
        return activityImages[key] || "/assets/img/activity-placeholder.jpg";
    }

    function resolveClass(activity) {
        const key = (activity.name || "").toLowerCase().replace(/\s+/g, "");
        if (!key) return "";
        return `activity-card--${key}`;
    }
}