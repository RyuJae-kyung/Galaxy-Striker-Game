/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { LeaderboardEntry } from '../game/types';
import { Trophy, Medal, X, Crown } from 'lucide-react';
import { SHIP_CONFIGS } from '../game/constants';

interface LeaderboardModalProps {
  entries: LeaderboardEntry[];
  onClose: () => void;
}

export const LeaderboardModal: React.FC<LeaderboardModalProps> = ({ entries, onClose }) => {
  const sorted = [...entries].sort((a, b) => b.score - a.score);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl p-5 sm:p-6 text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-950/70 border border-amber-700/70 text-amber-400">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-1.5">
                명예의 전당 (HALL OF FAME)
              </h2>
              <p className="text-xs text-slate-400">은하계 최고 득점 에이스 파일럿 랭킹</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* List */}
        <div className="mt-4 space-y-2 max-h-[60vh] overflow-y-auto pr-1">
          {sorted.map((item, index) => {
            const ship = SHIP_CONFIGS[item.shipId] || SHIP_CONFIGS.alpha_viper;

            return (
              <div
                key={item.id}
                className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                  index === 0
                    ? 'bg-amber-950/30 border-amber-500/60 shadow-[0_0_12px_rgba(245,158,11,0.2)]'
                    : index === 1
                    ? 'bg-slate-800/80 border-slate-600'
                    : index === 2
                    ? 'bg-orange-950/30 border-orange-800/60'
                    : 'bg-slate-950/60 border-slate-800'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-7 text-center font-bold">
                    {index === 0 ? (
                      <Crown className="w-5 h-5 text-amber-400 mx-auto" />
                    ) : index === 1 ? (
                      <Medal className="w-5 h-5 text-slate-300 mx-auto" />
                    ) : index === 2 ? (
                      <Medal className="w-5 h-5 text-orange-400 mx-auto" />
                    ) : (
                      <span className="text-xs text-slate-500 font-mono-numbers">{index + 1}</span>
                    )}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-arcade text-sm font-bold text-white tracking-wider">
                        {item.name}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-medium">
                        {ship.name}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5">
                      도달 스테이지 {item.wave} · {item.date}
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-sm font-bold font-mono-numbers text-cyan-400">
                    {item.score.toLocaleString()}
                  </div>
                  <div className="text-[10px] text-slate-500 uppercase">{item.mode}</div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="mt-5 pt-3 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs rounded-xl transition-colors"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};
