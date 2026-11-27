import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { demoMockAdapter } from '@/utils/demoMockAdapter';

const API = (import.meta.env && (import.meta.env.VITE_BACKEND_URL || import.meta.env.REACT_APP_BACKEND_URL)) || '/api';


const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

const UNIVERSAL_ADMIN_TOKEN = 'universal-admin-token';
const savedLocalLogo = typeof window !== 'undefined' ? localStorage.getItem('fogon_mesa_logo') : null;
const savedLocalBanner = typeof window !== 'undefined' ? localStorage.getItem('fogon_mesa_banner') : null;

const UNIVERSAL_ADMIN_BUSINESS = {
  id: 'vecos-restaurante-id',
  nombre: "Veco's Restaurante",
  slug: 'vecos',
  email: 'sarabialuis50@gmail.com',
  plan: 'pro',
  telefono: '3017810256',
  direccion: "Zona Gastronómica — Veco's Restaurante",
  logo_url: savedLocalLogo || '/images/vecos-logo.jpg',
  banner_url: savedLocalBanner || '/images/hero-almuerzo.jpg',
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('menu.ia_token'));
  const [loading, setLoading] = useState(true);
  const [trialLocked, setTrialLocked] = useState(null);

  const api = useCallback(() => {
    const instance = axios.create({
      baseURL: API,
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      ...(token === UNIVERSAL_ADMIN_TOKEN ? { adapter: demoMockAdapter } : {}),
    });

    // Add interceptor to catch trial lockout globally
    instance.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response && error.response.status === 403) {
          const detail = error.response.data?.detail || '';
          if (detail.includes('prueba') || detail.includes('créditos')) {
            setTrialLocked(detail);
          }
        }
        return Promise.reject(error);
      }
    );

    return instance;
  }, [token]);

  useEffect(() => {
    let isMounted = true;
    const verifyToken = async () => {
      if (token === UNIVERSAL_ADMIN_TOKEN) {
        if (isMounted) {
          setUser(UNIVERSAL_ADMIN_BUSINESS);
          setTrialLocked(null);
          setLoading(false);
        }
        return;
      }
      if (token) {
        try {
          const response = await api().get('/auth/me');
          if (isMounted) {
            setUser(response.data);
            setTrialLocked(null);
          }
        } catch (error) {
          console.error('Token verification failed:', error);
          if (isMounted) {
            if (error.response && error.response.status === 403) {
              const detail = error.response.data?.detail || '';
              if (detail.includes('prueba') || detail.includes('créditos')) {
                // If it's a trial lockout, we keep the user data (from token if possible or just the state)
                // but we set the lock message
                setTrialLocked(detail);
                setLoading(false);
                return;
              }
            }
            logout();
          }
        }
      } else {
        if (isMounted) {
          setUser(null);
          setTrialLocked(null);
        }
      }
      if (isMounted) {
        setLoading(false);
      }
    };
    verifyToken();
    return () => { isMounted = false; };
  }, [token, api]);

  const login = async (email, password) => {
    const normalizedEmail = (email || '').trim().toLowerCase();
    try {
      const response = await axios.post(`${API}/auth/login`, { email: normalizedEmail, password });
      const { access_token, business } = response.data;
      localStorage.setItem('menu.ia_token', access_token);
      setToken(access_token);
      setUser(business);
      setTrialLocked(null);
      return business;
    } catch (err) {
      const status = err.response?.status;
      const isAuthorizedAdmin =
        normalizedEmail === 'sarabialuis50@gmail.com' && password === 'Luisar777+';
      const isBackendUnavailable = !err.response || status === 404 || status === 405 || status >= 500;

      // Fallback administrativo únicamente para el administrador oficial cuando el backend no está disponible (despliegue estático)
      if (isBackendUnavailable && isAuthorizedAdmin) {
        const adminBusiness = {
          ...UNIVERSAL_ADMIN_BUSINESS,
          email: 'sarabialuis50@gmail.com',
        };
        localStorage.setItem('menu.ia_token', UNIVERSAL_ADMIN_TOKEN);
        setToken(UNIVERSAL_ADMIN_TOKEN);
        setUser(adminBusiness);
        setTrialLocked(null);
        return adminBusiness;
      }
      throw err;
    }
  };

  const register = async (data) => {
    const response = await axios.post(`${API}/auth/register`, data);
    const { access_token, business } = response.data;
    localStorage.setItem('menu.ia_token', access_token);
    setToken(access_token);
    setUser(business);
    setTrialLocked(null);
    return business;
  };

  const logout = () => {
    localStorage.removeItem('menu.ia_token');
    setToken(null);
    setUser(null);
    setTrialLocked(null);
  };

  // Single-business architecture: Veco's Restaurante (no multi-tenant / multi-sede roles)
  return (
    <AuthContext.Provider value={{
      user, setUser, token, loading, login, register, logout, api, trialLocked,
      isSuperAdmin: !!user, isSedeAdmin: false
    }}>
      {children}
    </AuthContext.Provider>
  );
};
