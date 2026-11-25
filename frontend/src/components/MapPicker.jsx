import React, { useEffect, useRef, useState } from 'react';
import { useGoogleMaps } from '@/hooks/useGoogleMaps';
import { Loader2, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import GOOGLE_MAPS_API_KEY from '@/config/googleMaps';

const API_KEY = GOOGLE_MAPS_API_KEY;

export const MapPicker = ({ lat, lng, onChange, address }) => {
    const mapRef = useRef(null);
    const markerRef = useRef(null);
    const isLoaded = useGoogleMaps(API_KEY);
    const [mapInstance, setMapInstance] = useState(null);

    useEffect(() => {
        if (!API_KEY) console.error("MapPicker: Google Maps API Key is missing!");
    }, []);

    // Initial map setup
    useEffect(() => {
        if (isLoaded && mapRef.current && !mapInstance && window.google && window.google.maps) {
            console.log("Initializing map at:", lat, lng);
            const initialLat = parseFloat(lat) || 4.6097;
            const initialLng = parseFloat(lng) || -74.0817;
            const center = { lat: initialLat, lng: initialLng };

            const map = new window.google.maps.Map(mapRef.current, {
                center: center,
                zoom: 15,
                mapTypeControl: false,
                streetViewControl: false,
                fullscreenControl: false,
            });

            // Trigger a resize slightly after init in case the container animated from 0 height
            setTimeout(() => {
                window.google.maps.event.trigger(map, 'resize');
                map.setCenter(center);
            }, 500);

            const marker = new window.google.maps.Marker({
                position: center,
                map: map,
                draggable: true,
                animation: window.google.maps.Animation.DROP,
            });

            marker.addListener('dragend', () => {
                const newPos = marker.getPosition();
                onChange({ lat: newPos.lat(), lng: newPos.lng() });
            });

            map.addListener('click', (e) => {
                const newPos = e.latLng;
                marker.setPosition(newPos);
                onChange({ lat: newPos.lat(), lng: newPos.lng() });
            });

            markerRef.current = marker;
            setMapInstance(map);
        }
    }, [isLoaded, mapInstance]);

    // Update map when coordinates change externaly
    useEffect(() => {
        if (mapInstance && markerRef.current && lat != null && lng != null) {
            const newPos = { lat: parseFloat(lat), lng: parseFloat(lng) };
            if (!isNaN(newPos.lat) && !isNaN(newPos.lng)) {
                console.log("Panning map to:", newPos);
                markerRef.current.setPosition(newPos);
                mapInstance.panTo(newPos);

                // Trigger a resize event with delay to ensure it renders correctly in modals/sheets
                setTimeout(() => {
                    if (window.google && window.google.maps) {
                        window.google.maps.event.trigger(mapInstance, 'resize');
                        mapInstance.setCenter(newPos);
                    }
                }, 300);
            }
        }
    }, [lat, lng, mapInstance]);

    return (
        <div className="space-y-4">
            <div
                ref={mapRef}
                className="h-64 w-full rounded-3xl overflow-hidden border-2 border-gray-100 shadow-md relative bg-gray-50"
            >
                {!isLoaded && (
                    <div className="absolute inset-0 flex items-center justify-center z-10">
                        <Loader2 className="w-8 h-8 text-[#4ADE80] animate-spin" />
                    </div>
                )}
            </div>
            {isLoaded && (
                <p className="text-[10px] text-gray-500 italic flex items-center gap-1 ml-2">
                    <MapPin className="w-3 h-3 text-[#4ADE80]" />
                    Arrastra el marcador para ajustar tu ubicación exacta.
                </p>
            )}
        </div>
    );
};
