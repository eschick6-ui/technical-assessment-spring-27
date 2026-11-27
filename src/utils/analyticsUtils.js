import {
    TRANSIT_CATEGORIES,
    getTransitCategory
} from "./transitUtils";

// Create a lookup object that maps route IDs to route objects
export function createRouteLookup(routes) {

    const routeLookup = {};

    routes.forEach((route) => {
        routeLookup[route.id] = route;
    });

    return routeLookup;
}

// Calculate the number of active vehicles in each transit category
export function getVehicleAnalytics(vehicles, routeLookup) {

    const counts = {};

    // Initialize each transit category with zero vehicles
    TRANSIT_CATEGORIES.forEach((category) => {
        counts[category.id] = 0;
    });

    // Categorize and count each vehicle
    vehicles.forEach((vehicle) => {

        const routeId =
            vehicle.relationships?.route?.data?.id;

        const route = routeLookup[routeId];

        const category = getTransitCategory(route, routeId);

        if (category && Object.hasOwn(counts, category)) {
            counts[category]++;
        }

    });

    // Convert the counts into a format compatible with Recharts
    return TRANSIT_CATEGORIES.map((category) => ({
        id: category.id,
        name: category.name,
        line: category.line,
        color: category.color,
        vehicles: counts[category.id]
    }));
}

// Calculate the distribution of alerts by severity
export function getSeverityAnalytics(alerts) {

    const severityData = [
        {
            name: "Informational",
            color: "#64748B",
            count: 0
        },
        {
            name: "Minor",
            color: "#22C55E",
            count: 0
        },
        {
            name: "Moderate",
            color: "#EAB308",
            count: 0
        },
        {
            name: "Major",
            color: "#EF4444",
            count: 0
        }
    ];

    alerts.forEach((alert) => {

        const severity = alert.attributes?.severity;

        // Ignore missing or invalid severity values
        if (!Number.isInteger(severity) ||
            severity < 0 || severity > 10) {
            return;
        }

        if (severity <= 1) {
            severityData[0].count++;
        } else if (severity <= 3) {
            severityData[1].count++;
        } else if (severity <= 6) {
            severityData[2].count++;
        } else {
            severityData[3].count++;
        }

    });

    return severityData;
}

// Calculate the number of alerts affecting each transit category
export function getAlertAnalytics(alerts, routeLookup) {

    const counts = {};

    // Initialize each transit category with zero alerts
    TRANSIT_CATEGORIES.forEach((category) => {
        counts[category.id] = 0;
    });

    alerts.forEach((alert) => {

        // Track the unique transit categories affected by this alert
        const affectedCategories = new Set();

        const affectedRoutes =
            alert.relationships?.routes?.data || [];

        affectedRoutes.forEach((affectedRoute) => {

            const routeId = affectedRoute.id;

            const route = routeLookup[routeId];

            const category = getTransitCategory(route, routeId);

            if (category && Object.hasOwn(counts, category)) {
                affectedCategories.add(category);
            }

        });

        // Count the alert once for each affected transit category
        affectedCategories.forEach((category) => {
            counts[category]++;
        });

    });

    // Convert the counts into a format compatible with Recharts
    return TRANSIT_CATEGORIES.map((category) => ({
        id: category.id,
        name: category.name,
        line: category.line,
        color: category.color,
        alerts: counts[category.id]
    }));
}