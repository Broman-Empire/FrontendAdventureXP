console.log("App is running");

import { getAvailability } from "./api";

let selectedDate = "";
let selectedActivityId = "";


// shows availability in the UI
function showAvailability(availability) {
    const resultsContainer = document.getElementById("availability-results");
    resultsContainer.innerHTML = ""; // Clear previous results

    if (!availability || availability.length === 0) {
        resultsContainer.textContent = "No available slots.";
        return;
    }

    const ul = document.createElement("ul"); // list to display availability
    availability.forEach(slot => {
        const li = document.createElement("li"); // list item for each slot
        li.textContent = `Start: ${slot.start} | End: ${slot.end} | Capacity: ${slot.capacity} | Available: ${slot.remaining}` +
            (slot.soldOut ? " (Sold Out)" : "");
        ul.appendChild(li); // add list item to list
    });
    resultsContainer.appendChild(ul);
}

// Load availability data and display it
async function loadAvailability(activityId, date) {
    try {
        const availability = await getAvailability(activityId, date);
        console.log("Availability data:", availability);

        //Filter sold out slots
        const availableSlots = availability.filter(slot => !slot.soldOut);
        showAvailability(availableSlots);
    } catch (error) {
        console.error("Error loading availability:", error);
    }
}

// Handle date change event
function onDateChange(date){
    selectedDate =  date;
    loadAvailability(selectedActivityId, date);
}

// Mount til booking form
function mount(container) {
    // Opret en form til at indtaste information
    const form = document.createElement("form");

    // Laver inputfelter til formen
    form.appendChild(createInput("Kundetype", "customerType"));
    form.appendChild(createInput("Kontaktnavn", "contactName"));
    form.appendChild(createInput("Email", "email", "email"));
    form.appendChild(createInput("Telefonnummer", "phone", "tel"));
    form.appendChild(createInput("Aktivitet", "activityId", "number"));
    form.appendChild(createInput("Start", "start", "datetime-local"));
    form.appendChild(createInput("Antal personer", "participants", "number"));

    // Laver en submitknap til formen
    const submitBtn = document.createElement("button");
    submitBtn.type = "submit";
    submitBtn.textContent = "Book";
    // Smider knappen på formen
    form.appendChild(submitBtn);

    // Smider formen i vores container
    container.appendChild(form);

    // EventListener for activityId change
    form.activityId.addEventListener("change", (e) => {
        selectedActivityId = e.target.value;
    });

    // EventListener for date change
    form.start.addEventListener("change", (e) => {
        onDateChange(e.target.value);
    });

    // EventListener til submit. Kan sandsynligvis også ligge udenfor funktionen
    form.addEventListener("submit", (e) => {
        e.preventDefault(); // Sørger for at vi ikke reloader siden og sletter alt i formen
        const formData = new FormData(form); // Gemmer formens data
        const data = Object.fromEntries(formData.entries()); // Konverterer til et objekt
        console.log("Submitted data: ", data); // Logger det i konsollen, hvis vi skal kunne tjekke det
    });
}

// Hjælpefunktion til at oprette inputfelter til en form. Bruges i mount()
function createInput(labelText, name, type = "text") {
    const wrapper = document.createElement("div"); // Laver en div med DOM

    const label = document.createElement("label");
    label.textContent = labelText;
    label.setAttribute("for", name);

    const input = document.createElement("input");
    input.type = type;
    input.name = name;
    input.id = name;

    wrapper.appendChild(label);
    wrapper.appendChild(document.createElement("br"));
    wrapper.appendChild(input);

    return wrapper;
}

// Mounter i HTML container
document.addEventListener("DOMContentLoaded", () => {
    const container = document.getElementById("booking-form");
    mount(container);
});