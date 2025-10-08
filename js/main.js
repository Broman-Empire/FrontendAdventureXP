// ---- SPA-router = styrer navigationen mellem views ----

// Importerer alt fra app.booking.js og lægger det i et objekt "bookingView"
import * as frontpageView from "./views/app.frontpage.js";
import * as bookingView from "./views/app.booking.js";
import * as adminView from "./views/app.admin.js";
import * as equipmentView from "./views/app.equipment.admin.js";
import * as scheduleView from "./views/app.schedule.admin.js";
import * as activityView from "./views/app.activity.admin.js";
import * as reservationView from "./views/app.reservations.admin.js";

console.log("SPA AdventureXP is running!");

// Views
const views = {
    frontpage: frontpageView,
    booking: bookingView,
    admin: adminView,
    equipment: equipmentView,
    schedule: scheduleView,
    activities: activityView,
    reservations: reservationView
};

// Funktion til at skifte mellem siderne
export function navigation(viewName) {
    const appContainer = document.getElementById("app");
    appContainer.innerHTML = ""; // Rydder tidligere indhold

    // Tjekker om view findes samt indeholder en mount-funktion
    const view = views[viewName];
    if (view && typeof view.mount === "function") {
        view.mount(appContainer); // Vis den i app-containeren på index.html
    } else {
        appContainer.innerHTML = `<p>View "${viewName}" ikke fundet :(<p>`;
    }
}

// Navigationens event listeners
document.addEventListener("DOMContentLoaded", () => {

    // Startvisningen er vores forside
    navigation("frontpage");

})



