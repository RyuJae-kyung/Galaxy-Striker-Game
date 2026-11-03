/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Volume2, VolumeX, Music, Music2, Pause, Bomb, Zap, Shield, Flame, Star } from 'lucide-react';
import { GameMode } from '../game/types';

interface GameHudProps {
  mode: GameMode;
  score: number;
  highScore: number;
  scrap: number;
  hp: number;
  maxHp: number;
  boost?: number;
  bombs: number;
  maxBombs: number;
  level?: number;
  xp?: number;
  nextXp?: number;
  stage: number;
  wave: number;
  combo: number;
  isBoss: boolean;
  isChallenging: boolean;
  isMuted: boolean;
  isBgmMuted: boolean;
  onToggleMute: () => void;
  onToggleBgmMute: () => void;
  onPause: () => void;
  onTriggerBomb: () => void;
}

export const GameHud: React.FC<GameHudProps> = ({
  mode,
  score,
  highScore,
  scrap,
  hp,
  maxHp,
  boost = 100,
  bombs,
  maxBombs,
  level = 1,
  xp = 0,
  nextXp = 100,
  stage,
  combo,
  isBoss,
  isChallenging,
  isMuted,
  isBgmMuted,
  onToggleMute,
  onToggleBgmMute,
  onPause,
  onTriggerBomb,
}) => {
  const hpPercent = Math.max(0, Math.min(100, Math.round((hp / maxHp) * 100)));
  const xpPercent = Math.max(0, Math.min(100, Math.round((xp / nextXp) * 100)));

  return (
    <div className="absolute top-0 left-0 right-0 z-30 p-2 sm:p-4 pointer-events-none select-none">
      {/* Top Bar Status Row */}
      <div className="flex items-center justify-between gap-2 max-w-2xl mx-auto bg-slate-900/85 backdrop-blur-md border border-slate-800/80 rounded-xl px-3 py-2 text-xs shadow-lg">
        {/* Score & High Score */}
        <div className="flex items-center gap-4">
          <div>
            <div className="text-[10px] text-slate-400 font-semibold tracking-wider">SCORE</div>
            <div className="text-sm sm:text-base font-bold font-mono-numbers text-cyan-400">
              {score.toLocaleString()}
            </div>
          </div>
          <div className="hidden sm:block border-l border-slate-700/60 pl-4">
            <div className="text-[10px] text-slate-400 font-semibold tracking-wider">HIGH SCORE</div>
            <div className="text-sm sm:text-base font-bold font-mono-numbers text-amber-400">
              {Math.max(score, highScore).toLocaleString()}
            </div>
          </div>
        </div>

        {/* Center: Level (360) or Stage (Classic) */}
        <div className="text-center">
          {mode === 'survivor_360' ? (
            <div>
              <div className="text-[10px] text-amber-400 font-semibold flex items-center justify-center gap-1">
                <Star className="w-3 h-3 fill-current" /> LEVEL
              </div>
              <div className="font-arcade text-amber-400 text-xs sm:text-sm font-bold">
                {level}
              </div>
            </div>
          ) : (
            <div>
              <div className="text-[10px] text-slate-400 font-semibold">STAGE</div>
              <div className="flex items-center justify-center gap-1 font-bold text-sm">
                <span className="font-arcade text-amber-400 text-xs sm:text-sm">{stage}</span>
                {isBoss && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-950/80 text-rose-300 border border-rose-700/60 font-semibold animate-pulse">
                    BOSS
                  </span>
                )}
                {isChallenging && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-sky-950/80 text-sky-300 border border-sky-700/60 font-semibold">
                    BONUS
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Currency & Control Buttons */}
        <div className="flex items-center gap-2 pointer-events-auto">
          {/* Scrap Currency */}
          <div className="flex items-center gap-1 bg-emerald-950/60 border border-emerald-800/50 rounded-lg px-2 py-1">
            <span className="text-emerald-400 text-xs">💎</span>
            <span className="font-mono-numbers text-emerald-300 font-bold text-xs">
              {scrap.toLocaleString()}
            </span>
          </div>

          {/* Sound Controls */}
          <button
            onClick={onToggleMute}
            aria-label="SFX 음소거 전환"
            className="p-1.5 rounded-lg bg-slate-800/80 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-cyan-400" />}
          </button>
          <button
            onClick={onToggleBgmMute}
            aria-label="BGM 음소거 전환"
            className="p-1.5 rounded-lg bg-slate-800/80 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
          >
            {isBgmMuted ? <Music2 className="w-4 h-4 text-slate-500" /> : <Music className="w-4 h-4 text-amber-400" />}
          </button>
          <button
            onClick={onPause}
            aria-label="일시 정지"
            className="p-1.5 rounded-lg bg-slate-800/80 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
          >
            <Pause className="w-4 h-4 text-slate-200" />
          </button>
        </div>
      </div>

      {/* 360 Mode XP Bar */}
      {mode === 'survivor_360' && (
        <div className="max-w-2xl mx-auto mt-1.5 px-1">
          <div className="w-full bg-slate-900/90 border border-slate-800/80 h-2 rounded-full overflow-hidden p-0.5">
            <div
              className="h-full bg-gradient-to-r from-cyan-500 to-amber-400 rounded-full transition-all duration-150 shadow-[0_0_8px_rgba(245,158,11,0.6)]"
              style={{ width: `${xpPercent}%` }}
            />
          </div>
        </div>
      )}

      {/* Sub-HUD: HP Bar & Boost Gauge & Bombs */}
      <div className="flex items-center justify-between gap-3 max-w-2xl mx-auto mt-2 px-1">
        {/* Shield / HP Bar */}
        <div className="flex-1 max-w-xs bg-slate-900/80 backdrop-blur-sm border border-slate-800/80 rounded-lg p-1.5">
          <div className="flex justify-between items-center text-[10px] text-slate-300 mb-1 px-1">
            <span className="font-semibold flex items-center gap-1">
              <Shield className="w-3 h-3 text-cyan-400" /> 방어막 (HULL)
            </span>
            <span className="font-mono-numbers font-bold text-cyan-300">{hpPercent}%</span>
          </div>
          <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden p-0.5">
            <div
              className={`h-full rounded-full transition-all duration-200 ${
                hpPercent > 50
                  ? 'bg-gradient-to-r from-cyan-500 to-emerald-400 shadow-[0_0_8px_rgba(6,182,212,0.6)]'
                  : hpPercent > 25
                  ? 'bg-gradient-to-r from-amber-500 to-yellow-400'
                  : 'bg-gradient-to-r from-rose-600 to-rose-400 animate-pulse'
              }`}
              style={{ width: `${hpPercent}%` }}
            />
          </div>
        </div>

        {/* 360 Boost Energy Meter */}
        {mode === 'survivor_360' && (
          <div className="w-28 bg-slate-900/80 backdrop-blur-sm border border-slate-800/80 rounded-lg p-1.5 hidden sm:block">
            <div className="flex justify-between items-center text-[10px] text-slate-300 mb-1 px-1">
              <span className="font-semibold flex items-center gap-1">
                <Flame className="w-3 h-3 text-amber-400" /> 부스트
              </span>
              <span className="font-mono-numbers font-bold text-amber-300">{Math.round(boost)}%</span>
            </div>
            <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden p-0.5">
              <div
                className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-400 transition-all duration-100"
                style={{ width: `${boost}%` }}
              />
            </div>
          </div>
        )}

        {/* EMP Bombs Count */}
        <div className="flex items-center gap-1.5 bg-slate-900/80 backdrop-blur-sm border border-slate-800/80 rounded-lg px-2.5 py-1.5 pointer-events-auto">
          <span className="text-[10px] text-slate-400 font-semibold hidden sm:inline">EMP:</span>
          <div className="flex items-center gap-1">
            {Array.from({ length: maxBombs }).map((_, i) => (
              <button
                key={i}
                disabled={i >= bombs}
                onClick={onTriggerBomb}
                className={`p-1 rounded transition-transform ${
                  i < bombs
                    ? 'bg-rose-950/80 border border-rose-500 text-rose-400 hover:scale-110 active:scale-95 shadow-[0_0_6px_rgba(244,63,94,0.4)]'
                    : 'bg-slate-800/50 border border-slate-700/40 text-slate-600 cursor-not-allowed'
                }`}
                title="EMP 폭탄 발동 (B 또는 X 키)"
              >
                <Bomb className="w-3.5 h-3.5" />
              </button>
            ))}
          </div>
        </div>

        {/* Combo Tracker */}
        {combo >= 3 && (
          <div className="bg-amber-950/70 border border-amber-500/50 rounded-lg px-2.5 py-1 text-center animate-bounce">
            <div className="text-[9px] text-amber-300 font-bold uppercase tracking-wider">COMBO</div>
            <div className="text-sm font-black font-arcade text-amber-400">{combo}x</div>
          </div>
        )}
      </div>
    </div>
  );
};
