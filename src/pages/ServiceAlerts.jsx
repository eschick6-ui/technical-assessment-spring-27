import { useState, useEffect } from "react";
import { fetchAlerts } from "../services/mbtaApi";

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

export default function ServiceAlerts() {
    // Store the active service alerts
    const [alerts, setAlerts] = useState([]);

    // Store additional route information from the API
    const [included, setIncluded] = useState([]);

    // Track whether the initial request is loading
    const [loading, setLoading] = useState(true);

    // Store any API request errors
    const [error, setError] = useState(null);
    
    // Retrieve active service alerts when the page mounts
    useEffect(() => {

        let cancelled = false;

        async function loadAlerts() {

            try {

                // Request active alerts and related route information
                const response = await fetchAlerts({
                    "filter[datetime]": "NOW",
                    "filter[activity]": "ALL",
                    include: "routes",
                    sort: "-severity"
                });

                // Update state only if the page is still mounted
                if (!cancelled) {

                    setAlerts(response.data);
                    setIncluded(response.included || []);
                    setError(null);

                }

            } catch (err) {

                // Store any errors returned by the API
                if (!cancelled) {
                    setError(err.message);
                }

            } finally {

                // Finish loading whether the request succeeds or fails
                if (!cancelled) {
                    setLoading(false);
                }

            }

        }

        loadAlerts();

        // Prevent state updates after leaving the page
        return () => {
            cancelled = true;
        };

    }, []);

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
            <div className="stats-grid">

                <div className="stat-card">
                    <p>Active Alerts</p>

                    <h2>
                        {loading || error ? "--" : totalAlerts}
                    </h2>
                </div>

                <div className="stat-card">
                    <p>Major Alerts</p>

                    <h2>
                        {loading || error ? "--" : majorAlerts}
                    </h2>
                </div>

                <div className="stat-card">
                    <p>Affected Routes</p>

                    <h2>
                        {loading || error ? "--" : affectedRoutes}
                    </h2>
                </div>

            </div>

            {/* Loading state */}
            {loading && (
                <p>Loading service alerts...</p>
            )}

            {/* Error state */}
            {error && (
                <p className="error-message" role="alert">
                    Unable to load service alerts: {error}
                </p>
            )}

            {/* Empty state */}
            {!loading && !error && alerts.length === 0 && (
                <p>No active service alerts.</p>
            )}

            {/* Temporary alert list for testing */}
            {!loading && !error && (
                <div>

                    {alerts.map((alert) => (

                        <div key={alert.id}>

                            <h3>
                                {alert.attributes.header ||
                                    "Service Alert"}
                            </h3>

                            <p>
                                Severity: {alert.attributes.severity}
                            </p>

                            <p>
                                Effect: {alert.attributes.effect}
                            </p>

                            <p>
                                Affected Routes:{" "}
                                {getAffectedRouteIds(alert)
                                    .map((routeId) =>
                                        routeLookup[routeId]
                                            ?.attributes?.long_name ||
                                        routeId
                                    )
                                    .join(", ") ||
                                    "No specific route provided"}
                            </p>

                            <hr />

                        </div>

                    ))}

                </div>
            )}

        </section>
    );
}