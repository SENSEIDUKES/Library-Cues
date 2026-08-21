import React from 'react';
import { FolderArchive } from 'lucide-react';
import { SoundKit } from '../types';
import { Modal, FormField, SelectField, Button } from './common';

export interface BatchAssignModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCount: number;
  batchAssignKitId: string;
  setBatchAssignKitId: (id: string) => void;
  kits: SoundKit[];
  onSubmit: () => void;
}

export const BatchAssignModal: React.FC<BatchAssignModalProps> = React.memo(({
  isOpen,
  onClose,
  selectedCount,
  batchAssignKitId,
  setBatchAssignKitId,
  kits,
  onSubmit,
}) => {
  const handleClose = () => {
    onClose();
    setBatchAssignKitId('');
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      size="sm"
      title="Assign to Sound Kit"
      icon={<FolderArchive className="w-4 h-4 text-neutral-300" />}
      description={`Choose which kit to add the ${selectedCount} selected sound${selectedCount !== 1 ? 's' : ''} to.`}
      hideCloseButton={true}
    >
      <div className="flex flex-col gap-4">
        <FormField label="Select Target Kit">
          <SelectField
            value={batchAssignKitId}
            onChange={(e) => setBatchAssignKitId(e.target.value)}
          >
            <option value="" disabled>-- Choose a sound kit --</option>
            {kits.map(kit => (
              <option key={kit.id} value={kit.id}>
                {kit.name} ({kit.soundIds.length} sounds)
              </option>
            ))}
          </SelectField>
        </FormField>

        <div className="flex gap-3 mt-1">
          <Button
            variant="secondary"
            size="md"
            onClick={handleClose}
            fullWidth
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            size="md"
            onClick={onSubmit}
            disabled={!batchAssignKitId}
            fullWidth
          >
            Assign to Kit
          </Button>
        </div>
      </div>
    </Modal>
  );
});

