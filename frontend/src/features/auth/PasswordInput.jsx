import { useState } from 'react';
import Icon from '../../design-system/Icon';
import { useI18n } from '../../shared/i18n';

export default function PasswordInput(props) {
  const { t } = useI18n();
  const [visible, setVisible] = useState(false);
  return (
    <div className="password-field">
      <input {...props} type={visible ? 'text' : 'password'} />
      <button
        type="button"
        className="icon-btn"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? t('auth.hidePassword') : t('auth.showPassword')}
        aria-pressed={visible}
      >
        <Icon name={visible ? 'eyeOff' : 'eye'} size={16} />
      </button>
    </div>
  );
}
