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
import {
    TRANSIT_CATEGORIES,
    getTransitCategory
} from "../utils/transitUtils";

// Refresh vehicle data every 15 seconds
const REFRESH_INTERVAL = 15000;

// Determine whether a route matches the user's search query
function matchesRouteSearch(route, routeId, query) {

    // Normalize the query to make searching case-insensitive
    const normalizedQuery = query.trim().toLowerCase();

    // An empty search query matches every route
    if (!normalizedQuery) {
        return true;
    }

    const shortName = route?.attributes?.short_name;
    const longName = route?.attributes?.long_name;

    // Determine the transit category
    const category = getTransitCategory(route, routeId);

    // Collect searchable fields for all transit categories
    const searchableFields = [
        routeId,
        longName,
        shortName,
        route ? getRouteDisplayName(route) : ""
    ];

    // Only support the "Route" keyword for buses
    if (category === "bus") {

        searchableFields.push(
            routeId ? `Route ${routeId}` : "",
            shortName ? `Route ${shortName}` : "",
            longName ? `Route ${longName}` : ""
        );

    }

    // Check whether any route field contains the search query
    return searchableFields.some((field) =>
        field?.toLowerCase().includes(normalizedQuery)
    );

}

// Generate a readable display name for each route
function getRouteDisplayName(route) {

    const { short_name, long_name, type } = route.attributes;

    // Display generic shuttles without duplicate names
    if (route.id === "Shuttle-Generic") {
        return "Shuttle";
    }

    // Include the route number for buses with distinct names
    if (
        type === 3 &&
        short_name &&
        long_name &&
        short_name !== long_name
    ) {
        return `${short_name} · ${long_name}`;
    }

    return long_name || short_name || route.id;
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

    // Store the user's current route search query
    const [searchQuery, setSearchQuery] = useState("");

    // Store the exact route selected from the search dropdown
    const [selectedRouteId, setSelectedRouteId] = useState(null);

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

    // Clear all transit categories and reset the route search
    function clearAllCategories() {

        setSelectedCategories([]);

        handleSearchChange("");

    }

    // Update the search query when the user types
    function handleSearchChange(query) {

        setSearchQuery(query);

        // Return to general searching when the user edits the input
        setSelectedRouteId(null);

    }

    // Select an exact route from the dropdown
    function handleRouteSelect(route) {

        // Store the selected route's unique ID
        setSelectedRouteId(route.id);

        // Autofill the search input with the route's display name
        setSearchQuery(getRouteDisplayName(route));

    }

    // Create a lookup object for accessing routes by ID
    const routeLookup = {};

    routes.forEach((route) => {
        routeLookup[route.id] = route;
    });

    // Filter vehicles by transit category and route search
    const filteredVehicles = vehicles.filter((vehicle) => {

        // Retrieve the route ID associated with this vehicle
        const routeId = vehicle.relationships?.route?.data?.id;

        // Find the corresponding route object
        const route = routeLookup[routeId];

        // Determine the vehicle's transit category
        const category = getTransitCategory(route, routeId);

        // Check whether the vehicle matches the selected categories
        const matchesCategory = category
            ? selectedCategories.includes(category)
            : selectedCategories.length === TRANSIT_CATEGORIES.length;

        // Match an exact route if a dropdown suggestion was selected
        const matchesSearch = selectedRouteId !== null
            ? routeId === selectedRouteId
            : matchesRouteSearch(route, routeId, searchQuery);

        // Display vehicles satisfying both conditions
        return matchesCategory && matchesSearch;

    });

    // Create an array of all available routes for searching
    const availableRoutes = Object.values(routeLookup);

    // Check whether generic shuttle vehicles are currently available
    const hasGenericShuttles = vehicles.some((vehicle) =>
        vehicle.relationships?.route?.data?.id === "Shuttle-Generic"
    );

    // Include generic shuttles in the search dropdown
    // when their route object is missing from the API response
    if (hasGenericShuttles && !routeLookup["Shuttle-Generic"]) {

        availableRoutes.push({
            id: "Shuttle-Generic",
            type: "route",
            attributes: {
                long_name: "Shuttle",
                short_name: "Shuttle",
                type: 3,
                color: "FFC72C"
            }
        });

    }

    // Find routes matching the selected categories and search query
    const matchingRoutes = availableRoutes.filter((route) => {

        const category = getTransitCategory(route, route.id);

        const matchesCategory = category
            ? selectedCategories.includes(category)
            : selectedCategories.length === TRANSIT_CATEGORIES.length;

        const matchesSearch = selectedRouteId !== null
            ? route.id === selectedRouteId
            : matchesRouteSearch(route, route.id, searchQuery);

        return matchesCategory && matchesSearch;

    });

    // Count all routes matching the current filters
    const matchingRouteCount = matchingRoutes.length;

    // Limit dropdown suggestions to keep the interface manageable
    const routeSuggestions = matchingRoutes.slice(0, 10);

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
            {/* Transit line filters and route search */}
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
                searchQuery={searchQuery}
                onSearchChange={handleSearchChange}
                matchingRouteCount={matchingRouteCount}
                routeSuggestions={routeSuggestions}
                onRouteSelect={handleRouteSelect}
                getRouteDisplayName={getRouteDisplayName}
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