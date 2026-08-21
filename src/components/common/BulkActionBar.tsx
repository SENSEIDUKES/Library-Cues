import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckSquare, Square } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface BulkActionBarProps {
  selectedCount: number;
  totalCount: number;
  isAllSelected: boolean;
  onToggleSelectAll: () => void;
  children?: React.ReactNode;
  className?: string;
  selectAllLabel?: string;
}

export const BulkActionBar: React.FC<BulkActionBarProps> = ({
  selectedCount,
  totalCount: _totalCount,
  isAllSelected,
  onToggleSelectAll,
  children,
  className,
  selectAllLabel = "Select All"
}) => {
  return (
    <div className={cn("flex items-center justify-between gap-3", className)}>
      <button
        type="button"
        onClick={onToggleSelectAll}
        className="flex items-center gap-1.5 text-[11px] font-bold text-neutral-400 hover:text-white transition-colors uppercase tracking-wider cursor-pointer select-none"
      >
        {isAllSelected ? (
          <CheckSquare className="w-4 h-4 text-white" />
        ) : (
          <Square className="w-4 h-4" />
        )}
        {selectAllLabel}
      </button>

      <AnimatePresence>
        {selectedCount > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="flex items-center gap-2 border-l border-white/10 pl-3 flex-wrap"
          >
            <span className="text-[10px] text-neutral-400 font-medium tracking-wide font-mono mr-1">
              {selectedCount} selected
            </span>
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
