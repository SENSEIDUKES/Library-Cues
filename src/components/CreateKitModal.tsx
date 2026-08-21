import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  FolderArchive, Zap, MousePointer, Sparkles, Flame, Radio, Sword, Cpu, Compass, RotateCcw, Check, Wand2
} from 'lucide-react';
import { KIT_TEMPLATES, KitTemplate } from '../data/kitTemplates';
import { cn } from '../lib/utils';
import { Modal, FormField, TextInput, TextArea, Badge, Button } from './common';

export interface CreateKitModalProps {
  isOpen: boolean;
  onClose: () => void;
  newKitName: string;
  setNewKitName: (name: string) => void;
  newKitDescription: string;
  setNewKitDescription: (desc: string) => void;
  onSubmit: (autoAssignMatching?: boolean, selectedTemplate?: KitTemplate | null) => void;
  librarySoundsCount?: number;
}

export const CreateKitModal: React.FC<CreateKitModalProps> = React.memo(({
  isOpen,
  onClose,
  newKitName,
  setNewKitName,
  newKitDescription,
  setNewKitDescription,
  onSubmit,
  librarySoundsCount = 0,
}) => {
  const [selectedTemplate, setSelectedTemplate] = useState<KitTemplate | null>(null);
  const [autoAssignMatching, setAutoAssignMatching] = useState(false);

  const getTemplateIcon = (iconName: KitTemplate['iconName']) => {
    switch (iconName) {
      case 'Zap': return <Zap className="w-3.5 h-3.5" />;
      case 'MousePointer': return <MousePointer className="w-3.5 h-3.5" />;
      case 'Sparkles': return <Sparkles className="w-3.5 h-3.5" />;
      case 'Flame': return <Flame className="w-3.5 h-3.5" />;
      case 'Radio': return <Radio className="w-3.5 h-3.5" />;
      case 'Sword': return <Sword className="w-3.5 h-3.5" />;
      case 'Cpu': return <Cpu className="w-3.5 h-3.5" />;
      case 'Compass': return <Compass className="w-3.5 h-3.5" />;
      default: return <FolderArchive className="w-3.5 h-3.5" />;
    }
  };

  const handleSelectTemplate = (template: KitTemplate) => {
    if (selectedTemplate?.id === template.id) {
      setSelectedTemplate(null);
      setNewKitName('');
      setNewKitDescription('');
    } else {
      setSelectedTemplate(template);
      setNewKitName(template.name);
      setNewKitDescription(template.description);
    }
  };

  const handleResetForm = () => {
    setSelectedTemplate(null);
    setNewKitName('');
    setNewKitDescription('');
    setAutoAssignMatching(false);
  };

  const handleClose = () => {
    handleResetForm();
    onClose();
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newKitName.trim()) return;
    onSubmit(autoAssignMatching, selectedTemplate);
    handleResetForm();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      id="create-kit-modal-container"
      overlayId="create-kit-modal-overlay"
      closeButtonId="create-kit-close-btn"
      size="lg"
      title="Create Sound Kit"
      icon={<FolderArchive className="w-4 h-4 text-neutral-300" />}
      description="Select a pre-populated template or create a custom kit to group and organize your audio assets."
      className="max-h-[90vh] overflow-y-auto scrollbar-none"
    >
      <div className="flex flex-col gap-4">
        {/* Template Suggestions Carousel / Grid */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-1.5">
              <Wand2 className="w-3.5 h-3.5 text-neutral-300" /> Pre-Populated Kit Templates
            </span>
            
            {(selectedTemplate || newKitName || newKitDescription) && (
              <button
                id="reset-kit-templates-btn"
                onClick={handleResetForm}
                type="button"
                className="text-[10px] font-semibold text-neutral-400 hover:text-white flex items-center gap-1 transition-colors cursor-pointer select-none"
                title="Reset template selection and fields"
              >
                <RotateCcw className="w-3 h-3" /> Reset Templates
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {KIT_TEMPLATES.map((tmpl) => {
              const isSelected = selectedTemplate?.id === tmpl.id;
              return (
                <button
                  key={tmpl.id}
                  id={`kit-template-chip-${tmpl.id}`}
                  type="button"
                  onClick={() => handleSelectTemplate(tmpl)}
                  className={cn(
                    "p-2.5 rounded-xl border text-left flex flex-col justify-between transition-all min-h-[68px] cursor-pointer group/template relative",
                    isSelected
                      ? "bg-white text-black border-white shadow-lg ring-1 ring-white"
                      : "bg-neutral-950/60 border-white/[0.05] hover:border-white/20 text-neutral-300 hover:text-white hover:bg-neutral-950"
                  )}
                >
                  <div className="flex items-center justify-between gap-1">
                    <span className={cn(
                      "p-1 rounded-lg shrink-0",
                      isSelected ? "bg-black/10 text-black" : "bg-white/[0.05] text-neutral-400 group-hover/template:text-white"
                    )}>
                      {getTemplateIcon(tmpl.iconName)}
                    </span>
                    {isSelected && (
                      <span className="bg-black text-white rounded-full p-0.5">
                        <Check className="w-2.5 h-2.5" />
                      </span>
                    )}
                  </div>

                  <div className="mt-2 flex flex-col">
                    <span className="text-[11px] font-bold leading-tight truncate">{tmpl.name}</span>
                    <span className={cn(
                      "text-[9px] uppercase tracking-wider font-semibold mt-0.5 truncate",
                      isSelected ? "text-neutral-700" : "text-neutral-500"
                    )}>
                      {tmpl.category}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Template Info Badge */}
        {selectedTemplate && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-white/[0.03] border border-white/[0.08] p-3 rounded-xl flex flex-col gap-1"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-300 flex items-center gap-1">
                Selected Template: <span className="text-white font-bold underline decoration-neutral-500">{selectedTemplate.name}</span>
              </span>
              <Badge variant="neutral" size="sm">
                {selectedTemplate.tags.length} Suggested Tags
              </Badge>
            </div>
            <p className="text-[11px] text-neutral-400 leading-normal">
              {selectedTemplate.description}
            </p>
          </motion.div>
        )}

        {/* Inputs Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <FormField label="Kit Name" required labelId="label-kit-name" htmlFor="input-kit-name">
            <TextInput
              id="input-kit-name"
              type="text"
              value={newKitName}
              onChange={(e) => {
                setNewKitName(e.target.value);
                if (selectedTemplate && e.target.value !== selectedTemplate.name) {
                  setSelectedTemplate(null);
                }
              }}
              placeholder="e.g. Vintage Synth, Sci-Fi Lasers, UI Clicks, Fantasy Spells"
              autoFocus
            />
          </FormField>

          <FormField label="Description (Optional)" labelId="label-kit-description" htmlFor="input-kit-description">
            <TextArea
              id="input-kit-description"
              rows={2}
              value={newKitDescription}
              onChange={(e) => setNewKitDescription(e.target.value)}
              placeholder="Short summary of sounds included in this kit..."
            />
          </FormField>

          {librarySoundsCount > 0 && selectedTemplate && (
            <label className="flex items-center gap-2.5 p-2.5 rounded-xl bg-neutral-950/60 border border-white/[0.04] cursor-pointer text-xs text-neutral-300 select-none hover:bg-neutral-950">
              <input
                id="checkbox-auto-assign-matching"
                type="checkbox"
                checked={autoAssignMatching}
                onChange={(e) => setAutoAssignMatching(e.target.checked)}
                className="w-4 h-4 rounded bg-neutral-900 border-white/20 text-white focus:ring-0 cursor-pointer accent-white"
              />
              <span>Auto-assign matching library sounds ({selectedTemplate.category})</span>
            </label>
          )}

          {/* Modal Buttons */}
          <div className="flex gap-3 mt-3">
            <Button
              id="create-kit-cancel-btn"
              variant="secondary"
              size="md"
              onClick={handleClose}
              fullWidth
            >
              Cancel
            </Button>
            <Button
              id="create-kit-submit-btn"
              type="submit"
              variant="primary"
              size="md"
              disabled={!newKitName.trim()}
              leftIcon={<FolderArchive className="w-3.5 h-3.5" />}
              fullWidth
            >
              {selectedTemplate ? `Create ${selectedTemplate.name}` : 'Create Kit'}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
});

