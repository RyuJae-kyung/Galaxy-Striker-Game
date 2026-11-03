/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Rocket,
  Trophy,
  Award,
  HelpCircle,
  Wrench,
  Play,
  RotateCcw,
  Sparkles,
  Shield,
  Zap,
  Volume2,
  VolumeX,
  Music,
  Tv,
  Skull,
  Crosshair,
  Compass,
  ChevronRight,
} from 'lucide-react';
import {
  GameState,
  GameMode,
  ShipId,
  PlayerUpgrades,
  LeaderboardEntry,
  Achievement,
  AbilityCard,
} from './game/types';
import {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  SHIP_CONFIGS,
  DEFAULT_LEADERBOARD,
  INITIAL_ACHIEVEMENTS,
} from './game/constants';
import { sound } from './game/sound';
import { Galaxy360Engine } from './game/galaxy360Engine';
import { GalaxyEngine } from './game/engine';
import { GameHud } from './components/GameHud';
import { RadarMinimap } from './components/RadarMinimap';
import { TouchControls360 } from './components/TouchControls360';
import { TouchControls } from './components/TouchControls';
import { LevelUpModal } from './components/LevelUpModal';
import { HangarModal } from './components/HangarModal';
import { LeaderboardModal } from './components/LeaderboardModal';
import { AchievementsModal } from './components/AchievementsModal';
import { HowToPlayModal } from './components/HowToPlayModal';
import { GameOverModal } from './components/GameOverModal';
import { PauseModal } from './components/PauseModal';

export default function App() {
  // Navigation / Modal States
  const [gameState, setGameState] = useState<GameState>('MENU');
  const [activeModal, setActiveModal] = useState<
    'NONE' | 'HANGAR' | 'LEADERBOARD' | 'ACHIEVEMENTS' | 'HOW_TO_PLAY' | 'PAUSE' | 'GAME_OVER' | 'LEVEL_UP'
  >('NONE');

  // Selected Game Mode & Ship
  const [gameMode, setGameMode] = useState<GameMode>('survivor_360');
  const [currentShipId, setCurrentShipId] = useState<ShipId>('alpha_viper');
  const [levelUpChoices, setLevelUpChoices] = useState<AbilityCard[]>([]);

  const [unlockedShips, setUnlockedShips] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem('galaxy_unlocked_ships');
      return saved ? JSON.parse(saved) : { alpha_viper: true };
    } catch {
      return { alpha_viper: true };
    }
  });

  // Currency & Upgrades State
  const [scrap, setScrap] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('galaxy_scrap');
      return saved ? Number(saved) : 200;
    } catch {
      return 200;
    }
  });

  const [upgrades, setUpgrades] = useState<PlayerUpgrades>(() => {
    try {
      const saved = localStorage.getItem('galaxy_upgrades');
      return saved
        ? JSON.parse(saved)
        : {
            fireRateLevel: 1,
            damageLevel: 1,
            maxShieldLevel: 1,
            bombStockLevel: 1,
            droneLevel: 0,
          };
    } catch {
      return {
        fireRateLevel: 1,
        damageLevel: 1,
        maxShieldLevel: 1,
        bombStockLevel: 1,
        droneLevel: 0,
      };
    }
  });

  // High Scores & Leaderboard
  const [highScore, setHighScore] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('galaxy_high_score');
      return saved ? Number(saved) : 128500;
    } catch {
      return 128500;
    }
  });

  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>(() => {
    try {
      const saved = localStorage.getItem('galaxy_leaderboard');
      return saved ? JSON.parse(saved) : DEFAULT_LEADERBOARD;
    } catch {
      return DEFAULT_LEADERBOARD;
    }
  });

  const [achievements, setAchievements] = useState<Achievement[]>(() => {
    try {
      const saved = localStorage.getItem('galaxy_achievements');
      return saved ? JSON.parse(saved) : INITIAL_ACHIEVEMENTS;
    } catch {
      return INITIAL_ACHIEVEMENTS;
    }
  });

  // Settings
  const [isMuted, setIsMuted] = useState<boolean>(() => sound.getMuted());
  const [isBgmMuted, setIsBgmMuted] = useState<boolean>(() => sound.getBgmMuted());
  const [crtEffect, setCrtEffect] = useState<boolean>(false);
  const [autoFire, setAutoFire] = useState<boolean>(true);

  // In-Game Dynamic Stats
  const [hudStats, setHudStats] = useState({
    score: 0,
    scrap: 0,
    combo: 0,
    hp: 100,
    maxHp: 100,
    boost: 100,
    bombs: 3,
    maxBombs: 3,
    level: 1,
    xp: 0,
    nextXp: 100,
    stage: 1,
    wave: 1,
    isBoss: false,
    isChallenging: false,
  });

  // Radar data for 360 mode
  const [radarData, setRadarData] = useState({
    playerPos: { x: 1700, y: 1700, angle: -Math.PI / 2 },
    enemies: [] as { x: number; y: number; isBoss: boolean }[],
    asteroids: [] as { x: number; y: number }[],
    gems: [] as { x: number; y: number }[],
  });

  // Game Over Recap Details
  const [gameOverStats, setGameOverStats] = useState({
    finalScore: 0,
    finalScrap: 0,
    accuracy: 0,
    maxCombo: 0,
    stage: 1,
    isNewHighScore: false,
  });

  // Engine instance & Canvas ref
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const engine360Ref = useRef<Galaxy360Engine | null>(null);
  const engineClassicRef = useRef<GalaxyEngine | null>(null);

  // Persistence Sync
  useEffect(() => {
    try {
      localStorage.setItem('galaxy_scrap', scrap.toString());
      localStorage.setItem('galaxy_upgrades', JSON.stringify(upgrades));
      localStorage.setItem('galaxy_unlocked_ships', JSON.stringify(unlockedShips));
      localStorage.setItem('galaxy_high_score', highScore.toString());
      localStorage.setItem('galaxy_leaderboard', JSON.stringify(leaderboard));
      localStorage.setItem('galaxy_achievements', JSON.stringify(achievements));
    } catch {
      // Storage error safely caught
    }
  }, [scrap, upgrades, unlockedShips, highScore, leaderboard, achievements]);

  // Handle Achievement Unlocking
  const unlockAchievement = useCallback((achievementId: string) => {
    setAchievements((prev) => {
      const found = prev.find((a) => a.id === achievementId);
      if (found && !found.unlocked) {
        sound.playPowerUp();
        setScrap((s) => s + found.rewardScrap);
        return prev.map((a) => (a.id === achievementId ? { ...a, unlocked: true } : a));
      }
      return prev;
    });
  }, []);

  // Cleanup all running engines
  const stopAllEngines = useCallback(() => {
    if (engine360Ref.current) {
      engine360Ref.current.stop();
      engine360Ref.current = null;
    }
    if (engineClassicRef.current) {
      engineClassicRef.current.stop();
      engineClassicRef.current = null;
    }
  }, []);

  // Launch Game Handler
  const launchGame = useCallback(
    (modeToPlay = gameMode) => {
      stopAllEngines();
      setGameMode(modeToPlay);
      setGameState('PLAYING');
      setActiveModal('NONE');

      setTimeout(() => {
        if (!canvasRef.current) return;

        if (modeToPlay === 'survivor_360') {
          // Launch 360 Degree Open Galaxy Roguelite
          const engine = new Galaxy360Engine(
            canvasRef.current,
            currentShipId,
            upgrades,
            {
              onScoreUpdate: (score, earnedScrap, combo) => {
                setHudStats((prev) => ({
                  ...prev,
                  score,
                  scrap: scrap + earnedScrap,
                  combo,
                }));
                if (score > highScore) setHighScore(score);
              },
              onPlayerStatusUpdate: (hp, maxHp, boost, bombs, maxBombs, level, xp, nextXp) => {
                setHudStats((prev) => ({
                  ...prev,
                  hp,
                  maxHp,
                  boost,
                  bombs,
                  maxBombs,
                  level,
                  xp,
                  nextXp,
                }));
              },
              onLevelUp: (choices) => {
                setLevelUpChoices(choices);
                setActiveModal('LEVEL_UP');
              },
              onBossAlert: (bossName) => {
                // Boss warp alert
              },
              onRadarUpdate: (playerPos, enemies, asteroids, gems) => {
                setRadarData({ playerPos, enemies, asteroids, gems });
              },
              onGameOver: (finalScore, finalScrap, survivalTime, level) => {
                setScrap((prev) => prev + finalScrap);
                const isNewHigh = finalScore > highScore;
                if (isNewHigh) setHighScore(finalScore);

                setGameOverStats({
                  finalScore,
                  finalScrap,
                  accuracy: 85,
                  maxCombo: level * 4,
                  stage: level,
                  isNewHighScore: isNewHigh,
                });
                setActiveModal('GAME_OVER');
              },
              onAchievementUnlock: (achId) => {
                unlockAchievement(achId);
              },
            }
          );

          engine.setAutoFire(autoFire);
          engine.start();
          engine360Ref.current = engine;
        } else {
          // Launch Classic Vertical Arcade Mode
          const engine = new GalaxyEngine(
            canvasRef.current,
            currentShipId,
            upgrades,
            modeToPlay,
            {
              onScoreUpdate: (score, earnedScrap, combo) => {
                setHudStats((prev) => ({
                  ...prev,
                  score,
                  scrap: scrap + earnedScrap,
                  combo,
                }));
                if (score > highScore) setHighScore(score);
              },
              onPlayerStatusUpdate: (hp, maxHp, bombs, maxBombs) => {
                setHudStats((prev) => ({
                  ...prev,
                  hp,
                  maxHp,
                  bombs,
                  maxBombs,
                }));
              },
              onWaveChange: (stage, wave, isBoss, isChallenging) => {
                setHudStats((prev) => ({
                  ...prev,
                  stage,
                  wave,
                  isBoss,
                  isChallenging,
                }));
              },
              onStageClear: () => {},
              onGameOver: (finalScore, finalScrap, accuracy, maxCombo, stage) => {
                setScrap((prev) => prev + finalScrap);
                const isNewHigh = finalScore > highScore;
                if (isNewHigh) setHighScore(finalScore);

                setGameOverStats({
                  finalScore,
                  finalScrap,
                  accuracy,
                  maxCombo,
                  stage,
                  isNewHighScore: isNewHigh,
                });
                setActiveModal('GAME_OVER');
              },
              onAchievementUnlock: (achId) => {
                unlockAchievement(achId);
              },
            }
          );

          engine.setAutoFire(autoFire);
          engine.start();
          engineClassicRef.current = engine;
        }
      }, 60);
    },
    [gameMode, currentShipId, upgrades, scrap, highScore, autoFire, unlockAchievement, stopAllEngines]
  );

  const returnToMenu = useCallback(() => {
    stopAllEngines();
    setGameState('MENU');
    setActiveModal('NONE');
  }, [stopAllEngines]);

  const handlePause = useCallback(() => {
    if (gameMode === 'survivor_360' && engine360Ref.current) {
      const isNowPaused = engine360Ref.current.togglePause();
      setActiveModal(isNowPaused ? 'PAUSE' : 'NONE');
    } else if (engineClassicRef.current) {
      const isNowPaused = engineClassicRef.current.togglePause();
      setActiveModal(isNowPaused ? 'PAUSE' : 'NONE');
    }
  }, [gameMode]);

  const handleResume = useCallback(() => {
    if (gameMode === 'survivor_360' && engine360Ref.current) {
      engine360Ref.current.togglePause();
      setActiveModal('NONE');
    } else if (engineClassicRef.current) {
      engineClassicRef.current.togglePause();
      setActiveModal('NONE');
    }
  }, [gameMode]);

  const handleTriggerBomb = useCallback(() => {
    if (gameMode === 'survivor_360' && engine360Ref.current) {
      engine360Ref.current.triggerBomb();
    } else if (engineClassicRef.current) {
      engineClassicRef.current.triggerBomb();
    }
  }, [gameMode]);

  const handleToggleAutoFire = useCallback(() => {
    const next = !autoFire;
    setAutoFire(next);
    if (engine360Ref.current) engine360Ref.current.setAutoFire(next);
    if (engineClassicRef.current) engineClassicRef.current.setAutoFire(next);
  }, [autoFire]);

  const handleSelectLevelUpCard = (card: AbilityCard) => {
    if (engine360Ref.current) {
      engine360Ref.current.selectAbilityUpgrade(card.id);
      setActiveModal('NONE');
    }
  };

  // Mouse & Touch events on canvas
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const scaleX = CANVAS_WIDTH / rect.width;
    const scaleY = CANVAS_HEIGHT / rect.height;
    const canvasX = (e.clientX - rect.left) * scaleX;
    const canvasY = (e.clientY - rect.top) * scaleY;

    if (gameMode === 'survivor_360' && engine360Ref.current) {
      // In 360 mode, convert canvas screen center offset to world coordinates
      const worldX = radarData.playerPos.x + (canvasX - CANVAS_WIDTH / 2);
      const worldY = radarData.playerPos.y + (canvasY - CANVAS_HEIGHT / 2);
      engine360Ref.current.setPointerWorld(worldX, worldY, true);
    } else if (engineClassicRef.current) {
      engineClassicRef.current.setPointerPosition(canvasX, canvasY, true);
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const scaleX = CANVAS_WIDTH / rect.width;
    const scaleY = CANVAS_HEIGHT / rect.height;
    const canvasX = (e.clientX - rect.left) * scaleX;
    const canvasY = (e.clientY - rect.top) * scaleY;

    if (gameMode === 'survivor_360' && engine360Ref.current) {
      const worldX = radarData.playerPos.x + (canvasX - CANVAS_WIDTH / 2);
      const worldY = radarData.playerPos.y + (canvasY - CANVAS_HEIGHT / 2);
      engine360Ref.current.setPointerWorld(worldX, worldY);
    } else if (engineClassicRef.current) {
      const isTouch = e.pointerType === 'touch';
      engineClassicRef.current.setPointerPosition(canvasX, canvasY - (isTouch ? 40 : 0));
    }
  };

  const handlePointerUp = () => {
    if (engine360Ref.current) engine360Ref.current.setFiring(false);
    if (engineClassicRef.current) engineClassicRef.current.setFiring(false);
  };

  // Upgrades & Fleet Management
  const handleShipUnlock = (shipId: ShipId, cost: number) => {
    if (scrap >= cost) {
      setScrap((s) => s - cost);
      setUnlockedShips((prev) => ({ ...prev, [shipId]: true }));
      setCurrentShipId(shipId);
    }
  };

  const handleUpgrade = (type: keyof PlayerUpgrades, cost: number) => {
    if (scrap >= cost) {
      setScrap((s) => s - cost);
      setUpgrades((prev) => ({ ...prev, [type]: prev[type] + 1 }));
    }
  };

  const handleSubmitScore = (pilotName: string) => {
    const newEntry: LeaderboardEntry = {
      id: Math.random().toString(),
      name: pilotName,
      score: gameOverStats.finalScore,
      wave: gameOverStats.stage,
      shipId: currentShipId,
      date: new Date().toISOString().split('T')[0],
      mode: gameMode,
    };
    setLeaderboard((prev) => [newEntry, ...prev].slice(0, 10));
  };

  const currentShip = SHIP_CONFIGS[currentShipId] || SHIP_CONFIGS.alpha_viper;

  return (
    <div className="flex flex-col min-h-screen bg-slate-950 text-slate-100 selection:bg-cyan-500 selection:text-black">
      {/* Top Bar Contract */}
      <header className="flex items-center justify-between gap-8 px-4 sm:px-8 py-3.5 border-b border-slate-800 bg-slate-900/90 backdrop-blur-md z-40">
        {/* Zone 1: Brand wordmark */}
        <button
          onClick={returnToMenu}
          className="text-lg sm:text-xl font-bold tracking-tight text-white flex items-center gap-2 whitespace-nowrap shrink-0 hover:text-cyan-400 transition-colors"
        >
          <Rocket className="w-5 h-5 text-cyan-400" />
          <span>GALAXY STRIKER</span>
        </button>

        {/* Zone 2: Navigation Links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-400">
          <button
            onClick={() => setActiveModal('HANGAR')}
            className="hover:text-cyan-300 transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5"
          >
            <Wrench className="w-4 h-4 text-cyan-400" />
            함선 격납고
          </button>
          <button
            onClick={() => setActiveModal('LEADERBOARD')}
            className="hover:text-amber-300 transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5"
          >
            <Trophy className="w-4 h-4 text-amber-400" />
            명예의 전당
          </button>
          <button
            onClick={() => setActiveModal('ACHIEVEMENTS')}
            className="hover:text-purple-300 transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5"
          >
            <Award className="w-4 h-4 text-purple-400" />
            업적 훈장
          </button>
          <button
            onClick={() => setActiveModal('HOW_TO_PLAY')}
            className="hover:text-blue-300 transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5"
          >
            <HelpCircle className="w-4 h-4 text-blue-400" />
            조작법
          </button>
        </nav>

        {/* Zone 3: 1 Primary CTA */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 bg-emerald-950/60 border border-emerald-800/70 rounded-lg text-xs">
            <span className="text-emerald-400">💎</span>
            <span className="font-mono-numbers font-bold text-emerald-300">{scrap.toLocaleString()}</span>
          </div>

          {gameState === 'MENU' ? (
            <button
              onClick={() => launchGame('survivor_360')}
              className="px-5 py-2 text-xs font-bold text-white bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 rounded-lg shadow-lg shadow-cyan-950/60 active:scale-95 transition-all whitespace-nowrap shrink-0 flex items-center gap-1.5"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              은하 출격 시작
            </button>
          ) : (
            <button
              onClick={handlePause}
              className="px-4 py-2 text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition-colors whitespace-nowrap shrink-0"
            >
              일시 정지
            </button>
          )}
        </div>
      </header>

      {/* Main Workspace */}
      <main className="flex-1 flex flex-col items-center justify-center p-2 sm:p-4 relative overflow-hidden">
        {gameState === 'MENU' ? (
          /* Title Menu & Mode Selector */
          <div className="w-full max-w-4xl mx-auto space-y-6 sm:space-y-8 py-4 sm:py-8 z-10">
            {/* Hero Header */}
            <div className="text-center space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/70 border border-cyan-800 text-cyan-300 text-xs font-semibold">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                <span>360° 은하 서바이벌 로그라이크 & 클래식 아케이드</span>
              </div>

              <h1 className="text-4xl sm:text-6xl font-black font-arcade tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-200 to-amber-400 drop-shadow-[0_0_25px_rgba(6,182,212,0.4)]">
                GALAXY STRIKER
              </h1>
              <p className="text-sm sm:text-base text-slate-400 max-w-xl mx-auto leading-relaxed">
                광활한 은하계를 360도 자유 비행하며 소행성을 채굴하고, 레벨 업 스킬 카드를 조합하여
                몰려오는 외계 편대와 거대 기함 보스를 격파하세요.
              </p>
            </div>

            {/* Game Modes */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Mode 1: 360 Degree Open Galaxy Roguelite (NEW!) */}
              <div
                onClick={() => launchGame('survivor_360')}
                className="group relative p-6 rounded-2xl bg-gradient-to-br from-slate-900/90 to-cyan-950/40 border-2 border-cyan-500/80 hover:border-cyan-400 transition-all duration-300 cursor-pointer shadow-2xl hover:shadow-[0_0_25px_rgba(6,182,212,0.35)] flex flex-col justify-between"
              >
                <div className="absolute top-4 right-4">
                  <span className="px-2.5 py-1 rounded-full bg-cyan-500 text-black text-[10px] font-black uppercase tracking-wider">
                    NEW FEATURE
                  </span>
                </div>

                <div>
                  <div className="p-3.5 rounded-xl bg-cyan-950/80 border border-cyan-700 text-cyan-300 w-fit mb-4 group-hover:scale-110 transition-transform">
                    <Compass className="w-7 h-7" />
                  </div>
                  <h2 className="text-xl font-black text-white group-hover:text-cyan-300 transition-colors flex items-center gap-2">
                    은하 서바이벌 (360° Open Space)
                  </h2>
                  <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                    광활한 우주 성간 구역을 360도 자유롭게 비행하며 소행성을 채굴하고 경험치 보석을 수집하세요.
                    레벨 업 시 <b>유도 미사일, 수호 위성, 연쇄 전격포, 블랙홀</b> 등 스킬 카드를 획득하여 무한 조합을 완성합니다!
                  </p>
                </div>
                <div className="mt-6 flex items-center justify-between text-xs font-bold text-cyan-400 pt-3 border-t border-cyan-900/40">
                  <span>360도 성간 비행 시작</span>
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>

              {/* Mode 2: Classic 2D Vertical Arcade Galaxian */}
              <div
                onClick={() => launchGame('arcade')}
                className="group relative p-6 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-amber-500 hover:bg-slate-900 transition-all duration-300 cursor-pointer shadow-xl hover:shadow-[0_0_20px_rgba(245,158,11,0.25)] flex flex-col justify-between"
              >
                <div>
                  <div className="p-3.5 rounded-xl bg-amber-950/80 border border-amber-800 text-amber-400 w-fit mb-4 group-hover:scale-110 transition-transform">
                    <Rocket className="w-7 h-7" />
                  </div>
                  <h2 className="text-xl font-bold text-white group-hover:text-amber-300 transition-colors">
                    클래식 아케이드 (Vertical Arcade)
                  </h2>
                  <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                    추억의 오락실 갤럭시/갤러그 방식의 클래식 종스크롤 슈팅 모드. 상단 편대의 급강하 다이브와
                    보너스 챌린징 스테이지, 5개 스테이지를 정복하세요.
                  </p>
                </div>
                <div className="mt-6 flex items-center justify-between text-xs font-bold text-amber-400 pt-3 border-t border-slate-800">
                  <span>정통 아케이드 모드 출격</span>
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </div>

            {/* Squadron Status Bar */}
            <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center border shadow-md"
                  style={{
                    backgroundColor: `${currentShip.color}15`,
                    borderColor: currentShip.color,
                  }}
                >
                  <Rocket className="w-6 h-6" style={{ color: currentShip.color }} />
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-white">{currentShip.name}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-medium">
                      현재 탑승 기체
                    </span>
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5">
                    {currentShip.specialAbility}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                <button
                  onClick={() => setActiveModal('HANGAR')}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 transition-colors"
                >
                  <Wrench className="w-4 h-4 text-cyan-400" />
                  기체 개조 & 강화
                </button>

                <button
                  onClick={() => setActiveModal('HOW_TO_PLAY')}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 transition-colors"
                >
                  <HelpCircle className="w-4 h-4 text-blue-400" />
                  조작 지침
                </button>
              </div>
            </div>

            {/* Bottom Audio / Controls Preference */}
            <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-slate-400 pt-2">
              <button
                onClick={() => {
                  const next = sound.toggleMute();
                  setIsMuted(next);
                }}
                className="flex items-center gap-1.5 hover:text-white transition-colors"
              >
                {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-cyan-400" />}
                <span>효과음 {isMuted ? '음소거' : '켜짐'}</span>
              </button>

              <button
                onClick={() => {
                  const next = sound.toggleBgmMute();
                  setIsBgmMuted(next);
                }}
                className="flex items-center gap-1.5 hover:text-white transition-colors"
              >
                <Music className={`w-4 h-4 ${isBgmMuted ? 'text-slate-500' : 'text-amber-400'}`} />
                <span>아케이드 BGM {isBgmMuted ? '음소거' : '켜짐'}</span>
              </button>

              <button
                onClick={() => setCrtEffect(!crtEffect)}
                className="flex items-center gap-1.5 hover:text-white transition-colors"
              >
                <Tv className={`w-4 h-4 ${crtEffect ? 'text-cyan-400' : 'text-slate-500'}`} />
                <span>CRT 주사선 {crtEffect ? 'ON' : 'OFF'}</span>
              </button>
            </div>
          </div>
        ) : (
          /* Active Playing Canvas Viewport */
          <div
            className={`relative w-full max-w-[640px] aspect-[640/860] max-h-[88vh] rounded-2xl overflow-hidden shadow-2xl border border-slate-800/90 ${
              crtEffect ? 'crt-overlay' : ''
            }`}
          >
            {/* Canvas */}
            <canvas
              ref={canvasRef}
              width={CANVAS_WIDTH}
              height={CANVAS_HEIGHT}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              className="w-full h-full block cursor-crosshair bg-slate-950"
            />

            {/* In-Game HUD */}
            <GameHud
              mode={gameMode}
              score={hudStats.score}
              highScore={highScore}
              scrap={hudStats.scrap}
              hp={hudStats.hp}
              maxHp={hudStats.maxHp}
              boost={hudStats.boost}
              bombs={hudStats.bombs}
              maxBombs={hudStats.maxBombs}
              level={hudStats.level}
              xp={hudStats.xp}
              nextXp={hudStats.nextXp}
              stage={hudStats.stage}
              wave={hudStats.wave}
              combo={hudStats.combo}
              isBoss={hudStats.isBoss}
              isChallenging={hudStats.isChallenging}
              isMuted={isMuted}
              isBgmMuted={isBgmMuted}
              onToggleMute={() => {
                const next = sound.toggleMute();
                setIsMuted(next);
              }}
              onToggleBgmMute={() => {
                const next = sound.toggleBgmMute();
                setIsBgmMuted(next);
              }}
              onPause={handlePause}
              onTriggerBomb={handleTriggerBomb}
            />

            {/* Tactical Radar in 360 mode */}
            {gameMode === 'survivor_360' && (
              <RadarMinimap
                playerPos={radarData.playerPos}
                enemies={radarData.enemies}
                asteroids={radarData.asteroids}
                gems={radarData.gems}
              />
            )}

            {/* Mobile Touch Controls */}
            {gameMode === 'survivor_360' ? (
              <TouchControls360
                onJoystickMove={(jx, jy) => {
                  if (engine360Ref.current) engine360Ref.current.setJoystickMove(jx, jy);
                }}
                onBoost={(boosting) => {
                  if (engine360Ref.current) engine360Ref.current.setBoost(boosting);
                }}
                onTriggerBomb={handleTriggerBomb}
                bombsAvailable={hudStats.bombs}
                boostAvailable={hudStats.boost}
                autoFire={autoFire}
                onToggleAutoFire={handleToggleAutoFire}
              />
            ) : (
              <TouchControls
                onTriggerBomb={handleTriggerBomb}
                bombsAvailable={hudStats.bombs}
                autoFire={autoFire}
                onToggleAutoFire={handleToggleAutoFire}
              />
            )}
          </div>
        )}

        {/* Level Up Roguelite Draft Modal */}
        {activeModal === 'LEVEL_UP' && (
          <LevelUpModal
            choices={levelUpChoices}
            onSelect={handleSelectLevelUpCard}
          />
        )}

        {/* Modal Dialogs */}
        {activeModal === 'HANGAR' && (
          <HangarModal
            currentShipId={currentShipId}
            unlockedShips={unlockedShips}
            scrap={scrap}
            upgrades={upgrades}
            onSelectShip={(id) => setCurrentShipId(id)}
            onUnlockShip={handleShipUnlock}
            onUpgrade={handleUpgrade}
            onClose={() => setActiveModal('NONE')}
          />
        )}

        {activeModal === 'LEADERBOARD' && (
          <LeaderboardModal
            entries={leaderboard}
            onClose={() => setActiveModal('NONE')}
          />
        )}

        {activeModal === 'ACHIEVEMENTS' && (
          <AchievementsModal
            achievements={achievements}
            onClose={() => setActiveModal('NONE')}
          />
        )}

        {activeModal === 'HOW_TO_PLAY' && (
          <HowToPlayModal onClose={() => setActiveModal('NONE')} />
        )}

        {activeModal === 'PAUSE' && (
          <PauseModal
            onResume={handleResume}
            onRestart={() => launchGame()}
            onOpenHangar={() => setActiveModal('HANGAR')}
            onOpenHowToPlay={() => setActiveModal('HOW_TO_PLAY')}
            onReturnToMenu={returnToMenu}
            isMuted={isMuted}
            onToggleMute={() => {
              const next = sound.toggleMute();
              setIsMuted(next);
            }}
          />
        )}

        {activeModal === 'GAME_OVER' && (
          <GameOverModal
            score={gameOverStats.finalScore}
            scrapEarned={gameOverStats.finalScrap}
            accuracy={gameOverStats.accuracy}
            maxCombo={gameOverStats.maxCombo}
            stage={gameOverStats.stage}
            shipId={currentShipId}
            mode={gameMode}
            isNewHighScore={gameOverStats.isNewHighScore}
            onRestart={() => launchGame()}
            onOpenHangar={() => setActiveModal('HANGAR')}
            onSubmitScore={handleSubmitScore}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="py-3 px-4 sm:px-8 border-t border-slate-900 bg-slate-950 text-slate-500 text-xs flex flex-col sm:flex-row items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span>GALAXY STRIKER</span>
          <span aria-hidden="true">·</span>
          <span>은하 서바이벌 & 클래식 아케이드</span>
        </div>
        <div className="flex items-center gap-4 text-[11px]">
          <span>PC: WASD(비행) + 마우스/Space(사격) + Shift(부스트) + B/X(EMP)</span>
          <span aria-hidden="true" className="hidden sm:inline">·</span>
          <span className="hidden sm:inline">모바일: 가상 조이스틱 + 부스트/EMP 버튼</span>
        </div>
      </footer>
    </div>
  );
}
