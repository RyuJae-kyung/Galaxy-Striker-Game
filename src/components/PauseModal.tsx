/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Play, RotateCcw, Wrench, Home, HelpCircle, Volume2, VolumeX } from 'lucide-react';

interface PauseModalProps {
  onResume: () => void;
  onRestart: () => void;
  onOpenHangar: () => void;
  onOpenHowToPlay: () => void;
  onReturnToMenu: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
}

export const PauseModal: React.FC<PauseModalProps> = ({
  onResume,
  onRestart,
  onOpenHangar,
  onOpenHowToPlay,
  onReturnToMenu,
  isMuted,
  onToggleMute,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
      <div className="relative w-full max-w-sm bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-6 text-slate-100 text-center space-y-4">
        <div className="font-arcade text-xl font-bold text-amber-400 tracking-wider">
          PAUSED
        </div>
        <p className="text-xs text-slate-400">전술 비행이 일시 중단되었습니다.</p>

        <div className="space-y-2 pt-2">
          <button
            onClick={onResume}
            className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs rounded-xl transition-all shadow-md active:scale-95"
          >
            <Play className="w-4 h-4 fill-current" />
            계속 비행 (Resume)
          </button>

          <button
            onClick={onRestart}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs rounded-xl transition-colors border border-slate-700"
          >
            <RotateCcw className="w-4 h-4 text-cyan-400" />
            스테이지 재도전
          </button>

          <button
            onClick={onOpenHangar}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs rounded-xl transition-colors border border-slate-700"
          >
            <Wrench className="w-4 h-4 text-emerald-400" />
            격납고 & 기체 강화
          </button>

          <button
            onClick={onOpenHowToPlay}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs rounded-xl transition-colors border border-slate-700"
          >
            <HelpCircle className="w-4 h-4 text-blue-400" />
            조작법 가이드
          </button>

          <button
            onClick={onToggleMute}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs rounded-xl transition-colors border border-slate-700"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-cyan-400" />}
            사운드 {isMuted ? '켜기' : '끄기'}
          </button>

          <button
            onClick={onReturnToMenu}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white font-medium text-xs rounded-xl transition-colors"
          >
            <Home className="w-4 h-4" />
            메인 타이틀로 복귀
          </button>
        </div>
      </div>
    </div>
  );
};
