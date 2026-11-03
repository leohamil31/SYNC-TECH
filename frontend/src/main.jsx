import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { MotionConfig } from 'framer-motion';
import { I18nProvider } from './shared/i18n';
import { ToastProvider } from './design-system/Toast';
import { ConfirmProvider } from './design-system/Confirm';
import { AuthProvider } from './features/auth/AuthProvider';
// Global styles first, so feature stylesheets (imported by pages) can refine them.
import './design-system/styles/tokens.css';
import './design-system/styles/base.css';
import './design-system/styles/components.css';
import App from './app/App';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {/* reducedMotion="user" makes every motion component honour the OS setting. */}
    <MotionConfig reducedMotion="user">
      <BrowserRouter basename={import.meta.env.BASE_URL}>
        <I18nProvider>
          <ToastProvider>
            <ConfirmProvider>
              <AuthProvider>
                <App />
              </AuthProvider>
            </ConfirmProvider>
          </ToastProvider>
        </I18nProvider>
      </BrowserRouter>
    </MotionConfig>
  </StrictMode>,
);
