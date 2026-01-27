import Keycloak from "keycloak-js";
import { KEYCLOAK_URL } from "@/utils/config"; 

export const keycloak = new Keycloak({
    url: KEYCLOAK_URL,
    realm: "bms",
    clientId: "bms-frontend",
});

console.log("KEYCLOAK EXPORT CREATED:", keycloak);