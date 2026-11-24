import { useEffect, useState } from "react";
import { fetchVehicles } from "../services/mbtaApi.js";
import TransitMap from "../components/TransitMap.jsx";

export default function LiveMap() {

    // Store the vehicles returned by the API
    const [vehicles, setVehicles] = useState([]);

    // Track whether data is still being fetched
    const [loading, setLoading] = useState(true);

    // Store an error message if the request fails
    const [error, setError] = useState(null);

    // Fetch vehicle data when the page mounts
    useEffect(() => {

        let cancelled = false;

        async function loadVehicles() {
            try {
                const response = await fetchVehicles();

                if (!cancelled) {
                    setVehicles(response.data);
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

        loadVehicles();

        // Ignore outdated responses if the page unmounts
        return () => {
            cancelled = true;
        };

    }, []);

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
                        {loading || error ? "--" : vehicles.length}
                    </h2>
                </div>

                <div className="stat-card">
                    <p>API Status</p>

                    <h2>
                        {loading
                            ? "Connecting..."
                            : error
                                ? "Error"
                                : "Connected"}
                    </h2>
                </div>

            </div>

            {error && (
                <p className="error-message">
                    Unable to load vehicle data: {error}
                </p>
            )}

            <div className="map-wrapper">
                <TransitMap vehicles={vehicles} />
            </div>

        </section>
    );
}