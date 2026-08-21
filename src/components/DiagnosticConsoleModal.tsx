import React from 'react';
import { Terminal } from 'lucide-react';
import { SoundAsset } from '../types';
import { Modal, Badge, Button } from './common';

interface DiagnosticConsoleModalProps {
  asset: SoundAsset | null;
  onClose: () => void;
}

export function DiagnosticConsoleModal({ asset, onClose }: DiagnosticConsoleModalProps) {
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
      footer={
        <div className="flex items-center justify-between w-full">
          <span className="text-[10px] text-neutral-500 font-mono">
            ASSET ID: {asset.id}
          </span>
          <Button
            variant="primary"
            size="sm"
            onClick={onClose}
          >
            Close Telemetry Log
          </Button>
        </div>
      }
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
            <span className="text-[9px] font-semibold text-neutral-500 uppercase tracking-wider">Original Buffer</span>
            <span className="text-[11px] font-bold text-neutral-300 font-mono mt-1">
              {asset.diagnostics?.originalSize ? `${(asset.diagnostics.originalSize / 1024).toFixed(1)} KB` : 'N/A'}
            </span>
          </div>

          <div className="p-3 bg-white/[0.01] border border-white/[0.04] rounded-xl flex flex-col">
            <span className="text-[9px] font-semibold text-neutral-500 uppercase tracking-wider">Processed Output</span>
            <span className="text-[11px] font-bold text-white font-mono mt-1">
              {asset.diagnostics?.processedSize ? `${(asset.diagnostics.processedSize / 1024).toFixed(1)} KB` : 'N/A'}
            </span>
          </div>
        </div>

        {/* Console Log Terminal Window */}
        <div className="flex-1 bg-black/60 border border-white/[0.06] rounded-xl p-4 flex flex-col overflow-hidden font-mono text-[11px] leading-relaxed">
          <div className="flex items-center justify-between border-b border-white/[0.04] pb-2 mb-2 text-neutral-500 text-[10px] font-semibold uppercase tracking-wider shrink-0">
            <span>Telemetry Output Logs</span>
            <span className="text-[9px] text-neutral-600">FFMPEG & SYNTHESIS PIPELINE</span>
          </div>
          
          <div className="flex-1 overflow-y-auto scrollbar-thin text-neutral-300 flex flex-col gap-1 pr-1 font-mono">
            {asset.diagnostics?.logs && asset.diagnostics.logs.length > 0 ? (
              asset.diagnostics.logs.map((log, idx) => {
                let logClass = "text-neutral-300";
                if (log.includes('Error') || log.includes('Failed') || log.includes('[!]')) logClass = "text-rose-400 font-semibold";
                else if (log.includes('Complete') || log.includes('Success') || log.includes('Delivered')) logClass = "text-emerald-400 font-semibold";
                else if (log.includes('Init') || log.includes('Config')) logClass = "text-sky-400";
                else if (log.includes('DSP:')) logClass = "text-amber-300";

                return (
                  <div key={idx} className={`${logClass} whitespace-pre-wrap`}>
                    {log}
                  </div>
                );
              })
            ) : (
              <div className="text-neutral-600 italic">No telemetry logs available for this asset.</div>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
}

