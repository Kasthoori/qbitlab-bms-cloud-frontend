import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { initAuth } from './auth/auth.ts'
import { BrowserRouter } from 'react-router-dom';

async function bootstrap() {

  try {

        await initAuth();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
        <App />
    </BrowserRouter>
  </StrictMode>,
);

  } catch (error) {
        console.error('Failed to initialize authentication', error);
        document.body.innerHTML = `<pre style="color: red;>Auth init failed: ${String(error)}</pre>`
  }

}

bootstrap();
