import React from 'react';
import { cn } from '../../lib/utils';
import { Button } from './Button';

export interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  actionIcon?: React.ReactNode;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  actionIcon,
  className
}) => {
  return (
    <div className={cn("flex flex-col items-center justify-center py-16 px-6 text-center w-full", className)}>
      <div className="w-14 h-14 rounded-2xl bg-neutral-900/60 border border-white/[0.04] flex items-center justify-center text-neutral-400 mb-4 shadow-inner">
        {icon}
      </div>
      <h3 className="text-sm font-semibold text-neutral-200 tracking-tight">{title}</h3>
      <p className="text-xs text-neutral-400 mt-1 max-w-xs leading-relaxed">
        {description}
      </p>
      {actionLabel && onAction && (
        <Button
          variant="secondary"
          size="sm"
          onClick={onAction}
          leftIcon={actionIcon}
          className="mt-5 rounded-full px-4"
        >
          {actionLabel}
        </Button>
      )}
    </div>
  );
};
