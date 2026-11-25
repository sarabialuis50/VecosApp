import React, { useEffect, useRef } from 'react';
import { useGoogleMaps } from '@/hooks/useGoogleMaps';
import { Input } from '@/components/ui/input';
import { MapPin } from 'lucide-react';
import GOOGLE_MAPS_API_KEY from '@/config/googleMaps';

const API_KEY = GOOGLE_MAPS_API_KEY;

export const PlacesAutocomplete = ({ value, onChange, onPlaceSelected, placeholder, className }) => {
    const inputRef = useRef(null);
    const isLoaded = useGoogleMaps(API_KEY);
    const autocompleteRef = useRef(null);

    useEffect(() => {
        const checkError = () => {
            if (inputRef.current && (inputRef.current.value.includes("Se ha producido un error") || inputRef.current.value.includes("This page can't load Google Maps correctly"))) {
                inputRef.current.value = "";
                onChange("");
            }
        };
        const timer = setInterval(checkError, 2000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        if (isLoaded && inputRef.current && !autocompleteRef.current && window.google && window.google.maps && window.google.maps.places) {
            try {
                const autocomplete = new window.google.maps.places.Autocomplete(inputRef.current, {
                    fields: ["address_components", "geometry", "name", "formatted_address"],
                    componentRestrictions: { country: "CO" } // Restrict to Colombia by default
                });

                autocomplete.addListener("place_changed", () => {
                    const place = autocomplete.getPlace();
                    if (place && place.geometry) {
                        onPlaceSelected({
                            address: place.formatted_address,
                            lat: place.geometry.location.lat(),
                            lng: place.geometry.location.lng()
                        });
                    } else if (place) {
                        onChange(place.name || "");
                    }
                });

                autocompleteRef.current = autocomplete;
            } catch (error) {
                console.error("Error initializing Google Autocomplete:", error);
            }
        }
    }, [isLoaded]);

    return (
        <div className="relative">
            <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
                ref={inputRef}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                className={`pl-10 ${className}`}
            />
        </div>
    );
};
