import { AnimatePresence } from 'framer-motion';
import { useI18n } from '../../../shared/i18n';
import Modal from '../../../design-system/Modal';
import ResourceForm from './ResourceForm';

export default function CrudModal({ crud, config }) {
  const { t } = useI18n();
  const { editing } = crud;
  const isNew = Boolean(editing && !editing.id);
  const title = isNew ? t('actions.new', { entity: config.singular }) : t('actions.editEntity', { entity: config.singular });

  // AnimatePresence keeps the last rendered tree alive during exit, so the form stays visible while closing.
  return (
    <AnimatePresence>
      {editing && (
        <Modal key="crud-modal" title={title} onClose={crud.close}>
          <ResourceForm
            fields={config.fields}
            initialValues={editing}
            isNew={isNew}
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
