import {
    useState,
    useEffect,
    useCallback,
    useRef
} from "react";

import { fetchAlerts } from "../services/mbtaApi";

import AlertCard from "../components/AlertCard";

import { getTransitCategory } from "../utils/transitUtils";

// Refresh alert data every 60 seconds
const ALERT_REFRESH_INTERVAL = 60000;

// Transit categories available for alert filtering
const ALERT_CATEGORIES = [
    { id: "all", label: "All Transit" },
    { id: "red", label: "Red Line" },
    { id: "orange", label: "Orange Line" },
    { id: "blue", label: "Blue Line" },
    { id: "green", label: "Green Line" },
    { id: "commuter", label: "Commuter Rail" },
    { id: "silver", label: "Silver Line" },
    { id: "bus", label: "Bus" },
    { id: "ferry", label: "Ferry" },
    { id: "other", label: "Other / Unspecified" }
];

// Retrieve the unique route IDs affected by an alert
function getAffectedRouteIds(alert) {

    // Retrieve the entities affected by the alert
    const informedEntities =
        alert.attributes?.informed_entity || [];

    // Extract route IDs and remove missing values
    const routeIds = informedEntities
        .map((entity) => entity.route)
        .filter(Boolean);

    // Remove duplicate route IDs
    return [...new Set(routeIds)];

}

// Determine whether an alert matches a severity filter
function matchesSeverity(alert, severityFilter) {

    const severity = alert.attributes?.severity;

    switch (severityFilter) {

        case "major":
            return severity >= 7;

        case "moderate":
            return severity >= 4 && severity <= 6;

        case "minor":
            return severity >= 2 && severity <= 3;

        case "informational":
            return severity === 1;

        default:
            return true;

    }

}

// Determine which transit categories an alert affects
function getAlertCategories(alert, routeLookup) {

    const categories = new Set();

    const informedEntities =
        alert.attributes?.informed_entity || [];

    informedEntities.forEach((entity) => {

        const routeId = entity.route;

        // Classify entities with an explicit route
        if (routeId) {

            const route = routeLookup[routeId];

            const category = getTransitCategory(route, routeId);

            categories.add(category || "other");

        }

        // Handle alerts that specify only a transit type
        else {

            switch (entity.route_type) {

                case 0:
                    categories.add("green");
                    break;

                case 1:
                    categories.add("red");
                    categories.add("orange");
                    categories.add("blue");
                    break;

                case 2:
                    categories.add("commuter");
                    break;

                case 3:
                    categories.add("bus");
                    categories.add("silver");
                    break;

                case 4:
                    categories.add("ferry");
                    break;

                default:
                    categories.add("other");

            }

        }

    });

    if (categories.size === 0) {
        categories.add("other");
    }

    return [...categories];

}

export default function ServiceAlerts() {
    // Store the active service alerts
    const [alerts, setAlerts] = useState([]);

    // Store additional route information from the API
    const [included, setIncluded] = useState([]);

    // Track whether the initial request is loading
    const [loading, setLoading] = useState(true);

    // Store any API request errors
    const [error, setError] = useState(null);

    // Control automatic alert refreshing
    const [autoRefresh, setAutoRefresh] = useState(true);

    // Track whether a refresh request is in progress
    const [refreshing, setRefreshing] = useState(false);

    // Store the most recent successful refresh time
    const [lastRefreshed, setLastRefreshed] = useState(null);

    // Prevent overlapping API requests
    const activeRequest = useRef(null);

    // Store the selected transit category
    const [categoryFilter, setCategoryFilter] = useState("all");

    // Store the selected severity filter
    const [severityFilter, setSeverityFilter] = useState("all");

    // Store the selected sorting method
    const [sortBy, setSortBy] = useState("severity");
    
    // Retrieve the latest active service alerts
    const loadAlerts = useCallback(async () => {

        // Prevent overlapping requests
        if (activeRequest.current !== null) {
            return;
        }

        const request = {};

        activeRequest.current = request;

        setRefreshing(true);

        try {

            const response = await fetchAlerts({
                "filter[datetime]": "NOW",
                "filter[activity]": "ALL",
                include: "routes",
                sort: "-severity"
            });

            // Ignore requests invalidated by leaving the page
            if (activeRequest.current !== request) {
                return;
            }

            setAlerts(response.data);

            setIncluded(response.included || []);

            setLastRefreshed(new Date());

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

    // Retrieve alerts when the page first mounts
    useEffect(() => {

        const timeoutId = setTimeout(() => {
            loadAlerts();
        }, 0);

        return () => {

            clearTimeout(timeoutId);

            // Invalidate any pending request
            activeRequest.current = null;

        };

    }, [loadAlerts]);

    // Automatically refresh alerts at regular intervals
    useEffect(() => {

        if (!autoRefresh) {
            return;
        }

        const intervalId = setInterval(() => {

            loadAlerts();

        }, ALERT_REFRESH_INTERVAL);

        // Stop refreshing when disabled or leaving the page
        return () => {
            clearInterval(intervalId);
        };

    }, [autoRefresh, loadAlerts]);

    // Create a lookup object for routes affected by alerts
    const routeLookup = {};

    included.forEach((item) => {

        // Only store objects representing transit routes
        if (item.type === "route") {
            routeLookup[item.id] = item;
        }

    });

    // Count all currently active alerts
    const totalAlerts = alerts.length;

    // Count alerts with significant severity ratings
    const majorAlerts = alerts.filter((alert) =>
        alert.attributes?.severity >= 7
    ).length;

    // Count unique routes explicitly affected by active alerts
    const affectedRoutes = new Set(
        alerts.flatMap((alert) => getAffectedRouteIds(alert))
    ).size;

    // Filter alerts by transit category and severity
    const filteredAlerts = alerts.filter((alert) => {

        const categories = getAlertCategories(alert, routeLookup);

        const matchesCategory =
            categoryFilter === "all" ||
            categories.includes(categoryFilter);

        return (
            matchesCategory &&
            matchesSeverity(alert, severityFilter)
        );

    });

    // Sort the filtered alerts
    const sortedAlerts = [...filteredAlerts].sort((a, b) => {

        // Sort by most recently updated
        if (sortBy === "recent") {

            return (
                (Date.parse(b.attributes.updated_at) || 0) -
                (Date.parse(a.attributes.updated_at) || 0)
            );

        }

        // Sort by lowest severity first
        if (sortBy === "lowest-severity") {

            return (
                a.attributes.severity -
                b.attributes.severity
            );

        }

        // Default: sort by highest severity first
        return (
            b.attributes.severity -
            a.attributes.severity
        );

    });

    // Reset all alert filters and sorting
    function resetFilters() {

        setCategoryFilter("all");

        setSeverityFilter("all");

        setSortBy("severity");

    }

    return (
        <section className="page">

            <div className="page-header">

                <h1>Service Alerts</h1>

                <p>
                    Stay informed about disruptions across
                    the MBTA network.
                </p>

            </div>

            {/* Alert statistics */}
            <div className="stats-grid alert-stats-grid">
                <div className="stat-card">
                    <p>Active Alerts</p>

                    <h2>
                        {lastRefreshed ? totalAlerts : "--"}
                    </h2>
                </div>

                <div className="stat-card">
                    <p>Major Alerts</p>

                    <h2 className="major-alert-count">
                        {lastRefreshed ? majorAlerts : "--"}
                    </h2>
                </div>

                <div className="stat-card">
                    <p>Affected Routes</p>

                    <h2>
                        {lastRefreshed ? affectedRoutes : "--"}
                    </h2>
                </div>

                {/* Alert refresh controls */}
                <div className="refresh-panel">

                    <div className="refresh-controls">

                        <button
                            type="button"
                            className="refresh-button"
                            onClick={loadAlerts}
                            disabled={loading || refreshing}
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

                    <div className="refresh-information">

                        <div className="refresh-status">

                            <span
                                className={`refresh-status-dot ${
                                    autoRefresh ? "active" : ""
                                }`}
                            />

                            <span>
                                {autoRefresh
                                    ? `Updating every ${ALERT_REFRESH_INTERVAL / 1000} seconds`
                                    : "Automatic updates paused"}
                            </span>

                        </div>

                        <span className="last-refreshed">

                            Last refreshed:{" "}

                            {lastRefreshed
                                ? lastRefreshed.toLocaleTimeString("en-US", {
                                    timeZone: "America/New_York"
                                })
                                : "Not yet refreshed"}

                        </span>

                    </div>

                </div>

            </div>

            {/* Alert filtering and sorting controls */}
            <div className="alert-filter-panel">

                <div className="alert-filter-header">

                    <h2>Filter Alerts</h2>

                    <button
                        type="button"
                        className="alert-reset-button"
                        onClick={resetFilters}
                    >
                        Reset Filters
                    </button>

                </div>

                <div className="alert-filter-grid">

                    {/* Transit category filter */}
                    <label className="alert-filter-field">

                        <span>Transit Category</span>

                        <select
                            value={categoryFilter}
                            onChange={(event) =>
                                setCategoryFilter(event.target.value)
                            }
                        >

                            {ALERT_CATEGORIES.map((category) => (

                                <option
                                    key={category.id}
                                    value={category.id}
                                >
                                    {category.label}
                                </option>

                            ))}

                        </select>

                    </label>

                    {/* Severity filter */}
                    <label className="alert-filter-field">

                        <span>Severity</span>

                        <select
                            value={severityFilter}
                            onChange={(event) =>
                                setSeverityFilter(event.target.value)
                            }
                        >

                            <option value="all">All Severities</option>
                            <option value="major">Major (7–10)</option>
                            <option value="moderate">Moderate (4–6)</option>
                            <option value="minor">Minor (2–3)</option>
                            <option value="informational">Informational (1)</option>

                        </select>

                    </label>

                    {/* Sorting options */}
                    <label className="alert-filter-field">

                        <span>Sort By</span>

                        <select
                            value={sortBy}
                            onChange={(event) =>
                                setSortBy(event.target.value)
                            }
                        >

                            <option value="severity">
                                Highest Severity
                            </option>

                            <option value="lowest-severity">
                                Lowest Severity
                            </option>

                            <option value="recent">
                                Most Recently Updated
                            </option>

                        </select>

                    </label>

                </div>

                <div
                    className="alert-filter-footer"
                    aria-live="polite"
                >

                    {loading
                        ? "Loading alerts..."
                        : !lastRefreshed
                            ? "Alert data unavailable"
                            : `Showing ${sortedAlerts.length} of ${totalAlerts} alerts`}

                </div>

            </div>

            {/* Initial loading state */}
            {loading && (
                <div className="alert-empty-state">

                    <h3>Loading service alerts...</h3>

                    <p>Retrieving the latest MBTA service information.</p>

                </div>
            )}

            {/* API error state */}
            {error && (
                <p className="refresh-error" role="alert">

                    Unable to retrieve service alerts: {error}

                    {lastRefreshed &&
                        " Displaying the last successfully retrieved data."}

                </p>
            )}

            {/* No active alerts */}
            {!loading && !error && alerts.length === 0 && (
                <div className="alert-empty-state">

                    <span className="alert-empty-icon success">✓</span>

                    <h3>No Active Service Alerts</h3>

                    <p>
                        There are currently no active alerts reported
                        by the MBTA.
                    </p>

                </div>
            )}

            {/* No alerts matching the selected filters */}
            {!loading &&
                lastRefreshed &&
                alerts.length > 0 &&
                sortedAlerts.length === 0 && (

                    <div className="alert-empty-state">

                        <h3>No Matching Alerts</h3>

                        <p>
                            No service alerts match your selected filters.
                        </p>

                        <button
                            type="button"
                            className="refresh-button"
                            onClick={resetFilters}
                        >
                            Reset Filters
                        </button>

                    </div>

            )}

            {/* Service alert cards */}
            {!loading && lastRefreshed && sortedAlerts.length > 0 && (

                <div className="alert-list">

                    {sortedAlerts.map((alert) => (

                        <AlertCard
                            key={alert.id}
                            alert={alert}
                            routeLookup={routeLookup}
                            affectedRouteIds={getAffectedRouteIds(alert)}
                            lastRefreshed={lastRefreshed}
                        />

                    ))}

                </div>

            )}

        </section>
    );
}