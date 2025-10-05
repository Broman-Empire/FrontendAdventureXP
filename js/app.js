import {getAvailability} from "./api";

console.log("App is running");

let selectedDate = "";
let selectedActivityId = "";

// Viser availability i UI
function showAvailability(availability) {
    const resultsContainer = document.getElementById("availability-results");
    resultsContainer.innerHTML = "";

    if (!availability || availability.length === 0) {
        resultsContainer.textContent = "No available slots.";
        return;
    }

    const ul = document.createElement("ul");
    availability.forEach(slot => {
        const li = document.createElement("li");
        li.textContent = `Start: ${slot.start} | End: ${slot.end} | Capacity: ${slot.capacity} | Available: ${slot.remaining}` +
            (slot.soldOut ? " (Sold Out)" : "");
        ul.appendChild(li);
    });
    resultsContainer.appendChild(ul);
}

// Loader availability fra backend
async function loadAvailability(activityId, date) {
    try {
        const availability = await getAvailability(activityId, date);
        console.log("Availability data:", availability);

        // filtrer udsolgte slots
        const availableSlots = availability.filter(slot => !slot.soldOut);
        showAvailability(availableSlots);
    } catch (error) {
        console.error("Error loading availability:", error);
    }
}

// Håndter ændring af dato
function onDateChange(date) {
    selectedDate = date;
    loadAvailability(selectedActivityId, date);
}

// Loader aktiviteter fra backend
async function loadActivities() {
    try {
        const response = await fetch("/api/activities");
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const activities = await response.json();

        // Vis aktiviteter i UI
        const container = document.getElementById("activity-list");
        container.innerHTML = "";

        const ul = document.createElement("ul");
        activities.forEach(activity => {
            const li = document.createElement("li");
            li.textContent = `${activity.name} - ${activity.description}`;
            ul.appendChild(li);
        });
        container.appendChild(ul);

        // returner aktiviteter så mount() kan bruge dem, hvis nødvendigt
        return activities;
    } catch (error) {
        console.error("Kunne ikke loade aktiviteter:", error);
        return [];
    }
}

// Mount booking-form
function mount(container) {
    const form = document.createElement("form");

    // Inputfelter
    const fields = [
        ["customerType", "Customer Type"],
        ["contactName", "Contact Name"],
        ["email", "Email", "email"],
        ["phone", "Phone", "tel"],
        ["activityId", "Activity ID", "number"],
        ["start", "Start", "datetime-local"],
        ["participants", "Participants", "number"]
    ];

    fields.forEach(([name, labelText, type = "text"]) => {
        const label = document.createElement("label");
        label.textContent = labelText;
        const input = document.createElement("input");
        input.name = name;
        input.id = name;
        input.type = type;
        form.appendChild(label);
        form.appendChild(document.createElement("br"));
        form.appendChild(input);
        form.appendChild(document.createElement("br"));
    });

    // Submit-knap
    const submitBtn = document.createElement("button");
    submitBtn.type = "submit";
    submitBtn.textContent = "Submit";
    form.appendChild(submitBtn);

    container.appendChild(form);

    // Event listeners
    form.activityId.addEventListener("change", (e) => {
        selectedActivityId = e.target.value;
    });

    form.start.addEventListener("change", (e) => {
        onDateChange(e.target.value);
    });

    form.addEventListener("submit", (e) => {
        e.preventDefault(); // Sørger for at vi ikke reloader siden og sletter alt i formen
        const payload = buildPayload(form);
    });
}

function buildPayload(form) {
    const formData = new FormData(form); // Gemmer formens data
    const data = Object.fromEntries(formData.entries()); // Konverterer til et objekt
    console.log("Submitted data: ", data); // Logger det i konsollen, hvis vi skal kunne tjekke det

    return data;
}

// Når DOM’en er klar
document.addEventListener("DOMContentLoaded", async () => {
    const container = document.getElementById("app");
    mount(container);
    await loadActivities();
});
