/* eslint-disable @typescript-eslint/no-explicit-any */
import { lazy } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { keycloak } from "./keycloak";

const App = lazy(() => import("./App.tsx"));

keycloak
  .init({
    onLoad: "login-required",
    pkceMethod: "S256",
    checkLoginIframe: false,

    // IMPORTANT:
    // This must match the URL opened in browser.
    // Example: https://192.168.68.66:5173
    redirectUri: window.location.origin,
  })
  .then((authenticated) => {
    console.log("Keycloak authenticated:", authenticated);
    console.log("Frontend origin:", window.location.origin);

    (window as any).keycloak = keycloak;

    createRoot(document.getElementById("root")!).render(<App />);
  })
  .catch((err) => {
    console.error("Keycloak init failed", err);
  });