

const BASE_IP = import.meta.env.VITE_BASE_IP;

export const FRONTEND_URL = `http://${BASE_IP}:5173`;
export const BACKEND_URL = `http://${BASE_IP}:8084`;
//export const KEYCLOAK_URL = `http://${BASE_IP}:8081`;
//export const KEYCLOAK_URL = `http://localhost:8081`;
export const KEYCLOAK_URL = import.meta.env.VITE_KEYCLOAK_URL;