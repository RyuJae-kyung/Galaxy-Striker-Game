/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Achievement } from '../game/types';
import { Award, CheckCircle2, Lock, X } from 'lucide-react';

interface AchievementsModalProps {
  achievements: Achievement[];
  onClose: () => void;
}

export const AchievementsModal: React.FC<AchievementsModalProps> = ({ achievements, onClose }) => {
  const completedCount = achievements.filter((a) => a.unlocked).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl p-5 sm:p-6 text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-950/70 border border-purple-700/70 text-purple-400">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                업적 훈장 (ACHIEVEMENTS)
              </h2>
              <p className="text-xs text-slate-400">
                달성률: {completedCount} / {achievements.length}
              </p>
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
        <div className="mt-4 space-y-2.5 max-h-[60vh] overflow-y-auto pr-1">
          {achievements.map((item) => (
            <div
              key={item.id}
              className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                item.unlocked
                  ? 'bg-purple-950/30 border-purple-500/50 shadow-[0_0_10px_rgba(168,85,247,0.15)]'
                  : 'bg-slate-950/60 border-slate-800/80 opacity-70'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="text-2xl p-1 bg-slate-800/80 rounded-lg">{item.icon}</div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-white">{item.title}</span>
                    {item.unlocked && (
                      <span className="flex items-center gap-0.5 text-[10px] font-bold text-purple-400">
                        <CheckCircle2 className="w-3 h-3" /> 완료
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </div>

              <div className="shrink-0 text-right ml-2">
                <span className="text-xs font-mono-numbers font-bold text-emerald-400 flex items-center gap-1">
                  💎 +{item.rewardScrap}
                </span>
                {!item.unlocked && <Lock className="w-3.5 h-3.5 text-slate-500 ml-auto mt-1" />}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-5 pt-3 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs rounded-xl transition-colors"
          >
            확인
          </button>
        </div>
      </div>
    </div>
  );
};
