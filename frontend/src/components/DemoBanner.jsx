import { resetDemoData } from '../api/mock';
import { useI18n } from '../i18n';
import Icon from './Icon';

export default function DemoBanner() {
  const { t } = useI18n();
  const reset = () => {
    if (!window.confirm(t('messages.confirmReset'))) return;
    resetDemoData();
    window.location.reload();
  };

  return (
    <div className="demo-banner" role="note">
      <span><strong>{t('demo.title')}</strong> {t('demo.text')}</span>
      <button type="button" className="btn btn-sm btn-ghost" onClick={reset}>
        <Icon name="refresh" size={14} /> {t('actions.reset')}
      </button>
    </div>
  );
}
