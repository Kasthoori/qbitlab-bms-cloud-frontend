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
