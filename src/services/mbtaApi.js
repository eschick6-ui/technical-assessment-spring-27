const BASE_URL = "https://api-v3.mbta.com";
const API_KEY = import.meta.env.VITE_MBTA_API_KEY;

// General helper function for making MBTA API requests
async function fetchMBTA(endpoint, params = {}) {
    // Convert query parameters into a URL query string
    const query = new URLSearchParams(params).toString();

    // Construct the full request URL
    const url = `${BASE_URL}${endpoint}${query ? `?${query}` : ""}`;

    // Include the API key if one is available
    const headers = {};

    if (API_KEY) {
        headers["X-API-Key"] = API_KEY;
    }

    // Send a GET request to the MBTA API
    const response = await fetch(url, { headers });

    // Check if the request was successful
    if (!response.ok) {
        throw new Error(`MBTA API error: ${response.status}`);
    }

    // Convert the response into a JavaScript object
    return await response.json();
}

// Retrieve live vehicle locations
export function fetchVehicles(params = {}) {
    return fetchMBTA("/vehicles", params);
}

// Retrieve transit routes
export function fetchRoutes(params = {}) {
    return fetchMBTA("/routes", params);
}

// Retrieve service alerts
export function fetchAlerts(params = {}) {
    return fetchMBTA("/alerts", params);
}

// Retrieve transit stops
export function fetchStops(params = {}) {
    return fetchMBTA("/stops", params);
}

// Retrieve estimated arrival times
export function fetchPredictions(params = {}) {
    return fetchMBTA("/predictions", params);
}

// Retrieve transit route geometry
export function fetchShapes(params = {}) {
    return fetchMBTA("/shapes", params);
}