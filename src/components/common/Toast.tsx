import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle, AlertTriangle, ArrowRight, Terminal, X } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Button } from './Button';

export interface DiagnosticToastProps {
  show: boolean;
  title: string;
  description: string;
  success: boolean;
  originalSize?: number;
  processedSize?: number;
  logs?: string[];
  onDismiss: () => void;
  onViewTelemetry?: () => void;
  className?: string;
}

export const DiagnosticToast: React.FC<DiagnosticToastProps> = ({
  show,
  title,
  description,
  success,
  originalSize,
  processedSize,
  logs = [],
  onDismiss,
  onViewTelemetry,
  className
}) => {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 380, damping: 28 }}
          className={cn(
            "fixed bottom-24 right-5 z-45 max-w-sm w-full bg-neutral-900/95 border border-white/10 rounded-2xl backdrop-blur-xl shadow-2xl shadow-black/80 p-4 flex flex-col gap-3 overflow-hidden text-neutral-200",
            className
          )}
          role="status"
          aria-live="polite"
        >
          {/* Visual accent bar */}
          <div className={cn("absolute top-0 left-0 right-0 h-0.5", success ? 'bg-emerald-500' : 'bg-rose-500')} />
          
          <div className="flex gap-3">
            <div className={cn(
              "w-8 h-8 rounded-full shrink-0 flex items-center justify-center",
              success ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
            )}>
              {success ? <CheckCircle className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
            </div>
            
            <div className="flex-1 min-w-0">
              <h4 className="text-xs font-bold text-white tracking-wide uppercase">{title}</h4>
              <p className="text-[11px] text-neutral-400 leading-relaxed mt-1">{description}</p>
              
              {/* File size optimization metrics */}
              {success && originalSize && processedSize && (
                <div className="mt-2 flex items-center gap-1.5 text-[10px] font-mono text-neutral-400">
                  <span>{(originalSize / 1024).toFixed(1)} KB</span>
                  <ArrowRight className="w-3 h-3 text-neutral-600" />
                  <span className="text-white font-medium">{(processedSize / 1024).toFixed(1)} KB</span>
                  {originalSize > processedSize && (
                    <span className="text-emerald-400 font-bold bg-emerald-500/10 px-1.5 py-0.5 rounded text-[9px]">
                      -{Math.round((1 - processedSize / originalSize) * 100)}%
                    </span>
                  )}
                </div>
              )}
            </div>

            <button
              onClick={onDismiss}
              type="button"
              className="w-5 h-5 flex items-center justify-center text-neutral-500 hover:text-white transition-colors cursor-pointer select-none"
              title="Dismiss notification"
              aria-label="Dismiss notification"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          
          {/* Action buttons inside Toast */}
          <div className="flex gap-2 justify-end border-t border-white/[0.04] pt-2.5 mt-0.5">
            <Button
              variant="ghost"
              size="xs"
              onClick={onDismiss}
              className="text-neutral-400 hover:text-white"
            >
              Dismiss
            </Button>

            {logs.length > 0 && onViewTelemetry && (
              <Button
                variant="outline"
                size="xs"
                onClick={onViewTelemetry}
                leftIcon={<Terminal className="w-3 h-3" />}
                className="bg-white/5 hover:bg-white/10 border-white/10 text-white rounded-full"
              >
                View Telemetry
              </Button>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
