import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';
import { cn } from '../../lib/utils';

export type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  description?: React.ReactNode;
  icon?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  headerExtra?: React.ReactNode;
  size?: ModalSize;
  hideCloseButton?: boolean;
  closeOnOverlayClick?: boolean;
  closeOnEsc?: boolean;
  className?: string;
  overlayClassName?: string;
  id?: string;
  overlayId?: string;
  closeButtonId?: string;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  icon,
  children,
  footer,
  headerExtra,
  size = 'md',
  hideCloseButton = false,
  closeOnOverlayClick = true,
  closeOnEsc = true,
  className,
  overlayClassName,
  id,
  overlayId,
  closeButtonId,
}) => {
  // Handle escape key
  useEffect(() => {
    if (!isOpen || !closeOnEsc) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [isOpen, closeOnEsc, onClose]);

  const sizeStyles: Record<ModalSize, string> = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl",
    '2xl': "max-w-2xl",
    '3xl': "max-w-3xl"
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          id={overlayId}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          onClick={(e) => {
            if (closeOnOverlayClick && e.target === e.currentTarget) {
              onClose();
            }
          }}
          className={cn(
            "fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-md overflow-y-auto",
            overlayClassName
          )}
        >
          <motion.div
            id={id}
            initial={{ scale: 0.95, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 10 }}
            transition={{ type: 'spring', stiffness: 350, damping: 26 }}
            className={cn(
              "bg-neutral-900 border border-white/[0.08] p-5 sm:p-6 rounded-2xl w-full shadow-2xl flex flex-col gap-4 my-auto relative text-neutral-200",
              sizeStyles[size],
              className
            )}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            {/* Header (rendered if title or icon provided or close button present) */}
            {(title || icon || !hideCloseButton || headerExtra) && (
              <div className="flex items-start justify-between gap-3 pb-3 border-b border-white/[0.06] shrink-0">
                <div className="flex items-center gap-2.5 min-w-0">
                  {icon && (
                    <div className="shrink-0 text-neutral-300">
                      {icon}
                    </div>
                  )}
                  <div className="flex flex-col min-w-0">
                    {typeof title === 'string' ? (
                      <h2 className="text-sm sm:text-base font-bold text-white tracking-tight truncate leading-tight">
                        {title}
                      </h2>
                    ) : (
                      title
                    )}
                    {description && (
                      typeof description === 'string' ? (
                        <p className="text-[11px] sm:text-xs text-neutral-400 leading-relaxed mt-0.5">
                          {description}
                        </p>
                      ) : (
                        description
                      )
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {headerExtra}
                  {!hideCloseButton && (
                    <button
                      id={closeButtonId}
                      onClick={onClose}
                      type="button"
                      className="w-7 h-7 rounded-full bg-white/[0.04] hover:bg-white/[0.1] text-neutral-400 hover:text-white flex items-center justify-center transition-colors shrink-0 cursor-pointer select-none"
                      title="Close modal"
                      aria-label="Close modal"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Modal Body */}
            <div className="flex-1 flex flex-col min-h-0">
              {children}
            </div>

            {/* Modal Footer */}
            {footer && (
              <div className="shrink-0 pt-2 border-t border-white/[0.04] flex items-center justify-end gap-3">
                {footer}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
