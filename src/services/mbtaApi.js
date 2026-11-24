const BASE_URL = "https://api-v3.mbta.com";
const API_KEY = import.meta.env.VITE_MBTA_API_KEY;

export async function fetchRoutes() {
    const response = await fetch(`${BASE_URL}/routes`, {
        headers: {
            "X-API-Key": API_KEY
        }
    });

    if (!response.ok) {
        throw new Error(`MBTA API error: ${response.status}`);
    }

    const data = await response.json();
    return data;
}