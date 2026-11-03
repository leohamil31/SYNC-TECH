import { useConfirm } from '../design-system/Confirm';
import Icon from '../design-system/Icon';
import { useI18n } from '../shared/i18n';

/** Shown only in the GitHub Pages build, where the API runs in the browser. */
export default function DemoBanner() {
  const { t } = useI18n();
  const confirm = useConfirm();

  const reset = async () => {
    const ok = await confirm({ title: t('demo.resetTitle'), message: t('demo.resetText'), confirmLabel: t('demo.reset'), danger: true });
    if (!ok) return;
    const { resetDemoData } = await import('../shared/api/demo/server');
    resetDemoData();
    window.location.reload();
  };

  return (
    <div className="demo-banner" role="note">
      <Icon name="alert" size={16} />
      <span className="grow">
        <strong>{t('demo.title')}</strong> {t('demo.text')}
      </span>
      <button type="button" className="btn btn-sm btn-ghost" onClick={reset}>
        <Icon name="rotate" size={14} /> {t('demo.reset')}
      </button>
    </div>
  );
}
