import { useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useI18n } from '../../shared/i18n';
import { ErrorAlert } from '../../design-system/Feedback';
import { useAuth } from './AuthProvider';
import AuthLayout from './AuthLayout';
import PasswordInput from './PasswordInput';

// Seed accounts, shown only in development builds.
const DEMO_ACCOUNTS = import.meta.env.DEV
  ? [
      ['alice@example.com', 'admin'],
      ['bruno@example.com', 'student'],
    ]
  : [];
const DEMO_PASSWORD = 'SyncTech@2026';

export default function LoginPage() {
  const { t, apiMessage } = useI18n();
  const { login } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const change = (name) => (e) => setForm((f) => ({ ...f, [name]: e.target.value }));

  // Navigation happens in <GuestOnly> as soon as the session exists.
  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await login(form);
    } catch (err) {
      setError(apiMessage(err.message));
      setBusy(false);
    }
  };

  return (
    <AuthLayout
      title={t('auth.loginTitle')}
      subtitle={t('auth.loginSubtitle')}
      footer={
        <>
          {t('auth.noAccount')} <Link to="/register">{t('auth.createAccount')}</Link>
        </>
      }
    >
      <form className="form" onSubmit={submit} noValidate>
        <AnimatePresence>
          {error && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
              <ErrorAlert>{error}</ErrorAlert>
            </motion.div>
          )}
        </AnimatePresence>
        <div className="field">
          <label htmlFor="login-email">{t('fields.email')}</label>
          <input id="login-email" type="email" autoComplete="email" required value={form.email} onChange={change('email')} />
        </div>
        <div className="field">
          <label htmlFor="login-password">{t('fields.password')}</label>
          <PasswordInput id="login-password" autoComplete="current-password" required value={form.password} onChange={change('password')} />
        </div>
        <button type="submit" className={`btn btn-primary btn-lg btn-block${busy ? ' is-loading' : ''}`} disabled={busy || !form.email || !form.password}>
          {t('auth.signIn')}
        </button>
        {DEMO_ACCOUNTS.length > 0 && (
          <div className="demo-hint">
            {t('auth.demoHint')}{' '}
            {DEMO_ACCOUNTS.map(([email, role], i) => (
              <span key={email}>
                {i > 0 && ', '}
                <button type="button" onClick={() => setForm({ email, password: DEMO_PASSWORD })}>
                  {t(`roles.${role}`)}
                </button>
              </span>
            ))}
          </div>
        )}
      </form>
    </AuthLayout>
  );
}
