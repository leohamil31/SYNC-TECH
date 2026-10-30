import { useI18n } from '../i18n';
import Modal from './Modal';
import ResourceForm from './ResourceForm';

export default function CrudModal({ crud, config, fields = config.fields, defaults }) {
  const { t } = useI18n();
  if (!crud.editing) return null;
  const isNew = !crud.editing.id;
  const title = isNew ? t('actions.new', { entity: config.singular }) : `${t('actions.edit')} ${config.singular}`;

  return (
    <Modal title={title} onClose={crud.close}>
      <ResourceForm
        fields={fields}
        initialValues={isNew ? { ...defaults, ...crud.editing } : crud.editing}
        onSubmit={crud.save}
        onCancel={crud.close}
        submitting={crud.saving}
        errors={crud.errors}
      />
    </Modal>
  );
}
