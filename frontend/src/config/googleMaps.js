/**
 * Google Maps API Key - Centralizado
 * 
 * Este módulo centraliza la API Key de Google Maps para que funcione
 * SIEMPRE, tanto en desarrollo (variables de entorno) como en producción
 * (donde las variables de entorno de Vite pueden no estar disponibles
 * si no se configuran en el momento del build).
 */

// Intentar obtener de variables de entorno primero, si no, usar la key directamente
const GOOGLE_MAPS_API_KEY =
    import.meta.env.VITE_GOOGLE_MAPS_API_KEY ||
    import.meta.env.REACT_APP_GOOGLE_MAPS_API_KEY ||
    'AIzaSyAwduq9rijltqE2tgI9shSHF76m-45K_iY';

export default GOOGLE_MAPS_API_KEY;
