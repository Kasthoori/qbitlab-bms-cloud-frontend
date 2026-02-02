import Keycloak from "keycloak-js";
import { KEYCLOAK_URL } from "@/utils/config"; 

console.log(">>> KEYCLOAK_URL (runtime) =", KEYCLOAK_URL);

export const keycloak = new Keycloak({
    url: KEYCLOAK_URL,
    realm: "bms",
    clientId: "bms-frontend",
});

