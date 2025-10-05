// ---- SPA-router = styrer navigationen mellem views ----

// Importerer alt fra app.booking.js og lægger det i et objekt "bookingView"
import * as frontpageView from "./views/app.frontpage.js";
import * as bookingView from "./views/app.booking.js";
import * as adminView from "./views/app.admin.js";

console.log("SPA AdventureXP is running!");

// Views
const views = {
    frontpage: frontpageView,
    booking: bookingView,
    admin: adminView
};

// Funktion til at skifte mellem siderne
export function navigation(viewName) {
    const appContainer = document.getElementById("app");
    appContainer.innerHTML = ""; // Rydder tidl. indhold

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

    // Find alle knapper i navigations-menuen på frontpage
    const menuBtns = document.querySelectorAll("nav button")

    // Hver knap skal kunne trykkes på = 'click'
    menuBtns.forEach(btn => {
        btn.addEventListener("click", () => {
        const chosenView = btn.dataset.view; // Eks. booking el. admin
        navigation(chosenView); // Navigér til valgte side
    });
});
    // Startvisningen er vores forside
    navigation("frontpage");

})



