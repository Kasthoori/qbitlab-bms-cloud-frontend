import { StrictMode, lazy} from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import Keycloak from 'keycloak-js';




const App = lazy(() => import('./App.tsx'))


// const keycloak = new Keycloak({
//   url: 'https://your-keycloak-server/auth',
//   realm: 'your-realm',
//   clientId: 'your-client-id'
// });

const keycloak = new Keycloak({
  url: 'http://192.168.68.50:8081',
  realm: 'bms',
  clientId: 'bms-frontend'
});
keycloak.init({ onLoad: "login-required", pkceMethod: "S256", checkLoginIframe: false }).then(() => {

  createRoot(document.getElementById('root')!).render(
  <StrictMode>
        <App />
  </StrictMode>,
)

})

.catch((err) => {
    console.error("Keycloak init failed", err);
  });
