import Keycloak from "keycloak-js";

export const keycloak = new Keycloak({
  url: `http://${window.location.hostname}:8081`,
  realm: "bms",
  clientId: "bms-frontend",
});