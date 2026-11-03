/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * GALAXY STRIKER: RETRO CHRONICLES & 360 SURVIVOR
 * Pure Vanilla JavaScript (Zero Build, GitHub Pages Compatible)
 */

(function () {
  'use strict';

  // ================= 1. CONSTANTS & CONFIGS =================
  const CANVAS_WIDTH = 640;
  const CANVAS_HEIGHT = 860;
  const WORLD_WIDTH = 3400;
  const WORLD_HEIGHT = 3400;

  const SHIP_CONFIGS = {
    alpha_viper: {
      id: 'alpha_viper',
      name: '알파 바이퍼',
      nameEn: 'Alpha Viper',
      description: '은하 연합의 주력 표준 전투기. 균형 잡힌 기동성과 고정밀 트윈 펄스 캐논 탑재.',
      cost: 0,
      baseSpeed: 380,
      baseHealth: 100,
      baseFireRate: 6.5,
      color: '#06b6d4',
      engineGlow: '#38bdf8',
      specialAbility: '균형 잡힌 트윈 연사 & 빠른 에너지 회복',
    },
    cosmic_phantom: {
      id: 'cosmic_phantom',
      name: '코스믹 팬텀',
      nameEn: 'Cosmic Phantom',
      description: '광속 요격을 위해 개발된 초경량 스텔스 파이터. 고속 기동과 관통형 빔을 발사합니다.',
      cost: 450,
      baseSpeed: 460,
      baseHealth: 75,
      baseFireRate: 8.0,
      color: '#a855f7',
      engineGlow: '#c084fc',
      specialAbility: '초고속 기동 회피 & 고주파 관통 레이저',
    },
    titan_dreadnought: {
      id: 'titan_dreadnought',
      name: '타이탄 드레드노트',
      nameEn: 'Titan Dreadnought',
      description: '중장갑 요새형 돌격함. 강력한 에너지 방어막과 광역 산탄 플라즈마로 적을 섬멸합니다.',
      cost: 900,
      baseSpeed: 300,
      baseHealth: 160,
      baseFireRate: 5.0,
      color: '#f59e0b',
      engineGlow: '#fbbf24',
      specialAbility: '강화 장갑 실드 & 광범위 산탄 일제 사격',
    },
    solar_phoenix: {
      id: 'solar_phoenix',
      name: '솔라 피닉스',
      nameEn: 'Solar Phoenix',
      description: '태양의 핵 에너지를 동력으로 삼는 전설의 기체. 적을 추적하는 플라즈마 탄환을 발사합니다.',
      cost: 1600,
      baseSpeed: 410,
      baseHealth: 120,
      baseFireRate: 7.2,
      color: '#ef4444',
      engineGlow: '#f97316',
      specialAbility: '스마트 유도 플라즈마탄 & 자동 재생 코어',
    },
  };

  const ABILITY_CARDS_CATALOG = [
    {
      id: 'quantum_missile',
      title: '유도 퀀텀 미사일',
      titleEn: 'Quantum Missiles',
      description: '주기적으로 적을 자동 추적하는 고폭성 양자 마이크로 미사일을 연사합니다.',
      icon: '🚀',
      maxLevel: 5,
      rarity: 'rare',
    },
    {
      id: 'orbital_satellite',
      title: '궤도 수호 위성',
      titleEn: 'Orbital Satellites',
      description: '기체 주변을 회전하며 접근하는 적과 탄환을 차단 및 파괴하는 플라즈마 위성을 배치합니다.',
      icon: '🛰️',
      maxLevel: 4,
      rarity: 'rare',
    },
    {
      id: 'chain_lightning',
      title: '연쇄 아크 전격포',
      titleEn: 'Chain Lightning',
      description: '고압의 번개가 적들을 연쇄적으로 감전시켜 일망타진합니다.',
      icon: '⚡',
      maxLevel: 5,
      rarity: 'epic',
    },
    {
      id: 'graviton_blackhole',
      title: '중력 특이점 블랙홀',
      titleEn: 'Graviton Singularity',
      description: '일정 주기마다 적들을 중심부로 강력하게 빨아들이는 소형 블랙홀을 전개합니다.',
      icon: '🌀',
      maxLevel: 4,
      rarity: 'legendary',
    },
    {
      id: 'flak_cannon',
      title: '확산 플랙 산탄포',
      titleEn: 'Flak Scattergun',
      description: '기체 전방으로 대구경 파편탄을 발사하여 강력한 넉백과 광역 데미지를 입힙니다.',
      icon: '💥',
      maxLevel: 5,
      rarity: 'common',
    },
    {
      id: 'plasma_cutter',
      title: '관통 플라즈마 커터',
      titleEn: 'Plasma Beam Cutter',
      description: '소행성과 외계 편대를 관통하는 고출력 레이저 빔을 일직선으로 분사합니다.',
      icon: '✨',
      maxLevel: 5,
      rarity: 'rare',
    },
    {
      id: 'hyper_afterburner',
      title: '초공간 애프터버너',
      titleEn: 'Hyperspace Boost',
      description: '비행 속도와 부스트 게이지 충전율을 25% 향상시키고 화염 궤적 데미지를 부여합니다.',
      icon: '🔥',
      maxLevel: 4,
      rarity: 'common',
    },
    {
      id: 'nano_repair',
      title: '나노 수리 로봇 군단',
      titleEn: 'Nano Repair Nanites',
      description: '초당 선체 내구도를 지속적으로 복구하고 방어막 재생 대기시간을 단축합니다.',
      icon: '🛠️',
      maxLevel: 5,
      rarity: 'common',
    },
    {
      id: 'magnetic_vacuum',
      title: '자기장 진공 흡입기',
      titleEn: 'Magnetic Harvester',
      description: '먼 거리의 스타라이트 XP 젬과 스크랩 자원을 자동으로 자석처럼 끌어당깁니다.',
      icon: '🧲',
      maxLevel: 4,
      rarity: 'common',
    },
  ];

  const INITIAL_UPGRADE_COSTS = {
    fireRate: [100, 220, 450, 800],
    damage: [120, 260, 520, 950],
    maxShield: [90, 200, 400, 750],
    bombStock: [150, 300, 600, 1100],
    drone: [500, 1200],
  };

  const DEFAULT_LEADERBOARD = [
    { id: '1', name: 'KOR', score: 128500, wave: 8, shipId: 'solar_phoenix', date: '2026-11-02', mode: 'survivor_360' },
    { id: '2', name: 'GAL', score: 94200, wave: 6, shipId: 'titan_dreadnought', date: '2026-10-28', mode: 'survivor_360' },
    { id: '3', name: 'ACE', score: 78900, wave: 5, shipId: 'cosmic_phantom', date: '2026-10-25', mode: 'survivor_360' },
    { id: '4', name: 'VIP', score: 53100, wave: 4, shipId: 'alpha_viper', date: '2026-10-20', mode: 'arcade' },
    { id: '5', name: 'NEO', score: 36200, wave: 3, shipId: 'alpha_viper', date: '2026-10-15', mode: 'arcade' },
  ];

  const INITIAL_ACHIEVEMENTS = [
    { id: 'first_sortie', title: '첫 번째 출격', description: '갤럭시 게임을 처음으로 플레이하고 1회 이상 적을 요격하세요.', unlocked: false, icon: '🚀', rewardScrap: 50 },
    { id: 'level_10_survivor', title: '베테랑 파일럿 레벨 10', description: '은하 서바이벌 모드에서 레벨 10에 도달하세요.', unlocked: false, icon: '⭐', rewardScrap: 150 },
    { id: 'sharpshooter', title: '명사수 (Sharpshooter)', description: '챌린징 스테이지에서 80% 이상의 명중률을 달성하세요.', unlocked: false, icon: '🎯', rewardScrap: 150 },
    { id: 'dual_pilot', title: '트윈 윙맨 결성', description: '지원 드론을 획득하여 2기의 드론과 함께 출격하세요.', unlocked: false, icon: '🛸', rewardScrap: 200 },
    { id: 'gorgon_slayer', title: '모선 격추', description: '외계 기함 보스를 완전히 파괴하세요.', unlocked: false, icon: '💥', rewardScrap: 300 },
    { id: 'bomb_expert', title: 'EMP 폭풍', description: '한 번의 EMP 폭탄으로 적기 8기 이상을 일거에 섬멸하세요.', unlocked: false, icon: '⚡', rewardScrap: 150 },
    { id: 'galaxy_savior', title: '은하의 구원자', description: '은하계 보스를 처치하거나 5스테이지를 돌파하세요.', unlocked: false, icon: '👑', rewardScrap: 600 },
    { id: 'scrap_collector', title: '은하계 자원 수집가', description: '누적 1,000개 이상의 스크랩 크리스털을 획득하세요.', unlocked: false, icon: '💎', rewardScrap: 200 },
  ];

  // ================= 2. PROCEDURAL SOUND SYNTHESIZER =================
  class SoundController {
    constructor() {
      this.ctx = null;
      this.masterGain = null;
      this.sfxGain = null;
      this.bgmGain = null;
      this.isMuted = false;
      this.isBgmMuted = false;
      this.bgmInterval = null;
      this.bgmStep = 0;
    }

    initCtx() {
      if (!this.ctx) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        this.ctx = new AudioCtx();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.value = 0.8;
        this.masterGain.connect(this.ctx.destination);

        this.sfxGain = this.ctx.createGain();
        this.sfxGain.gain.value = 0.7;
        this.sfxGain.connect(this.masterGain);

        this.bgmGain = this.ctx.createGain();
        this.bgmGain.gain.value = 0.22;
        this.bgmGain.connect(this.masterGain);
      }
      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
    }

    setMute(muted) {
      this.isMuted = muted;
      if (this.masterGain && this.ctx) {
        this.masterGain.gain.setValueAtTime(muted ? 0 : 0.8, this.ctx.currentTime);
      }
    }

    setBgmMute(muted) {
      this.isBgmMuted = muted;
      if (this.bgmGain && this.ctx) {
        this.bgmGain.gain.setValueAtTime(muted ? 0 : 0.22, this.ctx.currentTime);
      }
    }

    toggleMute() {
      this.setMute(!this.isMuted);
      return this.isMuted;
    }

    toggleBgmMute() {
      this.setBgmMute(!this.isBgmMuted);
      return this.isBgmMuted;
    }

    playLaser(type = 'single') {
      if (this.isMuted) return;
      try {
        this.initCtx();
        if (!this.ctx || !this.sfxGain) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.connect(gain);
        gain.connect(this.sfxGain);

        if (type === 'single') {
          osc.type = 'square';
          osc.frequency.setValueAtTime(880, now);
          osc.frequency.exponentialRampToValueAtTime(110, now + 0.12);
          gain.gain.setValueAtTime(0.18, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
          osc.start(now);
          osc.stop(now + 0.12);
        } else if (type === 'scatter') {
          osc.type = 'square';
          osc.frequency.setValueAtTime(650, now);
          osc.frequency.exponentialRampToValueAtTime(90, now + 0.09);
          gain.gain.setValueAtTime(0.15, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
          osc.start(now);
          osc.stop(now + 0.09);
        } else if (type === 'missile') {
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(250, now);
          osc.frequency.linearRampToValueAtTime(750, now + 0.15);
          gain.gain.setValueAtTime(0.18, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
          osc.start(now);
          osc.stop(now + 0.2);
        }
      } catch (e) {}
    }

    playLightning() {
      if (this.isMuted) return;
      try {
        this.initCtx();
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(1200, now);
        osc.frequency.exponentialRampToValueAtTime(150, now + 0.12);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(now);
        osc.stop(now + 0.12);
      } catch (e) {}
    }

    playLevelUp() {
      if (this.isMuted) return;
      try {
        this.initCtx();
        const notes = [440, 554, 659, 880, 1108];
        const now = this.ctx.currentTime;
        notes.forEach((freq, idx) => {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.value = freq;
          const start = now + idx * 0.07;
          gain.gain.setValueAtTime(0.2, start);
          gain.gain.exponentialRampToValueAtTime(0.001, start + 0.2);
          osc.connect(gain);
          gain.connect(this.sfxGain);
          osc.start(start);
          osc.stop(start + 0.22);
        });
      } catch (e) {}
    }

    playBoost() {
      if (this.isMuted) return;
      try {
        this.initCtx();
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(110, now);
        osc.frequency.exponentialRampToValueAtTime(320, now + 0.25);
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(now);
        osc.stop(now + 0.25);
      } catch (e) {}
    }

    playEnemyLaser() {
      if (this.isMuted) return;
      try {
        this.initCtx();
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(360, now);
        osc.frequency.exponentialRampToValueAtTime(80, now + 0.14);
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(now);
        osc.stop(now + 0.14);
      } catch (e) {}
    }

    playExplosion(size = 'small') {
      if (this.isMuted) return;
      try {
        this.initCtx();
        const duration = size === 'boss' ? 0.8 : 0.25;
        const bufferSize = this.ctx.sampleRate * duration;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        const now = this.ctx.currentTime;
        filter.frequency.setValueAtTime(size === 'boss' ? 500 : 900, now);
        filter.frequency.exponentialRampToValueAtTime(60, now + duration);

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(size === 'boss' ? 0.6 : 0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.sfxGain);
        noise.start(now);
        noise.stop(now + duration);
      } catch (e) {}
    }

    playPowerUp() {
      if (this.isMuted) return;
      try {
        this.initCtx();
        const notes = [440, 554, 659, 880];
        const now = this.ctx.currentTime;
        notes.forEach((freq, idx) => {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'sine';
          osc.frequency.value = freq;
          const start = now + idx * 0.05;
          gain.gain.setValueAtTime(0.15, start);
          gain.gain.exponentialRampToValueAtTime(0.001, start + 0.12);
          osc.connect(gain);
          gain.connect(this.sfxGain);
          osc.start(start);
          osc.stop(start + 0.13);
        });
      } catch (e) {}
    }

    playXpTick() {
      if (this.isMuted) return;
      try {
        this.initCtx();
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(600 + Math.random() * 400, now);
        gain.gain.setValueAtTime(0.05, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(now);
        osc.stop(now + 0.04);
      } catch (e) {}
    }

    playBomb() {
      if (this.isMuted) return;
      try {
        this.initCtx();
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(80, now);
        osc.frequency.exponentialRampToValueAtTime(1400, now + 0.15);
        osc.frequency.exponentialRampToValueAtTime(30, now + 0.6);
        gain.gain.setValueAtTime(0.4, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(now);
        osc.stop(now + 0.6);
        this.playExplosion('boss');
      } catch (e) {}
    }

    playBossAlarm() {
      if (this.isMuted) return;
      try {
        this.initCtx();
        const now = this.ctx.currentTime;
        for (let i = 0; i < 3; i++) {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'sawtooth';
          const start = now + i * 0.35;
          osc.frequency.setValueAtTime(850, start);
          osc.frequency.linearRampToValueAtTime(350, start + 0.25);
          gain.gain.setValueAtTime(0.25, start);
          gain.gain.exponentialRampToValueAtTime(0.001, start + 0.28);
          osc.connect(gain);
          gain.connect(this.sfxGain);
          osc.start(start);
          osc.stop(start + 0.3);
        }
      } catch (e) {}
    }

    startBgm() {
      if (this.bgmInterval !== null) return;
      this.initCtx();
      const bassScale = [73.42, 87.31, 110.0, 130.81, 146.83, 110.0, 87.31, 73.42];
      const leadScale = [293.66, 349.23, 440.0, 523.25, 587.33, 523.25, 440.0, 349.23];

      this.bgmStep = 0;
      this.bgmInterval = window.setInterval(() => {
        if (this.isBgmMuted || this.isMuted || !this.ctx || !this.bgmGain) {
          this.bgmStep++;
          return;
        }
        try {
          const now = this.ctx.currentTime;
          const bassOsc = this.ctx.createOscillator();
          const bassGain = this.ctx.createGain();
          bassOsc.type = 'square';
          bassOsc.frequency.setValueAtTime(bassScale[this.bgmStep % bassScale.length], now);
          bassGain.gain.setValueAtTime(0.045, now);
          bassGain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
          bassOsc.connect(bassGain);
          bassGain.connect(this.bgmGain);
          bassOsc.start(now);
          bassOsc.stop(now + 0.18);

          if (this.bgmStep % 2 === 0) {
            const leadOsc = this.ctx.createOscillator();
            const leadGain = this.ctx.createGain();
            leadOsc.type = 'triangle';
            leadOsc.frequency.setValueAtTime(leadScale[Math.floor(this.bgmStep / 2) % leadScale.length], now);
            leadGain.gain.setValueAtTime(0.04, now);
            leadGain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
            leadOsc.connect(leadGain);
            leadGain.connect(this.bgmGain);
            leadOsc.start(now);
            leadOsc.stop(now + 0.3);
          }
          this.bgmStep = (this.bgmStep + 1) % 32;
        } catch (e) {}
      }, 180);
    }

    stopBgm() {
      if (this.bgmInterval !== null) {
        clearInterval(this.bgmInterval);
        this.bgmInterval = null;
      }
    }
  }

  const sound = new SoundController();

  // ================= 3. STATE PERSISTENCE =================
  const state = {
    gameMode: 'survivor_360',
    currentShipId: 'alpha_viper',
    unlockedShips: JSON.parse(localStorage.getItem('galaxy_unlocked_ships') || '{"alpha_viper":true}'),
    scrap: Number(localStorage.getItem('galaxy_scrap') || 200),
    upgrades: JSON.parse(
      localStorage.getItem('galaxy_upgrades') ||
        '{"fireRateLevel":1,"damageLevel":1,"maxShieldLevel":1,"bombStockLevel":1,"droneLevel":0}'
    ),
    highScore: Number(localStorage.getItem('galaxy_high_score') || 128500),
    leaderboard: JSON.parse(localStorage.getItem('galaxy_leaderboard') || JSON.stringify(DEFAULT_LEADERBOARD)),
    achievements: JSON.parse(localStorage.getItem('galaxy_achievements') || JSON.stringify(INITIAL_ACHIEVEMENTS)),
    autoFire: true,
    crtEffect: false,
    activeModal: 'NONE',
    engineInstance: null,
  };

  function saveState() {
    localStorage.setItem('galaxy_scrap', state.scrap.toString());
    localStorage.setItem('galaxy_upgrades', JSON.stringify(state.upgrades));
    localStorage.setItem('galaxy_unlocked_ships', JSON.stringify(state.unlockedShips));
    localStorage.setItem('galaxy_high_score', state.highScore.toString());
    localStorage.setItem('galaxy_leaderboard', JSON.stringify(state.leaderboard));
    localStorage.setItem('galaxy_achievements', JSON.stringify(state.achievements));
  }

  function unlockAchievement(id) {
    const item = state.achievements.find((a) => a.id === id);
    if (item && !item.unlocked) {
      item.unlocked = true;
      state.scrap += item.rewardScrap;
      sound.playPowerUp();
      saveState();
      updateTopBar();
    }
  }

  // ================= 4. GALAXY 360 ROGUELITE ENGINE =================
  class Galaxy360Game {
    constructor(canvas, callbacks) {
      this.canvas = canvas;
      this.ctx = canvas.getContext('2d');
      this.callbacks = callbacks;

      const ship = SHIP_CONFIGS[state.currentShipId] || SHIP_CONFIGS.alpha_viper;
      this.shipConfig = ship;
      this.x = WORLD_WIDTH / 2;
      this.y = WORLD_HEIGHT / 2;
      this.camX = this.x;
      this.camY = this.y;
      this.vx = 0;
      this.vy = 0;
      this.angle = -Math.PI / 2;
      this.targetAngle = -Math.PI / 2;

      this.maxHp = ship.baseHealth + (state.upgrades.maxShieldLevel - 1) * 25;
      this.hp = this.maxHp;
      this.boostEnergy = 100;
      this.isBoosting = false;
      this.maxBombs = 2 + state.upgrades.bombStockLevel;
      this.bombs = this.maxBombs;
      this.invulnerableTimer = 0;

      // Roguelite Level
      this.level = 1;
      this.currentXp = 0;
      this.xpToNextLevel = 100;
      this.abilities = {
        quantum_missile: 0,
        orbital_satellite: state.upgrades.droneLevel || 0,
        chain_lightning: 0,
        graviton_blackhole: 0,
        flak_cannon: 0,
        plasma_cutter: 0,
        hyper_afterburner: 0,
        nano_repair: 0,
        magnetic_vacuum: 0,
      };

      this.score = 0;
      this.sessionScrap = 0;
      this.combo = 0;
      this.survivalTimer = 0;
      this.nextBossAt = 120;
      this.satelliteAngle = 0;

      this.shootCooldown = 0;
      this.missileCooldown = 2.4;
      this.lightningCooldown = 2.0;
      this.blackHoleCooldown = 6.0;
      this.flakCooldown = 1.6;

      this.pointerWorldX = this.x;
      this.pointerWorldY = this.y - 200;
      this.isFiring = false;
      this.joystickMove = null;
      this.keys = {};
      this.screenShake = 0;

      this.stars = [];
      this.enemies = [];
      this.playerBullets = [];
      this.enemyBullets = [];
      this.particles = [];
      this.floatingTexts = [];
      this.gems = [];
      this.asteroids = [];
      this.blackHoles = [];

      this.isRunning = false;
      this.isPaused = false;
      this.isLevelUpPaused = false;
      this.lastTime = 0;
      this.animId = null;

      this.initStars();
      this.initAsteroids();
      this.bindInputs();
    }

    initStars() {
      const colors = ['#ffffff', '#a5f3fc', '#fbcfe8', '#fed7aa', '#c7d2fe'];
      for (let i = 0; i < 350; i++) {
        this.stars.push({
          x: Math.random() * WORLD_WIDTH,
          y: Math.random() * WORLD_HEIGHT,
          size: Math.random() > 0.85 ? 2.5 : 1.5,
          color: colors[Math.floor(Math.random() * colors.length)],
        });
      }
    }

    initAsteroids() {
      for (let i = 0; i < 35; i++) {
        this.spawnAsteroid(Math.random() * WORLD_WIDTH, Math.random() * WORLD_HEIGHT, 25 + Math.random() * 35);
      }
    }

    spawnAsteroid(x, y, radius) {
      const points = [];
      const count = 9;
      for (let p = 0; p < count; p++) {
        const a = (p / count) * Math.PI * 2;
        const r = radius * (0.75 + Math.random() * 0.5);
        points.push({ x: Math.cos(a) * r, y: Math.sin(a) * r });
      }
      this.asteroids.push({
        id: Math.random(),
        x,
        y,
        vx: (Math.random() - 0.5) * 20,
        vy: (Math.random() - 0.5) * 20,
        radius,
        hp: Math.floor(radius * 1.5),
        angle: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.8,
        points,
      });
    }

    bindInputs() {
      this.onKeyDown = (e) => {
        this.keys[e.code] = true;
        if (e.code === 'KeyP' || e.code === 'Escape') this.callbacks.onPause();
        if (e.code === 'KeyB' || e.code === 'KeyX') this.triggerBomb();
        if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') this.isBoosting = true;
      };
      this.onKeyUp = (e) => {
        this.keys[e.code] = false;
        if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') this.isBoosting = false;
      };
      window.addEventListener('keydown', this.onKeyDown);
      window.addEventListener('keyup', this.onKeyUp);
    }

    start() {
      this.isRunning = true;
      this.lastTime = performance.now();
      sound.startBgm();
      unlockAchievement('first_sortie');

      const loop = (time) => {
        if (!this.isRunning) return;
        const dt = Math.min((time - this.lastTime) / 1000, 0.1);
        this.lastTime = time;

        if (!this.isPaused && !this.isLevelUpPaused) {
          this.update(dt);
        }
        this.render();
        this.animId = requestAnimationFrame(loop);
      };
      this.animId = requestAnimationFrame(loop);
    }

    stop() {
      this.isRunning = false;
      if (this.animId) cancelAnimationFrame(this.animId);
      sound.stopBgm();
      window.removeEventListener('keydown', this.onKeyDown);
      window.removeEventListener('keyup', this.onKeyUp);
    }

    selectAbility(abilityId) {
      this.abilities[abilityId] = (this.abilities[abilityId] || 0) + 1;
      this.isLevelUpPaused = false;
      this.lastTime = performance.now();
      sound.playPowerUp();
      this.spawnFloatingText(this.x, this.y - 30, '능력 업그레이드 장착!', '#38bdf8');
    }

    triggerBomb() {
      if (this.bombs <= 0) return;
      this.bombs--;
      sound.playBomb();
      this.screenShake = 22;

      this.enemyBullets = [];
      for (const e of this.enemies) {
        if (Math.hypot(e.x - this.x, e.y - this.y) < 800) {
          e.hp -= 150;
          this.createSpark(e.x, e.y, '#38bdf8', 6);
        }
      }
      this.spawnFloatingText(this.x, this.y - 40, 'EMP 전역 섬멸 파동!', '#38bdf8');
      this.updateHud();
    }

    update(dt) {
      this.survivalTimer += dt;
      if (this.screenShake > 0) this.screenShake = Math.max(0, this.screenShake - dt * 25);

      this.updatePlayer(dt);
      this.updateWeapons(dt);
      this.updateAbilities(dt);
      this.updateBullets(dt);
      this.updateAsteroids(dt);
      this.updateGems(dt);
      this.updateEnemies(dt);
      this.checkCollisions();
      this.spawnSpawns(dt);

      this.camX += (this.x - this.camX) * 8 * dt;
      this.camY += (this.y - this.camY) * 8 * dt;

      if (Math.random() < 0.2) {
        this.callbacks.onRadar({
          playerPos: { x: this.x, y: this.y, angle: this.angle },
          enemies: this.enemies.map((e) => ({ x: e.x, y: e.y, isBoss: e.type.startsWith('BOSS') })),
          asteroids: this.asteroids.slice(0, 15).map((a) => ({ x: a.x, y: a.y })),
          gems: this.gems.slice(0, 20).map((g) => ({ x: g.x, y: g.y })),
        });
      }

      if (this.abilities.nano_repair > 0 && this.hp < this.maxHp) {
        this.hp = Math.min(this.maxHp, this.hp + this.abilities.nano_repair * 1.5 * dt);
        this.updateHud();
      }
    }

    updatePlayer(dt) {
      if (this.invulnerableTimer > 0) this.invulnerableTimer -= dt;

      let ix = 0;
      let iy = 0;
      if (this.joystickMove) {
        ix = this.joystickMove.x;
        iy = this.joystickMove.y;
      } else {
        if (this.keys['KeyA'] || this.keys['ArrowLeft']) ix -= 1;
        if (this.keys['KeyD'] || this.keys['ArrowRight']) ix += 1;
        if (this.keys['KeyW'] || this.keys['ArrowUp']) iy -= 1;
        if (this.keys['KeyS'] || this.keys['ArrowDown']) iy += 1;
      }
      const len = Math.hypot(ix, iy);
      if (len > 0) {
        ix /= len;
        iy /= len;
      }

      const dx = this.pointerWorldX - this.x;
      const dy = this.pointerWorldY - this.y;
      if (Math.hypot(dx, dy) > 20) {
        this.targetAngle = Math.atan2(dy, dx);
      } else if (len > 0) {
        this.targetAngle = Math.atan2(iy, ix);
      }

      let diff = this.targetAngle - this.angle;
      while (diff < -Math.PI) diff += Math.PI * 2;
      while (diff > Math.PI) diff -= Math.PI * 2;
      this.angle += diff * 12 * dt;

      const isBoostingNow = this.isBoosting && this.boostEnergy > 5;
      if (isBoostingNow) {
        this.boostEnergy = Math.max(0, this.boostEnergy - dt * 35);
        if (Math.random() < 0.25) sound.playBoost();
      } else {
        this.boostEnergy = Math.min(100, this.boostEnergy + dt * 20);
      }

      const speedBonus = 1 + this.abilities.hyper_afterburner * 0.2;
      const topSpeed = (isBoostingNow ? this.shipConfig.baseSpeed * 1.75 : this.shipConfig.baseSpeed) * speedBonus;
      const accel = isBoostingNow ? 2400 : 1600;

      if (len > 0) {
        this.vx += ix * accel * dt;
        this.vy += iy * accel * dt;
      }

      const curSpeed = Math.hypot(this.vx, this.vy);
      if (curSpeed > topSpeed) {
        this.vx = (this.vx / curSpeed) * topSpeed;
        this.vy = (this.vy / curSpeed) * topSpeed;
      }
      this.vx *= Math.pow(0.88, dt * 60);
      this.vy *= Math.pow(0.88, dt * 60);

      this.x += this.vx * dt;
      this.y += this.vy * dt;

      const m = 60;
      this.x = Math.max(m, Math.min(WORLD_WIDTH - m, this.x));
      this.y = Math.max(m, Math.min(WORLD_HEIGHT - m, this.y));

      if (len > 0 || isBoostingNow) {
        const back = this.angle + Math.PI;
        this.particles.push({
          x: this.x - Math.cos(this.angle) * 18,
          y: this.y - Math.sin(this.angle) * 18,
          vx: Math.cos(back + (Math.random() - 0.5) * 0.4) * (isBoostingNow ? 220 : 120),
          vy: Math.sin(back + (Math.random() - 0.5) * 0.4) * (isBoostingNow ? 220 : 120),
          color: isBoostingNow ? '#f97316' : this.shipConfig.engineGlow,
          size: isBoostingNow ? 3.5 : 2.5,
          life: 0.25,
          maxLife: 0.25,
        });
      }

      this.updateHud();
    }

    updateWeapons(dt) {
      this.shootCooldown -= dt;
      const shouldFire = state.autoFire || this.isFiring || this.keys['Space'];
      if (shouldFire && this.shootCooldown <= 0) {
        const fireRate = this.shipConfig.baseFireRate * (1 + (state.upgrades.fireRateLevel - 1) * 0.2);
        this.shootCooldown = 1 / fireRate;
        const damage = 14 * (1 + (state.upgrades.damageLevel - 1) * 0.25);
        sound.playLaser('single');

        [-8, 8].forEach((offset) => {
          const perp = this.angle + Math.PI / 2;
          this.playerBullets.push({
            x: this.x + Math.cos(this.angle) * 16 + Math.cos(perp) * offset,
            y: this.y + Math.sin(this.angle) * 16 + Math.sin(perp) * offset,
            vx: Math.cos(this.angle) * 780 + this.vx * 0.3,
            vy: Math.sin(this.angle) * 780 + this.vy * 0.3,
            width: 5,
            damage,
            color: this.shipConfig.color,
            life: 1.1,
          });
        });
      }
    }

    updateAbilities(dt) {
      // Satellites
      const sats = this.abilities.orbital_satellite;
      if (sats > 0) {
        this.satelliteAngle += dt * 3.2;
        for (let s = 0; s < sats; s++) {
          const a = this.satelliteAngle + (s / sats) * Math.PI * 2;
          const sx = this.x + Math.cos(a) * 55;
          const sy = this.y + Math.sin(a) * 55;
          for (const e of this.enemies) {
            if (Math.hypot(e.x - sx, e.y - sy) < 28) {
              e.hp -= 25 * dt;
              this.createSpark(sx, sy, '#38bdf8', 2);
            }
          }
        }
      }

      // Quantum Missiles
      if (this.abilities.quantum_missile > 0) {
        this.missileCooldown -= dt;
        if (this.missileCooldown <= 0) {
          this.missileCooldown = 2.2 - this.abilities.quantum_missile * 0.25;
          sound.playLaser('missile');
          for (let m = 0; m < 1 + this.abilities.quantum_missile; m++) {
            const spread = this.angle + (m - this.abilities.quantum_missile / 2) * 0.4;
            this.playerBullets.push({
              x: this.x,
              y: this.y,
              vx: Math.cos(spread) * 350,
              vy: Math.sin(spread) * 350,
              width: 8,
              damage: 45 + this.abilities.quantum_missile * 15,
              color: '#38bdf8',
              isHoming: true,
              life: 2.2,
            });
          }
        }
      }

      // Chain Lightning
      if (this.abilities.chain_lightning > 0) {
        this.lightningCooldown -= dt;
        if (this.lightningCooldown <= 0) {
          this.lightningCooldown = 2.5 - this.abilities.chain_lightning * 0.3;
          const inRange = this.enemies
            .map((e) => ({ enemy: e, dist: Math.hypot(e.x - this.x, e.y - this.y) }))
            .filter((item) => item.dist < 500)
            .sort((a, b) => a.dist - b.dist)
            .slice(0, 3 + this.abilities.chain_lightning);

          if (inRange.length > 0) {
            sound.playLightning();
            let px = this.x;
            let py = this.y;
            for (const item of inRange) {
              item.enemy.hp -= 35 + this.abilities.chain_lightning * 12;
              this.createSpark(item.enemy.x, item.enemy.y, '#38bdf8', 6);
              px = item.enemy.x;
              py = item.enemy.y;
            }
          }
        }
      }

      // Flak Scattergun
      if (this.abilities.flak_cannon > 0) {
        this.flakCooldown -= dt;
        if (this.flakCooldown <= 0) {
          this.flakCooldown = 1.8 - this.abilities.flak_cannon * 0.2;
          sound.playLaser('scatter');
          for (let f = 0; f < 6 + this.abilities.flak_cannon * 2; f++) {
            const sp = this.angle + (Math.random() - 0.5) * 1.2;
            this.playerBullets.push({
              x: this.x,
              y: this.y,
              vx: Math.cos(sp) * 600,
              vy: Math.sin(sp) * 600,
              width: 6,
              damage: 22,
              color: '#f59e0b',
              life: 0.55,
            });
          }
        }
      }
    }

    updateBullets(dt) {
      for (let i = this.playerBullets.length - 1; i >= 0; i--) {
        const b = this.playerBullets[i];
        if (b.isHoming && this.enemies.length > 0) {
          let target = null;
          let closest = Infinity;
          for (const e of this.enemies) {
            const d = Math.hypot(e.x - b.x, e.y - b.y);
            if (d < closest) {
              closest = d;
              target = e;
            }
          }
          if (target && closest < 600) {
            const ta = Math.atan2(target.y - b.y, target.x - b.x);
            const ca = Math.atan2(b.vy, b.vx);
            let diff = ta - ca;
            while (diff < -Math.PI) diff += Math.PI * 2;
            while (diff > Math.PI) diff -= Math.PI * 2;
            const sp = Math.hypot(b.vx, b.vy);
            b.vx = Math.cos(ca + diff * 6 * dt) * sp;
            b.vy = Math.sin(ca + diff * 6 * dt) * sp;
          }
        }
        b.x += b.vx * dt;
        b.y += b.vy * dt;
        b.life -= dt;
        if (b.life <= 0 || b.x < 0 || b.x > WORLD_WIDTH || b.y < 0 || b.y > WORLD_HEIGHT) {
          this.playerBullets.splice(i, 1);
        }
      }

      for (let i = this.enemyBullets.length - 1; i >= 0; i--) {
        const b = this.enemyBullets[i];
        b.x += b.vx * dt;
        b.y += b.vy * dt;
        b.life -= dt;
        if (b.life <= 0 || b.x < 0 || b.x > WORLD_WIDTH || b.y < 0 || b.y > WORLD_HEIGHT) {
          this.enemyBullets.splice(i, 1);
        }
      }
    }

    updateAsteroids(dt) {
      for (const a of this.asteroids) {
        a.x += a.vx * dt;
        a.y += a.vy * dt;
        a.angle += a.rotSpeed * dt;
        if (a.x < 0) a.x += WORLD_WIDTH;
        if (a.x > WORLD_WIDTH) a.x -= WORLD_WIDTH;
        if (a.y < 0) a.y += WORLD_HEIGHT;
        if (a.y > WORLD_HEIGHT) a.y -= WORLD_HEIGHT;
      }
    }

    updateGems(dt) {
      const magnet = 110 + this.abilities.magnetic_vacuum * 65;
      for (let i = this.gems.length - 1; i >= 0; i--) {
        const g = this.gems[i];
        const dist = Math.hypot(this.x - g.x, this.y - g.y);
        if (dist < magnet) {
          const sp = 450 + (1 - dist / magnet) * 450;
          g.x += ((this.x - g.x) / dist) * sp * dt;
          g.y += ((this.y - g.y) / dist) * sp * dt;
        }
        if (dist < 26) {
          sound.playXpTick();
          this.currentXp += g.xp;
          this.sessionScrap += g.scrap;
          this.score += g.xp * 10;
          this.gems.splice(i, 1);
          if (this.currentXp >= this.xpToNextLevel) {
            this.levelUp();
          }
          this.updateHud();
        }
      }
    }

    levelUp() {
      this.level++;
      this.currentXp -= this.xpToNextLevel;
      this.xpToNextLevel = Math.floor(this.xpToNextLevel * 1.35 + 50);
      sound.playLevelUp();
      this.spawnFloatingText(this.x, this.y - 45, `LEVEL UP! Lv.${this.level}`, '#facc15');

      if (this.level >= 10) unlockAchievement('level_10_survivor');

      const available = ABILITY_CARDS_CATALOG.filter((c) => (this.abilities[c.id] || 0) < c.maxLevel);
      const shuffled = [...available].sort(() => Math.random() - 0.5).slice(0, 3);
      if (shuffled.length > 0) {
        this.isLevelUpPaused = true;
        this.callbacks.onLevelUp(shuffled.map((c) => ({ ...c, level: this.abilities[c.id] || 0 })));
      }
    }

    updateEnemies(dt) {
      for (let i = this.enemies.length - 1; i >= 0; i--) {
        const e = this.enemies[i];
        const dx = this.x - e.x;
        const dy = this.y - e.y;
        const dist = Math.hypot(dx, dy) || 1;
        e.angle = Math.atan2(dy, dx);

        if (e.type.startsWith('BOSS')) {
          if (dist > 320) {
            e.x += (dx / dist) * 110 * dt;
            e.y += (dy / dist) * 110 * dt;
          }
          e.shootCooldown -= dt;
          if (e.shootCooldown <= 0) {
            e.shootCooldown = 1.6;
            sound.playEnemyLaser();
            for (let b = 0; b < 10; b++) {
              const a = (b / 10) * Math.PI * 2;
              this.enemyBullets.push({
                x: e.x,
                y: e.y,
                vx: Math.cos(a) * 220,
                vy: Math.sin(a) * 220,
                damage: 16,
                color: '#fbbf24',
                life: 3.5,
              });
            }
          }
        } else {
          const sp = e.type === 'DRONE' ? 180 : 130;
          e.x += (dx / dist) * sp * dt;
          e.y += (dy / dist) * sp * dt;
          e.shootCooldown -= dt;
          if (e.shootCooldown <= 0 && dist < 450) {
            e.shootCooldown = 2.8 + Math.random() * 2;
            sound.playEnemyLaser();
            this.enemyBullets.push({
              x: e.x,
              y: e.y,
              vx: (dx / dist) * 280,
              vy: (dy / dist) * 280,
              damage: 12,
              color: '#f43f5e',
              life: 2.8,
            });
          }
        }
      }
    }

    spawnSpawns(dt) {
      if (this.enemies.length < 25 + Math.floor(this.survivalTimer * 0.15)) {
        const a = Math.random() * Math.PI * 2;
        const sx = this.x + Math.cos(a) * 700;
        const sy = this.y + Math.sin(a) * 700;
        this.enemies.push({
          id: Math.random(),
          type: Math.random() < 0.2 ? 'COMMANDER' : 'DRONE',
          x: sx,
          y: sy,
          width: 30,
          height: 30,
          hp: 12 + Math.floor(this.survivalTimer * 0.1),
          scoreValue: 120,
          color: Math.random() < 0.2 ? '#ef4444' : '#22c55e',
          shootCooldown: 2.0 + Math.random() * 3,
        });
      }

      if (this.survivalTimer >= this.nextBossAt) {
        this.nextBossAt += 180;
        sound.playBossAlarm();
        this.screenShake = 22;
        const a = Math.random() * Math.PI * 2;
        this.enemies.push({
          id: 'boss_' + Math.random(),
          type: 'BOSS_OVERLORD',
          x: this.x + Math.cos(a) * 550,
          y: this.y + Math.sin(a) * 550,
          width: 140,
          height: 100,
          hp: 1400 + this.level * 250,
          scoreValue: 8000,
          color: '#ef4444',
          shootCooldown: 1.5,
        });
      }
    }

    checkCollisions() {
      // Bullets vs Asteroids
      for (let bi = this.playerBullets.length - 1; bi >= 0; bi--) {
        const b = this.playerBullets[bi];
        for (let ai = this.asteroids.length - 1; ai >= 0; ai--) {
          const a = this.asteroids[ai];
          if (Math.hypot(b.x - a.x, b.y - a.y) < a.radius) {
            a.hp -= b.damage;
            this.createSpark(b.x, b.y, '#94a3b8', 3);
            this.playerBullets.splice(bi, 1);
            if (a.hp <= 0) {
              sound.playExplosion('small');
              this.gems.push({ id: Math.random(), x: a.x, y: a.y, xp: 15, scrap: 3, color: '#34d399', radius: 4 });
              this.asteroids.splice(ai, 1);
              this.spawnAsteroid(this.x + (Math.random() - 0.5) * 1200, this.y + (Math.random() - 0.5) * 1200, 25);
            }
            break;
          }
        }
      }

      // Bullets vs Enemies
      for (let bi = this.playerBullets.length - 1; bi >= 0; bi--) {
        const b = this.playerBullets[bi];
        for (let ei = this.enemies.length - 1; ei >= 0; ei--) {
          const e = this.enemies[ei];
          if (Math.hypot(b.x - e.x, b.y - e.y) < e.width / 2 + 5) {
            e.hp -= b.damage;
            this.combo++;
            this.createSpark(b.x, b.y, e.color, 4);
            this.playerBullets.splice(bi, 1);
            if (e.hp <= 0) {
              const isBoss = e.type.startsWith('BOSS');
              sound.playExplosion(isBoss ? 'boss' : 'small');
              if (isBoss) {
                this.screenShake = 24;
                unlockAchievement('gorgon_slayer');
              }
              this.score += e.scoreValue;
              const gemCount = isBoss ? 15 : 1;
              for (let g = 0; g < gemCount; g++) {
                this.gems.push({
                  id: Math.random(),
                  x: e.x + (Math.random() - 0.5) * 20,
                  y: e.y + (Math.random() - 0.5) * 20,
                  xp: isBoss ? 80 : 25,
                  scrap: isBoss ? 8 : 1,
                  color: isBoss ? '#facc15' : '#38bdf8',
                  radius: isBoss ? 6 : 4,
                });
              }
              this.enemies.splice(ei, 1);
            }
            break;
          }
        }
      }

      // Enemy Bullets vs Player
      if (this.invulnerableTimer <= 0) {
        for (let bi = this.enemyBullets.length - 1; bi >= 0; bi--) {
          const b = this.enemyBullets[bi];
          if (Math.hypot(b.x - this.x, b.y - this.y) < 22) {
            this.hitPlayer(b.damage);
            this.enemyBullets.splice(bi, 1);
            break;
          }
        }
        for (const e of this.enemies) {
          if (Math.hypot(e.x - this.x, e.y - this.y) < 28) {
            this.hitPlayer(20);
            e.hp -= 30;
            break;
          }
        }
      }
    }

    hitPlayer(damage) {
      this.hp -= damage;
      this.invulnerableTimer = 1.4;
      this.combo = 0;
      this.screenShake = 14;
      sound.playExplosion('small');
      this.updateHud();
      if (this.hp <= 0) {
        this.stop();
        this.callbacks.onGameOver(this.score, this.sessionScrap, Math.floor(this.survivalTimer), this.level);
      }
    }

    createSpark(x, y, color, count) {
      for (let i = 0; i < count; i++) {
        const a = Math.random() * Math.PI * 2;
        this.particles.push({
          x,
          y,
          vx: Math.cos(a) * (50 + Math.random() * 100),
          vy: Math.sin(a) * (50 + Math.random() * 100),
          color,
          size: 2,
          life: 0.25,
          maxLife: 0.25,
        });
      }
    }

    spawnFloatingText(x, y, text, color) {
      this.floatingTexts.push({ x, y, text, color, life: 0.85, maxLife: 0.85 });
    }

    updateHud() {
      this.callbacks.onStats({
        score: this.score,
        scrap: state.scrap + this.sessionScrap,
        combo: this.combo,
        hp: this.hp,
        maxHp: this.maxHp,
        boost: this.boostEnergy,
        bombs: this.bombs,
        maxBombs: this.maxBombs,
        level: this.level,
        xp: this.currentXp,
        nextXp: this.xpToNextLevel,
      });
    }

    render() {
      const ctx = this.ctx;
      ctx.save();
      if (this.screenShake > 0) {
        ctx.translate((Math.random() - 0.5) * this.screenShake, (Math.random() - 0.5) * this.screenShake);
      }

      ctx.fillStyle = '#030712';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      ctx.save();
      ctx.translate(CANVAS_WIDTH / 2 - this.camX, CANVAS_HEIGHT / 2 - this.camY);

      // Stars
      for (const s of this.stars) {
        ctx.fillStyle = s.color;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
        ctx.fill();
      }

      // Asteroids
      for (const a of this.asteroids) {
        ctx.save();
        ctx.translate(a.x, a.y);
        ctx.rotate(a.angle);
        ctx.fillStyle = '#334155';
        ctx.strokeStyle = '#64748b';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        for (let i = 0; i < a.points.length; i++) {
          if (i === 0) ctx.moveTo(a.points[i].x, a.points[i].y);
          else ctx.lineTo(a.points[i].x, a.points[i].y);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
      }

      // Gems
      for (const g of this.gems) {
        ctx.fillStyle = g.color;
        ctx.beginPath();
        ctx.arc(g.x, g.y, g.radius, 0, Math.PI * 2);
        ctx.fill();
      }

      // Bullets
      for (const b of this.playerBullets) {
        ctx.fillStyle = b.color;
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.width / 2, 0, Math.PI * 2);
        ctx.fill();
      }
      for (const b of this.enemyBullets) {
        ctx.fillStyle = b.color;
        ctx.beginPath();
        ctx.arc(b.x, b.y, 3, 0, Math.PI * 2);
        ctx.fill();
      }

      // Enemies
      for (const e of this.enemies) {
        ctx.save();
        ctx.translate(e.x, e.y);
        ctx.rotate(e.angle || 0);
        ctx.fillStyle = e.color;
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(e.width * 0.5, 0);
        ctx.lineTo(-e.width * 0.4, e.height * 0.35);
        ctx.lineTo(-e.width * 0.2, 0);
        ctx.lineTo(-e.width * 0.4, -e.height * 0.35);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
      }

      // Satellites
      const sats = this.abilities.orbital_satellite;
      if (sats > 0) {
        for (let s = 0; s < sats; s++) {
          const a = this.satelliteAngle + (s / sats) * Math.PI * 2;
          ctx.fillStyle = '#38bdf8';
          ctx.beginPath();
          ctx.arc(this.x + Math.cos(a) * 55, this.y + Math.sin(a) * 55, 6, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Player Ship
      if (!(this.invulnerableTimer > 0 && Math.floor(this.invulnerableTimer * 10) % 2 === 0)) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);
        ctx.fillStyle = this.shipConfig.color;
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(24, 0);
        ctx.lineTo(-14, 18);
        ctx.lineTo(-8, 8);
        ctx.lineTo(-18, 0);
        ctx.lineTo(-8, -8);
        ctx.lineTo(-14, -18);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
      }

      // Particles
      for (let i = this.particles.length - 1; i >= 0; i--) {
        const p = this.particles[i];
        p.x += p.vx * 0.016;
        p.y += p.vy * 0.016;
        p.life -= 0.016;
        if (p.life <= 0) {
          this.particles.splice(i, 1);
          continue;
        }
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }

      // Floating Texts
      for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
        const ft = this.floatingTexts[i];
        ft.y -= 25 * 0.016;
        ft.life -= 0.016;
        if (ft.life <= 0) {
          this.floatingTexts.splice(i, 1);
          continue;
        }
        ctx.fillStyle = ft.color;
        ctx.font = 'bold 14px "Outfit", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(ft.text, ft.x, ft.y);
      }

      ctx.restore();
      ctx.restore();
    }
  }

  // ================= 5. CLASSIC VERTICAL ARCADE GAME ENGINE =================
  class ClassicArcadeGame {
    constructor(canvas, callbacks) {
      this.canvas = canvas;
      this.ctx = canvas.getContext('2d');
      this.callbacks = callbacks;
      const ship = SHIP_CONFIGS[state.currentShipId] || SHIP_CONFIGS.alpha_viper;
      this.shipConfig = ship;
      this.playerX = CANVAS_WIDTH / 2;
      this.playerY = CANVAS_HEIGHT - 90;
      this.playerTargetX = this.playerX;
      this.maxHp = ship.baseHealth + (state.upgrades.maxShieldLevel - 1) * 25;
      this.hp = this.maxHp;
      this.maxBombs = 2 + state.upgrades.bombStockLevel;
      this.bombs = this.maxBombs;
      this.score = 0;
      this.sessionScrap = 0;
      this.combo = 0;
      this.stage = 1;
      this.shootCooldown = 0;
      this.invulnerableTimer = 0;
      this.enemies = [];
      this.playerBullets = [];
      this.enemyBullets = [];
      this.stars = [];
      this.particles = [];
      this.floatingTexts = [];
      this.isRunning = false;
      this.isPaused = false;
      this.keys = {};
      this.screenShake = 0;
      this.diveTimer = 0;
      this.formationOffset = 0;
      this.formationDir = 1;

      for (let i = 0; i < 90; i++) {
        this.stars.push({
          x: Math.random() * CANVAS_WIDTH,
          y: Math.random() * CANVAS_HEIGHT,
          speed: 40 + Math.random() * 140,
          size: Math.random() > 0.8 ? 2 : 1,
        });
      }

      this.bindInputs();
    }

    bindInputs() {
      this.onKeyDown = (e) => {
        this.keys[e.code] = true;
        if (e.code === 'KeyP' || e.code === 'Escape') this.callbacks.onPause();
        if (e.code === 'KeyB' || e.code === 'KeyX') this.triggerBomb();
      };
      this.onKeyUp = (e) => {
        this.keys[e.code] = false;
      };
      window.addEventListener('keydown', this.onKeyDown);
      window.addEventListener('keyup', this.onKeyUp);
    }

    start() {
      this.isRunning = true;
      this.lastTime = performance.now();
      sound.startBgm();
      this.spawnFormation();

      const loop = (time) => {
        if (!this.isRunning) return;
        const dt = Math.min((time - this.lastTime) / 1000, 0.1);
        this.lastTime = time;
        if (!this.isPaused) this.update(dt);
        this.render();
        this.animId = requestAnimationFrame(loop);
      };
      this.animId = requestAnimationFrame(loop);
    }

    stop() {
      this.isRunning = false;
      if (this.animId) cancelAnimationFrame(this.animId);
      sound.stopBgm();
      window.removeEventListener('keydown', this.onKeyDown);
      window.removeEventListener('keyup', this.onKeyUp);
    }

    triggerBomb() {
      if (this.bombs <= 0) return;
      this.bombs--;
      sound.playBomb();
      this.screenShake = 18;
      this.enemyBullets = [];
      for (const e of this.enemies) {
        e.hp -= 35;
      }
      this.updateHud();
    }

    spawnFormation() {
      this.enemies = [];
      const isBoss = this.stage === 3 || this.stage === 5;
      if (isBoss) {
        sound.playBossAlarm();
        this.enemies.push({
          id: 'boss',
          type: 'BOSS',
          x: CANVAS_WIDTH / 2,
          y: 160,
          width: 130,
          height: 90,
          hp: 800 + this.stage * 200,
          color: '#ef4444',
          shootCooldown: 1.5,
        });
        return;
      }

      const rows = [
        { count: 6, hp: 4, color: '#ef4444', score: 350 },
        { count: 8, hp: 3, color: '#a855f7', score: 250 },
        { count: 9, hp: 2, color: '#06b6d4', score: 180 },
        { count: 10, hp: 1, color: '#22c55e', score: 120 },
      ];

      rows.forEach((r, rowIdx) => {
        const sp = (CANVAS_WIDTH - 80) / (r.count + 1);
        for (let c = 0; c < r.count; c++) {
          this.enemies.push({
            id: Math.random(),
            type: 'MOB',
            formationX: 40 + sp * (c + 1),
            formationY: 120 + rowIdx * 45,
            x: 40 + sp * (c + 1),
            y: 120 + rowIdx * 45,
            width: 30,
            height: 30,
            hp: r.hp,
            color: r.color,
            scoreValue: r.score,
            state: 'FORMATION',
            shootCooldown: 3 + Math.random() * 4,
          });
        }
      });
    }

    update(dt) {
      if (this.screenShake > 0) this.screenShake = Math.max(0, this.screenShake - dt * 25);
      if (this.invulnerableTimer > 0) this.invulnerableTimer -= dt;

      // Stars
      for (const s of this.stars) {
        s.y += s.speed * dt;
        if (s.y > CANVAS_HEIGHT) s.y = -5;
      }

      // Player Movement
      let mx = 0;
      if (this.keys['KeyA'] || this.keys['ArrowLeft']) mx -= 1;
      if (this.keys['KeyD'] || this.keys['ArrowRight']) mx += 1;
      if (mx !== 0) {
        this.playerX += mx * this.shipConfig.baseSpeed * dt;
        this.playerTargetX = this.playerX;
      } else {
        const dx = this.playerTargetX - this.playerX;
        if (Math.abs(dx) > 1) this.playerX += Math.sign(dx) * Math.min(Math.abs(dx), this.shipConfig.baseSpeed * 1.5 * dt);
      }
      this.playerX = Math.max(28, Math.min(CANVAS_WIDTH - 28, this.playerX));

      // Player Firing
      this.shootCooldown -= dt;
      if (this.shootCooldown <= 0) {
        this.shootCooldown = 1 / (this.shipConfig.baseFireRate * (1 + (state.upgrades.fireRateLevel - 1) * 0.2));
        sound.playLaser('single');
        const dmg = 12 * (1 + (state.upgrades.damageLevel - 1) * 0.25);
        [-8, 8].forEach((ox) => {
          this.playerBullets.push({
            x: this.playerX + ox,
            y: this.playerY - 18,
            vx: 0,
            vy: -750,
            damage: dmg,
            color: this.shipConfig.color,
          });
        });
      }

      // Bullets
      for (let i = this.playerBullets.length - 1; i >= 0; i--) {
        const b = this.playerBullets[i];
        b.y += b.vy * dt;
        if (b.y < -30) this.playerBullets.splice(i, 1);
      }
      for (let i = this.enemyBullets.length - 1; i >= 0; i--) {
        const b = this.enemyBullets[i];
        b.y += b.vy * dt;
        if (b.y > CANVAS_HEIGHT + 30) this.enemyBullets.splice(i, 1);
      }

      // Formation sway
      this.formationOffset += this.formationDir * 35 * dt;
      if (Math.abs(this.formationOffset) > 30) this.formationDir *= -1;

      // Enemies
      this.diveTimer += dt;
      if (this.diveTimer > 2.5 && this.enemies.length > 0) {
        this.diveTimer = 0;
        const e = this.enemies[Math.floor(Math.random() * this.enemies.length)];
        if (e && e.state === 'FORMATION') {
          e.state = 'DIVE';
          sound.playLaser('scatter');
        }
      }

      for (let i = this.enemies.length - 1; i >= 0; i--) {
        const e = this.enemies[i];
        if (e.state === 'FORMATION') {
          e.x = e.formationX + this.formationOffset;
          e.y = e.formationY + Math.sin(this.diveTimer * 2 + e.formationX) * 4;
          e.shootCooldown -= dt;
          if (e.shootCooldown <= 0) {
            e.shootCooldown = 4 + Math.random() * 4;
            sound.playEnemyLaser();
            this.enemyBullets.push({ x: e.x, y: e.y + 15, vx: 0, vy: 280, damage: 14, color: '#f43f5e' });
          }
        } else if (e.state === 'DIVE') {
          e.y += 240 * dt;
          e.x += Math.sin(e.y * 0.05) * 80 * dt;
          if (e.y > CANVAS_HEIGHT + 30) {
            e.y = -30;
            e.state = 'FORMATION';
          }
        } else if (e.type === 'BOSS') {
          e.x = CANVAS_WIDTH / 2 + Math.sin(this.diveTimer * 1.5) * 140;
          e.shootCooldown -= dt;
          if (e.shootCooldown <= 0) {
            e.shootCooldown = 1.6;
            sound.playEnemyLaser();
            [-30, 0, 30].forEach((ox) => {
              this.enemyBullets.push({ x: e.x + ox, y: e.y + 35, vx: ox * 1.5, vy: 300, damage: 18, color: '#fbbf24' });
            });
          }
        }
      }

      // Collisions
      for (let bi = this.playerBullets.length - 1; bi >= 0; bi--) {
        const b = this.playerBullets[bi];
        for (let ei = this.enemies.length - 1; ei >= 0; ei--) {
          const e = this.enemies[ei];
          if (Math.abs(b.x - e.x) < e.width / 2 && Math.abs(b.y - e.y) < e.height / 2) {
            e.hp -= b.damage;
            this.combo++;
            this.playerBullets.splice(bi, 1);
            if (e.hp <= 0) {
              sound.playExplosion('small');
              this.score += e.scoreValue || 300;
              this.sessionScrap += 4;
              this.enemies.splice(ei, 1);
            }
            break;
          }
        }
      }

      if (this.invulnerableTimer <= 0) {
        for (let bi = this.enemyBullets.length - 1; bi >= 0; bi--) {
          const b = this.enemyBullets[bi];
          if (Math.hypot(b.x - this.playerX, b.y - this.playerY) < 22) {
            this.hp -= b.damage;
            this.invulnerableTimer = 1.4;
            this.combo = 0;
            this.screenShake = 12;
            sound.playExplosion('small');
            this.enemyBullets.splice(bi, 1);
            if (this.hp <= 0) {
              this.stop();
              this.callbacks.onGameOver(this.score, this.sessionScrap, 85, this.stage);
            }
            break;
          }
        }
      }

      if (this.enemies.length === 0) {
        this.stage++;
        sound.playPowerUp();
        this.spawnFormation();
      }

      this.updateHud();
    }

    updateHud() {
      this.callbacks.onStats({
        score: this.score,
        scrap: state.scrap + this.sessionScrap,
        combo: this.combo,
        hp: this.hp,
        maxHp: this.maxHp,
        boost: 100,
        bombs: this.bombs,
        maxBombs: this.maxBombs,
        stage: this.stage,
        isBoss: this.stage === 3 || this.stage === 5,
      });
    }

    render() {
      const ctx = this.ctx;
      ctx.save();
      if (this.screenShake > 0) ctx.translate((Math.random() - 0.5) * this.screenShake, (Math.random() - 0.5) * this.screenShake);

      ctx.fillStyle = '#050711';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // Stars
      for (const s of this.stars) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(s.x, s.y, s.size, s.size);
      }

      // Enemies
      for (const e of this.enemies) {
        ctx.save();
        ctx.translate(e.x, e.y);
        ctx.fillStyle = e.color;
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(0, e.height * 0.45);
        ctx.lineTo(-e.width * 0.45, -e.height * 0.2);
        ctx.lineTo(e.width * 0.45, -e.height * 0.2);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
      }

      // Bullets
      for (const b of this.playerBullets) {
        ctx.fillStyle = b.color;
        ctx.fillRect(b.x - 2, b.y, 4, 14);
      }
      for (const b of this.enemyBullets) {
        ctx.fillStyle = b.color;
        ctx.beginPath();
        ctx.arc(b.x, b.y, 3, 0, Math.PI * 2);
        ctx.fill();
      }

      // Player
      if (!(this.invulnerableTimer > 0 && Math.floor(this.invulnerableTimer * 10) % 2 === 0)) {
        ctx.save();
        ctx.translate(this.playerX, this.playerY);
        ctx.fillStyle = this.shipConfig.color;
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(0, -24);
        ctx.lineTo(-20, 16);
        ctx.lineTo(0, 10);
        ctx.lineTo(20, 16);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
      }

      ctx.restore();
    }
  }

  // ================= 6. RADAR SCANNER =================
  function drawRadar(data) {
    const canvas = document.getElementById('radarCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const size = 110;
    const center = size / 2;
    const range = 900;
    ctx.clearRect(0, 0, size, size);

    ctx.fillStyle = 'rgba(15, 23, 42, 0.75)';
    ctx.beginPath();
    ctx.arc(center, center, center - 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = 'rgba(6, 182, 212, 0.25)';
    ctx.lineWidth = 1;
    [center * 0.35, center * 0.7, center - 4].forEach((r) => {
      ctx.beginPath();
      ctx.arc(center, center, r, 0, Math.PI * 2);
      ctx.stroke();
    });

    const toRadar = (wx, wy) => {
      const dx = wx - data.playerPos.x;
      const dy = wy - data.playerPos.y;
      const sc = (center - 8) / range;
      return { rx: center + dx * sc, ry: center + dy * sc, inRange: Math.hypot(dx, dy) < range };
    };

    // Gems
    ctx.fillStyle = '#38bdf8';
    for (const g of data.gems) {
      const { rx, ry, inRange } = toRadar(g.x, g.y);
      if (inRange) {
        ctx.beginPath();
        ctx.arc(rx, ry, 1.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Enemies
    for (const e of data.enemies) {
      const { rx, ry, inRange } = toRadar(e.x, e.y);
      if (inRange) {
        ctx.fillStyle = e.isBoss ? '#ef4444' : '#f43f5e';
        ctx.beginPath();
        ctx.arc(rx, ry, e.isBoss ? 4.5 : 2, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Player arrow
    ctx.save();
    ctx.translate(center, center);
    ctx.rotate(data.playerPos.angle);
    ctx.fillStyle = '#22c55e';
    ctx.beginPath();
    ctx.moveTo(5, 0);
    ctx.lineTo(-4, 3.5);
    ctx.lineTo(-4, -3.5);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    ctx.strokeStyle = 'rgba(6, 182, 212, 0.6)';
    ctx.beginPath();
    ctx.arc(center, center, center - 2, 0, Math.PI * 2);
    ctx.stroke();
  }

  // ================= 7. DOM & UI CONTROLLER =================
  function initUI() {
    renderMenu();
    updateTopBar();
    bindGlobalEvents();
  }

  function updateTopBar() {
    const scrapEl = document.getElementById('topScrapVal');
    if (scrapEl) scrapEl.textContent = state.scrap.toLocaleString();
  }

  function renderMenu() {
    const menuEl = document.getElementById('menuView');
    const gameEl = document.getElementById('gameView');
    menuEl.classList.remove('hidden');
    gameEl.classList.add('hidden');

    const ship = SHIP_CONFIGS[state.currentShipId] || SHIP_CONFIGS.alpha_viper;
    document.getElementById('currentShipName').textContent = ship.name;
    document.getElementById('currentShipAbility').textContent = ship.specialAbility;
  }

  function startGame(mode) {
    state.gameMode = mode;
    document.getElementById('menuView').classList.add('hidden');
    document.getElementById('gameView').classList.remove('hidden');

    const radarContainer = document.getElementById('radarContainer');
    const touch360 = document.getElementById('touchControls360');
    const touchClassic = document.getElementById('touchControlsClassic');
    const boostMeter = document.getElementById('boostMeterWrapper');

    if (mode === 'survivor_360') {
      radarContainer.classList.remove('hidden');
      touch360.classList.remove('hidden');
      touchClassic.classList.add('hidden');
      boostMeter.classList.remove('hidden');
      document.getElementById('hudModeLabel').textContent = 'LEVEL';
    } else {
      radarContainer.classList.add('hidden');
      touch360.classList.add('hidden');
      touchClassic.classList.remove('hidden');
      boostMeter.classList.add('hidden');
      document.getElementById('hudModeLabel').textContent = 'STAGE';
    }

    const canvas = document.getElementById('gameCanvas');
    if (state.engineInstance) state.engineInstance.stop();

    if (mode === 'survivor_360') {
      state.engineInstance = new Galaxy360Game(canvas, {
        onStats: updateHudDisplay,
        onRadar: drawRadar,
        onLevelUp: showLevelUpModal,
        onGameOver: showGameOverModal,
        onPause: showPauseModal,
      });
    } else {
      state.engineInstance = new ClassicArcadeGame(canvas, {
        onStats: updateHudDisplay,
        onGameOver: showGameOverModal,
        onPause: showPauseModal,
      });
    }

    state.engineInstance.start();
  }

  function updateHudDisplay(stats) {
    document.getElementById('hudScore').textContent = stats.score.toLocaleString();
    document.getElementById('hudHighScore').textContent = Math.max(stats.score, state.highScore).toLocaleString();
    document.getElementById('hudScrap').textContent = stats.scrap.toLocaleString();

    if (state.gameMode === 'survivor_360') {
      document.getElementById('hudModeValue').textContent = stats.level;
      const xpPct = Math.min(100, (stats.xp / stats.nextXp) * 100);
      document.getElementById('hudXpBar').style.width = xpPct + '%';
      document.getElementById('hudXpContainer').classList.remove('hidden');
    } else {
      document.getElementById('hudModeValue').textContent = stats.stage;
      document.getElementById('hudXpContainer').classList.add('hidden');
    }

    const hpPct = Math.max(0, Math.min(100, Math.round((stats.hp / stats.maxHp) * 100)));
    document.getElementById('hudHpBar').style.width = hpPct + '%';
    document.getElementById('hudHpVal').textContent = hpPct + '%';

    if (stats.boost !== undefined) {
      document.getElementById('hudBoostBar').style.width = Math.round(stats.boost) + '%';
      document.getElementById('hudBoostVal').textContent = Math.round(stats.boost) + '%';
    }

    const bombContainer = document.getElementById('hudBombIcons');
    bombContainer.innerHTML = '';
    for (let i = 0; i < stats.maxBombs; i++) {
      const b = document.createElement('span');
      b.className = `p-1 rounded ${i < stats.bombs ? 'text-rose-400' : 'text-slate-600'}`;
      b.innerHTML = '💣';
      bombContainer.appendChild(b);
    }
  }

  function showLevelUpModal(choices) {
    const modal = document.getElementById('levelUpModal');
    const container = document.getElementById('levelUpChoices');
    container.innerHTML = '';

    choices.forEach((card) => {
      const btn = document.createElement('button');
      btn.className =
        'p-4 rounded-xl bg-slate-950/80 border-2 border-cyan-500 hover:scale-105 active:scale-95 transition-all text-left flex flex-col justify-between cursor-pointer';
      btn.innerHTML = `
        <div>
          <div class="flex items-center justify-between mb-2">
            <span class="text-[10px] font-bold px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-700 uppercase">${card.rarity}</span>
            <span class="text-xs font-mono font-bold text-amber-400">${card.level === 0 ? '신규 획득' : 'Lv.' + card.level + ' → Lv.' + (card.level + 1)}</span>
          </div>
          <div class="text-3xl mb-2">${card.icon}</div>
          <h4 class="text-sm font-bold text-white">${card.title}</h4>
          <p class="text-xs text-slate-300 mt-1 leading-relaxed">${card.description}</p>
        </div>
        <div class="mt-4 pt-2 border-t border-slate-800 text-xs font-bold text-cyan-400 flex justify-between">
          <span>장착 선택</span><span>➔</span>
        </div>
      `;
      btn.onclick = () => {
        modal.classList.add('hidden');
        if (state.engineInstance && state.engineInstance.selectAbility) {
          state.engineInstance.selectAbility(card.id);
        }
      };
      container.appendChild(btn);
    });

    modal.classList.remove('hidden');
  }

  function showGameOverModal(finalScore, earnedScrap, statParam, levelOrStage) {
    const modal = document.getElementById('gameOverModal');
    document.getElementById('finalScoreVal').textContent = finalScore.toLocaleString();
    document.getElementById('finalScrapVal').textContent = '+' + earnedScrap;
    document.getElementById('finalLevelVal').textContent = levelOrStage;

    state.scrap += earnedScrap;
    if (finalScore > state.highScore) {
      state.highScore = finalScore;
      if (window.confetti) window.confetti({ particleCount: 70, spread: 60 });
    }
    saveState();
    updateTopBar();
    modal.classList.remove('hidden');
  }

  function showPauseModal() {
    document.getElementById('pauseModal').classList.remove('hidden');
  }

  function hidePauseModal() {
    document.getElementById('pauseModal').classList.add('hidden');
  }

  function showHangarModal() {
    const modal = document.getElementById('hangarModal');
    document.getElementById('hangarScrapVal').textContent = state.scrap.toLocaleString();
    renderHangarShips();
    renderHangarUpgrades();
    modal.classList.remove('hidden');
  }

  function renderHangarShips() {
    const container = document.getElementById('hangarShipList');
    container.innerHTML = '';
    Object.values(SHIP_CONFIGS).forEach((ship) => {
      const isSelected = state.currentShipId === ship.id;
      const isUnlocked = ship.cost === 0 || state.unlockedShips[ship.id];

      const div = document.createElement('div');
      div.className = `p-3.5 rounded-xl border ${isSelected ? 'bg-slate-800 border-cyan-500 ring-1 ring-cyan-500' : 'bg-slate-900 border-slate-800'}`;
      div.innerHTML = `
        <div class="flex items-center justify-between">
          <span class="font-bold text-sm text-white">${ship.name}</span>
          ${
            isSelected
              ? '<span class="text-[11px] font-bold text-cyan-400">출격 중</span>'
              : isUnlocked
              ? `<button class="select-ship-btn px-2.5 py-1 text-xs font-semibold bg-cyan-900 text-cyan-200 rounded-lg">선택</button>`
              : `<button class="unlock-ship-btn px-2.5 py-1 text-xs font-semibold bg-emerald-950 text-emerald-300 border border-emerald-600 rounded-lg">💎 ${ship.cost}</button>`
          }
        </div>
        <p class="text-[11px] text-slate-400 mt-1">${ship.description}</p>
        <div class="text-[10px] text-amber-300 font-medium mt-2">특성: ${ship.specialAbility}</div>
      `;

      const selBtn = div.querySelector('.select-ship-btn');
      if (selBtn) {
        selBtn.onclick = () => {
          state.currentShipId = ship.id;
          sound.playPowerUp();
          renderHangarShips();
          renderMenu();
        };
      }
      const unlBtn = div.querySelector('.unlock-ship-btn');
      if (unlBtn) {
        unlBtn.onclick = () => {
          if (state.scrap >= ship.cost) {
            state.scrap -= ship.cost;
            state.unlockedShips[ship.id] = true;
            state.currentShipId = ship.id;
            sound.playPowerUp();
            saveState();
            updateTopBar();
            showHangarModal();
            renderMenu();
          }
        };
      }

      container.appendChild(div);
    });
  }

  function renderHangarUpgrades() {
    const container = document.getElementById('hangarUpgradeList');
    container.innerHTML = '';

    const list = [
      { key: 'fireRateLevel', title: '발사 속도 강화', max: 5, costs: INITIAL_UPGRADE_COSTS.fireRate },
      { key: 'damageLevel', title: '플라즈마 화력 증강', max: 5, costs: INITIAL_UPGRADE_COSTS.damage },
      { key: 'maxShieldLevel', title: '방어막 코어 증설', max: 5, costs: INITIAL_UPGRADE_COSTS.maxShield },
      { key: 'bombStockLevel', title: 'EMP 폭탄 장전고 확장', max: 5, costs: INITIAL_UPGRADE_COSTS.bombStock },
      { key: 'droneLevel', title: '지원 윙맨 드론 배치', max: 2, costs: INITIAL_UPGRADE_COSTS.drone },
    ];

    list.forEach((item) => {
      const cur = state.upgrades[item.key];
      const isMax = cur >= item.max;
      const cost = isMax ? null : item.costs[cur - (item.key === 'droneLevel' ? 0 : 1)];

      const div = document.createElement('div');
      div.className = 'p-3 bg-slate-950/70 border border-slate-800 rounded-xl flex items-center justify-between';
      div.innerHTML = `
        <div>
          <div class="font-bold text-xs text-white">${item.title} (Lv.${cur}/${item.max})</div>
        </div>
        <div>
          ${
            isMax
              ? '<span class="text-xs font-bold text-emerald-400">MAX</span>'
              : `<button class="upgrade-btn px-3 py-1.5 rounded-lg text-xs font-bold border ${state.scrap >= cost ? 'bg-cyan-950 border-cyan-500 text-cyan-200' : 'bg-slate-800 border-slate-700 text-slate-500'}">💎 ${cost}</button>`
          }
        </div>
      `;

      const btn = div.querySelector('.upgrade-btn');
      if (btn && cost !== null) {
        btn.onclick = () => {
          if (state.scrap >= cost) {
            state.scrap -= cost;
            state.upgrades[item.key]++;
            sound.playPowerUp();
            saveState();
            updateTopBar();
            showHangarModal();
          }
        };
      }
      container.appendChild(div);
    });
  }

  function showLeaderboardModal() {
    const modal = document.getElementById('leaderboardModal');
    const container = document.getElementById('leaderboardList');
    container.innerHTML = '';

    state.leaderboard.forEach((item, idx) => {
      const div = document.createElement('div');
      div.className = 'flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-xs';
      div.innerHTML = `
        <div class="flex items-center gap-3">
          <span class="font-bold text-amber-400">${idx + 1}</span>
          <div>
            <div class="font-bold text-white">${item.name} <span class="text-slate-400 font-normal">(${item.shipId})</span></div>
            <div class="text-[10px] text-slate-500">${item.date}</div>
          </div>
        </div>
        <div class="font-mono font-bold text-cyan-400">${item.score.toLocaleString()}</div>
      `;
      container.appendChild(div);
    });

    modal.classList.remove('hidden');
  }

  function showAchievementsModal() {
    const modal = document.getElementById('achievementsModal');
    const container = document.getElementById('achievementsList');
    container.innerHTML = '';

    state.achievements.forEach((a) => {
      const div = document.createElement('div');
      div.className = `flex items-center justify-between p-3 rounded-xl border text-xs ${a.unlocked ? 'bg-purple-950/30 border-purple-500/50' : 'bg-slate-950/60 border-slate-800 opacity-70'}`;
      div.innerHTML = `
        <div class="flex items-center gap-3">
          <div class="text-2xl">${a.icon}</div>
          <div>
            <div class="font-bold text-white">${a.title} ${a.unlocked ? '<span class="text-purple-400 font-normal">· 달성</span>' : ''}</div>
            <p class="text-[11px] text-slate-400">${a.description}</p>
          </div>
        </div>
        <span class="font-mono font-bold text-emerald-400">💎 +${a.rewardScrap}</span>
      `;
      container.appendChild(div);
    });

    modal.classList.remove('hidden');
  }

  function bindGlobalEvents() {
    // Mode Buttons on Menu
    document.getElementById('btnStart360').onclick = () => startGame('survivor_360');
    document.getElementById('btnStartArcade').onclick = () => startGame('arcade');

    // Header buttons
    document.getElementById('headerHangarBtn').onclick = showHangarModal;
    document.getElementById('headerLeaderboardBtn').onclick = showLeaderboardModal;
    document.getElementById('headerAchievementsBtn').onclick = showAchievementsModal;
    document.getElementById('headerHowToBtn').onclick = () => document.getElementById('howToModal').classList.remove('hidden');
    document.getElementById('headerStartBtn').onclick = () => startGame('survivor_360');
    document.getElementById('brandLogoBtn').onclick = () => {
      if (state.engineInstance) state.engineInstance.stop();
      renderMenu();
    };

    // Quick Action Bar on Menu
    document.getElementById('menuHangarBtn').onclick = showHangarModal;
    document.getElementById('menuHowToBtn').onclick = () => document.getElementById('howToModal').classList.remove('hidden');

    // Modals Close Buttons
    document.querySelectorAll('.close-modal-btn').forEach((btn) => {
      btn.onclick = () => {
        btn.closest('.modal-container').classList.add('hidden');
      };
    });

    // Pause Modal actions
    document.getElementById('btnResume').onclick = () => {
      hidePauseModal();
      if (state.engineInstance) state.engineInstance.start();
    };
    document.getElementById('btnRestart').onclick = () => {
      hidePauseModal();
      startGame(state.gameMode);
    };
    document.getElementById('btnExitToMenu').onclick = () => {
      hidePauseModal();
      if (state.engineInstance) state.engineInstance.stop();
      renderMenu();
    };

    // Game Over actions
    document.getElementById('btnGameOverHangar').onclick = () => {
      document.getElementById('gameOverModal').classList.add('hidden');
      showHangarModal();
    };
    document.getElementById('btnGameOverRestart').onclick = () => {
      document.getElementById('gameOverModal').classList.add('hidden');
      startGame(state.gameMode);
    };
    document.getElementById('btnSaveScore').onclick = () => {
      const name = (document.getElementById('pilotInitialsInput').value || 'ACE').toUpperCase().slice(0, 4);
      const score = Number(document.getElementById('finalScoreVal').textContent.replace(/,/g, ''));
      state.leaderboard.unshift({
        id: Math.random().toString(),
        name,
        score,
        wave: Number(document.getElementById('finalLevelVal').textContent),
        shipId: state.currentShipId,
        date: new Date().toISOString().split('T')[0],
        mode: state.gameMode,
      });
      state.leaderboard = state.leaderboard.slice(0, 10);
      saveState();
      document.getElementById('scoreSavedNotice').classList.remove('hidden');
    };

    // Audio & Display Toggles
    const toggleMute = () => {
      const m = sound.toggleMute();
      document.querySelectorAll('.sfx-status').forEach((el) => (el.textContent = m ? '음소거' : '켜짐'));
    };
    const toggleBgmMute = () => {
      const bm = sound.toggleBgmMute();
      document.querySelectorAll('.bgm-status').forEach((el) => (el.textContent = bm ? '음소거' : '켜짐'));
    };

    document.getElementById('btnToggleMute').onclick = toggleMute;
    document.getElementById('btnToggleBgmMute').onclick = toggleBgmMute;
    document.getElementById('hudToggleMute').onclick = toggleMute;
    document.getElementById('hudToggleBgm').onclick = toggleBgmMute;
    document.getElementById('hudPauseBtn').onclick = () => {
      if (state.engineInstance) {
        state.engineInstance.stop();
        showPauseModal();
      }
    };

    // CRT Toggle
    document.getElementById('btnToggleCrt').onclick = () => {
      state.crtEffect = !state.crtEffect;
      const arena = document.getElementById('gameArenaContainer');
      if (state.crtEffect) arena.classList.add('crt-overlay');
      else arena.classList.remove('crt-overlay');
      document.getElementById('crtStatus').textContent = state.crtEffect ? 'ON' : 'OFF';
    };

    // Canvas Mouse / Pointer Listeners
    const canvas = document.getElementById('gameCanvas');
    canvas.onpointerdown = (e) => {
      const rect = canvas.getBoundingClientRect();
      const cx = (e.clientX - rect.left) * (CANVAS_WIDTH / rect.width);
      const cy = (e.clientY - rect.top) * (CANVAS_HEIGHT / rect.height);
      if (state.gameMode === 'survivor_360' && state.engineInstance) {
        state.engineInstance.pointerWorldX = state.engineInstance.x + (cx - CANVAS_WIDTH / 2);
        state.engineInstance.pointerWorldY = state.engineInstance.y + (cy - CANVAS_HEIGHT / 2);
        state.engineInstance.isFiring = true;
      } else if (state.engineInstance) {
        state.engineInstance.playerTargetX = cx;
      }
    };
    canvas.onpointermove = (e) => {
      const rect = canvas.getBoundingClientRect();
      const cx = (e.clientX - rect.left) * (CANVAS_WIDTH / rect.width);
      const cy = (e.clientY - rect.top) * (CANVAS_HEIGHT / rect.height);
      if (state.gameMode === 'survivor_360' && state.engineInstance) {
        state.engineInstance.pointerWorldX = state.engineInstance.x + (cx - CANVAS_WIDTH / 2);
        state.engineInstance.pointerWorldY = state.engineInstance.y + (cy - CANVAS_HEIGHT / 2);
      } else if (state.engineInstance) {
        state.engineInstance.playerTargetX = cx;
      }
    };
    canvas.onpointerup = () => {
      if (state.engineInstance) state.engineInstance.isFiring = false;
    };

    // Mobile Virtual Joystick for 360 mode
    const joyArea = document.getElementById('touchJoystickArea');
    const knob = document.getElementById('touchJoystickKnob');
    let touchId = null;

    joyArea.ontouchstart = (e) => {
      if (touchId !== null) return;
      const t = e.changedTouches[0];
      touchId = t.identifier;
      handleJoy(t.clientX, t.clientY);
    };
    joyArea.ontouchmove = (e) => {
      for (let i = 0; i < e.changedTouches.length; i++) {
        if (e.changedTouches[i].identifier === touchId) {
          handleJoy(e.changedTouches[i].clientX, e.changedTouches[i].clientY);
          break;
        }
      }
    };
    const endJoy = () => {
      touchId = null;
      knob.style.transform = 'translate(0px, 0px)';
      if (state.engineInstance) state.engineInstance.joystickMove = null;
    };
    joyArea.ontouchend = endJoy;
    joyArea.ontouchcancel = endJoy;

    function handleJoy(cx, cy) {
      const rect = joyArea.getBoundingClientRect();
      const ox = cx - (rect.left + rect.width / 2);
      const oy = cy - (rect.top + rect.height / 2);
      const maxR = 36;
      const dist = Math.hypot(ox, oy);
      if (dist <= maxR) {
        knob.style.transform = `translate(${ox}px, ${oy}px)`;
        if (state.engineInstance) state.engineInstance.joystickMove = { x: ox / maxR, y: oy / maxR };
      } else {
        const nx = (ox / dist) * maxR;
        const ny = (oy / dist) * maxR;
        knob.style.transform = `translate(${nx}px, ${ny}px)`;
        if (state.engineInstance) state.engineInstance.joystickMove = { x: nx / maxR, y: ny / maxR };
      }
    }

    // Touch Buttons
    const btnTouchBoost = document.getElementById('btnTouchBoost');
    btnTouchBoost.ontouchstart = () => { if (state.engineInstance) state.engineInstance.isBoosting = true; };
    btnTouchBoost.ontouchend = () => { if (state.engineInstance) state.engineInstance.isBoosting = false; };

    document.querySelectorAll('.btn-touch-bomb').forEach((btn) => {
      btn.onclick = () => {
        if (state.engineInstance && state.engineInstance.triggerBomb) state.engineInstance.triggerBomb();
      };
    });
  }

  // Auto-init on load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initUI);
  } else {
    initUI();
  }
})();
