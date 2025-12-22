// API Configuration

// Toggle this to use mock data when backend is not available
export const USE_MOCK_DATA = false;

// ✅ NEW: mock auth only (login/logout/me)
export const USE_MOCK_AUTH = true;

// API Base URL - set via environment variable
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';

// API Endpoints
export const ENDPOINTS = {
  players: '/players',
  achievements: '/achievements',
  teamMedia: '/team-media',
  tournaments: '/tournaments',
  results: '/results',
  gallery: '/gallery',
  videos: '/videos',
  news: '/news',
  sponsors: '/sponsors',
  auth: {
    login: '/auth/login',
    logout: '/auth/logout',
    me: '/auth/me',
  },
} as const;

// Request timeout in milliseconds
export const REQUEST_TIMEOUT = 10000;
