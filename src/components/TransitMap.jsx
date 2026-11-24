import {MapContainer, TileLayer, CircleMarker} from "react-leaflet";
import "leaflet/dist/leaflet.css";

// Geographic coordinates of downtown Boston
const BOSTON_CENTER = [42.3601, -71.0589];

export default function TransitMap({ vehicles = [] }) {

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

                // Extract the vehicle's geographic coordinates
                const { latitude, longitude } = vehicle.attributes;

                // Skip vehicles without valid coordinates
                if (
                    !Number.isFinite(latitude) ||
                    !Number.isFinite(longitude)
                ) {
                    return null;
                }

                // Display the vehicle on the map
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
                    />
                );
            })}

        </MapContainer>
    );
}