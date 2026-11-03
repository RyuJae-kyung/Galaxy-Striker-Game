/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { RotateCcw, Wrench, Trophy, Award, Flame, Target } from 'lucide-react';
import { ShipId, GameMode } from '../game/types';
import { SHIP_CONFIGS } from '../game/constants';

interface GameOverModalProps {
  score: number;
  scrapEarned: number;
  accuracy: number;
  maxCombo: number;
  stage: number;
  shipId: ShipId;
  mode: GameMode;
  isNewHighScore: boolean;
  onRestart: () => void;
  onOpenHangar: () => void;
  onSubmitScore: (name: string) => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  score,
  scrapEarned,
  accuracy,
  maxCombo,
  stage,
  shipId,
  mode,
  isNewHighScore,
  onRestart,
  onOpenHangar,
  onSubmitScore,
}) => {
  const [initials, setInitials] = useState('ACE');
  const [submitted, setSubmitted] = useState(false);
  const ship = SHIP_CONFIGS[shipId] || SHIP_CONFIGS.alpha_viper;

  useEffect(() => {
    if (isNewHighScore) {
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch {
        // Confetti fallback
      }
    }
  }, [isNewHighScore]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!submitted) {
      onSubmitScore(initials.trim().toUpperCase() || 'PILOT');
      setSubmitted(true);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-6 text-slate-100 text-center">
        {/* Banner */}
        <div className="font-arcade text-2xl sm:text-3xl font-black text-rose-500 tracking-wider arcade-glow mb-1">
          GAME OVER
        </div>
        <p className="text-xs text-slate-400">전투기가 피격되었습니다. 임무 기록 정산</p>

        {isNewHighScore && (
          <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 bg-amber-950/70 border border-amber-500/70 rounded-full text-xs font-bold text-amber-400 animate-pulse">
            <Trophy className="w-3.5 h-3.5" /> NEW HIGH SCORE!
          </div>
        )}

        {/* Primary Score Board */}
        <div className="my-5 p-4 bg-slate-950/80 border border-slate-800 rounded-xl">
          <div className="text-[10px] text-slate-400 font-semibold tracking-wider">최종 득점 (FINAL SCORE)</div>
          <div className="text-3xl sm:text-4xl font-black font-mono-numbers text-cyan-400 mt-1">
            {score.toLocaleString()}
          </div>
        </div>

        {/* Flight Stats Grid */}
        <div className="grid grid-cols-2 gap-2 text-left mb-5 text-xs">
          <div className="p-2.5 bg-slate-950/60 border border-slate-800/80 rounded-lg flex items-center gap-2">
            <Target className="w-4 h-4 text-emerald-400" />
            <div>
              <div className="text-[10px] text-slate-400">사격 명중률</div>
              <div className="font-mono-numbers font-bold text-slate-200">{accuracy}%</div>
            </div>
          </div>

          <div className="p-2.5 bg-slate-950/60 border border-slate-800/80 rounded-lg flex items-center gap-2">
            <Flame className="w-4 h-4 text-amber-400" />
            <div>
              <div className="text-[10px] text-slate-400">최대 연계 콤보</div>
              <div className="font-mono-numbers font-bold text-slate-200">{maxCombo}x</div>
            </div>
          </div>

          <div className="p-2.5 bg-slate-950/60 border border-slate-800/80 rounded-lg flex items-center gap-2">
            <Award className="w-4 h-4 text-purple-400" />
            <div>
              <div className="text-[10px] text-slate-400">도달 스테이지</div>
              <div className="font-mono-numbers font-bold text-slate-200">STAGE {stage}</div>
            </div>
          </div>

          <div className="p-2.5 bg-slate-950/60 border border-slate-800/80 rounded-lg flex items-center gap-2">
            <span className="text-sm">💎</span>
            <div>
              <div className="text-[10px] text-slate-400">획득 크리스털</div>
              <div className="font-mono-numbers font-bold text-emerald-400">+{scrapEarned}</div>
            </div>
          </div>
        </div>

        {/* Initials Entry for Leaderboard */}
        {!submitted ? (
          <form onSubmit={handleSubmit} className="mb-5 p-3 bg-slate-950/50 border border-slate-800 rounded-xl">
            <div className="text-xs text-slate-300 font-semibold mb-2">
              명예의 전당 등록 (파일럿 콜사인 3글자)
            </div>
            <div className="flex justify-center items-center gap-2">
              <input
                type="text"
                maxLength={4}
                value={initials}
                onChange={(e) => setInitials(e.target.value.toUpperCase())}
                className="w-24 px-3 py-1.5 bg-slate-900 border border-cyan-500 rounded-lg text-center font-arcade text-sm font-bold text-cyan-300 tracking-widest focus:outline-none uppercase"
              />
              <button
                type="submit"
                className="px-3 py-1.5 bg-cyan-700 hover:bg-cyan-600 text-white font-bold text-xs rounded-lg transition-colors"
              >
                기록 등록
              </button>
            </div>
          </form>
        ) : (
          <div className="mb-5 text-xs text-emerald-400 font-semibold">
            ✓ 파일럿 랭킹에 성공적으로 등록되었습니다!
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenHangar}
            className="flex-1 flex items-center justify-center gap-1.5 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl transition-colors border border-slate-700"
          >
            <Wrench className="w-4 h-4 text-cyan-400" />
            격납고 & 강화
          </button>

          <button
            onClick={onRestart}
            className="flex-1 flex items-center justify-center gap-1.5 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs rounded-xl transition-all shadow-lg active:scale-95"
          >
            <RotateCcw className="w-4 h-4" />
            다시 출격
          </button>
        </div>
      </div>
    </div>
  );
};
