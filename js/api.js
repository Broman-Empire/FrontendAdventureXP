const BASE_URL = 'http://localhost:8080/api';

// TODO (backend & server-side):
// - Check @GetMapping endpoint: /api/activities
// - Check @GetMapping endpoint: /api/activities/{activityId}/availability?date=YYYY-MM-DD
// - Check @PostMapping endpoint: /api/reservations
// - Check CORS is enabled for frontend (server-side) - så backend og frontend taler sammen


// Fetch all activities
export async function getActivities() {
    const response = await fetch(`${BASE_URL}/activities`);
    if (!response.ok) {
        throw new Error(`Failed to fetch activities: ${response.statusText}`);
    }
    return response.json();
}

// Fetch availability for a specific activity and date
export async function getAvailability(activityId, date) {
    const params = new URLSearchParams({ date });
    const response = await fetch(`${BASE_URL}/activities/${activityId}/availability?${params}`);
    if (!response.ok) {
        throw new Error(`Failed to fetch availability: ${response.statusText}`);
    }
    return response.json();
}

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