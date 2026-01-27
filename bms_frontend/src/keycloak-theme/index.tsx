import { createRoot } from "react-dom/client";
import { KcApp } from "keycloakify";
import type { KcContext} from "keycloakify/login/KcContext";
import type { I18n } from "keycloakify/login/i18n";

declare global {
    interface Window {
        kcContext?: KcContext;
        i18n?: I18n;
    }
}

import '../index.css';

createRoot(document.getElementById("root")!).render(
    <KcApp
        kcContext={window.kcContext as KcContext}
        i18n={window.i18n as I18n}
    />
);