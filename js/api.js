// Samler alle API-kald = GET, POST, UPDATE, PATCH, DELETE

const BASE_URL = 'http://localhost:8080/api';

// TODO (backend & server-side):
// - Check @GetMapping endpoint: /api/activities
// - Check @GetMapping endpoint: /api/activities/{activityId}/availability?date=YYYY-MM-DD
// - Check @PostMapping endpoint: /api/reservations
// - Check CORS is enabled for frontend (server-side) - så backend og frontend taler sammen

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



// ---- Reservation wrappers ----

// Create a new reservation
export async function postReservation(payload){
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
// TODO: denne peger ikke på noget før backend understøtter dens funktion
// Henter reservations for at vise schedule (admin)
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
    const res = await fetch(`${BASE_URL}/admin/reservations/${reservationId}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
    });
    if (!res.ok) {
        const t = await res.text().catch(() => '');
        throw new Error(`Failed to fetch reservation ${reservationId}. ${res.status} ${res.statusText}. ${t}`);
    }
    return res.json();
}

// Opdaterer reservation (admin) – bruges af applyUpdate(reservationId, updateBody)
export async function updateReservation(updateBody) {
    const res = await fetch(`${BASE_URL}/admin/reservations/${updateBody.reservationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateBody)
    });
    if (!res.ok) {
        const t = await res.text().catch(() => '');
        throw new Error(`Failed to update reservation ${updateBody.reservationId}. ${res.status} ${res.statusText}. ${t}`);
    }
    try {
        return await res.json();    // 200 OK
    } catch {
        return true;                // 204 No Content
    }
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

// ADMIN: hent dags-skema
export async function getSchedule(date) {
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

export async function applyUpdate(reservationId, updateBody) {
    const form = document.getElementById("editReservationForm");
    const modal = document.getElementById("editModal");

    const submitBtn = form?.querySelector('button[type="submit"]');
    const originalText = submitBtn?.textContent;
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = "Gemmer...";
    }

    try {
        // 1) PATCH til backend
        await patchReservation(reservationId, updateBody);

        if (modal) modal.style.display = "none";

        // 3) Genindlæs visningen
        const datePicker = document.querySelector("#dateFilter");
        const date = datePicker?.value;

        if (date) {
            datePicker.dispatchEvent(new Event("change"));
            return;
        }
        if (typeof window.refreshReservations == "function") {
            await window.refreshReservations();
            return;
        }
        if (typeof window.loadReservationsForDate == "function") {
            await window.loadReservationsForDate(new Date().toISOString().slice(0, 10));
            return;
        }
        window.location.reload();

    } catch (err) {
        console.error(err);
        alert("Kunne ikke opdatere reservationen. Tjek felterne og prøv igen.");
    } finally {
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
        }
    }
}
// Find reservation via telefonnummer (admin)
export async function searchReservation(phone) {
    const param = new URLSearchParams({ phone });
    const response = await fetch(`${BASE_URL}/admin/search?${param}`);
    if (!response.ok) {
        throw new Error(`Failed to fetch reservation by phone: ${response.statusText}`);
    }
    return response.json();
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
