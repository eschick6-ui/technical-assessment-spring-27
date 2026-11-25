import {
    useState,
    useEffect,
    useCallback,
    useRef
} from "react";
import {
    fetchVehicles,
    fetchRoutes
} from "../services/mbtaApi";
import TransitMap from "../components/TransitMap.jsx";
import TransitFilters from "../components/TransitFilters";

// Refresh vehicle data every 15 seconds
const REFRESH_INTERVAL = 15000;

const TRANSIT_CATEGORIES = [
    { id: "red", name: "Red Line", color: "#DA291C" },
    { id: "orange", name: "Orange Line", color: "#ED8B00" },
    { id: "blue", name: "Blue Line", color: "#003DA5" },
    { id: "green", name: "Green Line", color: "#00843D" },
    { id: "commuter", name: "Commuter Rail", color: "#80276C" },
    { id: "silver", name: "Silver Line", color: "#7C878E" },
    { id: "bus", name: "Bus", color: "#FFC72C" },
    { id: "ferry", name: "Ferry", color: "#008EAA" }
];

// Determine which transit category a route belongs to
function getTransitCategory(route, routeId = route?.id) {

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

export default function LiveMap() {

    // Store the vehicles returned by the API
    const [vehicles, setVehicles] = useState([]);

    // Store additional route and stop information
    const [included, setIncluded] = useState([]);

    // Track whether data is still being fetched
    const [loading, setLoading] = useState(true);

    // Store an error message if the request fails
    const [error, setError] = useState(null);

    // Store all available MBTA routes
    const [routes, setRoutes] = useState([]);

    // Track whether route data is loading
    const [routesLoading, setRoutesLoading] = useState(true);

    // Track errors when retrieving route data
    const [routesError, setRoutesError] = useState(null);

    // Store the transit categories currently selected by the user
    const [selectedCategories, setSelectedCategories] = useState(
        TRANSIT_CATEGORIES.map((category) => category.id)
    );

    // Determine whether automatic refreshes are enabled
    const [autoRefresh, setAutoRefresh] = useState(true);

    // Track whether a refresh is currently in progress
    const [refreshing, setRefreshing] = useState(false);

    // Store the time of the last successful API request
    const [lastRefreshed, setLastRefreshed] = useState(null);

    // Track the active request to prevent overlapping requests
    const activeRequest = useRef(null);

   // Retrieve the latest vehicle, route, and stop information
    const loadVehicles = useCallback(async () => {

        // Prevent multiple requests from running simultaneously
        if (activeRequest.current !== null) {
            return;
        }

        // Create a unique identifier for this request
        const request = {};
        activeRequest.current = request;

        setRefreshing(true);

        try {
            const response = await fetchVehicles({
                include: "route,stop"
            });

            // Ignore outdated requests
            if (activeRequest.current !== request) {
                return;
            }

            // Update vehicle and related resource information
            setVehicles(response.data);
            setIncluded(response.included || []);

            // Record the successful refresh time
            setLastRefreshed(new Date());

            // Clear any previous API errors
            setError(null);

        } catch (err) {

            if (activeRequest.current === request) {
                setError(err.message);
            }

        } finally {

            if (activeRequest.current === request) {
                activeRequest.current = null;

                setLoading(false);
                setRefreshing(false);
            }
        }

    }, []);

    // Load vehicle data when the page initially mounts
    useEffect(() => {

        // Schedule the initial API request asynchronously
        const timeoutId = setTimeout(() => {
            loadVehicles();
        }, 0);

        // Clean up when leaving the page
        return () => {
            clearTimeout(timeoutId);
            activeRequest.current = null;
        };

    }, [loadVehicles]);

    // Automatically refresh vehicle data
    useEffect(() => {

        // Do not create an interval if auto-refresh is disabled
        if (!autoRefresh) {
            return;
        }

        // Retrieve new vehicle data every 15 seconds
        const intervalId = setInterval(() => {
            loadVehicles();
        }, REFRESH_INTERVAL);

        // Remove the interval when the component unmounts
        // or when auto-refresh is disabled
        return () => {
            clearInterval(intervalId);
        };

    }, [autoRefresh, loadVehicles]);

    // Fetch available MBTA routes when the page mounts
    useEffect(() => {

        let cancelled = false;

        async function loadRoutes() {
            try {
                const response = await fetchRoutes();

                // Ignore outdated responses
                if (!cancelled) {
                    setRoutes(response.data);
                    setRoutesError(null);
                }

            } catch (err) {

                if (!cancelled) {
                    setRoutesError(err.message);
                }

            } finally {

                if (!cancelled) {
                    setRoutesLoading(false);
                }
            }
        }

        loadRoutes();

        // Ignore responses if the page unmounts
        return () => {
            cancelled = true;
        };

    }, []);

    // Select or deselect an individual transit category
    function toggleCategory(categoryId) {

        setSelectedCategories((previousCategories) => {

            if (previousCategories.includes(categoryId)) {

                return previousCategories.filter(
                    (id) => id !== categoryId
                );

            }

            return [...previousCategories, categoryId];

        });
    }

    // Select every transit category
    function selectAllCategories() {

        setSelectedCategories(
            TRANSIT_CATEGORIES.map((category) => category.id)
        );

    }

    // Deselect every transit category
    function clearAllCategories() {

        setSelectedCategories([]);

    }

    // Create a lookup object for accessing routes by ID
    const routeLookup = {};

    routes.forEach((route) => {
        routeLookup[route.id] = route;
    });

    // Only display vehicles belonging to selected transit categories
    const filteredVehicles = vehicles.filter((vehicle) => {

        // Retrieve the route ID associated with this vehicle
        const routeId = vehicle.relationships?.route?.data?.id;

        // Find the corresponding route
        const route = routeLookup[routeId];

        // Determine the vehicle's transit category
        const category = getTransitCategory(route, routeId);

        // Preserve uncategorized vehicles when all filters are selected
        if (!category) {
            return selectedCategories.length === TRANSIT_CATEGORIES.length;
        }

        // Check whether the category is currently selected
        return selectedCategories.includes(category);

    });
    console.table(
        vehicles
            .filter((vehicle) => {
                const routeId = vehicle.relationships?.route?.data?.id;
                const route = routeLookup[routeId];

                return !getTransitCategory(route);
            })
            .map((vehicle) => {
                const routeId = vehicle.relationships?.route?.data?.id;
                const route = routeLookup[routeId];

                return {
                    vehicleId: vehicle.id,
                    routeId: routeId,
                    routeFound: Boolean(route),
                    longName: route?.attributes?.long_name,
                    shortName: route?.attributes?.short_name,
                    type: route?.attributes?.type
                };
            })
    );

    return (
        <section className="page">

            <div className="page-header">
                <h1>Boston, what's the chaos today?</h1>

                <p>
                    Bringing order to Boston's daily transit chaos
                    with real-time MBTA data.
                </p>
            </div>

            <div className="transit-colors">
                <span className="line-red"></span>
                <span className="line-orange"></span>
                <span className="line-blue"></span>
                <span className="line-green"></span>
                <span className="line-purple"></span>
                <span className="line-silver"></span>
            </div>

            <div className="stats-grid">

                <div className="stat-card">
                    <p>Active Vehicles</p>

                    <h2>
                        {lastRefreshed ? vehicles.length : "--"}
                    </h2>
                </div>

                <div className="stat-card">
                    <p>API Status</p>
                
                    <h2>
                        {loading
                            ? "Connecting..."
                            : error
                                ? lastRefreshed
                                    ? "Stale Data"
                                    : "Error"
                                : "Connected"}
                    </h2>
                </div>

            </div>
            {/* Vehicle refresh controls */}
            <div className="refresh-panel">

                <div className="refresh-controls">

                    {/* Manual refresh button */}
                    <button
                        type="button"
                        className="refresh-button"
                        onClick={loadVehicles}
                        disabled={refreshing}
                    >
                        <span
                            className={`refresh-icon ${
                                refreshing ? "spinning" : ""
                            }`}
                            aria-hidden="true"
                        >
                            ↻
                        </span>

                        {refreshing ? "Refreshing..." : "Refresh Now"}
                    </button>

                    {/* Automatic refresh toggle */}
                    <label className="auto-refresh-control">

                        <input
                            type="checkbox"
                            className="refresh-toggle"
                            checked={autoRefresh}
                            onChange={(event) =>
                                setAutoRefresh(event.target.checked)
                            }
                        />

                        <span>Auto-refresh</span>

                    </label>

                </div>

                {/* Refresh information */}
                <div className="refresh-information">

                    <div className="refresh-status">

                        <span
                            className={`refresh-status-dot ${
                                autoRefresh ? "active" : ""
                            }`}
                        />

                        <span>
                            {autoRefresh
                                ? `Updating every ${REFRESH_INTERVAL / 1000} seconds`
                                : "Automatic updates paused"}
                        </span>

                    </div>

                    <span className="last-refreshed">
                        Last refreshed:{" "}
                        {lastRefreshed
                            ? lastRefreshed.toLocaleTimeString(
                                "en-US",
                                { timeZone: "America/New_York" }
                            )
                            : "Not yet refreshed"}
                    </span>

                </div>

            </div>
            {/* Transit line filters */}
            <TransitFilters
                categories={TRANSIT_CATEGORIES}
                selectedCategories={selectedCategories}
                onToggle={toggleCategory}
                onSelectAll={selectAllCategories}
                onClearAll={clearAllCategories}
                totalVehicles={vehicles.length}
                visibleVehicles={filteredVehicles.length}
                loading={routesLoading}
                error={routesError}
            />

            {loading && (
                <p>Loading vehicles...</p>
            )}

            {error && (
                <p className="refresh-error" role="alert">
                    Unable to retrieve the latest vehicle data: {error}
                    {lastRefreshed &&
                        " Displaying the last successfully retrieved data."}
                </p>
            )}

            {!loading && (
                <div className="map-wrapper">
                    <TransitMap
                        vehicles={filteredVehicles}
                        included={included}
                    />
                </div>
            )}

        </section>
    );
}