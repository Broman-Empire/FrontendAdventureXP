// Samler alle API-kald = GET, POST, UPDATE, PATCH, DELETE

const BASE_URL = 'http://localhost:8080/api';
const RESERVATIONS_URL = 'http://localhost:8080/reservations';

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

// Fetch availability for a specific activity and date
export async function getAvailability(activityId, fromDate, toDate, openTime, closeTime) {
    const params = new URLSearchParams({
        fromDate,
        toDate,
        openTime,
        closeTime
    });
    const response = await fetch(`${BASE_URL}/availability/${activityId}?${params.toString()}`);
    if (!response.ok) {
        throw new Error(`Failed to fetch availability: ${response.statusText}`);
    }
    return response.json();
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
export async function getReservations(date) {
    let url = `${BASE_URL}/admin/reservations`;
    if (date) {
        url += `?date=${date}`; // Hvis dato er som @RequestParam i url 
    }
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Failed to fetch reservations: ${response.statusText}`);
    }
    return response.json();
}

// Henter reservation med ID (admin) – bruges af openEdit(reservationId)
export async function getReservationById(reservationId) {
    const res = await fetch(`${BASE_URL}/admin/reservations/${reservationId}`);
    if (!res.ok) throw new Error(`Failed to fetch reservation ${reservationId}: ${res.statusText}`);
    return res.json();
}

// Opdater en eksisterende reservation (delvist)
export async function patchReservation(reservationId, patch) {
    const response = await fetch(`${BASE_URL}/admin/reservations/${reservationId}`, {
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

// Slet reservation (admin)
export async function deleteReservation(reservationId) {
    const res = await fetch(`${BASE_URL}/admin/reservations/${reservationId}`, {
        method: 'DELETE'
    });
    if (!res.ok) {
        const t = await res.text().catch(() => '');
        throw new Error(`Failed to delete reservation ${reservationId}. ${res.status} ${res.statusText}. ${t}`);
    }
    return true;
}

// Hent reservation ud fra dato (admin)
export async function getReservationByDate(date) {
    if (!date) throw new Error('getSchedule(date) kræver YYYY-MM-DD');
    const params = new URLSearchParams({ date });
    const res = await fetch(`${BASE_URL}/admin/reservations?${params.toString()}`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' }
    });
    if (!res.ok) {
        const t = await res.text().catch(() => '');
        throw new Error(`Failed to load schedule for ${date}. ${res.status} ${res.statusText}. ${t}`);
    }
    return res.json();
}

// Henter dagsplan (admin)
export async function getDailySchedule(date) {
    if (!date) throw new Error("getSchedule(date) kræver YYYY-MM-DD");
    const params = new URLSearchParams({ date });
    const res = await fetch(`${BASE_URL}/admin/schedule?${params.toString()}`, {
        method: "GET",
        headers: { "Accept": "application/json" }
    });
    if (!res.ok) throw new Error(`Kunne ikke hente skema for ${date}`);
    return res.json();
}


// Find reservation via telefonnummer (admin)
export async function searchReservationByPhone(phone) {
    const param = new URLSearchParams({ phone });
    const response = await fetch(`${BASE_URL}/admin/search?${param}`);
    if (!response.ok) {
        throw new Error(`Failed to fetch reservation by phone: ${response.statusText}`);
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
