import Keycloak from "keycloak-js";
import { CONFIG } from "../config/env";

export const keycloak = new Keycloak({
  url: CONFIG.keycloakUrl,
  realm: CONFIG.keycloakRealm,
  clientId: CONFIG.keycloakClientId,
});