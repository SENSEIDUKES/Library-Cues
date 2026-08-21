import React from 'react';
import { Pencil } from 'lucide-react';
import { Modal, FormField, TextInput, Button } from './common';

export interface RenameKitModalProps {
  isOpen: boolean;
  onClose: () => void;
  renameKitName: string;
  setRenameKitName: (name: string) => void;
  onSubmit: () => void;
}

export const RenameKitModal: React.FC<RenameKitModalProps> = ({
  isOpen,
  onClose,
  renameKitName,
  setRenameKitName,
  onSubmit,
}) => {
  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!renameKitName.trim()) return;
    onSubmit();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="sm"
      title="Rename Sound Kit"
      icon={<Pencil className="w-4 h-4 text-neutral-300" />}
      description="Enter a new name for your sound library category group."
      hideCloseButton={true}
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <FormField label="New Kit Name">
          <TextInput
            type="text"
            value={renameKitName}
            onChange={(e) => setRenameKitName(e.target.value)}
            placeholder="e.g. UI Clicks"
            autoFocus
          />
        </FormField>

        <div className="flex gap-3 mt-1">
          <Button
            variant="secondary"
            size="md"
            onClick={onClose}
            fullWidth
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="md"
            disabled={!renameKitName.trim()}
            fullWidth
          >
            Rename Kit
          </Button>
        </div>
      </form>
    </Modal>
  );
};

