// Transit categories and their corresponding display information
export const TRANSIT_CATEGORIES = [
    { id: "red", name: "Red Line", line: "Red", color: "#DA291C" },
    { id: "orange", name: "Orange Line", line: "Orange", color: "#ED8B00" },
    { id: "blue", name: "Blue Line", line: "Blue", color: "#003DA5" },
    { id: "green", name: "Green Line", line: "Green", color: "#00843D" },
    { id: "commuter", name: "Commuter Rail", line: "Commuter", color: "#80276C" },
    { id: "silver", name: "Silver Line", line: "Silver", color: "#7C878E" },
    { id: "bus", name: "Bus", line: "Bus", color: "#FFC72C" },
    { id: "ferry", name: "Ferry", line: "Ferry", color: "#008EAA" }
];

// Determine which transit category a route belongs to
export function getTransitCategory(route, routeId = route?.id) {
    // Categorize generic shuttle vehicles as buses
    // even when their route information is unavailable
    if (routeId === "Shuttle-Generic") {
        return "bus";
    }

    if (!route) {
        return null;
    }

    const { type, short_name } = route.attributes;

    // Subway lines
    if (route.id === "Red" || route.id === "Mattapan") {
        return "red";
    }

    if (route.id === "Orange") {
        return "orange";
    }

    if (route.id === "Blue") {
        return "blue";
    }

    // Green Line branches
    if (route.id.startsWith("Green-")) {
        return "green";
    }

    // Commuter Rail
    if (type === 2) {
        return "commuter";
    }

    // Silver Line and regular buses
    if (type === 3) {
        if (short_name?.startsWith("SL")) {
            return "silver";
        }

        return "bus";
    }

    // Ferry
    if (type === 4) {
        return "ferry";
    }

    return null;
}