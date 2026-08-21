import React, { InputHTMLAttributes, TextareaHTMLAttributes, SelectHTMLAttributes } from 'react';
import { ChevronDown, X } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface FormFieldProps {
  label?: string;
  labelId?: string;
  htmlFor?: string;
  required?: boolean;
  hint?: string;
  error?: string;
  className?: string;
  children: React.ReactNode;
}

export const FormField: React.FC<FormFieldProps> = ({
  label,
  labelId,
  htmlFor,
  required = false,
  hint,
  error,
  className,
  children
}) => {
  return (
    <div className={cn("flex flex-col gap-1 w-full", className)}>
      {label && (
        <div className="flex items-center justify-between">
          <label
            id={labelId}
            htmlFor={htmlFor}
            className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider select-none"
          >
            {label} {required && <span className="text-rose-400">*</span>}
          </label>
          {hint && <span className="text-[10px] text-neutral-500 font-medium">{hint}</span>}
        </div>
      )}
      {children}
      {error && <span className="text-[10px] text-rose-400 mt-0.5">{error}</span>}
    </div>
  );
};

export interface TextInputProps extends InputHTMLAttributes<HTMLInputElement> {
  onClear?: () => void;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const TextInput = React.forwardRef<HTMLInputElement, TextInputProps>(({
  className,
  value,
  onClear,
  leftIcon,
  rightIcon,
  ...props
}, ref) => {
  const hasValue = value !== undefined && value !== null && String(value).length > 0;

  return (
    <div className="relative flex items-center w-full">
      {leftIcon && (
        <span className="absolute left-3.5 flex items-center pointer-events-none text-neutral-500 shrink-0">
          {leftIcon}
        </span>
      )}
      <input
        ref={ref}
        value={value}
        className={cn(
          "w-full px-3.5 py-2.5 bg-neutral-950 border border-white/[0.08] rounded-xl text-xs text-white placeholder-neutral-500 outline-none focus:border-white/30 focus:ring-1 focus:ring-white/20 transition-all min-h-[40px]",
          leftIcon && "pl-9",
          (rightIcon || (onClear && hasValue)) && "pr-9",
          className
        )}
        {...props}
      />
      {onClear && hasValue ? (
        <button
          type="button"
          onClick={onClear}
          className="absolute right-3 flex items-center text-neutral-500 hover:text-white transition-colors cursor-pointer p-0.5"
          title="Clear"
          aria-label="Clear input"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      ) : rightIcon ? (
        <span className="absolute right-3.5 flex items-center pointer-events-none text-neutral-500 shrink-0">
          {rightIcon}
        </span>
      ) : null}
    </div>
  );
});

TextInput.displayName = 'TextInput';

export interface SelectFieldProps extends SelectHTMLAttributes<HTMLSelectElement> {
  leftIcon?: React.ReactNode;
}

export const SelectField = React.forwardRef<HTMLSelectElement, SelectFieldProps>(({
  className,
  children,
  leftIcon,
  ...props
}, ref) => {
  return (
    <div className="relative flex items-center w-full">
      {leftIcon && (
        <span className="absolute left-3.5 flex items-center pointer-events-none text-neutral-500 shrink-0">
          {leftIcon}
        </span>
      )}
      <select
        ref={ref}
        className={cn(
          "w-full bg-neutral-950 border border-white/[0.08] rounded-xl px-3.5 py-2.5 text-xs text-white outline-none cursor-pointer appearance-none transition-all focus:border-white/30 focus:ring-1 focus:ring-white/20 pr-9 min-h-[40px]",
          leftIcon && "pl-9",
          className
        )}
        {...props}
      >
        {children}
      </select>
      <span className="absolute right-3 flex items-center pointer-events-none text-neutral-500">
        <ChevronDown className="w-4 h-4" />
      </span>
    </div>
  );
});

SelectField.displayName = 'SelectField';

export interface TextAreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  onClear?: () => void;
}

export const TextArea = React.forwardRef<HTMLTextAreaElement, TextAreaProps>(({
  className,
  value,
  onClear,
  ...props
}, ref) => {
  const hasValue = value !== undefined && value !== null && String(value).length > 0;

  return (
    <div className="relative w-full">
      <textarea
        ref={ref}
        value={value}
        className={cn(
          "w-full px-3.5 py-2.5 bg-neutral-950 border border-white/[0.08] rounded-xl text-xs text-white placeholder-neutral-500 outline-none focus:border-white/30 focus:ring-1 focus:ring-white/20 transition-all resize-none",
          className
        )}
        {...props}
      />
      {onClear && hasValue && (
        <button
          type="button"
          onClick={onClear}
          className="absolute right-3 top-3 text-[10px] text-neutral-500 hover:text-neutral-300 font-mono transition-colors rounded px-1 cursor-pointer"
          title="Clear"
          aria-label="Clear text"
        >
          Clear
        </button>
      )}
    </div>
  );
});

TextArea.displayName = 'TextArea';
