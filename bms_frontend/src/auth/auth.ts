import { keycloak } from "./keycloak";

export async function initAuth() {
  const redirectUri = window.location.origin;

  console.log("initAuth starting =", redirectUri);
  console.log("keycloak config =", (keycloak as any));

  const authenticated = await keycloak.init({
    onLoad: "login-required",
    pkceMethod: "S256",
    checkLoginIframe: false,
    redirectUri, // 👈 important
  });

  console.log("keycloak.init result authenticated =", authenticated);
    console.log("keycloak.authenticated =", keycloak.authenticated);
    console.log("login url preview =", keycloak.createLoginUrl({ redirectUri }));

  if (!authenticated) {
    // fallback: force login with correct redirect
    await keycloak.login({ redirectUri });
    return;
  }

  setInterval(() => {
    keycloak.updateToken(60).catch(() => keycloak.login({ redirectUri }));
  }, 30_000);
}
