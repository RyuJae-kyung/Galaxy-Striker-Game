/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ShipId, ShipConfig, PlayerUpgrades } from '../game/types';
import { SHIP_CONFIGS, INITIAL_UPGRADE_COSTS } from '../game/constants';
import { X, Check, Lock, Zap, Shield, Flame, Bomb, Rocket, Sparkles } from 'lucide-react';
import { sound } from '../game/sound';

interface HangarModalProps {
  currentShipId: ShipId;
  unlockedShips: Record<string, boolean>;
  scrap: number;
  upgrades: PlayerUpgrades;
  onSelectShip: (id: ShipId) => void;
  onUnlockShip: (id: ShipId, cost: number) => void;
  onUpgrade: (type: keyof PlayerUpgrades, cost: number) => void;
  onClose: () => void;
}

export const HangarModal: React.FC<HangarModalProps> = ({
  currentShipId,
  unlockedShips,
  scrap,
  upgrades,
  onSelectShip,
  onUnlockShip,
  onUpgrade,
  onClose,
}) => {
  const ships = Object.values(SHIP_CONFIGS);

  const getUpgradeCost = (type: keyof PlayerUpgrades): number | null => {
    const currentLevel = upgrades[type];
    if (type === 'droneLevel') {
      if (currentLevel >= 2) return null;
      return INITIAL_UPGRADE_COSTS.drone[currentLevel];
    }
    if (currentLevel >= 5) return null;
    if (type === 'fireRateLevel') return INITIAL_UPGRADE_COSTS.fireRate[currentLevel - 1];
    if (type === 'damageLevel') return INITIAL_UPGRADE_COSTS.damage[currentLevel - 1];
    if (type === 'maxShieldLevel') return INITIAL_UPGRADE_COSTS.maxShield[currentLevel - 1];
    if (type === 'bombStockLevel') return INITIAL_UPGRADE_COSTS.bombStock[currentLevel - 1];
    return null;
  };

  const handleUpgradeClick = (type: keyof PlayerUpgrades) => {
    const cost = getUpgradeCost(type);
    if (cost !== null && scrap >= cost) {
      sound.playPowerUp();
      onUpgrade(type, cost);
    }
  };

  const handleUnlockClick = (ship: ShipConfig) => {
    if (scrap >= ship.cost) {
      sound.playPowerUp();
      onUnlockShip(ship.id, ship.cost);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl p-4 sm:p-6 text-slate-100 my-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-950/60 border border-cyan-800 text-cyan-400">
              <Rocket className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold tracking-tight text-white flex items-center gap-2">
                격납고 & 함선 연구소
              </h2>
              <p className="text-xs text-slate-400">
                기체를 출격 편성하고 수집한 스크랩 크리스털로 전투력을 영구 강화하세요.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Currency counter */}
            <div className="flex items-center gap-1.5 bg-emerald-950/70 border border-emerald-700/70 px-3 py-1.5 rounded-xl">
              <span className="text-sm">💎</span>
              <span className="font-mono-numbers font-bold text-emerald-400 text-sm sm:text-base">
                {scrap.toLocaleString()}
              </span>
              <span className="text-[10px] text-emerald-500 font-semibold">보유 크리스털</span>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 2-Column Layout: Left Ship Selection, Right Tech Upgrades */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6">
          {/* Ship Selection Area (7 Cols) */}
          <div className="lg:col-span-7 space-y-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" /> 출격 함선 선택
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {ships.map((ship) => {
                const isSelected = currentShipId === ship.id;
                const isUnlocked = ship.cost === 0 || unlockedShips[ship.id];

                return (
                  <div
                    key={ship.id}
                    className={`relative p-3.5 rounded-xl border transition-all ${
                      isSelected
                        ? 'bg-slate-800/90 border-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.25)] ring-1 ring-cyan-500'
                        : isUnlocked
                        ? 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-800/50'
                        : 'bg-slate-950/60 border-slate-800/60 opacity-80'
                    }`}
                  >
                    {/* Top status */}
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-white">{ship.name}</span>
                      {isSelected ? (
                        <span className="flex items-center gap-1 text-[11px] font-bold text-cyan-400">
                          <Check className="w-3.5 h-3.5" /> 출격 중
                        </span>
                      ) : isUnlocked ? (
                        <button
                          onClick={() => onSelectShip(ship.id)}
                          className="px-2.5 py-1 text-xs font-semibold bg-cyan-900/60 hover:bg-cyan-800 text-cyan-200 border border-cyan-700 rounded-lg transition-colors"
                        >
                          선택
                        </button>
                      ) : (
                        <button
                          onClick={() => handleUnlockClick(ship)}
                          disabled={scrap < ship.cost}
                          className={`flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg border transition-all ${
                            scrap >= ship.cost
                              ? 'bg-emerald-950 border-emerald-500 text-emerald-300 hover:bg-emerald-900'
                              : 'bg-slate-800 border-slate-700 text-slate-500 cursor-not-allowed'
                          }`}
                        >
                          <Lock className="w-3 h-3" />
                          <span>💎 {ship.cost}</span>
                        </button>
                      )}
                    </div>

                    <div className="text-[11px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                      {ship.description}
                    </div>

                    {/* Ship Stats Preview */}
                    <div className="mt-3 pt-2.5 border-t border-slate-800/80 space-y-1.5 text-[11px]">
                      <div className="flex justify-between items-center text-slate-400">
                        <span>기동 속도</span>
                        <div className="w-24 bg-slate-800 h-1.5 rounded-full overflow-hidden">
                          <div
                            className="bg-cyan-400 h-full rounded-full"
                            style={{ width: `${(ship.baseSpeed / 500) * 100}%` }}
                          />
                        </div>
                      </div>
                      <div className="flex justify-between items-center text-slate-400">
                        <span>기체 내구도</span>
                        <div className="w-24 bg-slate-800 h-1.5 rounded-full overflow-hidden">
                          <div
                            className="bg-rose-400 h-full rounded-full"
                            style={{ width: `${(ship.baseHealth / 180) * 100}%` }}
                          />
                        </div>
                      </div>
                      <div className="text-[10px] text-amber-300/90 font-medium pt-1">
                        특성: {ship.specialAbility}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Permanent Upgrades Tech Tree (5 Cols) */}
          <div className="lg:col-span-5 space-y-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-400" /> 전투 함대 업그레이드
            </h3>

            <div className="space-y-3">
              {/* Fire Rate Upgrade */}
              <UpgradeCard
                title="발사 속도 강화"
                desc="주무장 펄스 캐논의 발사 연사율을 20% 증가시킵니다."
                icon={<Flame className="w-4 h-4 text-amber-400" />}
                level={upgrades.fireRateLevel}
                maxLevel={5}
                cost={getUpgradeCost('fireRateLevel')}
                canAfford={scrap >= (getUpgradeCost('fireRateLevel') ?? Infinity)}
                onUpgrade={() => handleUpgradeClick('fireRateLevel')}
              />

              {/* Damage Upgrade */}
              <UpgradeCard
                title="플라즈마 화력 증강"
                desc="모든 탄환 및 레이저의 공격력을 25% 증폭시킵니다."
                icon={<Zap className="w-4 h-4 text-cyan-400" />}
                level={upgrades.damageLevel}
                maxLevel={5}
                cost={getUpgradeCost('damageLevel')}
                canAfford={scrap >= (getUpgradeCost('damageLevel') ?? Infinity)}
                onUpgrade={() => handleUpgradeClick('damageLevel')}
              />

              {/* Max Shield Upgrade */}
              <UpgradeCard
                title="방어막 코어 증설"
                desc="기체의 최대 내구도 및 실드 용량을 +25 확장합니다."
                icon={<Shield className="w-4 h-4 text-emerald-400" />}
                level={upgrades.maxShieldLevel}
                maxLevel={5}
                cost={getUpgradeCost('maxShieldLevel')}
                canAfford={scrap >= (getUpgradeCost('maxShieldLevel') ?? Infinity)}
                onUpgrade={() => handleUpgradeClick('maxShieldLevel')}
              />

              {/* Bomb Stock Upgrade */}
              <UpgradeCard
                title="EMP 폭탄 장전고 확장"
                desc="출격 시 기본 보유 가능한 EMP 폭탄 개수를 +1 늘립니다."
                icon={<Bomb className="w-4 h-4 text-rose-400" />}
                level={upgrades.bombStockLevel}
                maxLevel={5}
                cost={getUpgradeCost('bombStockLevel')}
                canAfford={scrap >= (getUpgradeCost('bombStockLevel') ?? Infinity)}
                onUpgrade={() => handleUpgradeClick('bombStockLevel')}
              />

              {/* Wingman Drone Upgrade */}
              <UpgradeCard
                title="지원 윙맨 드론 배치"
                desc="기체 좌우에 동반 비행하며 레이저를 동시 발사하는 호위 드론을 증설합니다."
                icon={<Sparkles className="w-4 h-4 text-purple-400" />}
                level={upgrades.droneLevel}
                maxLevel={2}
                cost={getUpgradeCost('droneLevel')}
                canAfford={scrap >= (getUpgradeCost('droneLevel') ?? Infinity)}
                onUpgrade={() => handleUpgradeClick('droneLevel')}
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-sm rounded-xl transition-all shadow-lg active:scale-95"
          >
            함대 준비 완료
          </button>
        </div>
      </div>
    </div>
  );
};

interface UpgradeCardProps {
  title: string;
  desc: string;
  icon: React.ReactNode;
  level: number;
  maxLevel: number;
  cost: number | null;
  canAfford: boolean;
  onUpgrade: () => void;
}

const UpgradeCard: React.FC<UpgradeCardProps> = ({
  title,
  desc,
  icon,
  level,
  maxLevel,
  cost,
  canAfford,
  onUpgrade,
}) => {
  const isMax = level >= maxLevel;

  return (
    <div className="p-3 bg-slate-950/70 border border-slate-800/80 rounded-xl flex items-center justify-between gap-3">
      <div className="flex items-start gap-2.5">
        <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 mt-0.5">{icon}</div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-xs text-white">{title}</span>
            <div className="flex items-center gap-0.5">
              {Array.from({ length: maxLevel }).map((_, i) => (
                <div
                  key={i}
                  className={`w-2 h-2 rounded-xs ${
                    i < level ? 'bg-cyan-400 shadow-[0_0_5px_rgba(6,182,212,0.6)]' : 'bg-slate-800'
                  }`}
                />
              ))}
            </div>
          </div>
          <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">{desc}</p>
        </div>
      </div>

      <div>
        {isMax ? (
          <span className="text-[11px] font-bold text-emerald-400 px-2 py-1 bg-emerald-950/50 rounded-lg border border-emerald-800/40">
            MAX
          </span>
        ) : (
          <button
            onClick={onUpgrade}
            disabled={!canAfford}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
              canAfford
                ? 'bg-cyan-950 hover:bg-cyan-900 border-cyan-500 text-cyan-200 active:scale-95 shadow-[0_0_8px_rgba(6,182,212,0.3)]'
                : 'bg-slate-800 border-slate-700 text-slate-500 cursor-not-allowed'
            }`}
          >
            💎 {cost}
          </button>
        )}
      </div>
    </div>
  );
};
