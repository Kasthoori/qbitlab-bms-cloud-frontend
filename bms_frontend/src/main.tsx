import { StrictMode, lazy } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { keycloak } from "./keycloak";   // ✅ shared instance



const App = lazy(() => import("./App.tsx"));

keycloak
  .init({
    onLoad: "login-required",
    pkceMethod: "S256",
    checkLoginIframe: false,
    //redirectUri: window.location.origin, // Ensure it matches where the app is opened
    //redirectUri: "http://localhost:5173", // Ensure it matches where the app is opened
  })
  .then(() => {
    createRoot(document.getElementById("root")!).render(
      <StrictMode>
        <App />
      </StrictMode>
    );
  })
  .catch((err) => {
    console.error("Keycloak init failed", err);
  });
