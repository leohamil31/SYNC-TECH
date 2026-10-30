import Modal from './Modal';
import ResourceForm from './ResourceForm';

export default function CrudModal({ crud, config, fields = config.fields, defaults }) {
  if (!crud.editing) return null;
  const isNew = !crud.editing.id;
  return (
    <Modal title={`${isNew ? 'New' : 'Edit'} ${config.singular}`} onClose={crud.close}>
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
