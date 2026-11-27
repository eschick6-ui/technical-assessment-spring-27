import { useState, useEffect, useMemo } from "react";
import {
    fetchVehicles,
    fetchRoutes,
    fetchAlerts
} from "../services/mbtaApi";
import {
    createRouteLookup,
    getVehicleAnalytics
    //getSeverityAnalytics,
    //getAlertAnalytics
} from "../utils/analyticsUtils";
import {
    ResponsiveContainer,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Cell
} from "recharts";

export default function Analytics() {
    // Store MBTA API data
    const [vehicles, setVehicles] = useState([]);
    const [routes, setRoutes] = useState([]);
    const [, setAlerts] = useState([]);

    // Track loading and error states
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Fetch analytics data when the page mounts
    useEffect(() => {

        let cancelled = false;

        async function loadAnalytics() {

            try {

                // Fetch all three datasets concurrently
                const [
                    vehicleResponse,
                    routeResponse,
                    alertResponse
                ] = await Promise.all([
                    fetchVehicles({
                        include: "route"
                    }),
                    fetchRoutes(),
                    fetchAlerts({
                        "filter[datetime]": "NOW",
                        "filter[activity]": "BOARD,EXIT,RIDE",
                        include: "routes"
                    })
                ]);

                if (!cancelled) {

                    setVehicles(vehicleResponse.data);

                    // Combine route metadata from all three responses
                    setRoutes([
                        ...routeResponse.data,
                        ...(vehicleResponse.included || [])
                            .filter((item) => item.type === "route"),
                        ...(alertResponse.included || [])
                            .filter((item) => item.type === "route")
                    ]);

                    setAlerts(alertResponse.data);
                    setError(null);

                }

            } catch (err) {

                if (!cancelled) {
                    setError(err.message);
                }

            } finally {

                if (!cancelled) {
                    setLoading(false);
                }

            }

        }

        loadAnalytics();

        // Prevent state updates after leaving the page
        return () => {
            cancelled = true;
        };

    }, []);

    // Create a lookup object for efficient route access
    const routeLookup = useMemo(() => {
        return createRouteLookup(routes);
    }, [routes]);

    // Calculate active vehicles by transit category
    const vehicleAnalytics = useMemo(() => {
        return getVehicleAnalytics(vehicles, routeLookup);
    }, [vehicles, routeLookup]);

    // Calculate alerts by severity
    //const severityAnalytics = useMemo(() => {
    //    return getSeverityAnalytics(alerts);
    //}, [alerts]);

    // Calculate alerts by transit category
    //const alertAnalytics = useMemo(() => {
    //    return getAlertAnalytics(alerts, routeLookup);
    //}, [alerts, routeLookup]);

    return (
        <section className="page">

            <div className="page-header">
                <h1>Analytics</h1>

                <p>
                    Explore the data behind Boston's transit system
                    and discover how chaotic your commute really is.
                </p>
            </div>

            {/* Loading state */}
            {loading && (
                <p className="page-loading">
                    Loading analytics data...
                </p>
            )}

            {/* Error state */}
            {error && (
                <p className="refresh-error" role="alert">
                    Unable to load analytics data: {error}
                </p>
            )}

            {!loading && !error && (

                <div className="analytics-chart-card">

                    <h2>Active Vehicles by Transit Line</h2>

                    <p>Number of active vehicles across the MBTA network.</p>

                    <div className="analytics-chart">

                        <ResponsiveContainer width="100%" height="100%">

                            <BarChart data={vehicleAnalytics}>

                                <CartesianGrid
                                    strokeDasharray="3 3"
                                    stroke="#334155"
                                    vertical={false}
                                />

                                <XAxis
                                    dataKey="line"
                                    stroke="#94A3B8"
                                    tick={{ fontSize: 12 }}
                                />

                                <YAxis
                                    stroke="#94A3B8"
                                    tick={{ fontSize: 12 }}
                                    allowDecimals={false}
                                />

                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: "#19212E",
                                        border: "1px solid #334155",
                                        borderRadius: "8px"
                                    }}
                                    labelStyle={{
                                        color: "#F1F5F9"
                                    }}
                                    itemStyle={{
                                        color: "#F1F5F9"
                                    }}
                                    cursor={{
                                        fill: "rgba(255, 255, 255, 0.05)"
                                    }}
                                />

                                <Bar
                                    dataKey="vehicles"
                                    name="Active Vehicles"
                                    radius={[6, 6, 0, 0]}
                                >

                                    {vehicleAnalytics.map((entry) => (
                                        <Cell
                                            key={entry.line}
                                            fill={entry.color}
                                        />
                                    ))}

                                </Bar>

                            </BarChart>

                        </ResponsiveContainer>

                    </div>

                </div>

            )}

        </section>
    );
}