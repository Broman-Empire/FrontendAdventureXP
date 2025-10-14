// Samler alle API-kald = GET, POST, UPDATE, PATCH, DELETE

const BASE_URL = 'http://localhost:8080/api';
const RESERVATIONS_URL = 'http://localhost:8080/reservations';
const ADMIN_BASE_URL = `${BASE_URL}/admin`;
const ADMIN_RESERVATIONS_URL = `${ADMIN_BASE_URL}/reservations`;
const ADMIN_SEARCH_URL = `${ADMIN_BASE_URL}/search`;
const ADMIN_SCHEDULE_URL = `${ADMIN_BASE_URL}/schedule`;

// TODO (backend & server-side):
// - Check @PostMapping endpoint: /api/reservations

// ---- Activity wrappers ----

// -- For alle brugere --

// Fetch all activities
export async function getActivities() {
    const response = await fetch(`${BASE_URL}/activities`);
    if (!response.ok) {
        throw new Error(`Failed to fetch activities: ${response.statusText}`);
    }
    return response.json();
}

// Fetch availability for a specific activity and date
export async function getAvailability(activityId, fromDate, toDate, openTime, closeTime) {

    const params = new URLSearchParams({
        fromDate,
        toDate,
        openTime,
        closeTime
    }); //Dette er et objekt
    // JS forventer en String, ikke et objekt til URL'en
    const response = await fetch(`${BASE_URL}/availability/${activityId}?${params.toString()}`);
    if (!response.ok) {
        throw new Error(`Failed to fetch availability: ${response.statusText}`);
    }
    return response.json();
}


// TODO: denne skal flyttes til relevant view
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

// -- For admin

// Hent alle aktiviteter (admin)
export async function getAdminActivities() {
    const response = await fetch(`${BASE_URL}/admin/activities`);
    if (!response.ok) {
        throw new Error(`Failed to fetch admin activities: ${response.statusText}`);
    }
    return response.json();
}

// Opret ny Activity (admin)
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

// Opdater aktivitet med PATCH (admin)
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

// Slet aktivitet (admin)
export async function deleteActivity(id) {
    const response = await fetch(`${BASE_URL}/admin/activities/${id}`, {
        method: "DELETE"
    });
    if (!response.ok) {
        throw new Error(`Failed to delete activity: ${response.statusText}`);
    }
}

// Fetch availability for a specific activity on a single day
export async function getAvailabilityForDay(activityId, date) {
    return getAvailability(activityId, date, date, "00:00:00", "23:59:00");
}


// ---- Reservation wrappers ----

// Create a new reservation
export async function postReservation(payload){
    const response = await fetch(RESERVATIONS_URL, {
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
export async function patchReservation(reservationId, patch) {
    const response = await fetch(`${ADMIN_RESERVATIONS_URL}/${reservationId}`, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(patch)
    });
    if (!response.ok) {
        throw new Error(`Failed to update reservation ${reservationId}: ${response.statusText}`);
    }
    return response.json();
}

export async function listAdminReservations({ date } = {}) {
    const params = new URLSearchParams();
    if (date) params.set("date", date);
    const url = params.size ? `${ADMIN_RESERVATIONS_URL}?${params.toString()}` : ADMIN_RESERVATIONS_URL;

    const response = await fetch(url, {
        headers: { Accept: "application/json" }
    });

    if (!response.ok) {
        const body = await response.text().catch(() => "");
        throw new Error(`Failed to fetch reservations. ${response.status} ${response.statusText}. ${body}`);
    }

    return response.json();
}

export async function getAdminReservation(reservationId) {
    const response = await fetch(`${ADMIN_RESERVATIONS_URL}/${reservationId}`, {
        headers: { Accept: "application/json" }
    });

    if (!response.ok) {
        const body = await response.text().catch(() => "");
        throw new Error(`Failed to load reservation ${reservationId}. ${response.status} ${response.statusText}. ${body}`);
    }

    return response.json();
}

// Compatibility helpers for existing admin views
export const getReservations = listAdminReservations;
export const getReservationByDate = async (date) => {
    if (!date) return listAdminReservations();
    return listAdminReservations({ date });
};
export const getReservationById = getAdminReservation;

export async function deleteReservation(reservationId) {
    const response = await fetch(`${ADMIN_RESERVATIONS_URL}/${reservationId}`, {
        method: "DELETE"
    });

    if (!response.ok) {
        const body = await response.text().catch(() => "");
        throw new Error(`Failed to delete reservation ${reservationId}. ${response.status} ${response.statusText}. ${body}`);
    }

    return true;
}

export async function getDailySchedule(date) {
    const params = new URLSearchParams();
    if (date) params.set("date", date);

    const response = await fetch(`${ADMIN_SCHEDULE_URL}?${params.toString()}`, {
        headers: { Accept: "application/json" }
    });

    if (!response.ok) {
        const body = await response.text().catch(() => "");
        throw new Error(`Failed to load schedule for ${date || "(missing date)"}. ${response.status} ${response.statusText}. ${body}`);
    }

    return response.json();
}

export async function searchReservationByPhone(phone) {
    const params = new URLSearchParams();
    if (phone) params.set("phone", phone);

    const response = await fetch(`${ADMIN_SEARCH_URL}?${params.toString()}`, {
        headers: { Accept: "application/json" }
    });

    if (!response.ok) {
        const body = await response.text().catch(() => "");
        throw new Error(`Failed to search reservations. ${response.status} ${response.statusText}. ${body}`);
    }

    return response.json();
}



// // Slet en reservation
// export async function deleteReservation(reservationId) {
//     const response = await fetch(`${BASE_URL}/admin/reservations/${reservationId}`, {
//         method: 'DELETE',
//     });
//     if (!response.ok) {
//         throw new Error(`Failed to delete reservation ${reservationId}: ${response.statusText}`);
//     }
//     return true; // En bekræftelse
// }


// ---- Equipment wrappers ----

// Opretter nyt Equipment til en Activity
export async function createEquipmentForActivity(activityId, equipment) {
    const response = await fetch(`${BASE_URL}/admin/activities/${activityId}/equipment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(equipment)
    });

    if (!response.ok) {
        throw new Error(`Failed to create equipment for activity ${activityId}: ${response.statusText}`);
    }

    return response.json();
}


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
