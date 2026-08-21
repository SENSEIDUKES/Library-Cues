import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { Modal, Button } from './common';

export interface ConfirmDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCount: number;
  onConfirm: () => void;
}

export const ConfirmDeleteModal: React.FC<ConfirmDeleteModalProps> = React.memo(({
  isOpen,
  onClose,
  selectedCount,
  onConfirm,
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="sm"
      title={
        <h2 className="text-base font-semibold text-white flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0" />
          Delete Selected Assets?
        </h2>
      }
      description={`Are you sure you want to delete ${selectedCount} asset${selectedCount !== 1 ? 's' : ''}? This action cannot be undone.`}
      hideCloseButton={true}
    >
      <div className="flex gap-3 mt-4">
        <Button
          variant="secondary"
          size="md"
          onClick={onClose}
          fullWidth
        >
          Cancel
        </Button>
        <Button
          variant="danger"
          size="md"
          onClick={onConfirm}
          fullWidth
        >
          Delete
        </Button>
      </div>
    </Modal>
  );
});

