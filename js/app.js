console.log("App is running");

async function loadActivities() {
    try {
        const response = await fetch("/api/activities");
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const activities = await response.json();

        const container = document.getElementById("activity-list");
        container.innerHTML = "";

        const ul = document.createElement("ul");
        activities.forEach(activity => {
            const li = document.createElement("li");
            li.textContent = `${activity.name} - ${activity.description}`;
            ul.appendChild(li);
        });
    } catch (error) {
        console.error("Kunne ikke loade aktiviteter:", error);
    }

    document.addEventListener("DOMContentLoaded", () => {
        loadActivities();
    });
}