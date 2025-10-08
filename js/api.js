// Samler alle API-kald = GET, POST, UPDATE, PATCH, DELETE

const BASE_URL = 'http://localhost:8080/api';

// TODO (backend & server-side):
// - Check @GetMapping endpoint: /api/activities
// - Check @GetMapping endpoint: /api/activities/{activityId}/availability?date=YYYY-MM-DD
// - Check @PostMapping endpoint: /api/reservations
// - Check CORS is enabled for frontend (server-side) - så backend og frontend taler sammen

// ---- Activity wrappers ----

// Fetch all activities
export async function getActivities() {
    const response = await fetch(`${BASE_URL}/activities`);
    if (!response.ok) {
        throw new Error(`Failed to fetch activities: ${response.statusText}`);
    }
    return response.json();
}

// Loader aktiviteter fra backend
async function loadActivities() {
    const activities = await getActivities();

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
}


// Hent alle aktiviteter (admin)
export async function getAdminActivities() {
    const response = await fetch(`${BASE_URL}/admin/activities`);
    if (!response.ok) {
        throw new Error(`Failed to fetch admin activities: ${response.statusText}`);
    }
    return response.json();
}

// Opret ny Activity
export async function createActivity(activity) {
    const response = await fetch(`${BASE_URL}/admin/activities`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(activity)
    });
    if (!response.ok) {
        throw new Error(`Failed to create activity: ${response.statusText}`);
    }
    return response.json();
}

// Opdater aktivitet med PATCH
export async function updateActivity(id, patch) {
    const response = await fetch(`${BASE_URL}/admin/activities/${id}`, {
        method: "PATCH",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(patch)
    });
    if (!response.ok) {
        throw new Error(`Failed to update activity: ${response.statusText}`);
    }
    return response.json();
}

// Slet aktivitet
export async function deleteActivity(id) {
    const response = await fetch(`${BASE_URL}/admin/activities/${id}`, {
        method: "DELETE"
    });
    if (!response.ok) {
        throw new Error(`Failed to delete activity: ${response.statusText}`);
    }
}



// Fetch availability for a specific activity and date
export async function getAvailability(activityId, date) {
    const params = new URLSearchParams({date});
    const response = await fetch(`${BASE_URL}/activities/${activityId}/availability?${params}`);
    if (!response.ok) {
        throw new Error(`Failed to fetch availability: ${response.statusText}`);
    }
    return response.json();
}


// ---- Reservation wrappers ----

// Create a new reservation
export async function postReservation(payload) {
    const response = await fetch(`${BASE_URL}/reservations`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
    });
    if (!response.ok) {
        throw new Error(`Failed to create reservation: ${response.statusText}`);
    }
    return response.json();
}

// Henter reservation for at vise schedule
export async function getReservations(date) {
    let url = `${BASE_URL}/reservations`;
    if (date) {
        url += `?date=${date}`; // Hvis dato er som @RequestParam i url
    }
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Failed to fetch reservations: ${response.statusText}`);
    }
    return response.json();
}

// TODO Vi skal lige finde ud af, hvornår vi loader aktiviteterne
// // Når DOM’en er klar
// document.addEventListener("DOMContentLoaded", async () => {
//     const container = document.getElementById("app");
//     mount(container);
//     await loadActivities();
// });

// ---- Equipment wrappers ----

// Henter alt Equipment for én bestemt Activity
export async function getEquipmentByActivity(activityId) {
    const response = await fetch(`${BASE_URL}/admin/activities/${activityId}/equipment`)
    if (!response.ok) {
        throw new Error(`Failed to fetch equipment for activity ${activityId}: ${response.statusText}`)
    }
    return response.json();
}

// Opdaterer Equipment
export async function updateEquipment(equipmentId, patch) {
    const response = await fetch(`${BASE_URL}/admin/equipment/${equipmentId}`, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(patch)
    });

    if (!response.ok) {
        throw new Error(`Failed to update equipment ${equipmentId}: ${response.statusText}`);
    }
    return response.json();
}

// Sletter Equipment
export async function deleteEquipment(equipmentId) {
    const response = await fetch(`${BASE_URL}/admin/equipment/${equipmentId}`, {
        method: 'DELETE',
    });
    if (!response.ok) {
        throw new Error(`Failed to delete equipment ${equipmentId}: ${response.statusText}`);
    }
    return true; // En bekræftelse
}
