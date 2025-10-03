const BASE_URL = 'http://localhost:8080/api';

// TODO:
// - Check @GetMapping endpoint: /api/activities
// - Check @GetMapping endpoint: /api/activities/{activityId}/availability?date=YYYY-MM-DD
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