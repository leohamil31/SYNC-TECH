import { AnimatePresence } from 'framer-motion';
import { useI18n } from '../i18n';
import Modal from './Modal';
import ResourceForm from './ResourceForm';

export default function CrudModal({ crud, config, fields = config.fields, defaults }) {
  const { t } = useI18n();
  const editing = crud.editing;
  const isNew = editing && !editing.id;
  const title = isNew ? t('actions.new', { entity: config.singular }) : `${t('actions.edit')} ${config.singular}`;

  // AnimatePresence keeps the last rendered tree alive during exit,
  // so the form stays visible while the dialog animates out.
  return (
    <AnimatePresence>
      {editing && (
        <Modal key="crud-modal" title={title} onClose={crud.close}>
          <ResourceForm
            fields={fields}
            initialValues={isNew ? { ...defaults, ...editing } : editing}
            onSubmit={crud.save}
            onCancel={crud.close}
            submitting={crud.saving}
            errors={crud.errors}
          />
        </Modal>
      )}
    </AnimatePresence>
  );
}
