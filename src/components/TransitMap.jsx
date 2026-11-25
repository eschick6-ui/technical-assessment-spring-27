import { useState } from "react";

import {
    MapContainer,
    TileLayer,
    CircleMarker,
    Popup,
    useMap,
    useMapEvents
} from "react-leaflet";

import "leaflet/dist/leaflet.css";

import { point } from "leaflet";

// Geographic coordinates of downtown Boston
const BOSTON_CENTER = [42.3601, -71.0589];

// Convert API status values into readable text
const STATUS_LABELS = {
    IN_TRANSIT_TO: "In Transit",
    STOPPED_AT: "Stopped",
    INCOMING_AT: "Approaching"
};

// MBTA transportation colors for the map legend
const LINE_COLORS = [
    { name: "Red Line", color: "#DA291C" },
    { name: "Orange Line", color: "#ED8B00" },
    { name: "Blue Line", color: "#003DA5" },
    { name: "Green Line", color: "#00843D" },
    { name: "Commuter Rail", color: "#80276C" },
    { name: "Silver Line", color: "#7C878E" },
    { name: "Bus", color: "#FFC72C" },
    { name: "Ferry", color: "#008EAA" }
];

function CenteredPopup({ children }) {
    const map = useMap();

    return (
        <Popup
            autoPan={false}
            keepInView={false}
            eventHandlers={{
                add: (event) => {
                    const popup = event.target;

                    requestAnimationFrame(() => {
                        const popupElement = popup.getElement();

                        if (!popupElement || !popup.isOpen()) {
                            return;
                        }

                        // Measure the height of the popup
                        const popupHeight = popupElement.offsetHeight;

                        // Convert the vehicle location into pixel coordinates
                        const vehiclePoint = map.project(
                            popup.getLatLng()
                        );

                        // Account for the height of the popup
                        const centerPoint = vehiclePoint.subtract(
                            point(0, popupHeight / 2)
                        );

                        // Convert back to geographic coordinates
                        const center = map.unproject(centerPoint);

                        // Smoothly pan the map to center the popup
                        map.panTo(center, {
                            animate: true,
                            duration: 0.4
                        });
                    });
                }
            }}
        >
            {children}
        </Popup>
    );
}

function MapLegend() {
    // Track whether the user has expanded the legend
    const [expanded, setExpanded] = useState(true);

    // Track whether a vehicle popup is open
    const [popupOpen, setPopupOpen] = useState(false);

    // Listen for popup events on the map
    useMapEvents({
        popupopen: () => {
            setPopupOpen(true);
        },
        popupclose: () => {
            setPopupOpen(false);
        }
    });

    // Automatically collapse the legend when a popup is open
    const isExpanded = expanded && !popupOpen;

    return (
        <div className="map-legend">

            <button
                type="button"
                className="legend-toggle"
                aria-expanded={isExpanded}
                disabled={popupOpen}
                onClick={() => setExpanded(!expanded)}
            >
                <span
                    className={`legend-arrow ${
                        isExpanded ? "expanded" : ""
                    }`}
                >
                    ▸
                </span>

                Transit Lines
            </button>

            <div
                className={`legend-content ${
                    isExpanded ? "expanded" : ""
                }`}
                aria-hidden={!isExpanded}
            >
                <div className="legend-content-inner">

                    {LINE_COLORS.map((line) => (
                        <div
                            key={line.name}
                            className="legend-item"
                        >
                            <span
                                className="legend-dot"
                                style={{
                                    backgroundColor: line.color
                                }}
                            />

                            <span>{line.name}</span>
                        </div>
                    ))}

                </div>
            </div>

        </div>
    );
}

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
        <div className="transit-map-container">
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

                    // Retrieve the official MBTA route color
                    const routeColor = route?.color
                        ? `#${route.color}`
                        : "#3388FF";

                    // Determine the route's display name
                    const routeName =
                        route?.long_name ||
                        route?.short_name ||
                        routeId ||
                        "Unknown Route";

                    // Include the route number for bus routes
                    const routeTitle =
                        route?.type === 3 && route?.short_name
                            ? `${route.short_name} · ${routeName}`
                            : routeName;
                    
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
                                fillColor: routeColor,
                                fillOpacity: 0.9,
                                weight: 2
                            }}
                        >
                            <CenteredPopup>
                                <div className="vehicle-popup">

                                    <h3 className="popup-route-title">
                                        <span
                                            className="popup-route-dot"
                                            style={{ backgroundColor: routeColor }}
                                        />
                                        {routeTitle}
                                    </h3>

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
                            </CenteredPopup>
                        </CircleMarker>
                    );
                })}
                        
                {/* Map legend */}
                <MapLegend />
                
            </MapContainer>
        </div>
    );
}