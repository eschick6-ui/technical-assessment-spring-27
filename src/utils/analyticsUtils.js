import {
    TRANSIT_CATEGORIES,
    getTransitCategory
} from "./transitUtils";

// Weights representing the relative disruption of each alert effect
const ALERT_EFFECT_WEIGHTS = {
    SUSPENSION: 2.0,
    SHUTTLE: 1.8,
    STOP_CLOSURE: 1.5,
    STATION_CLOSURE: 1.5,
    DELAY: 1.4,
    DETOUR: 1.2,
    SERVICE_CHANGE: 1.2,
    REDUCED_SERVICE: 1.2,
    SIGNIFICANT_DELAY: 1.8,
    ELEVATOR_CLOSURE: 0.8,
    ESCALATOR_CLOSURE: 0.6,
    ACCESS_ISSUE: 0.8,
    PARKING_ISSUE: 0.3,
    BIKE_ISSUE: 0.3,
    EXTRA_SERVICE: 0,
    INFORMATION: 0.2
};

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

// Calculate the weighted disruption caused by an individual alert
function getAlertImpact(alert) {

    const { severity, effect } = alert.attributes;

    // Use a neutral weight for unrecognized alert effects
    const effectWeight = ALERT_EFFECT_WEIGHTS[effect] ?? 1;

    return (severity ?? 0) * effectWeight;
}

// Determine the chaos classification and display color
export function getChaosLevel(score) {

    if (score < 20) {
        return {
            label: "Smooth Sailing",
            color: "#22C55E"
        };
    }

    if (score < 40) {
        return {
            label: "Minor Disruptions",
            color: "#84CC16"
        };
    }

    if (score < 60) {
        return {
            label: "Moderate Chaos",
            color: "#EAB308"
        };
    }

    if (score < 80) {
        return {
            label: "High Chaos",
            color: "#F97316"
        };
    }

    return {
        label: "Extreme Chaos",
        color: "#EF4444"
    };
}

// Calculate a Chaos Score for each transit category
export function getChaosAnalytics(vehicles, routes, alerts) {

    // Create a lookup table for route information
    const routeLookup = new Map(
        routes.map((route) => [route.id, route])
    );

    // Calculate analytics for each transit category
    return TRANSIT_CATEGORIES.map((category) => {

        // Find vehicles belonging to this category
        const categoryVehicles = vehicles.filter((vehicle) => {

            const routeId =
                vehicle.relationships?.route?.data?.id;

            const route = routeLookup.get(routeId);

            return getTransitCategory(route, routeId)
                === category.id;
        });

        // Find alerts affecting this category
        const categoryAlerts = alerts.filter((alert) => {

            const affectedRoutes =
                alert.relationships?.routes?.data || [];

            return affectedRoutes.some((affectedRoute) => {

                const routeId = affectedRoute.id;
                const route = routeLookup.get(routeId);

                return getTransitCategory(route, routeId)
                    === category.id;
            });
        });

        // Calculate the total weighted impact of all alerts
        const totalImpact = categoryAlerts.reduce(
            (total, alert) => total + getAlertImpact(alert),
            0
        );

        // Account for differences in transit category size
        // Use a minimum of 10 to avoid division by zero
        // and excessive scores for smaller categories
        const normalizationFactor = Math.max(
            categoryVehicles.length,
            10
        );

        // Calculate a normalized Chaos Score that gradually
        // approaches 100 as the weighted alert impact increases
        const score = Math.round(
            (totalImpact / (totalImpact + normalizationFactor)) * 100
        );

        // Determine the chaos classification
        const chaosLevel = getChaosLevel(score);

        return {
            ...category,
            vehicles: categoryVehicles.length,
            alerts: categoryAlerts.length,
            impact: Number(totalImpact.toFixed(2)),
            score,
            chaosLevel: chaosLevel.label,
            chaosColor: chaosLevel.color
        };
    });
}