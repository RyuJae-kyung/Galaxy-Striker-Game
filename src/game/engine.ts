/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  SHIP_CONFIGS,
} from './constants';
import { sound } from './sound';
import {
  ShipId,
  ShipConfig,
  PlayerUpgrades,
  EnemyEntity,
  EnemyType,
  Bullet,
  Particle,
  FloatingText,
  PowerUpItem,
  PowerUpType,
  Star,
  GameMode,
} from './types';

export interface GameEngineCallbacks {
  onScoreUpdate: (score: number, scrap: number, combo: number) => void;
  onPlayerStatusUpdate: (hp: number, maxHp: number, bombs: number, maxBombs: number) => void;
  onWaveChange: (stage: number, wave: number, isBoss: boolean, isChallenging: boolean) => void;
  onGameOver: (finalScore: number, finalScrap: number, accuracy: number, maxCombo: number, stage: number) => void;
  onStageClear: (stage: number, accuracy: number, bonusScore: number) => void;
  onAchievementUnlock: (achievementId: string) => void;
}

export class GalaxyEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private callbacks: GameEngineCallbacks;

  // Running loop state
  private animationFrameId: number | null = null;
  private lastTime: number = 0;
  private isRunning: boolean = false;
  private isPaused: boolean = false;

  // Game Mode & Stage State
  private mode: GameMode = 'arcade';
  private currentStage: number = 1;
  private currentWaveInStage: number = 1;
  private isChallengingStage: boolean = false;
  private isBossWave: boolean = false;
  private stageState: 'PLAYING' | 'STAGE_INTRO' | 'STAGE_CLEAR' | 'CHALLENGE_RESULTS' = 'STAGE_INTRO';
  private stageIntroTimer: number = 2.5;

  // Player State
  private shipConfig: ShipConfig;
  private upgrades: PlayerUpgrades;
  private playerX: number = CANVAS_WIDTH / 2;
  private playerY: number = CANVAS_HEIGHT - 90;
  private playerTargetX: number = CANVAS_WIDTH / 2;
  private playerTargetY: number = CANVAS_HEIGHT - 90;
  private playerSpeed: number = 380;
  private playerTilt: number = 0; // -1 to 1 for banking animation
  private playerHp: number = 100;
  private playerMaxHp: number = 100;
  private playerBombs: number = 2;
  private maxBombs: number = 3;
  private invulnerableTimer: number = 0;
  private shootCooldown: number = 0;
  private autoFireEnabled: boolean = true;
  private isFiring: boolean = false;

  // PowerUp Timers (seconds remaining)
  private activePowerUps: {
    dualShot: number;
    tripleSpread: number;
    pierceLaser: number;
    overdrive: number;
  } = {
    dualShot: 0,
    tripleSpread: 0,
    pierceLaser: 0,
    overdrive: 0,
  };

  // Score & Statistics
  private score: number = 0;
  private sessionScrap: number = 0;
  private combo: number = 0;
  private maxCombo: number = 0;
  private shotsFired: number = 0;
  private shotsHit: number = 0;
  private challengeWaveKilled: number = 0;
  private totalChallengeSpawns: number = 0;

  // Entities
  private stars: Star[] = [];
  private enemies: EnemyEntity[] = [];
  private playerBullets: Bullet[] = [];
  private enemyBullets: Bullet[] = [];
  private particles: Particle[] = [];
  private floatingTexts: FloatingText[] = [];
  private powerUps: PowerUpItem[] = [];

  // Formation sway parameters (Classic Galaxian breathing grid)
  private formationOffsetX: number = 0;
  private formationSwayDir: number = 1;
  private formationSwaySpeed: number = 35;
  private diveTimer: number = 0;
  private diveInterval: number = 2.2;

  // Visual Effects
  private screenShake: number = 0;
  private shockwaveRadius: number = 0;
  private shockwaveAlpha: number = 0;
  private warpSpeed: number = 1;

  // Input states
  private keys: Record<string, boolean> = {};

  constructor(
    canvas: HTMLCanvasElement,
    shipId: ShipId,
    upgrades: PlayerUpgrades,
    mode: GameMode,
    callbacks: GameEngineCallbacks
  ) {
    this.canvas = canvas;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Failed to get 2D context');
    this.ctx = context;
    this.callbacks = callbacks;
    this.mode = mode;
    this.shipConfig = SHIP_CONFIGS[shipId] || SHIP_CONFIGS.alpha_viper;
    this.upgrades = upgrades;

    this.initStars();
    this.applyUpgrades();
    this.initControls();
  }

  private applyUpgrades() {
    const baseHp = this.shipConfig.baseHealth;
    // Shield upgrade increases max HP
    this.playerMaxHp = baseHp + (this.upgrades.maxShieldLevel - 1) * 25;
    this.playerHp = this.playerMaxHp;
    this.maxBombs = 2 + this.upgrades.bombStockLevel;
    this.playerBombs = this.maxBombs;
    this.playerSpeed = this.shipConfig.baseSpeed;
  }

  private initStars() {
    this.stars = [];
    const colors = ['#ffffff', '#a5f3fc', '#fbcfe8', '#fed7aa', '#c7d2fe'];
    for (let i = 0; i < 110; i++) {
      this.stars.push({
        x: Math.random() * CANVAS_WIDTH,
        y: Math.random() * CANVAS_HEIGHT,
        speed: 40 + Math.random() * 160,
        size: Math.random() > 0.85 ? 2.5 : Math.random() > 0.4 ? 1.5 : 1,
        color: colors[Math.floor(Math.random() * colors.length)],
        twinkleOffset: Math.random() * Math.PI * 2,
      });
    }
  }

  private initControls() {
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
  }

  private handleKeyDown = (e: KeyboardEvent) => {
    this.keys[e.code] = true;
    if (e.code === 'KeyP' || e.code === 'Escape') {
      this.togglePause();
    }
    if (e.code === 'KeyB' || e.code === 'KeyX') {
      this.triggerBomb();
    }
  };

  private handleKeyUp = (e: KeyboardEvent) => {
    this.keys[e.code] = false;
  };

  public setPointerPosition(canvasX: number, canvasY: number, firing?: boolean) {
    this.playerTargetX = Math.max(30, Math.min(CANVAS_WIDTH - 30, canvasX));
    this.playerTargetY = Math.max(80, Math.min(CANVAS_HEIGHT - 40, canvasY));
    if (firing !== undefined) {
      this.isFiring = firing;
    }
  }

  public setFiring(firing: boolean) {
    this.isFiring = firing;
  }

  public togglePause(): boolean {
    this.isPaused = !this.isPaused;
    if (!this.isPaused) {
      this.lastTime = performance.now();
    }
    return this.isPaused;
  }

  public setAutoFire(enabled: boolean) {
    this.autoFireEnabled = enabled;
  }

  public start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.isPaused = false;
    this.lastTime = performance.now();
    this.callbacks.onPlayerStatusUpdate(this.playerHp, this.playerMaxHp, this.playerBombs, this.maxBombs);
    this.callbacks.onScoreUpdate(this.score, this.sessionScrap, this.combo);
    this.startStage(this.currentStage);
    sound.startBgm();

    this.callbacks.onAchievementUnlock('first_sortie');

    const loop = (time: number) => {
      if (!this.isRunning) return;
      const dt = Math.min((time - this.lastTime) / 1000, 0.1);
      this.lastTime = time;

      if (!this.isPaused) {
        this.update(dt);
      }
      this.render();

      this.animationFrameId = requestAnimationFrame(loop);
    };

    this.animationFrameId = requestAnimationFrame(loop);
  }

  public stop() {
    this.isRunning = false;
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    sound.stopBgm();
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
  }

  // Stage setup and wave population
  private startStage(stage: number) {
    this.currentStage = stage;
    this.stageState = 'STAGE_INTRO';
    this.stageIntroTimer = 2.4;
    this.warpSpeed = 6;
    this.enemies = [];
    this.enemyBullets = [];
    this.playerBullets = [];

    // Stage 3 & 5 are Boss Stages in Arcade mode; Boss Rush is always Bosses!
    if (this.mode === 'boss_rush') {
      this.isBossWave = true;
      this.isChallengingStage = false;
    } else if (this.mode === 'arcade') {
      // Challenging Stage between Stage 2 and 3, or Stage 4 and 5
      if (stage === 2 && this.currentWaveInStage === 2) {
        this.isChallengingStage = true;
        this.isBossWave = false;
      } else if (stage === 3 || stage === 5) {
        this.isBossWave = true;
        this.isChallengingStage = false;
      } else {
        this.isBossWave = false;
        this.isChallengingStage = false;
      }
    } else {
      // Endless mode
      this.isBossWave = (stage % 4 === 0);
      this.isChallengingStage = false;
    }

    this.callbacks.onWaveChange(this.currentStage, this.currentWaveInStage, this.isBossWave, this.isChallengingStage);

    if (this.isBossWave) {
      sound.playBossAlarm();
    }

    this.spawnStageFormation();
  }

  private spawnStageFormation() {
    this.enemies = [];
    this.challengeWaveKilled = 0;

    if (this.isBossWave) {
      // Spawn Boss
      const isOverlord = this.currentStage >= 4 || this.mode === 'boss_rush';
      const bossType: EnemyType = isOverlord ? 'BOSS_OVERLORD' : 'BOSS_GORGON';
      const bossHp = isOverlord ? 1200 + this.currentStage * 200 : 700;

      this.enemies.push({
        id: 'boss_1',
        type: bossType,
        x: CANVAS_WIDTH / 2,
        y: -140,
        vx: 0,
        vy: 70,
        width: isOverlord ? 140 : 110,
        height: isOverlord ? 100 : 80,
        hp: bossHp,
        maxHp: bossHp,
        scoreValue: 5000 + this.currentStage * 1000,
        scrapValue: 80 + this.currentStage * 20,
        color: isOverlord ? '#ef4444' : '#f59e0b',
        formationX: CANVAS_WIDTH / 2,
        formationY: 170,
        state: 'ENTERING',
        stateTimer: 0,
        shootCooldown: 1.5,
        bossPhase: 1,
        bossAttackPattern: 0,
        shieldHp: 200,
        maxShieldHp: 200,
      });

      // Flanking Escort Drones for the Boss
      for (let i = 0; i < 4; i++) {
        const xOffset = (i - 1.5) * 80;
        this.enemies.push({
          id: `boss_escort_${i}`,
          type: 'COMMANDER',
          x: CANVAS_WIDTH / 2 + xOffset,
          y: -100 - i * 30,
          vx: 0,
          vy: 90,
          width: 38,
          height: 38,
          hp: 12,
          maxHp: 12,
          scoreValue: 400,
          scrapValue: 8,
          color: '#ef4444',
          formationX: CANVAS_WIDTH / 2 + xOffset,
          formationY: 260,
          state: 'ENTERING',
          stateTimer: 0,
          shootCooldown: 2.0 + Math.random(),
        });
      }
      return;
    }

    if (this.isChallengingStage) {
      // Classic Galaga Challenging Stage! Drones fly in formation loops and do not fire!
      this.totalChallengeSpawns = 24;
      for (let i = 0; i < 24; i++) {
        const group = Math.floor(i / 8);
        const indexInGroup = i % 8;
        const startX = group % 2 === 0 ? -40 - indexInGroup * 35 : CANVAS_WIDTH + 40 + indexInGroup * 35;
        const startY = 140 + group * 70;

        this.enemies.push({
          id: `challenge_${i}`,
          type: 'CHALLENGE_DRONE',
          x: startX,
          y: startY,
          vx: group % 2 === 0 ? 160 : -160,
          vy: 40,
          width: 32,
          height: 32,
          hp: 2,
          maxHp: 2,
          scoreValue: 300,
          scrapValue: 3,
          color: '#38bdf8',
          formationX: 80 + (i % 8) * 65,
          formationY: 100 + Math.floor(i / 8) * 55,
          state: 'DIVING',
          stateTimer: group * 1.8 + indexInGroup * 0.25,
          shootCooldown: 999, // Doesn't shoot
        });
      }
      return;
    }

    // Standard Galaxian Grid Formation
    // 4 Rows: Top row Commanders, Row 2 Infiltrators, Row 3 Interceptors, Row 4 Drones
    const rows = [
      { type: 'COMMANDER' as EnemyType, count: 6, hp: 5, score: 350, scrap: 5, color: '#ef4444' },
      { type: 'INFILTRATOR' as EnemyType, count: 8, hp: 4, score: 250, scrap: 4, color: '#a855f7' },
      { type: 'INTERCEPTOR' as EnemyType, count: 9, hp: 3, score: 180, scrap: 3, color: '#06b6d4' },
      { type: 'DRONE' as EnemyType, count: 10, hp: 2, score: 120, scrap: 2, color: '#22c55e' },
    ];

    let enemyIndex = 0;
    rows.forEach((row, rowIndex) => {
      const spacingX = (CANVAS_WIDTH - 80) / (row.count + 1);
      for (let c = 0; c < row.count; c++) {
        const targetFormationX = 40 + spacingX * (c + 1);
        const targetFormationY = 110 + rowIndex * 48;

        // Spawn above screen and swoop into position
        const spawnFromLeft = enemyIndex % 2 === 0;
        const spawnX = spawnFromLeft ? -30 - c * 25 : CANVAS_WIDTH + 30 + c * 25;
        const spawnY = -50 - rowIndex * 30;

        this.enemies.push({
          id: `enemy_${enemyIndex}`,
          type: row.type,
          x: spawnX,
          y: spawnY,
          vx: 0,
          vy: 0,
          width: row.type === 'COMMANDER' ? 36 : 30,
          height: row.type === 'COMMANDER' ? 36 : 30,
          hp: row.hp + Math.floor((this.currentStage - 1) * 0.6),
          maxHp: row.hp + Math.floor((this.currentStage - 1) * 0.6),
          scoreValue: row.score,
          scrapValue: row.scrap,
          color: row.color,
          formationX: targetFormationX,
          formationY: targetFormationY,
          state: 'ENTERING',
          stateTimer: 0.1 * enemyIndex, // Stagger entrance
          shootCooldown: 2.5 + Math.random() * 4,
        });

        enemyIndex++;
      }
    });
  }

  // Core Update Loop
  private update(dt: number) {
    this.updateStars(dt);
    this.updateParticles(dt);
    this.updateFloatingTexts(dt);
    this.updatePowerUps(dt);

    if (this.screenShake > 0) {
      this.screenShake = Math.max(0, this.screenShake - dt * 25);
    }
    if (this.shockwaveRadius > 0) {
      this.shockwaveRadius += dt * 800;
      this.shockwaveAlpha = Math.max(0, this.shockwaveAlpha - dt * 2);
    }

    // Stage Intro Countdown
    if (this.stageState === 'STAGE_INTRO') {
      this.stageIntroTimer -= dt;
      this.warpSpeed = Math.max(1, this.warpSpeed - dt * 2.5);
      if (this.stageIntroTimer <= 0) {
        this.stageState = 'PLAYING';
      }
    }

    this.updatePlayer(dt);
    this.updateBullets(dt);
    this.updateEnemies(dt);
    this.checkCollisions();

    // Check Stage Clear condition
    if (this.stageState === 'PLAYING') {
      if (this.enemies.length === 0) {
        this.handleStageCompletion();
      }
    }
  }

  private updateStars(dt: number) {
    for (const star of this.stars) {
      star.y += star.speed * dt * this.warpSpeed;
      if (star.y > CANVAS_HEIGHT) {
        star.y = -5;
        star.x = Math.random() * CANVAS_WIDTH;
      }
    }
  }

  private updatePlayer(dt: number) {
    if (this.invulnerableTimer > 0) {
      this.invulnerableTimer -= dt;
    }

    // Keyboard movement handling
    let moveX = 0;
    let moveY = 0;
    if (this.keys['ArrowLeft'] || this.keys['KeyA']) moveX -= 1;
    if (this.keys['ArrowRight'] || this.keys['KeyD']) moveX += 1;
    if (this.keys['ArrowUp'] || this.keys['KeyW']) moveY -= 1;
    if (this.keys['ArrowDown'] || this.keys['KeyS']) moveY += 1;

    if (moveX !== 0 || moveY !== 0) {
      const len = Math.hypot(moveX, moveY) || 1;
      this.playerX += (moveX / len) * this.playerSpeed * dt;
      this.playerY += (moveY / len) * this.playerSpeed * dt;
      this.playerTargetX = this.playerX;
      this.playerTargetY = this.playerY;
    } else {
      // Smooth interpolation toward pointer/touch target
      const dx = this.playerTargetX - this.playerX;
      const dy = this.playerTargetY - this.playerY;
      const dist = Math.hypot(dx, dy);
      if (dist > 1) {
        const step = Math.min(dist, this.playerSpeed * 1.6 * dt);
        this.playerX += (dx / dist) * step;
        this.playerY += (dy / dist) * step;
      }
    }

    // Screen bounds clamp
    this.playerX = Math.max(28, Math.min(CANVAS_WIDTH - 28, this.playerX));
    this.playerY = Math.max(90, Math.min(CANVAS_HEIGHT - 38, this.playerY));

    // Player Banking Tilt
    const targetTilt = moveX !== 0 ? moveX * 0.45 : (this.playerTargetX - this.playerX) * 0.015;
    this.playerTilt += (Math.max(-0.5, Math.min(0.5, targetTilt)) - this.playerTilt) * 10 * dt;

    // Thruster Particle Generation
    if (Math.random() < 0.65) {
      this.particles.push({
        x: this.playerX + (Math.random() * 8 - 4),
        y: this.playerY + 22,
        vx: (Math.random() - 0.5) * 20,
        vy: 120 + Math.random() * 80,
        color: this.shipConfig.engineGlow,
        size: 2.5 + Math.random() * 2.5,
        life: 0.25,
        maxLife: 0.25,
        alpha: 0.9,
      });
    }

    // PowerUp Active Countdown
    if (this.activePowerUps.dualShot > 0) this.activePowerUps.dualShot -= dt;
    if (this.activePowerUps.tripleSpread > 0) this.activePowerUps.tripleSpread -= dt;
    if (this.activePowerUps.pierceLaser > 0) this.activePowerUps.pierceLaser -= dt;
    if (this.activePowerUps.overdrive > 0) this.activePowerUps.overdrive -= dt;

    // Weapons firing
    this.shootCooldown -= dt;
    const shouldFire = this.autoFireEnabled || this.isFiring || this.keys['Space'];
    if (shouldFire && this.shootCooldown <= 0) {
      this.firePlayerWeapon();
    }
  }

  private firePlayerWeapon() {
    const isOverdrive = this.activePowerUps.overdrive > 0;
    const fireRateMultiplier = 1 + (this.upgrades.fireRateLevel - 1) * 0.2 + (isOverdrive ? 0.75 : 0);
    const baseCooldown = 1 / (this.shipConfig.baseFireRate * fireRateMultiplier);
    this.shootCooldown = baseCooldown;

    const damageMultiplier = 1 + (this.upgrades.damageLevel - 1) * 0.25;
    const baseDamage = 1.0 * damageMultiplier;

    this.shotsFired++;

    if (this.activePowerUps.pierceLaser > 0) {
      // High-power piercing continuous beam
      sound.playLaser('plasma');
      this.playerBullets.push({
        x: this.playerX,
        y: this.playerY - 24,
        vx: 0,
        vy: -900,
        width: 12,
        height: 38,
        damage: baseDamage * 2.2,
        color: '#c084fc',
        isPlayer: true,
        isLaser: true,
        piercing: true,
      });
    } else if (this.activePowerUps.tripleSpread > 0) {
      // 3-way spread volley
      sound.playLaser('scatter');
      [-16, 0, 16].forEach((angleDeg) => {
        const rad = (angleDeg * Math.PI) / 180;
        this.playerBullets.push({
          x: this.playerX + (angleDeg !== 0 ? Math.sign(angleDeg) * 12 : 0),
          y: this.playerY - 18,
          vx: Math.sin(rad) * 700,
          vy: -Math.cos(rad) * 700,
          width: 5,
          height: 16,
          damage: baseDamage * 1.1,
          color: '#f59e0b',
          isPlayer: true,
        });
      });
    } else if (this.activePowerUps.dualShot > 0 || this.shipConfig.id === 'solar_phoenix') {
      // Twin pulse cannons
      sound.playLaser('dual');
      [-10, 10].forEach((offset) => {
        this.playerBullets.push({
          x: this.playerX + offset,
          y: this.playerY - 18,
          vx: 0,
          vy: -750,
          width: 4,
          height: 18,
          damage: baseDamage * 1.0,
          color: this.shipConfig.color,
          isPlayer: true,
        });
      });
    } else {
      // Standard dual blaster
      sound.playLaser('single');
      [-8, 8].forEach((offset) => {
        this.playerBullets.push({
          x: this.playerX + offset,
          y: this.playerY - 18,
          vx: 0,
          vy: -720,
          width: 4,
          height: 15,
          damage: baseDamage,
          color: this.shipConfig.color,
          isPlayer: true,
        });
      });
    }

    // Support Drones (Option wingmen flanking player ship!)
    const droneCount = this.upgrades.droneLevel;
    if (droneCount >= 1) {
      // Drone 1: Left
      this.playerBullets.push({
        x: this.playerX - 34,
        y: this.playerY + 4,
        vx: 0,
        vy: -700,
        width: 3,
        height: 12,
        damage: baseDamage * 0.6,
        color: '#38bdf8',
        isPlayer: true,
      });
    }
    if (droneCount >= 2) {
      // Drone 2: Right
      this.playerBullets.push({
        x: this.playerX + 34,
        y: this.playerY + 4,
        vx: 0,
        vy: -700,
        width: 3,
        height: 12,
        damage: baseDamage * 0.6,
        color: '#38bdf8',
        isPlayer: true,
      });
    }
  }

  public triggerBomb() {
    if (this.playerBombs <= 0) return;
    this.playerBombs--;
    this.callbacks.onPlayerStatusUpdate(this.playerHp, this.playerMaxHp, this.playerBombs, this.maxBombs);
    sound.playBomb();

    this.screenShake = 16;
    this.shockwaveRadius = 10;
    this.shockwaveAlpha = 1.0;

    // Destroy all enemy bullets
    for (const b of this.enemyBullets) {
      this.createSparkExplosion(b.x, b.y, '#f43f5e', 4);
    }
    this.enemyBullets = [];

    // Damage all enemies on screen
    let killedCount = 0;
    for (const enemy of this.enemies) {
      enemy.hp -= 35;
      this.createSparkExplosion(enemy.x, enemy.y, '#38bdf8', 6);
      if (enemy.hp <= 0) {
        killedCount++;
      }
    }

    if (killedCount >= 8) {
      this.callbacks.onAchievementUnlock('bomb_expert');
    }

    this.floatingTexts.push({
      id: Math.random().toString(),
      x: CANVAS_WIDTH / 2,
      y: CANVAS_HEIGHT / 2 - 40,
      text: 'EMP NOVA DETONATION!',
      color: '#38bdf8',
      fontSize: 20,
      life: 1.2,
      maxLife: 1.2,
    });
  }

  private updateBullets(dt: number) {
    // Player bullets
    for (let i = this.playerBullets.length - 1; i >= 0; i--) {
      const b = this.playerBullets[i];
      b.x += b.vx * dt;
      b.y += b.vy * dt;

      if (b.y < -30 || b.x < -30 || b.x > CANVAS_WIDTH + 30) {
        this.playerBullets.splice(i, 1);
      }
    }

    // Enemy bullets
    for (let i = this.enemyBullets.length - 1; i >= 0; i--) {
      const b = this.enemyBullets[i];
      b.x += b.vx * dt;
      b.y += b.vy * dt;

      if (b.y > CANVAS_HEIGHT + 30 || b.y < -30 || b.x < -30 || b.x > CANVAS_WIDTH + 30) {
        this.enemyBullets.splice(i, 1);
      }
    }
  }

  private updateEnemies(dt: number) {
    const isOverdrive = this.activePowerUps.overdrive > 0;
    const timeScale = isOverdrive ? 0.45 : 1.0;

    // Formation Breathing & Swaying
    this.formationOffsetX += this.formationSwayDir * this.formationSwaySpeed * dt * timeScale;
    if (Math.abs(this.formationOffsetX) > 35) {
      this.formationSwayDir *= -1;
    }

    // Dive Timer (trigger classic swooping dive-bomb attack runs!)
    if (!this.isChallengingStage && !this.isBossWave && this.stageState === 'PLAYING') {
      this.diveTimer += dt * timeScale;
      if (this.diveTimer >= this.diveInterval) {
        this.diveTimer = 0;
        this.triggerFormationDive();
      }
    }

    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const enemy = this.enemies[i];
      enemy.stateTimer += dt * timeScale;

      // Behavior by State
      switch (enemy.state) {
        case 'ENTERING': {
          const targetX = enemy.formationX + this.formationOffsetX;
          const targetY = enemy.formationY;
          const dx = targetX - enemy.x;
          const dy = targetY - enemy.y;
          const dist = Math.hypot(dx, dy);
          if (dist < 10) {
            enemy.state = this.isBossWave ? 'BOSS_PATTERN' : 'IN_FORMATION';
          } else {
            const speed = 220 * timeScale;
            enemy.x += (dx / dist) * speed * dt;
            enemy.y += (dy / dist) * speed * dt;
          }
          break;
        }

        case 'IN_FORMATION': {
          // Stay locked in floating formation grid
          enemy.x = enemy.formationX + this.formationOffsetX;
          enemy.y = enemy.formationY + Math.sin(enemy.stateTimer * 2 + enemy.formationX * 0.05) * 4;

          // Occasional formation shooting
          enemy.shootCooldown -= dt * timeScale;
          if (enemy.shootCooldown <= 0 && enemy.type !== 'CHALLENGE_DRONE') {
            enemy.shootCooldown = 4.5 + Math.random() * 4;
            this.enemyFire(enemy);
          }
          break;
        }

        case 'DIVING': {
          if (enemy.diveTrajectory) {
            const t = enemy.diveTrajectory.t;
            enemy.diveTrajectory.t += dt * enemy.diveTrajectory.speed * timeScale;

            // Cubic Bézier curve swooping path
            const p0 = { x: enemy.formationX, y: enemy.formationY };
            const p1 = { x: enemy.diveTrajectory.controlX1, y: enemy.diveTrajectory.controlY1 };
            const p2 = { x: enemy.diveTrajectory.controlX2, y: enemy.diveTrajectory.controlY2 };
            const p3 = { x: enemy.diveTrajectory.targetX, y: enemy.diveTrajectory.targetY };

            const u = 1 - t;
            enemy.x = u * u * u * p0.x + 3 * u * u * t * p1.x + 3 * u * t * t * p2.x + t * t * t * p3.x;
            enemy.y = u * u * u * p0.y + 3 * u * u * t * p1.y + 3 * u * t * t * p2.y + t * t * t * p3.y;

            // Fire during dive
            enemy.shootCooldown -= dt * timeScale;
            if (enemy.shootCooldown <= 0 && enemy.type !== 'CHALLENGE_DRONE') {
              enemy.shootCooldown = 999; // 1 burst per dive
              this.enemyFire(enemy);
            }

            if (t >= 1 || enemy.y > CANVAS_HEIGHT + 40) {
              // Wrap around from top back to formation
              enemy.state = 'RETURNING';
              enemy.x = enemy.formationX + this.formationOffsetX;
              enemy.y = -40;
            }
          }
          break;
        }

        case 'RETURNING': {
          const targetX = enemy.formationX + this.formationOffsetX;
          const targetY = enemy.formationY;
          const dy = targetY - enemy.y;
          enemy.y += 180 * dt * timeScale;
          enemy.x += (targetX - enemy.x) * 4 * dt;
          if (dy <= 5) {
            enemy.state = 'IN_FORMATION';
          }
          break;
        }

        case 'BOSS_PATTERN': {
          // Boss attack routine
          this.updateBossBehavior(enemy, dt * timeScale);
          break;
        }
      }
    }
  }

  // Classic Galaxian dive maneuver selection
  private triggerFormationDive() {
    const formationEnemies = this.enemies.filter((e) => e.state === 'IN_FORMATION');
    if (formationEnemies.length === 0) return;

    // Pick a dive leader (prefer Commanders or Interceptors)
    const leaders = formationEnemies.filter((e) => e.type === 'COMMANDER');
    const leader = leaders.length > 0
      ? leaders[Math.floor(Math.random() * leaders.length)]
      : formationEnemies[Math.floor(Math.random() * formationEnemies.length)];

    sound.playDiveSwoop();

    const diveTargetX = this.playerX + (Math.random() * 120 - 60);
    const diveTargetY = CANVAS_HEIGHT + 60;

    leader.state = 'DIVING';
    leader.shootCooldown = 0.6 + Math.random() * 0.4;
    leader.diveTrajectory = {
      controlX1: leader.x + (Math.random() > 0.5 ? 180 : -180),
      controlY1: leader.y + 200,
      controlX2: diveTargetX + (Math.random() > 0.5 ? 100 : -100),
      controlY2: CANVAS_HEIGHT - 180,
      targetX: diveTargetX,
      targetY: diveTargetY,
      t: 0,
      speed: 0.45 + (this.currentStage * 0.04),
    };

    // If Commander, optionally bring 1 escort Drone along!
    if (leader.type === 'COMMANDER') {
      const escorts = formationEnemies.filter((e) => e.type === 'DRONE' && e.id !== leader.id);
      if (escorts.length > 0) {
        const escort = escorts[0];
        escort.state = 'DIVING';
        escort.shootCooldown = 0.9;
        escort.diveTrajectory = {
          controlX1: leader.diveTrajectory.controlX1 - 40,
          controlY1: leader.diveTrajectory.controlY1 - 20,
          controlX2: leader.diveTrajectory.controlX2 - 40,
          controlY2: leader.diveTrajectory.controlY2 - 20,
          targetX: diveTargetX - 40,
          targetY: diveTargetY,
          t: 0,
          speed: leader.diveTrajectory.speed * 1.02,
        };
      }
    }
  }

  // Boss attack logic
  private updateBossBehavior(boss: EnemyEntity, dt: number) {
    // Gentle sway back and forth
    boss.x = CANVAS_WIDTH / 2 + Math.sin(boss.stateTimer * 1.2) * 160;
    boss.y = 160 + Math.cos(boss.stateTimer * 0.8) * 35;

    boss.shootCooldown -= dt;
    if (boss.shootCooldown <= 0) {
      boss.bossAttackPattern = ((boss.bossAttackPattern || 0) + 1) % 3;
      boss.shootCooldown = 1.6 - Math.min(0.8, this.currentStage * 0.12);

      // Attack Pattern 1: Quad Laser Salvo
      if (boss.bossAttackPattern === 0) {
        sound.playEnemyLaser();
        [-40, -15, 15, 40].forEach((ox) => {
          this.enemyBullets.push({
            x: boss.x + ox,
            y: boss.y + 40,
            vx: ox * 1.2,
            vy: 280,
            width: 5,
            height: 18,
            damage: 18,
            color: '#f43f5e',
            isPlayer: false,
          });
        });
      }
      // Attack Pattern 2: Circular Bullet Ring
      else if (boss.bossAttackPattern === 1) {
        sound.playEnemyLaser();
        const bulletCount = 10;
        for (let b = 0; b < bulletCount; b++) {
          const angle = (b / bulletCount) * Math.PI * 2;
          this.enemyBullets.push({
            x: boss.x,
            y: boss.y + 20,
            vx: Math.cos(angle) * 180,
            vy: Math.sin(angle) * 180,
            width: 7,
            height: 7,
            damage: 15,
            color: '#fbbf24',
            isPlayer: false,
          });
        }
      }
      // Attack Pattern 3: Targeted Tri-Shot directly at player
      else {
        sound.playEnemyLaser();
        const dx = this.playerX - boss.x;
        const dy = this.playerY - boss.y;
        const angle = Math.atan2(dy, dx);
        [-0.2, 0, 0.2].forEach((offsetAngle) => {
          const a = angle + offsetAngle;
          this.enemyBullets.push({
            x: boss.x,
            y: boss.y + 35,
            vx: Math.cos(a) * 320,
            vy: Math.sin(a) * 320,
            width: 6,
            height: 14,
            damage: 20,
            color: '#ec4899',
            isPlayer: false,
          });
        });
      }
    }
  }

  private enemyFire(enemy: EnemyEntity) {
    sound.playEnemyLaser();
    const dx = this.playerX - enemy.x;
    const dy = this.playerY - enemy.y;
    const len = Math.hypot(dx, dy) || 1;

    const bulletSpeed = 260 + this.currentStage * 15;
    this.enemyBullets.push({
      x: enemy.x,
      y: enemy.y + enemy.height / 2,
      vx: (dx / len) * (bulletSpeed * 0.4),
      vy: bulletSpeed,
      width: 4,
      height: 12,
      damage: 12,
      color: '#f43f5e',
      isPlayer: false,
    });
  }

  private updatePowerUps(dt: number) {
    for (let i = this.powerUps.length - 1; i >= 0; i--) {
      const p = this.powerUps[i];
      p.pulseTimer += dt * 4;

      // Magnetize towards player if close
      const dx = this.playerX - p.x;
      const dy = this.playerY - p.y;
      const dist = Math.hypot(dx, dy);
      if (dist < 130) {
        p.x += (dx / dist) * 240 * dt;
        p.y += (dy / dist) * 240 * dt;
      } else {
        p.y += p.vy * dt;
        p.x += Math.sin(p.pulseTimer * 1.5) * 25 * dt;
      }

      // Check pickup
      if (dist < 32) {
        this.collectPowerUp(p);
        this.powerUps.splice(i, 1);
        continue;
      }

      if (p.y > CANVAS_HEIGHT + 20) {
        this.powerUps.splice(i, 1);
      }
    }
  }

  private collectPowerUp(p: PowerUpItem) {
    sound.playPowerUp();
    switch (p.type) {
      case 'DUAL_CANNON':
        this.activePowerUps.dualShot = 15;
        this.spawnFloatingText(p.x, p.y, 'DUAL CANNONS!', '#38bdf8');
        break;
      case 'TRIPLE_SPREAD':
        this.activePowerUps.tripleSpread = 12;
        this.spawnFloatingText(p.x, p.y, 'TRIPLE SPREAD!', '#f59e0b');
        break;
      case 'PIERCE_LASER':
        this.activePowerUps.pierceLaser = 10;
        this.spawnFloatingText(p.x, p.y, 'PIERCE LASER!', '#c084fc');
        break;
      case 'HYPER_OVERDRIVE':
        this.activePowerUps.overdrive = 8;
        this.spawnFloatingText(p.x, p.y, 'HYPER OVERDRIVE!', '#ec4899');
        break;
      case 'SHIELD_REPAIR':
        this.playerHp = Math.min(this.playerMaxHp, this.playerHp + 40);
        this.callbacks.onPlayerStatusUpdate(this.playerHp, this.playerMaxHp, this.playerBombs, this.maxBombs);
        this.spawnFloatingText(p.x, p.y, 'SHIELD RESTORED +40', '#10b981');
        break;
      case 'EMP_BOMB':
        this.playerBombs = Math.min(this.maxBombs, this.playerBombs + 1);
        this.callbacks.onPlayerStatusUpdate(this.playerHp, this.playerMaxHp, this.playerBombs, this.maxBombs);
        this.spawnFloatingText(p.x, p.y, '+1 EMP BOMB', '#06b6d4');
        break;
      case 'WINGMAN_DRONE':
        if (this.upgrades.droneLevel < 2) {
          this.upgrades.droneLevel++;
          if (this.upgrades.droneLevel === 2) {
            this.callbacks.onAchievementUnlock('dual_pilot');
          }
        }
        this.spawnFloatingText(p.x, p.y, 'WINGMAN DRONE ACTIVATED!', '#38bdf8');
        break;
      case 'SCRAP_GEM':
        this.sessionScrap += 15;
        this.score += 250;
        this.spawnFloatingText(p.x, p.y, '+15 SCRAP', '#a7f3d0');
        this.callbacks.onScoreUpdate(this.score, this.sessionScrap, this.combo);
        break;
    }
  }

  private checkCollisions() {
    // 1. Player Bullets vs Enemies
    for (let bi = this.playerBullets.length - 1; bi >= 0; bi--) {
      const b = this.playerBullets[bi];
      for (let ei = this.enemies.length - 1; ei >= 0; ei--) {
        const enemy = this.enemies[ei];
        const halfW = enemy.width / 2;
        const halfH = enemy.height / 2;

        if (
          b.x >= enemy.x - halfW &&
          b.x <= enemy.x + halfW &&
          b.y >= enemy.y - halfH &&
          b.y <= enemy.y + halfH
        ) {
          // Hit!
          this.shotsHit++;
          enemy.hp -= b.damage;
          this.combo++;
          if (this.combo > this.maxCombo) {
            this.maxCombo = this.combo;
          }

          sound.playHit();
          this.createSparkExplosion(b.x, b.y, b.color, 4);

          if (!b.piercing) {
            this.playerBullets.splice(bi, 1);
          }

          // Enemy destroyed?
          if (enemy.hp <= 0) {
            this.handleEnemyDefeated(enemy, ei);
          }
          break;
        }
      }
    }

    // 2. Enemy Bullets vs Player
    if (this.invulnerableTimer <= 0) {
      for (let bi = this.enemyBullets.length - 1; bi >= 0; bi--) {
        const b = this.enemyBullets[bi];
        const dist = Math.hypot(b.x - this.playerX, b.y - this.playerY);
        if (dist < 22) {
          this.handlePlayerHit(b.damage);
          this.createSparkExplosion(b.x, b.y, '#f43f5e', 8);
          this.enemyBullets.splice(bi, 1);
          break;
        }
      }

      // 3. Enemy Body vs Player (Ramming damage)
      for (const enemy of this.enemies) {
        const dist = Math.hypot(enemy.x - this.playerX, enemy.y - this.playerY);
        if (dist < 28) {
          this.handlePlayerHit(25);
          enemy.hp -= 20;
          this.createSparkExplosion(this.playerX, this.playerY, '#ef4444', 12);
          break;
        }
      }
    }
  }

  private handlePlayerHit(damage: number) {
    this.playerHp -= damage;
    this.invulnerableTimer = 1.6;
    this.combo = 0; // Combo reset on hit
    this.screenShake = 12;
    sound.playExplosion('small');

    this.callbacks.onPlayerStatusUpdate(this.playerHp, this.playerMaxHp, this.playerBombs, this.maxBombs);
    this.callbacks.onScoreUpdate(this.score, this.sessionScrap, this.combo);

    if (this.playerHp <= 0) {
      this.handleGameOver();
    }
  }

  private handleEnemyDefeated(enemy: EnemyEntity, index: number) {
    const isBoss = enemy.type === 'BOSS_GORGON' || enemy.type === 'BOSS_OVERLORD';
    sound.playExplosion(isBoss ? 'boss' : enemy.type === 'COMMANDER' ? 'medium' : 'small');

    if (isBoss) {
      this.screenShake = 22;
      this.shockwaveRadius = 15;
      this.shockwaveAlpha = 1.0;
      this.callbacks.onAchievementUnlock('gorgon_slayer');
    }

    // Score & Scrap with combo multiplier
    const comboMultiplier = 1 + Math.min(2.5, Math.floor(this.combo / 10) * 0.25);
    const earnedScore = Math.floor(enemy.scoreValue * comboMultiplier);
    this.score += earnedScore;
    this.sessionScrap += enemy.scrapValue;

    if (this.sessionScrap >= 1000) {
      this.callbacks.onAchievementUnlock('scrap_collector');
    }

    this.callbacks.onScoreUpdate(this.score, this.sessionScrap, this.combo);

    // Floating score popup
    this.spawnFloatingText(
      enemy.x,
      enemy.y,
      `+${earnedScore}${this.combo >= 10 ? ` (${this.combo}x)` : ''}`,
      enemy.color
    );

    // Chance to drop power-up item
    this.rollPowerUpDrop(enemy.x, enemy.y, enemy.type);

    // Explosion particles
    this.createDeathExplosion(enemy.x, enemy.y, enemy.color, isBoss ? 45 : 16);

    if (enemy.type === 'CHALLENGE_DRONE') {
      this.challengeWaveKilled++;
    }

    this.enemies.splice(index, 1);
  }

  private rollPowerUpDrop(x: number, y: number, type: EnemyType) {
    const dropRate = type.startsWith('BOSS') ? 1.0 : type === 'COMMANDER' ? 0.45 : 0.16;
    if (Math.random() > dropRate) return;

    const roll = Math.random();
    let powerType: PowerUpType = 'SCRAP_GEM';
    if (roll < 0.22) powerType = 'DUAL_CANNON';
    else if (roll < 0.4) powerType = 'TRIPLE_SPREAD';
    else if (roll < 0.55) powerType = 'PIERCE_LASER';
    else if (roll < 0.7) powerType = 'SHIELD_REPAIR';
    else if (roll < 0.82) powerType = 'EMP_BOMB';
    else if (roll < 0.92) powerType = 'WINGMAN_DRONE';
    else powerType = 'HYPER_OVERDRIVE';

    this.powerUps.push({
      id: Math.random().toString(),
      type: powerType,
      x,
      y,
      vy: 85,
      radius: 14,
      pulseTimer: 0,
    });
  }

  private handleStageCompletion() {
    this.stageState = 'STAGE_CLEAR';
    sound.playPowerUp();

    const accuracy = this.shotsFired > 0 ? Math.round((this.shotsHit / this.shotsFired) * 100) : 100;
    const stageBonus = this.currentStage * 1500 + Math.floor(accuracy * 15);
    this.score += stageBonus;
    this.callbacks.onScoreUpdate(this.score, this.sessionScrap, this.combo);

    if (this.isChallengingStage && accuracy >= 80) {
      this.callbacks.onAchievementUnlock('sharpshooter');
    }

    this.callbacks.onStageClear(this.currentStage, accuracy, stageBonus);

    // If completed 5 stages in arcade mode, unlock galaxy savior achievement!
    if (this.mode === 'arcade' && this.currentStage >= 5) {
      this.callbacks.onAchievementUnlock('galaxy_savior');
    }

    // Automatic transition to next stage after short victory dwell
    setTimeout(() => {
      if (!this.isRunning) return;
      this.currentStage++;
      this.currentWaveInStage++;
      this.startStage(this.currentStage);
    }, 2800);
  }

  private handleGameOver() {
    this.isRunning = false;
    sound.stopBgm();
    sound.playExplosion('boss');

    const accuracy = this.shotsFired > 0 ? Math.round((this.shotsHit / this.shotsFired) * 100) : 0;
    this.callbacks.onGameOver(this.score, this.sessionScrap, accuracy, this.maxCombo, this.currentStage);
  }

  private createSparkExplosion(x: number, y: number, color: string, count: number) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 40 + Math.random() * 140;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color,
        size: 2 + Math.random() * 2,
        life: 0.2 + Math.random() * 0.15,
        maxLife: 0.35,
        alpha: 1,
      });
    }
  }

  private createDeathExplosion(x: number, y: number, color: string, count: number) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 60 + Math.random() * 220;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color: Math.random() > 0.4 ? color : '#facc15',
        size: 3 + Math.random() * 4,
        life: 0.4 + Math.random() * 0.3,
        maxLife: 0.7,
        alpha: 1,
        sparkle: Math.random() > 0.5,
      });
    }
  }

  private spawnFloatingText(x: number, y: number, text: string, color: string) {
    this.floatingTexts.push({
      id: Math.random().toString(),
      x,
      y,
      text,
      color,
      fontSize: 13,
      life: 0.85,
      maxLife: 0.85,
    });
  }

  private updateParticles(dt: number) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;
      p.alpha = Math.max(0, p.life / p.maxLife);

      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }

  private updateFloatingTexts(dt: number) {
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i];
      ft.y -= 35 * dt;
      ft.life -= dt;
      if (ft.life <= 0) {
        this.floatingTexts.splice(i, 1);
      }
    }
  }

  // ================= RENDER SYSTEM =================
  private render() {
    const ctx = this.ctx;

    // Apply screen shake
    ctx.save();
    if (this.screenShake > 0) {
      const shakeX = (Math.random() - 0.5) * this.screenShake;
      const shakeY = (Math.random() - 0.5) * this.screenShake;
      ctx.translate(shakeX, shakeY);
    }

    // Dark space background with subtle nebulae
    ctx.fillStyle = '#050711';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Distant Cosmic Nebula Glows
    const grad1 = ctx.createRadialGradient(CANVAS_WIDTH * 0.3, CANVAS_HEIGHT * 0.4, 40, CANVAS_WIDTH * 0.3, CANVAS_HEIGHT * 0.4, 280);
    grad1.addColorStop(0, 'rgba(88, 28, 135, 0.15)');
    grad1.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = grad1;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    const grad2 = ctx.createRadialGradient(CANVAS_WIDTH * 0.7, CANVAS_HEIGHT * 0.7, 50, CANVAS_WIDTH * 0.7, CANVAS_HEIGHT * 0.7, 240);
    grad2.addColorStop(0, 'rgba(6, 182, 212, 0.1)');
    grad2.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = grad2;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Stars
    this.renderStars();

    // Shockwave ring
    if (this.shockwaveRadius > 0 && this.shockwaveAlpha > 0) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2, this.shockwaveRadius, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(56, 189, 248, ${this.shockwaveAlpha})`;
      ctx.lineWidth = 6;
      ctx.stroke();
      ctx.restore();
    }

    // Power-up items
    this.renderPowerUps();

    // Bullets
    this.renderBullets();

    // Enemies
    this.renderEnemies();

    // Player Ship & Drones
    this.renderPlayer();

    // Particles
    this.renderParticles();

    // Floating Score Texts
    this.renderFloatingTexts();

    // Stage Intro / Boss Warning Overlay
    this.renderStageBanners();

    ctx.restore();
  }

  private renderStars() {
    const ctx = this.ctx;
    for (const star of this.stars) {
      ctx.fillStyle = star.color;
      if (this.warpSpeed > 1.5) {
        // Star streaks in warp speed
        ctx.fillRect(star.x, star.y, star.size, star.size * this.warpSpeed * 1.5);
      } else {
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  private renderPowerUps() {
    const ctx = this.ctx;
    for (const p of this.powerUps) {
      ctx.save();
      ctx.translate(p.x, p.y);

      // Pulsing outer aura
      const auraScale = 1 + Math.sin(p.pulseTimer) * 0.15;
      ctx.beginPath();
      ctx.arc(0, 0, p.radius * auraScale, 0, Math.PI * 2);

      let color = '#38bdf8';
      let icon = 'P';
      if (p.type === 'DUAL_CANNON') { color = '#06b6d4'; icon = '2x'; }
      else if (p.type === 'TRIPLE_SPREAD') { color = '#f59e0b'; icon = '3W'; }
      else if (p.type === 'PIERCE_LASER') { color = '#c084fc'; icon = 'LZ'; }
      else if (p.type === 'HYPER_OVERDRIVE') { color = '#ec4899'; icon = 'OV'; }
      else if (p.type === 'SHIELD_REPAIR') { color = '#10b981'; icon = 'SH'; }
      else if (p.type === 'EMP_BOMB') { color = '#ef4444'; icon = 'BM'; }
      else if (p.type === 'WINGMAN_DRONE') { color = '#60a5fa'; icon = 'DR'; }
      else if (p.type === 'SCRAP_GEM') { color = '#34d399'; icon = '💎'; }

      ctx.fillStyle = `${color}33`;
      ctx.fill();
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.stroke();

      // Icon badge
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 10px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(icon, 0, 1);

      ctx.restore();
    }
  }

  private renderBullets() {
    const ctx = this.ctx;

    // Player bullets
    for (const b of this.playerBullets) {
      ctx.save();
      ctx.fillStyle = b.color;
      ctx.shadowColor = b.color;
      ctx.shadowBlur = b.isLaser ? 14 : 6;

      if (b.isLaser) {
        // Continuous energy beam
        ctx.fillRect(b.x - b.width / 2, b.y, b.width, b.height);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(b.x - b.width / 4, b.y, b.width / 2, b.height);
      } else {
        // Rounded plasma bolt
        ctx.beginPath();
        ctx.ellipse(b.x, b.y, b.width / 2, b.height / 2, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    // Enemy bullets
    for (const b of this.enemyBullets) {
      ctx.save();
      ctx.fillStyle = b.color;
      ctx.shadowColor = b.color;
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.ellipse(b.x, b.y, b.width / 2, b.height / 2, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  private renderEnemies() {
    const ctx = this.ctx;
    for (const enemy of this.enemies) {
      ctx.save();
      ctx.translate(enemy.x, enemy.y);

      // Bank or rotate during dive
      if (enemy.state === 'DIVING') {
        const tilt = Math.atan2(enemy.vy, enemy.vx) - Math.PI / 2;
        ctx.rotate(tilt * 0.5);
      }

      this.drawEnemySprite(enemy);

      // Health bar for Boss or tough enemies
      if (enemy.hp < enemy.maxHp || enemy.type.startsWith('BOSS')) {
        const barWidth = enemy.width;
        const hpPercent = Math.max(0, enemy.hp / enemy.maxHp);
        ctx.fillStyle = 'rgba(15, 23, 42, 0.7)';
        ctx.fillRect(-barWidth / 2, -enemy.height / 2 - 10, barWidth, 4);
        ctx.fillStyle = enemy.type.startsWith('BOSS') ? '#ef4444' : '#10b981';
        ctx.fillRect(-barWidth / 2, -enemy.height / 2 - 10, barWidth * hpPercent, 4);
      }

      ctx.restore();
    }
  }

  private drawEnemySprite(enemy: EnemyEntity) {
    const ctx = this.ctx;
    const w = enemy.width;
    const h = enemy.height;

    ctx.fillStyle = enemy.color;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.2;

    switch (enemy.type) {
      case 'DRONE': // Classic Galaxian Green Drone (Insectoid)
        ctx.beginPath();
        ctx.moveTo(0, h * 0.45);
        ctx.lineTo(-w * 0.45, -h * 0.1);
        ctx.lineTo(-w * 0.25, -h * 0.45);
        ctx.lineTo(w * 0.25, -h * 0.45);
        ctx.lineTo(w * 0.45, -h * 0.1);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Eye antennas
        ctx.fillStyle = '#facc15';
        ctx.fillRect(-6, -h * 0.2, 3, 5);
        ctx.fillRect(3, -h * 0.2, 3, 5);
        break;

      case 'INTERCEPTOR': // Classic Blue Interceptor
        ctx.beginPath();
        ctx.moveTo(0, h * 0.5);
        ctx.lineTo(-w * 0.5, 0);
        ctx.lineTo(-w * 0.4, -h * 0.45);
        ctx.lineTo(0, -h * 0.2);
        ctx.lineTo(w * 0.4, -h * 0.45);
        ctx.lineTo(w * 0.5, 0);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#38bdf8';
        ctx.beginPath();
        ctx.arc(0, 0, 4, 0, Math.PI * 2);
        ctx.fill();
        break;

      case 'COMMANDER': // Red Boss Flagship Alien
        ctx.beginPath();
        ctx.moveTo(0, h * 0.5);
        ctx.lineTo(-w * 0.45, h * 0.1);
        ctx.lineTo(-w * 0.5, -h * 0.35);
        ctx.lineTo(-w * 0.2, -h * 0.45);
        ctx.lineTo(0, -h * 0.25);
        ctx.lineTo(w * 0.2, -h * 0.45);
        ctx.lineTo(w * 0.5, -h * 0.35);
        ctx.lineTo(w * 0.45, h * 0.1);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Yellow core crown
        ctx.fillStyle = '#f59e0b';
        ctx.beginPath();
        ctx.arc(0, -2, 6, 0, Math.PI * 2);
        ctx.fill();
        break;

      case 'INFILTRATOR': // Purple stealth diamond
        ctx.beginPath();
        ctx.moveTo(0, h * 0.5);
        ctx.lineTo(-w * 0.45, 0);
        ctx.lineTo(0, -h * 0.5);
        ctx.lineTo(w * 0.45, 0);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#e879f9';
        ctx.fillRect(-3, -3, 6, 6);
        break;

      case 'CHALLENGE_DRONE': // Fast bonus target drone
        ctx.beginPath();
        ctx.arc(0, 0, w * 0.38, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(-2, -h * 0.35, 4, h * 0.7);
        break;

      case 'BOSS_GORGON':
      case 'BOSS_OVERLORD': {
        // Enormous Alien Flagship Mothership
        const isOverlord = enemy.type === 'BOSS_OVERLORD';
        ctx.beginPath();
        ctx.moveTo(0, h * 0.5);
        ctx.lineTo(-w * 0.25, h * 0.45);
        ctx.lineTo(-w * 0.48, h * 0.15);
        ctx.lineTo(-w * 0.45, -h * 0.4);
        ctx.lineTo(-w * 0.2, -h * 0.5);
        ctx.lineTo(0, -h * 0.35);
        ctx.lineTo(w * 0.2, -h * 0.5);
        ctx.lineTo(w * 0.45, -h * 0.4);
        ctx.lineTo(w * 0.48, h * 0.15);
        ctx.lineTo(w * 0.25, h * 0.45);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Glowing core reactor
        const pulse = 1 + Math.sin(enemy.stateTimer * 6) * 0.2;
        ctx.fillStyle = isOverlord ? '#ef4444' : '#fbbf24';
        ctx.beginPath();
        ctx.arc(0, 0, 14 * pulse, 0, Math.PI * 2);
        ctx.fill();

        // Weapon wing cannons
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(-w * 0.42, h * 0.1, 6, 18);
        ctx.fillRect(w * 0.42 - 6, h * 0.1, 6, 18);
        break;
      }
    }
  }

  private renderPlayer() {
    const ctx = this.ctx;

    // Blinking effect during invulnerability
    if (this.invulnerableTimer > 0 && Math.floor(this.invulnerableTimer * 10) % 2 === 0) {
      return;
    }

    ctx.save();
    ctx.translate(this.playerX, this.playerY);
    ctx.rotate(this.playerTilt);

    // Option Wingman Drones
    const droneCount = this.upgrades.droneLevel;
    if (droneCount >= 1) {
      this.drawDrone(-34, 4);
    }
    if (droneCount >= 2) {
      this.drawDrone(34, 4);
    }

    // Shield bubble
    if (this.invulnerableTimer > 0) {
      ctx.beginPath();
      ctx.arc(0, 0, 32, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.65)';
      ctx.lineWidth = 2.5;
      ctx.stroke();
    }

    // Player Starfighter Body
    ctx.fillStyle = this.shipConfig.color;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;

    // Sleek geometric arcade starfighter
    ctx.beginPath();
    ctx.moveTo(0, -26); // Nose cone
    ctx.lineTo(-8, -6);
    ctx.lineTo(-24, 14); // Left wingtip
    ctx.lineTo(-12, 18);
    ctx.lineTo(-6, 14);
    ctx.lineTo(0, 18);
    ctx.lineTo(6, 14);
    ctx.lineTo(12, 18);
    ctx.lineTo(24, 14); // Right wingtip
    ctx.lineTo(8, -6);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Cockpit Canopy Glass
    ctx.fillStyle = '#e0f2fe';
    ctx.beginPath();
    ctx.ellipse(0, -6, 4, 10, 0, 0, Math.PI * 2);
    ctx.fill();

    // Wing cannons
    ctx.fillStyle = '#94a3b8';
    ctx.fillRect(-18, 0, 3, 10);
    ctx.fillRect(15, 0, 3, 10);

    ctx.restore();
  }

  private drawDrone(offsetX: number, offsetY: number) {
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(offsetX, offsetY);

    ctx.fillStyle = '#38bdf8';
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;

    ctx.beginPath();
    ctx.moveTo(0, -10);
    ctx.lineTo(-8, 6);
    ctx.lineTo(0, 4);
    ctx.lineTo(8, 6);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Drone engine flare
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(-2, 4, 4, 4);

    ctx.restore();
  }

  private renderParticles() {
    const ctx = this.ctx;
    for (const p of this.particles) {
      ctx.save();
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  private renderFloatingTexts() {
    const ctx = this.ctx;
    for (const ft of this.floatingTexts) {
      ctx.save();
      ctx.globalAlpha = ft.life / ft.maxLife;
      ctx.fillStyle = ft.color;
      ctx.font = `bold ${ft.fontSize}px 'Outfit', sans-serif`;
      ctx.textAlign = 'center';
      ctx.shadowColor = ft.color;
      ctx.shadowBlur = 6;
      ctx.fillText(ft.text, ft.x, ft.y);
      ctx.restore();
    }
  }

  private renderStageBanners() {
    const ctx = this.ctx;

    if (this.stageState === 'STAGE_INTRO') {
      ctx.save();
      ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
      ctx.fillRect(0, CANVAS_HEIGHT / 2 - 80, CANVAS_WIDTH, 140);

      ctx.fillStyle = this.isBossWave ? '#ef4444' : '#38bdf8';
      ctx.font = 'bold 28px "Press Start 2P", monospace';
      ctx.textAlign = 'center';
      ctx.shadowColor = this.isBossWave ? '#ef4444' : '#38bdf8';
      ctx.shadowBlur = 12;

      if (this.isBossWave) {
        ctx.fillText('WARNING!!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 25);
        ctx.font = '16px "Outfit", sans-serif';
        ctx.fillStyle = '#ffffff';
        ctx.fillText('거대 외계 모선 접근 중!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 15);
      } else if (this.isChallengingStage) {
        ctx.fillText('CHALLENGING STAGE', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 25);
        ctx.font = '16px "Outfit", sans-serif';
        ctx.fillStyle = '#ffffff';
        ctx.fillText('적 편대를 격추하여 명중률 보너스를 획득하세요!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 15);
      } else {
        ctx.fillText(`STAGE ${this.currentStage}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 25);
        ctx.font = '16px "Outfit", sans-serif';
        ctx.fillStyle = '#ffffff';
        ctx.fillText('READY... GO!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 15);
      }
      ctx.restore();
    } else if (this.stageState === 'STAGE_CLEAR') {
      ctx.save();
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.fillRect(0, CANVAS_HEIGHT / 2 - 70, CANVAS_WIDTH, 130);

      ctx.fillStyle = '#facc15';
      ctx.font = 'bold 26px "Press Start 2P", monospace';
      ctx.textAlign = 'center';
      ctx.shadowColor = '#facc15';
      ctx.shadowBlur = 12;
      ctx.fillText('STAGE CLEAR!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 20);

      ctx.font = '16px "Outfit", sans-serif';
      ctx.fillStyle = '#a7f3d0';
      ctx.fillText('다음 구역으로 워프 도약 준비 중...', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 20);
      ctx.restore();
    }
  }
}
