/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Bomb, Flame, Crosshair } from 'lucide-react';

interface TouchControlsProps {
  onTriggerBomb: () => void;
  bombsAvailable: number;
  autoFire: boolean;
  onToggleAutoFire: () => void;
}

export const TouchControls: React.FC<TouchControlsProps> = ({
  onTriggerBomb,
  bombsAvailable,
  autoFire,
  onToggleAutoFire,
}) => {
  return (
    <div className="absolute bottom-4 left-4 right-4 z-20 flex items-center justify-between pointer-events-none select-none sm:hidden">
      {/* Auto-fire toggle button */}
      <button
        onClick={onToggleAutoFire}
        className={`pointer-events-auto flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold backdrop-blur-md border transition-all ${
          autoFire
            ? 'bg-cyan-950/80 border-cyan-500 text-cyan-300 shadow-[0_0_10px_rgba(6,182,212,0.3)]'
            : 'bg-slate-900/80 border-slate-700 text-slate-400'
        }`}
      >
        <Flame className={`w-4 h-4 ${autoFire ? 'text-cyan-400 animate-pulse' : 'text-slate-500'}`} />
        <span>자동사격 {autoFire ? 'ON' : 'OFF'}</span>
      </button>

      {/* Touch tip info */}
      <div className="text-[10px] text-slate-400/80 bg-slate-950/60 px-2 py-1 rounded-md border border-slate-800/60">
        화면을 드래그하여 기체 이동
      </div>

      {/* EMP Bomb Trigger Button */}
      <button
        onClick={onTriggerBomb}
        disabled={bombsAvailable <= 0}
        aria-label="EMP 폭탄 발동"
        className={`pointer-events-auto flex items-center justify-center w-14 h-14 rounded-full border-2 transition-transform active:scale-95 shadow-xl ${
          bombsAvailable > 0
            ? 'bg-rose-600/90 hover:bg-rose-500 border-rose-300 text-white shadow-[0_0_16px_rgba(244,63,94,0.6)] animate-pulse'
            : 'bg-slate-800/60 border-slate-700 text-slate-500 cursor-not-allowed'
        }`}
      >
        <div className="flex flex-col items-center">
          <Bomb className="w-5 h-5" />
          <span className="text-[9px] font-bold mt-0.5">EMP ({bombsAvailable})</span>
        </div>
      </button>
    </div>
  );
};
