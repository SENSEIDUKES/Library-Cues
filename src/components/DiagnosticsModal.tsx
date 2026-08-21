import React from 'react';
import { Terminal, Info, Copy } from 'lucide-react';
import { SoundAsset } from '../types';
import { Modal, Badge, Button } from './common';

export interface DiagnosticsModalProps {
  asset: SoundAsset | null;
  onClose: () => void;
}

export const DiagnosticsModal: React.FC<DiagnosticsModalProps> = React.memo(({
  asset,
  onClose,
}) => {
  if (!asset) return null;

  const isSuccess = asset.diagnostics?.success !== false;

  return (
    <Modal
      isOpen={Boolean(asset)}
      onClose={onClose}
      size="2xl"
      title="Active DSP Diagnostics"
      description={
        <span className="text-sm font-bold text-white mt-0.5 truncate block max-w-sm sm:max-w-md">
          {asset.name}
        </span>
      }
      icon={
        <div className="w-7 h-7 rounded-lg bg-neutral-900 border border-white/5 flex items-center justify-center text-neutral-400">
          <Terminal className="w-4 h-4 text-neutral-300" />
        </div>
      }
      className="h-[520px] bg-neutral-950 flex flex-col overflow-hidden"
    >
      <div className="flex-1 flex flex-col min-h-0">
        {/* Stats Overview Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4 shrink-0">
          <div className="p-3 bg-white/[0.01] border border-white/[0.04] rounded-xl flex flex-col">
            <span className="text-[9px] font-semibold text-neutral-500 uppercase tracking-wider">Engine Running</span>
            <span className="text-[11px] font-bold text-neutral-300 mt-1 truncate" title={asset.diagnostics?.engine}>
              {asset.diagnostics?.engine || 'DSP Engine'}
            </span>
          </div>
          
          <div className="p-3 bg-white/[0.01] border border-white/[0.04] rounded-xl flex flex-col">
            <span className="text-[9px] font-semibold text-neutral-500 uppercase tracking-wider">Status</span>
            <div className="mt-1">
              <Badge
                variant={isSuccess ? 'success' : 'danger'}
                size="sm"
                dot
              >
                {isSuccess ? 'PROCESSED' : 'FALLBACK'}
              </Badge>
            </div>
          </div>

          <div className="p-3 bg-white/[0.01] border border-white/[0.04] rounded-xl flex flex-col">
            <span className="text-[9px] font-semibold text-neutral-500 uppercase tracking-wider">Original Size</span>
            <span className="text-[11px] font-mono font-bold text-neutral-300 mt-1">
              {asset.diagnostics?.originalSize 
                ? `${(asset.diagnostics.originalSize / 1024).toFixed(1)} KB` 
                : `${(asset.audioBase64 ? (asset.audioBase64.length * 0.75 / 1024).toFixed(1) : '0')} KB`}
            </span>
          </div>

          <div className="p-3 bg-white/[0.01] border border-white/[0.04] rounded-xl flex flex-col">
            <span className="text-[9px] font-semibold text-neutral-500 uppercase tracking-wider">Processed Size</span>
            <span className="text-[11px] font-mono font-bold text-neutral-300 mt-1">
              {asset.diagnostics?.processedSize 
                ? `${(asset.diagnostics.processedSize / 1024).toFixed(1)} KB` 
                : `${(asset.audioBase64 ? (asset.audioBase64.length * 0.75 / 1024).toFixed(1) : '0')} KB`}
            </span>
          </div>
        </div>

        {/* Buffer delivery status banner */}
        <div className={`p-3 rounded-xl border mb-4 text-[11px] leading-relaxed flex items-center gap-2 shrink-0 ${
          isSuccess 
            ? 'bg-emerald-950/20 border-emerald-900/30 text-emerald-300' 
            : 'bg-amber-950/20 border-amber-900/30 text-amber-300'
        }`}>
          <Info className="w-4 h-4 shrink-0" />
          <span>
            {isSuccess 
              ? 'Confirm: Processed audio buffer successfully returned and cached by local state engine.' 
              : 'System Alert: Subprocess compilation warning. Automatically fell back to original generated audio.'
            }
          </span>
        </div>

        {/* Scrollable logs area */}
        <div className="bg-black/40 border border-white/[0.03] rounded-xl p-3 flex-1 flex flex-col overflow-hidden relative">
          <div className="flex items-center justify-between mb-2 shrink-0">
            <span className="text-[10px] font-bold text-neutral-500 tracking-wider uppercase font-mono">Console Telemetry Log</span>
            <Button
              variant="subtle"
              size="xs"
              onClick={() => {
                const logsTxt = asset.diagnostics?.logs?.join('\n') || '';
                navigator.clipboard.writeText(logsTxt);
              }}
              leftIcon={<Copy className="w-3 h-3" />}
              className="text-[9px]"
            >
              Copy Console Output
            </Button>
          </div>
          
          <div className="flex-1 overflow-y-auto font-mono text-[10px] text-neutral-400 leading-relaxed select-text pr-1 pb-2 flex flex-col gap-1.5 scrollbar-thin">
            {asset.diagnostics?.logs && asset.diagnostics.logs.length > 0 ? (
              asset.diagnostics.logs.map((log, index) => {
                let colorClass = 'text-neutral-400';
                if (log.includes('Error:')) colorClass = 'text-rose-400 font-medium';
                else if (log.includes('DSP:')) colorClass = 'text-sky-300 font-medium';
                else if (log.includes('FFmpeg:')) colorClass = 'text-violet-300';
                else if (log.includes('Cache:')) colorClass = 'text-amber-300';
                else if (log.includes('API:')) colorClass = 'text-fuchsia-300';
                else if (log.includes('Complete:')) colorClass = 'text-emerald-400 font-bold';
                
                return (
                  <div key={index} className={`${colorClass} whitespace-pre-wrap font-mono break-all`}>
                    {log}
                  </div>
                );
              })
            ) : (
              <div className="text-neutral-600 italic font-sans text-xs p-2">No telemetry diagnostic output logged for this asset.</div>
            )}
          </div>
        </div>

        {/* Action buttons */}
        <div className="mt-4 shrink-0">
          <Button
            variant="subtle"
            size="md"
            onClick={onClose}
            fullWidth
          >
            Dismiss Console
          </Button>
        </div>
      </div>
    </Modal>
  );
});

