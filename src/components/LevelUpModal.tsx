/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { AbilityCard } from '../game/types';
import { Sparkles } from 'lucide-react';

interface LevelUpModalProps {
  choices: AbilityCard[];
  onSelect: (card: AbilityCard) => void;
}

export const LevelUpModal: React.FC<LevelUpModalProps> = ({ choices, onSelect }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700/90 rounded-2xl shadow-2xl p-6 text-slate-100 text-center">
        {/* Banner */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-950/60 border border-amber-500/70 text-amber-300 text-xs font-bold mb-2">
          <Sparkles className="w-3.5 h-3.5" /> 은하 전술 함선 레벨 업!
        </div>
        <h2 className="text-2xl sm:text-3xl font-black font-arcade text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-yellow-200 to-amber-500 drop-shadow-[0_0_15px_rgba(245,158,11,0.5)]">
          CHOOSE AN UPGRADE
        </h2>
        <p className="text-xs text-slate-400 mt-1 mb-6">
          원하는 전술 무장 또는 패시브 능력을 선택하여 기체 성능을 강화하세요.
        </p>

        {/* 3 Choices Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          {choices.map((card) => {
            const isNew = card.level === 0;

            const rarityBorder =
              card.rarity === 'legendary'
                ? 'border-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.35)]'
                : card.rarity === 'epic'
                ? 'border-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.35)]'
                : card.rarity === 'rare'
                ? 'border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.35)]'
                : 'border-slate-700';

            const rarityBadge =
              card.rarity === 'legendary'
                ? 'bg-amber-950 text-amber-300 border-amber-600'
                : card.rarity === 'epic'
                ? 'bg-purple-950 text-purple-300 border-purple-600'
                : card.rarity === 'rare'
                ? 'bg-cyan-950 text-cyan-300 border-cyan-600'
                : 'bg-slate-800 text-slate-400 border-slate-700';

            return (
              <button
                key={card.id}
                onClick={() => onSelect(card)}
                className={`relative p-4 rounded-xl bg-slate-950/80 border-2 ${rarityBorder} hover:scale-105 active:scale-95 transition-all text-left flex flex-col justify-between group cursor-pointer`}
              >
                <div>
                  {/* Top Badge & Level */}
                  <div className="flex items-center justify-between mb-3">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${rarityBadge}`}>
                      {card.rarity}
                    </span>
                    <span className="text-xs font-mono-numbers font-bold text-amber-400">
                      {isNew ? '신규 획득' : `Lv.${card.level} → Lv.${card.level + 1}`}
                    </span>
                  </div>

                  {/* Icon & Title */}
                  <div className="text-3xl mb-2.5 p-2 bg-slate-900 rounded-lg w-fit group-hover:scale-110 transition-transform">
                    {card.icon}
                  </div>
                  <h3 className="text-sm font-bold text-white group-hover:text-cyan-300 transition-colors">
                    {card.title}
                  </h3>
                  <div className="text-[10px] text-slate-500 font-mono">{card.titleEn}</div>

                  <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                    {card.description}
                  </p>
                </div>

                <div className="mt-4 pt-2.5 border-t border-slate-800/80 text-[11px] font-bold text-cyan-400 flex items-center justify-between">
                  <span>장착 선택</span>
                  <span className="group-hover:translate-x-1 transition-transform">➔</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
