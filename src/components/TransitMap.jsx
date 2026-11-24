import {
    MapContainer,
    TileLayer,
    CircleMarker,
    Popup
} from "react-leaflet";

import "leaflet/dist/leaflet.css";

// Geographic coordinates of downtown Boston
const BOSTON_CENTER = [42.3601, -71.0589];

// Convert API status values into readable text
const STATUS_LABELS = {
    IN_TRANSIT_TO: "In Transit",
    STOPPED_AT: "Stopped",
    INCOMING_AT: "Approaching"
};

export default function TransitMap({
    vehicles = [],
    included = []
}) {

    // Create lookup objects for routes and stops
    const routes = {};
    const stops = {};

    // Separate included resources by type
    included.forEach((item) => {
        if (item.type === "route") {
            routes[item.id] = item.attributes;
        } else if (item.type === "stop") {
            stops[item.id] = item.attributes;
        }
    });

    return (
        <MapContainer
            center={BOSTON_CENTER}
            zoom={12}
            scrollWheelZoom={true}
            className="transit-map"
        >
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {/* Render a marker for each vehicle */}
            {vehicles.map((vehicle) => {

                // Extract vehicle attributes
                const {
                    latitude,
                    longitude,
                    label,
                    direction_id,
                    current_status,
                    updated_at
                } = vehicle.attributes;

                // Skip vehicles without valid coordinates
                if (
                    !Number.isFinite(latitude) ||
                    !Number.isFinite(longitude)
                ) {
                    return null;
                }

                // Retrieve the associated route and stop IDs
                const routeId =
                    vehicle.relationships?.route?.data?.id;

                const stopId =
                    vehicle.relationships?.stop?.data?.id;

                // Look up additional route and stop information
                const route = routes[routeId];
                const stop = stops[stopId];

                // Determine the route's display name
                const routeName =
                    route?.long_name ||
                    route?.short_name ||
                    routeId ||
                    "Unknown Route";

                // Determine the vehicle's direction
                const direction =
                    route?.direction_names?.[direction_id] ||
                    "Unknown";

                // Convert the vehicle's status into readable text
                const status =
                    STATUS_LABELS[current_status] ||
                    "Unknown";

                // Retrieve the stop name
                const stopName =
                    stop?.name || "Unavailable";

                // Format the last updated time
                const updatedTime = updated_at
                    ? new Date(updated_at).toLocaleTimeString(
                        "en-US",
                        { timeZone: "America/New_York" }
                    )
                    : "Unavailable";

                // Display the vehicle marker and popup
                return (
                    <CircleMarker
                        key={vehicle.id}
                        center={[latitude, longitude]}
                        radius={7}
                        pathOptions={{
                            color: "#FFFFFF",
                            fillColor: "#3388FF",
                            fillOpacity: 0.9,
                            weight: 2
                        }}
                    >
                        <Popup>
                            <div className="vehicle-popup">

                                <h3>{routeName}</h3>

                                <div className="popup-details">

                                    <p>
                                        <strong>Vehicle:</strong>{" "}
                                        {label || vehicle.id}
                                    </p>

                                    <p>
                                        <strong>Direction:</strong>{" "}
                                        {direction}
                                    </p>

                                    <p>
                                        <strong>Status:</strong>{" "}
                                        {status}
                                    </p>

                                    <p>
                                        <strong>
                                            {current_status === "STOPPED_AT"
                                                ? "Current Stop:"
                                                : "Next Stop:"}
                                        </strong>{" "}
                                        {stopName}
                                    </p>

                                    <p>
                                        <strong>Last Updated:</strong>{" "}
                                        {updatedTime}
                                    </p>

                                </div>

                            </div>
                        </Popup>
                    </CircleMarker>
                );
            })}

        </MapContainer>
    );
}