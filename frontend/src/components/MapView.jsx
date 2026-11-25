import { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix default marker icons (Leaflet bug with bundlers)
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Component to recenter map when coordinates change
function RecenterMap({ lat, lng }) {
    const map = useMap();
    useEffect(() => {
        map.setView([lat, lng], 15);
    }, [lat, lng, map]);
    return null;
}

async function geocode(query) {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1&countrycodes=co,ve,mx,ar,cl,pe,ec,bo,py,uy,br`;
    const res = await fetch(url, {
        headers: { 'Accept-Language': 'es', 'User-Agent': 'MenuIA-App/1.0' }
    });
    const data = await res.json();
    return data && data.length > 0 ? { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) } : null;
}

export default function MapView({ address }) {
    const [coords, setCoords] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const lastFetchedAddress = useRef('');

    useEffect(() => {
        if (!address || address.trim().length < 5) {
            setLoading(false);
            setError(true);
            return;
        }
        if (address === lastFetchedAddress.current) return;

        const delay = setTimeout(async () => {
            lastFetchedAddress.current = address;
            setError(false);
            setLoading(true);

            try {
                // Attempt 1: exact address
                let found = await geocode(address);

                // Attempt 2: append Colombia if not found
                if (!found) {
                    found = await geocode(`${address}, Colombia`);
                }

                // Attempt 3: try just the city name extracted from the address
                if (!found) {
                    const parts = address.split(',');
                    if (parts.length > 1) {
                        found = await geocode(parts.slice(1).join(',').trim());
                    }
                }

                if (found) {
                    setCoords(found);
                    setError(false);
                } else {
                    setError(true);
                }
            } catch {
                setError(true);
            } finally {
                setLoading(false);
            }
        }, 600);

        return () => clearTimeout(delay);
    }, [address]);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-2">
                <div className="w-6 h-6 border-2 border-gray-300 border-t-green-500 rounded-full animate-spin" />
                <span className="text-sm font-medium">Buscando ubicación...</span>
            </div>
        );
    }

    if (error || !coords) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-2">
                <span className="text-3xl">📍</span>
                <span className="text-sm font-medium text-center px-4">
                    Agrega una dirección más completa<br />
                    <span className="text-xs">(ej: Calle 123, Ciudad, País)</span>
                </span>
            </div>
        );
    }

    return (
        <MapContainer
            center={[coords.lat, coords.lng]}
            zoom={15}
            scrollWheelZoom={false}
            style={{ height: '100%', width: '100%' }}
            className="z-0"
        >
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <RecenterMap lat={coords.lat} lng={coords.lng} />
            <Marker position={[coords.lat, coords.lng]}>
                <Popup>{address}</Popup>
            </Marker>
        </MapContainer>
    );
}
