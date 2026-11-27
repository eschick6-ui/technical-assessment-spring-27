import { useState, useEffect, useMemo } from "react";
import {
    fetchVehicles,
    fetchRoutes,
    fetchAlerts
} from "../services/mbtaApi";
import {
    createRouteLookup,
    getVehicleAnalytics,
    getSeverityAnalytics,
    getAlertAnalytics
} from "../utils/analyticsUtils";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell,
    PieChart,
    Pie
} from "recharts";
import AnalyticsTooltip from "../components/AnalyticsTooltip";

export default function Analytics() {
    // Store MBTA API data
    const [vehicles, setVehicles] = useState([]);
    const [routes, setRoutes] = useState([]);
    const [alerts, setAlerts] = useState([]);

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
                        "filter[activity]": "ALL",
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
    const severityAnalytics = useMemo(() => {
        return getSeverityAnalytics(alerts);
    }, [alerts]);

    // Calculate alerts by transit category
    const alertAnalytics = useMemo(() => {
        return getAlertAnalytics(alerts, routeLookup);
    }, [alerts, routeLookup]);

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

                <div className="analytics-grid">

                    {/* Active vehicles by transit category */}
                    <div className="analytics-card analytics-card-wide">

                        <div className="analytics-card-header">

                            <h2>Active Vehicles by Transit Category</h2>

                            <p>
                                Current vehicle distribution across the MBTA network.
                            </p>

                        </div>

                        <div className="analytics-chart">

                            <ResponsiveContainer width="100%" height="100%">

                                <BarChart
                                    data={vehicleAnalytics}
                                    margin={{
                                        top: 10,
                                        right: 10,
                                        left: -15,
                                        bottom: 5
                                    }}
                                >

                                    <CartesianGrid
                                        strokeDasharray="3 3"
                                        stroke="#303C4D"
                                        vertical={false}
                                    />

                                    <XAxis
                                        dataKey="line"
                                        stroke="#94A3B8"
                                        tickLine={false}
                                        axisLine={false}
                                        tick={{ fontSize: 12 }}
                                        interval={0}
                                    />

                                    <YAxis
                                        stroke="#94A3B8"
                                        tickLine={false}
                                        axisLine={false}
                                        allowDecimals={false}
                                        tick={{ fontSize: 12 }}
                                    />

                                    <Tooltip
                                        content={
                                            <AnalyticsTooltip valueLabel="Vehicles" />
                                        }
                                        cursor={{
                                            fill: "rgba(148, 163, 184, 0.08)"
                                        }}
                                    />

                                    <Bar
                                        dataKey="vehicles"
                                        radius={[5, 5, 0, 0]}
                                        maxBarSize={65}
                                    >

                                        {vehicleAnalytics.map((category) => (
                                            <Cell
                                                key={category.id}
                                                fill={category.color}
                                            />
                                        ))}

                                    </Bar>

                                </BarChart>

                            </ResponsiveContainer>

                        </div>

                    </div>

                    {/* Alert severity distribution */}
                    <div className="analytics-card">

                        <div className="analytics-card-header">

                            <h2>Alert Severity Distribution</h2>

                            <p>
                                Breakdown of active alerts by severity level.
                            </p>

                        </div>

                        {alerts.length === 0 ? (

                            <div className="analytics-empty">
                                No active service alerts.
                            </div>

                        ) : (

                            <div className="analytics-donut-container">

                                <div className="analytics-donut-chart">

                                    <ResponsiveContainer width="100%" height="100%">

                                        <PieChart>

                                            <Pie
                                                data={severityAnalytics}
                                                dataKey="count"
                                                nameKey="name"
                                                cx="50%"
                                                cy="50%"
                                                innerRadius="58%"
                                                outerRadius="85%"
                                                paddingAngle={2}
                                                stroke="none"
                                            >

                                                {severityAnalytics.map((severity) => (
                                                    <Cell
                                                        key={severity.name}
                                                        fill={severity.color}
                                                    />
                                                ))}

                                            </Pie>

                                            <Tooltip
                                                content={
                                                    <AnalyticsTooltip valueLabel="Alerts" />
                                                }
                                            />

                                        </PieChart>

                                    </ResponsiveContainer>

                                    {/* Total alerts displayed in the center */}
                                    <div className="analytics-donut-center">

                                        <strong>{alerts.length}</strong>

                                        <span>Total Alerts</span>

                                    </div>

                                </div>

                                {/* Severity legend */}
                                <div className="analytics-severity-legend">

                                    {severityAnalytics.map((severity) => (

                                        <div
                                            key={severity.name}
                                            className="analytics-severity-row"
                                        >

                                            <span
                                                className="analytics-legend-dot"
                                                style={{
                                                    backgroundColor: severity.color
                                                }}
                                            />

                                            <span className="analytics-severity-name">
                                                {severity.name}
                                            </span>

                                            <strong>{severity.count}</strong>

                                            <span className="analytics-severity-percentage">

                                                {(
                                                    severity.count / alerts.length * 100
                                                ).toFixed(1)}%

                                            </span>

                                        </div>

                                    ))}

                                </div>

                            </div>

                        )}

                    </div>

                    {/* Service alerts by transit category */}
                    <div className="analytics-card">

                        <div className="analytics-card-header">

                            <h2>Alerts by Transit Category</h2>

                            <p>
                                Number of active alerts affecting each transit category.
                            </p>

                        </div>

                        <div className="analytics-chart analytics-chart-horizontal">

                            <ResponsiveContainer width="100%" height="100%">

                                <BarChart
                                    data={alertAnalytics}
                                    layout="vertical"
                                    margin={{
                                        top: 5,
                                        right: 15,
                                        left: 0,
                                        bottom: 5
                                    }}
                                >

                                    <CartesianGrid
                                        strokeDasharray="3 3"
                                        stroke="#303C4D"
                                        horizontal={false}
                                    />

                                    <XAxis
                                        type="number"
                                        stroke="#94A3B8"
                                        tickLine={false}
                                        axisLine={false}
                                        allowDecimals={false}
                                        tick={{ fontSize: 12 }}
                                    />

                                    <YAxis
                                        type="category"
                                        dataKey="line"
                                        stroke="#94A3B8"
                                        tickLine={false}
                                        axisLine={false}
                                        tick={{ fontSize: 12 }}
                                        width={55}
                                    />

                                    <Tooltip
                                        content={
                                            <AnalyticsTooltip valueLabel="Alerts" />
                                        }
                                        cursor={{
                                            fill: "rgba(148, 163, 184, 0.08)"
                                        }}
                                    />

                                    <Bar
                                        dataKey="alerts"
                                        radius={[0, 5, 5, 0]}
                                        maxBarSize={25}
                                    >

                                        {alertAnalytics.map((category) => (
                                            <Cell
                                                key={category.id}
                                                fill={category.color}
                                            />
                                        ))}

                                    </Bar>

                                </BarChart>

                            </ResponsiveContainer>

                        </div>

                        <p className="analytics-chart-note">
                            Alerts affecting multiple transit categories may be
                            counted in more than one category.
                        </p>

                    </div>

                </div>

            )}

        </section>
    );
}