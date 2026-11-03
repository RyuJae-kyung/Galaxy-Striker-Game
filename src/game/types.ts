/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type GameState = 
  | 'MENU'
  | 'PLAYING'
  | 'LEVEL_UP'
  | 'PAUSED'
  | 'STAGE_TRANSITION'
  | 'STAGE_CLEAR'
  | 'GAME_OVER'
  | 'VICTORY'
  | 'HANGAR'
  | 'LEADERBOARD'
  | 'HOW_TO_PLAY'
  | 'ACHIEVEMENTS';

export type GameMode = 'survivor_360' | 'arcade' | 'boss_rush';

export type ShipId = 'alpha_viper' | 'cosmic_phantom' | 'titan_dreadnought' | 'solar_phoenix';

export interface ShipConfig {
  id: ShipId;
  name: string;
  nameEn: string;
  description: string;
  cost: number;
  unlocked: boolean;
  baseSpeed: number;
  baseHealth: number;
  baseFireRate: number;
  color: string;
  engineGlow: string;
  specialAbility: string;
  spriteShape: 'spear' | 'needle' | 'heavy' | 'phoenix';
}

export interface PlayerUpgrades {
  fireRateLevel: number;    // 1 - 5
  damageLevel: number;      // 1 - 5
  maxShieldLevel: number;   // 1 - 5
  bombStockLevel: number;   // 1 - 5
  droneLevel: number;       // 0 - 2
}

export type AbilityId = 
  | 'quantum_missile'
  | 'orbital_satellite'
  | 'chain_lightning'
  | 'graviton_blackhole'
  | 'flak_cannon'
  | 'plasma_cutter'
  | 'hyper_afterburner'
  | 'nano_repair'
  | 'magnetic_vacuum';

export interface AbilityCard {
  id: AbilityId;
  title: string;
  titleEn: string;
  description: string;
  icon: string;
  level: number;
  maxLevel: number;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

export type EnemyType = 
  | 'DRONE'
  | 'INTERCEPTOR'
  | 'COMMANDER'
  | 'INFILTRATOR'
  | 'ASTEROID'
  | 'CHALLENGE_DRONE'
  | 'BOSS_GORGON'
  | 'BOSS_OVERLORD'
  | 'BOSS_LEVIATHAN';

export type PowerUpType = 
  | 'DUAL_CANNON'
  | 'TRIPLE_SPREAD'
  | 'PIERCE_LASER'
  | 'HOMING_MISSILES'
  | 'SHIELD_REPAIR'
  | 'EMP_BOMB'
  | 'WINGMAN_DRONE'
  | 'HYPER_OVERDRIVE'
  | 'SCRAP_GEM';

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  life: number;
  maxLife: number;
  alpha: number;
  sparkle?: boolean;
}

export interface FloatingText {
  id: string;
  x: number;
  y: number;
  text: string;
  color: string;
  fontSize: number;
  life: number;
  maxLife: number;
}

export interface Bullet {
  x: number;
  y: number;
  vx: number;
  vy: number;
  width: number;
  height: number;
  damage: number;
  color: string;
  isPlayer: boolean;
  isLaser?: boolean;
  isHoming?: boolean;
  targetId?: string;
  piercing?: boolean;
  life?: number;
  isMissile?: boolean;
}

export interface PowerUpItem {
  id: string;
  type: PowerUpType;
  x: number;
  y: number;
  vy: number;
  radius: number;
  pulseTimer: number;
}

export interface StarlightGem {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  xpValue: number;
  scrapValue: number;
  color: string;
  radius: number;
}

export interface AsteroidEntity {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  hp: number;
  maxHp: number;
  angle: number;
  rotSpeed: number;
  points: { x: number; y: number }[];
}

export interface BlackHoleEntity {
  id: string;
  x: number;
  y: number;
  radius: number;
  life: number;
  maxLife: number;
  pullRadius: number;
}

export interface EnemyEntity {
  id: string;
  type: EnemyType;
  x: number;
  y: number;
  vx: number;
  vy: number;
  width: number;
  height: number;
  hp: number;
  maxHp: number;
  scoreValue: number;
  scrapValue: number;
  color: string;
  formationX: number;
  formationY: number;
  state: 'ENTERING' | 'IN_FORMATION' | 'DIVING' | 'RETURNING' | 'BOSS_PATTERN' | 'CHASE' | 'CIRCLE';
  stateTimer: number;
  diveTrajectory?: {
    controlX1: number;
    controlY1: number;
    controlX2: number;
    controlY2: number;
    targetX: number;
    targetY: number;
    t: number;
    speed: number;
  };
  shootCooldown: number;
  bossPhase?: number;
  bossAttackPattern?: number;
  shieldHp?: number;
  maxShieldHp?: number;
  angle?: number;
}

export interface Star {
  x: number;
  y: number;
  speed: number;
  size: number;
  color: string;
  twinkleOffset: number;
}

export interface LeaderboardEntry {
  id: string;
  name: string;
  score: number;
  wave: number;
  shipId: ShipId;
  date: string;
  mode: GameMode;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  unlocked: boolean;
  icon: string;
  rewardScrap: number;
}
