const cleanUrl = (value: string | undefined, fallback: string) => {
  return (value || fallback).replace(/\/+$/, "");
};

// Frontend URL = the URL currently opened in the browser
// Example: https://192.168.68.66:5173
export const FRONTEND_URL = cleanUrl(
  import.meta.env.VITE_FRONTEND_URL,
  window.location.origin
);

// Backend API goes through Caddy HTTPS
// Example: https://bms-api.test
export const BACKEND_URL = cleanUrl(
  import.meta.env.VITE_API_BASE_URL,
  "https://bms-api.test"
);

// Keycloak goes through Caddy HTTPS
// Example: https://bms-auth.test
export const KEYCLOAK_URL = cleanUrl(
  import.meta.env.VITE_KEYCLOAK_URL,
  "https://bms-auth.test"
);

// SockJS/STOMP endpoint goes through backend HTTPS
// Example: https://bms-api.test/ws
export const WS_BASE_URL = cleanUrl(
  import.meta.env.VITE_WS_BASE_URL,
  `${BACKEND_URL}/ws`
);