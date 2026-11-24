import { MapContainer, TileLayer } from "react-leaflet";
import "leaflet/dist/leaflet.css";

// Geographic coordinates of downtown Boston
const BOSTON_CENTER = [42.3601, -71.0589];

export default function TransitMap() {
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
        </MapContainer>
    );
}