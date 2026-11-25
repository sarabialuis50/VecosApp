import { useState, useEffect } from 'react';

let isLoading = false;
let isLoaded = false;
const callbacks = [];

export const useGoogleMaps = (apiKey) => {
    const [loaded, setLoaded] = useState(isLoaded);

    useEffect(() => {
        if (isLoaded) return;

        const handleLoaded = () => {
            setLoaded(true);
        };

        if (isLoading) {
            callbacks.push(handleLoaded);
            return;
        }

        if (window.google && window.google.maps && window.google.maps.Map) {
            isLoaded = true;
            handleLoaded();
            return;
        }

        isLoading = true;
        const callbackName = `initGoogleMaps_${Math.random().toString(36).substr(2, 9)}`;

        window[callbackName] = () => {
            isLoaded = true;
            handleLoaded();
            while (callbacks.length > 0) {
                const cb = callbacks.shift();
                if (typeof cb === 'function') cb();
            }
            delete window[callbackName];
        };

        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&callback=${callbackName}`;
        script.async = true;
        script.defer = true;

        // Error handling
        script.onerror = () => {
            console.error("Failed to load Google Maps API script");
            isLoading = false;
        };

        // Standard Google Maps auth failure listener
        window.gm_authFailure = () => {
            console.error("Google Maps API Authentication Failure. Check your API Key and Console restrictions.");
            isLoading = false;
        };

        document.head.appendChild(script);

    }, [apiKey]);

    return loaded;
};
