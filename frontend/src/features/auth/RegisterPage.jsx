import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useI18n } from '../../shared/i18n';
import { ErrorAlert } from '../../design-system/Feedback';
import { useAuth } from './AuthProvider';
import AuthLayout from './AuthLayout';
import PasswordInput from './PasswordInput';

const passwordOk = (p) => p.length >= 8 && /[A-Za-z]/.test(p) && /\d/.test(p);

export default function RegisterPage() {
  const { t, apiMessage } = useI18n();
  const { register } = useAuth();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const change = (name) => (e) => setForm((f) => ({ ...f, [name]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setErrors({});
    try {
      await register(form);
    } catch (err) {
      if (Array.isArray(err.details)) setErrors(Object.fromEntries(err.details.map((d) => [d.field, apiMessage(d.message)])));
      setError(apiMessage(err.message));
      setBusy(false);
    }
  };

  return (
    <AuthLayout
      title={t('auth.registerTitle')}
      subtitle={t('auth.registerSubtitle')}
      footer={
        <>
          {t('auth.haveAccount')} <Link to="/login">{t('auth.signIn')}</Link>
        </>
      }
    >
      <form className="form" onSubmit={submit} noValidate>
        {error && <ErrorAlert>{error}</ErrorAlert>}
        <div className={`field${errors.name ? ' has-error' : ''}`}>
          <label htmlFor="reg-name">{t('fields.name')}</label>
          <input id="reg-name" autoComplete="name" required value={form.name} onChange={change('name')} />
          {errors.name && <small className="error-text">{errors.name}</small>}
        </div>
        <div className={`field${errors.email ? ' has-error' : ''}`}>
          <label htmlFor="reg-email">{t('fields.email')}</label>
          <input id="reg-email" type="email" autoComplete="email" required value={form.email} onChange={change('email')} />
          {errors.email && <small className="error-text">{errors.email}</small>}
        </div>
        <div className={`field${errors.password ? ' has-error' : ''}`}>
          <label htmlFor="reg-password">{t('fields.password')}</label>
          <PasswordInput id="reg-password" autoComplete="new-password" required value={form.password} onChange={change('password')} aria-describedby="reg-password-hint" />
          <small id="reg-password-hint" className={errors.password ? 'error-text' : 'hint'}>
            {errors.password || t('auth.passwordRule')}
          </small>
        </div>
        <button
          type="submit"
          className={`btn btn-primary btn-lg btn-block${busy ? ' is-loading' : ''}`}
          disabled={busy || form.name.trim().length < 2 || !form.email || !passwordOk(form.password)}
        >
          {t('auth.createAccount')}
        </button>
      </form>
    </AuthLayout>
  );
}
