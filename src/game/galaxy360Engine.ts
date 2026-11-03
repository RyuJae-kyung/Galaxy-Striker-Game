/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  WORLD_WIDTH,
  WORLD_HEIGHT,
  SHIP_CONFIGS,
  ABILITY_CARDS_CATALOG,
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
  StarlightGem,
  AsteroidEntity,
  BlackHoleEntity,
  Star,
  AbilityId,
  AbilityCard,
} from './types';

export interface Galaxy360Callbacks {
  onScoreUpdate: (score: number, scrap: number, combo: number) => void;
  onPlayerStatusUpdate: (
    hp: number,
    maxHp: number,
    boost: number,
    bombs: number,
    maxBombs: number,
    level: number,
    xp: number,
    nextXp: number
  ) => void;
  onLevelUp: (choices: AbilityCard[]) => void;
  onBossAlert: (bossName: string) => void;
  onRadarUpdate: (
    playerPos: { x: number; y: number; angle: number },
    enemies: { x: number; y: number; isBoss: boolean }[],
    asteroids: { x: number; y: number }[],
    gems: { x: number; y: number }[]
  ) => void;
  onGameOver: (finalScore: number, finalScrap: number, survivalTime: number, level: number) => void;
  onAchievementUnlock: (achievementId: string) => void;
}

export class Galaxy360Engine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private callbacks: Galaxy360Callbacks;

  // Running loop state
  private animationFrameId: number | null = null;
  private lastTime: number = 0;
  private isRunning: boolean = false;
  private isPaused: boolean = false;
  private isLevelUpPaused: boolean = false;

  // World & Camera
  private camX: number = WORLD_WIDTH / 2;
  private camY: number = WORLD_HEIGHT / 2;

  // Player State
  private shipConfig: ShipConfig;
  private upgrades: PlayerUpgrades;
  private x: number = WORLD_WIDTH / 2;
  private y: number = WORLD_HEIGHT / 2;
  private vx: number = 0;
  private vy: number = 0;
  private angle: number = -Math.PI / 2; // Facing UP
  private targetAngle: number = -Math.PI / 2;
  private hp: number = 100;
  private maxHp: number = 100;
  private boostEnergy: number = 100;
  private maxBoostEnergy: number = 100;
  private isBoosting: boolean = false;
  private bombs: number = 3;
  private maxBombs: number = 3;
  private invulnerableTimer: number = 0;

  // Progression & Roguelite Level
  private level: number = 1;
  private currentXp: number = 0;
  private xpToNextLevel: number = 100;
  private abilities: Record<AbilityId, number> = {
    quantum_missile: 0,
    orbital_satellite: 0,
    chain_lightning: 0,
    graviton_blackhole: 0,
    flak_cannon: 0,
    plasma_cutter: 0,
    hyper_afterburner: 0,
    nano_repair: 0,
    magnetic_vacuum: 0,
  };

  // Cooldown timers
  private shootCooldown: number = 0;
  private missileCooldown: number = 2.4;
  private lightningCooldown: number = 2.0;
  private blackHoleCooldown: number = 6.0;
  private flakCooldown: number = 1.6;
  private satelliteAngle: number = 0;

  // Score & Time
  private score: number = 0;
  private sessionScrap: number = 0;
  private combo: number = 0;
  private survivalTimer: number = 0;
  private bossTimer: number = 120; // First boss at 2 min
  private nextBossAt: number = 120;

  // Input states
  private keys: Record<string, boolean> = {};
  private pointerWorldX: number = WORLD_WIDTH / 2;
  private pointerWorldY: number = WORLD_HEIGHT / 2 - 200;
  private isFiring: boolean = false;
  private autoFire: boolean = true;
  private joystickMove: { x: number; y: number } | null = null;

  // Entities
  private stars: Star[] = [];
  private enemies: EnemyEntity[] = [];
  private playerBullets: Bullet[] = [];
  private enemyBullets: Bullet[] = [];
  private particles: Particle[] = [];
  private floatingTexts: FloatingText[] = [];
  private gems: StarlightGem[] = [];
  private asteroids: AsteroidEntity[] = [];
  private blackHoles: BlackHoleEntity[] = [];

  // Visual shake
  private screenShake: number = 0;

  constructor(
    canvas: HTMLCanvasElement,
    shipId: ShipId,
    upgrades: PlayerUpgrades,
    callbacks: Galaxy360Callbacks
  ) {
    this.canvas = canvas;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Failed to get 2D context');
    this.ctx = context;
    this.callbacks = callbacks;
    this.shipConfig = SHIP_CONFIGS[shipId] || SHIP_CONFIGS.alpha_viper;
    this.upgrades = upgrades;

    this.applyUpgrades();
    this.initStars();
    this.initWorldAsteroids();
    this.initControls();
  }

  private applyUpgrades() {
    this.maxHp = this.shipConfig.baseHealth + (this.upgrades.maxShieldLevel - 1) * 25;
    this.hp = this.maxHp;
    this.maxBombs = 2 + this.upgrades.bombStockLevel;
    this.bombs = this.maxBombs;
    if (this.upgrades.droneLevel > 0) {
      this.abilities.orbital_satellite = this.upgrades.droneLevel;
    }
  }

  private initStars() {
    this.stars = [];
    const colors = ['#ffffff', '#a5f3fc', '#fbcfe8', '#fed7aa', '#c7d2fe'];
    for (let i = 0; i < 350; i++) {
      this.stars.push({
        x: Math.random() * WORLD_WIDTH,
        y: Math.random() * WORLD_HEIGHT,
        speed: 0.15 + Math.random() * 0.4,
        size: Math.random() > 0.85 ? 2.5 : Math.random() > 0.4 ? 1.5 : 1,
        color: colors[Math.floor(Math.random() * colors.length)],
        twinkleOffset: Math.random() * Math.PI * 2,
      });
    }
  }

  private initWorldAsteroids() {
    this.asteroids = [];
    for (let i = 0; i < 35; i++) {
      this.spawnAsteroid(
        Math.random() * WORLD_WIDTH,
        Math.random() * WORLD_HEIGHT,
        25 + Math.random() * 35
      );
    }
  }

  private spawnAsteroid(x: number, y: number, radius: number) {
    // Generate rugged polygon points
    const pointsCount = 8 + Math.floor(Math.random() * 4);
    const points: { x: number; y: number }[] = [];
    for (let p = 0; p < pointsCount; p++) {
      const a = (p / pointsCount) * Math.PI * 2;
      const r = radius * (0.75 + Math.random() * 0.5);
      points.push({ x: Math.cos(a) * r, y: Math.sin(a) * r });
    }

    this.asteroids.push({
      id: Math.random().toString(),
      x,
      y,
      vx: (Math.random() - 0.5) * 25,
      vy: (Math.random() - 0.5) * 25,
      radius,
      hp: Math.floor(radius * 1.5),
      maxHp: Math.floor(radius * 1.5),
      angle: Math.random() * Math.PI * 2,
      rotSpeed: (Math.random() - 0.5) * 0.8,
      points,
    });
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
    if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
      this.isBoosting = true;
    }
  };

  private handleKeyUp = (e: KeyboardEvent) => {
    this.keys[e.code] = false;
    if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
      this.isBoosting = false;
    }
  };

  public setPointerWorld(worldX: number, worldY: number, firing?: boolean) {
    this.pointerWorldX = worldX;
    this.pointerWorldY = worldY;
    if (firing !== undefined) {
      this.isFiring = firing;
    }
  }

  public setJoystickMove(x: number, y: number) {
    if (Math.hypot(x, y) < 0.1) {
      this.joystickMove = null;
    } else {
      this.joystickMove = { x, y };
    }
  }

  public setBoost(boosting: boolean) {
    this.isBoosting = boosting;
  }

  public setFiring(firing: boolean) {
    this.isFiring = firing;
  }

  public setAutoFire(auto: boolean) {
    this.autoFire = auto;
  }

  public togglePause(): boolean {
    this.isPaused = !this.isPaused;
    if (!this.isPaused) {
      this.lastTime = performance.now();
    }
    return this.isPaused;
  }

  public selectAbilityUpgrade(abilityId: AbilityId) {
    this.abilities[abilityId] = (this.abilities[abilityId] || 0) + 1;
    this.isLevelUpPaused = false;
    this.lastTime = performance.now();
    sound.playPowerUp();

    this.spawnFloatingText(this.x, this.y - 30, '능력 업그레이드 장착!', '#38bdf8');
  }

  public triggerBomb() {
    if (this.bombs <= 0) return;
    this.bombs--;
    sound.playBomb();

    this.screenShake = 20;

    // Destroy all enemy bullets
    for (const b of this.enemyBullets) {
      this.createSparkExplosion(b.x, b.y, '#f43f5e', 4);
    }
    this.enemyBullets = [];

    // Deal massive damage to enemies in visible radius
    for (const enemy of this.enemies) {
      const dist = Math.hypot(enemy.x - this.x, enemy.y - this.y);
      if (dist < 800) {
        enemy.hp -= 150;
        this.createSparkExplosion(enemy.x, enemy.y, '#38bdf8', 6);
      }
    }

    this.callbacks.onPlayerStatusUpdate(
      this.hp,
      this.maxHp,
      this.boostEnergy,
      this.bombs,
      this.maxBombs,
      this.level,
      this.currentXp,
      this.xpToNextLevel
    );

    this.spawnFloatingText(this.x, this.y - 40, 'EMP 전역 섬멸 파동!', '#38bdf8');
  }

  public start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.isPaused = false;
    this.isLevelUpPaused = false;
    this.lastTime = performance.now();
    sound.startBgm();

    this.callbacks.onAchievementUnlock('first_sortie');

    const loop = (time: number) => {
      if (!this.isRunning) return;
      const dt = Math.min((time - this.lastTime) / 1000, 0.1);
      this.lastTime = time;

      if (!this.isPaused && !this.isLevelUpPaused) {
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

  // ================= MAIN UPDATE LOOP =================
  private update(dt: number) {
    this.survivalTimer += dt;

    if (this.screenShake > 0) {
      this.screenShake = Math.max(0, this.screenShake - dt * 25);
    }

    this.updatePlayerMovement(dt);
    this.updatePlayerWeapons(dt);
    this.updateAutomaticAbilities(dt);
    this.updateBullets(dt);
    this.updateAsteroids(dt);
    this.updateBlackHoles(dt);
    this.updateGems(dt);
    this.updateEnemies(dt);
    this.checkCollisions();
    this.spawnAlienWaves(dt);

    // Camera follow smoothly
    this.camX += (this.x - this.camX) * 8 * dt;
    this.camY += (this.y - this.camY) * 8 * dt;

    // Send radar telemetry every 0.1s
    if (Math.random() < 0.2) {
      this.callbacks.onRadarUpdate(
        { x: this.x, y: this.y, angle: this.angle },
        this.enemies.map((e) => ({
          x: e.x,
          y: e.y,
          isBoss: e.type.startsWith('BOSS'),
        })),
        this.asteroids.slice(0, 15).map((a) => ({ x: a.x, y: a.y })),
        this.gems.slice(0, 20).map((g) => ({ x: g.x, y: g.y }))
      );
    }

    // Passive Nano Repair ability
    if (this.abilities.nano_repair > 0) {
      const healPerSec = this.abilities.nano_repair * 1.5;
      if (this.hp < this.maxHp) {
        this.hp = Math.min(this.maxHp, this.hp + healPerSec * dt);
        this.callbacks.onPlayerStatusUpdate(
          this.hp,
          this.maxHp,
          this.boostEnergy,
          this.bombs,
          this.maxBombs,
          this.level,
          this.currentXp,
          this.xpToNextLevel
        );
      }
    }
  }

  private updatePlayerMovement(dt: number) {
    if (this.invulnerableTimer > 0) {
      this.invulnerableTimer -= dt;
    }

    // Calculate movement vector from keyboard or touch joystick
    let inputX = 0;
    let inputY = 0;

    if (this.joystickMove) {
      inputX = this.joystickMove.x;
      inputY = this.joystickMove.y;
    } else {
      if (this.keys['KeyA'] || this.keys['ArrowLeft']) inputX -= 1;
      if (this.keys['KeyD'] || this.keys['ArrowRight']) inputX += 1;
      if (this.keys['KeyW'] || this.keys['ArrowUp']) inputY -= 1;
      if (this.keys['KeyS'] || this.keys['ArrowDown']) inputY += 1;
    }

    const inputLen = Math.hypot(inputX, inputY);
    if (inputLen > 0) {
      inputX /= inputLen;
      inputY /= inputLen;
    }

    // Aim Angle
    const dx = this.pointerWorldX - this.x;
    const dy = this.pointerWorldY - this.y;
    if (Math.hypot(dx, dy) > 20) {
      this.targetAngle = Math.atan2(dy, dx);
    } else if (inputLen > 0) {
      this.targetAngle = Math.atan2(inputY, inputX);
    }

    // Smooth rotation towards target angle
    let diff = this.targetAngle - this.angle;
    while (diff < -Math.PI) diff += Math.PI * 2;
    while (diff > Math.PI) diff -= Math.PI * 2;
    this.angle += diff * 12 * dt;

    // Afterburner Boost handling
    const isBoostingNow = this.isBoosting && this.boostEnergy > 5;
    if (isBoostingNow) {
      this.boostEnergy = Math.max(0, this.boostEnergy - dt * 35);
      if (Math.random() < 0.3) sound.playBoost();
    } else {
      this.boostEnergy = Math.min(this.maxBoostEnergy, this.boostEnergy + dt * 20);
    }

    const speedBonus = 1 + (this.abilities.hyper_afterburner * 0.2);
    const topSpeed = (isBoostingNow ? this.shipConfig.baseSpeed * 1.75 : this.shipConfig.baseSpeed) * speedBonus;
    const accel = isBoostingNow ? 2400 : 1600;

    if (inputLen > 0) {
      this.vx += inputX * accel * dt;
      this.vy += inputY * accel * dt;
    }

    // Drag / friction
    const currentSpeed = Math.hypot(this.vx, this.vy);
    if (currentSpeed > topSpeed) {
      this.vx = (this.vx / currentSpeed) * topSpeed;
      this.vy = (this.vy / currentSpeed) * topSpeed;
    }
    this.vx *= Math.pow(0.88, dt * 60);
    this.vy *= Math.pow(0.88, dt * 60);

    this.x += this.vx * dt;
    this.y += this.vy * dt;

    // Clamp inside world sector with soft bouncy boundary
    const margin = 60;
    if (this.x < margin) { this.x = margin; this.vx = Math.abs(this.vx) * 0.5; }
    if (this.x > WORLD_WIDTH - margin) { this.x = WORLD_WIDTH - margin; this.vx = -Math.abs(this.vx) * 0.5; }
    if (this.y < margin) { this.y = margin; this.vy = Math.abs(this.vy) * 0.5; }
    if (this.y > WORLD_HEIGHT - margin) { this.y = WORLD_HEIGHT - margin; this.vy = -Math.abs(this.vy) * 0.5; }

    // Thruster engine particles
    if (inputLen > 0 || isBoostingNow) {
      const backAngle = this.angle + Math.PI;
      const spread = (Math.random() - 0.5) * 0.4;
      const pSpeed = (isBoostingNow ? 220 : 120) + Math.random() * 60;
      this.particles.push({
        x: this.x - Math.cos(this.angle) * 18,
        y: this.y - Math.sin(this.angle) * 18,
        vx: Math.cos(backAngle + spread) * pSpeed + this.vx * 0.2,
        vy: Math.sin(backAngle + spread) * pSpeed + this.vy * 0.2,
        color: isBoostingNow ? '#f97316' : this.shipConfig.engineGlow,
        size: isBoostingNow ? 3.5 : 2.5,
        life: isBoostingNow ? 0.35 : 0.22,
        maxLife: isBoostingNow ? 0.35 : 0.22,
        alpha: 1,
      });
    }

    this.callbacks.onPlayerStatusUpdate(
      this.hp,
      this.maxHp,
      this.boostEnergy,
      this.bombs,
      this.maxBombs,
      this.level,
      this.currentXp,
      this.xpToNextLevel
    );
  }

  private updatePlayerWeapons(dt: number) {
    this.shootCooldown -= dt;
    const shouldFire = this.autoFire || this.isFiring || this.keys['Space'];

    if (shouldFire && this.shootCooldown <= 0) {
      const fireRate = this.shipConfig.baseFireRate * (1 + (this.upgrades.fireRateLevel - 1) * 0.2);
      this.shootCooldown = 1 / fireRate;

      const damage = 14 * (1 + (this.upgrades.damageLevel - 1) * 0.25);
      sound.playLaser('single');

      // Primary Twin Blasters
      [-8, 8].forEach((offset) => {
        const perpAngle = this.angle + Math.PI / 2;
        const bx = this.x + Math.cos(this.angle) * 16 + Math.cos(perpAngle) * offset;
        const by = this.y + Math.sin(this.angle) * 16 + Math.sin(perpAngle) * offset;

        this.playerBullets.push({
          x: bx,
          y: by,
          vx: Math.cos(this.angle) * 780 + this.vx * 0.3,
          vy: Math.sin(this.angle) * 780 + this.vy * 0.3,
          width: 5,
          height: 14,
          damage,
          color: this.shipConfig.color,
          isPlayer: true,
          life: 1.1,
        });
      });
    }
  }

  // Automatic Roguelite Abilities (Missiles, Lightning, Satellites, Flak, Black Holes)
  private updateAutomaticAbilities(dt: number) {
    // 1. Orbital Satellites
    const satCount = this.abilities.orbital_satellite;
    if (satCount > 0) {
      this.satelliteAngle += dt * 3.2;
      const orbitRadius = 55;
      for (let s = 0; s < satCount; s++) {
        const a = this.satelliteAngle + (s / satCount) * Math.PI * 2;
        const sx = this.x + Math.cos(a) * orbitRadius;
        const sy = this.y + Math.sin(a) * orbitRadius;

        // Satellite deals contact damage to nearby enemies
        for (const enemy of this.enemies) {
          const dist = Math.hypot(enemy.x - sx, enemy.y - sy);
          if (dist < 28) {
            enemy.hp -= 25 * dt;
            this.createSparkExplosion(sx, sy, '#38bdf8', 2);
          }
        }
      }
    }

    // 2. Quantum Homing Missiles
    if (this.abilities.quantum_missile > 0) {
      this.missileCooldown -= dt;
      if (this.missileCooldown <= 0) {
        this.missileCooldown = 2.2 - (this.abilities.quantum_missile * 0.25);
        this.fireQuantumMissiles();
      }
    }

    // 3. Chain Lightning
    if (this.abilities.chain_lightning > 0) {
      this.lightningCooldown -= dt;
      if (this.lightningCooldown <= 0) {
        this.lightningCooldown = 2.5 - (this.abilities.chain_lightning * 0.3);
        this.triggerChainLightning();
      }
    }

    // 4. Graviton Singularity Black Hole
    if (this.abilities.graviton_blackhole > 0) {
      this.blackHoleCooldown -= dt;
      if (this.blackHoleCooldown <= 0) {
        this.blackHoleCooldown = 7.0 - (this.abilities.graviton_blackhole * 0.8);
        this.spawnBlackHole();
      }
    }

    // 5. Flak Scattergun
    if (this.abilities.flak_cannon > 0) {
      this.flakCooldown -= dt;
      if (this.flakCooldown <= 0) {
        this.flakCooldown = 1.8 - (this.abilities.flak_cannon * 0.2);
        this.fireFlakScatter();
      }
    }

    // 6. Plasma Cutter Pierce Beam
    if (this.abilities.plasma_cutter > 0 && Math.random() < 0.3) {
      const bAngle = this.angle + (Math.random() - 0.5) * 0.1;
      this.playerBullets.push({
        x: this.x + Math.cos(this.angle) * 20,
        y: this.y + Math.sin(this.angle) * 20,
        vx: Math.cos(bAngle) * 950,
        vy: Math.sin(bAngle) * 950,
        width: 8,
        height: 28,
        damage: 18 * this.abilities.plasma_cutter,
        color: '#c084fc',
        isPlayer: true,
        piercing: true,
        life: 0.9,
      });
    }
  }

  private fireQuantumMissiles() {
    const missileCount = 1 + this.abilities.quantum_missile;
    sound.playLaser('missile');

    for (let m = 0; m < missileCount; m++) {
      const spreadAngle = this.angle + (m - (missileCount - 1) / 2) * 0.4;
      this.playerBullets.push({
        x: this.x,
        y: this.y,
        vx: Math.cos(spreadAngle) * 350,
        vy: Math.sin(spreadAngle) * 350,
        width: 8,
        height: 16,
        damage: 45 + this.abilities.quantum_missile * 15,
        color: '#38bdf8',
        isPlayer: true,
        isHoming: true,
        isMissile: true,
        life: 2.2,
      });
    }
  }

  private triggerChainLightning() {
    // Find closest enemies within 450px
    const inRange = this.enemies
      .map((e) => ({ enemy: e, dist: Math.hypot(e.x - this.x, e.y - this.y) }))
      .filter((item) => item.dist < 500)
      .sort((a, b) => a.dist - b.dist)
      .slice(0, 3 + this.abilities.chain_lightning);

    if (inRange.length === 0) return;

    sound.playLightning();
    let prevX = this.x;
    let prevY = this.y;

    for (const item of inRange) {
      const enemy = item.enemy;
      enemy.hp -= 35 + this.abilities.chain_lightning * 12;

      // Create lightning particle sparks between nodes
      this.createLightningParticles(prevX, prevY, enemy.x, enemy.y);
      this.createSparkExplosion(enemy.x, enemy.y, '#38bdf8', 6);

      prevX = enemy.x;
      prevY = enemy.y;
    }
  }

  private createLightningParticles(x1: number, y1: number, x2: number, y2: number) {
    const steps = 6;
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const lx = x1 + (x2 - x1) * t + (Math.random() - 0.5) * 20;
      const ly = y1 + (y2 - y1) * t + (Math.random() - 0.5) * 20;
      this.particles.push({
        x: lx,
        y: ly,
        vx: 0,
        vy: 0,
        color: '#67e8f9',
        size: 3,
        life: 0.18,
        maxLife: 0.18,
        alpha: 1,
      });
    }
  }

  private spawnBlackHole() {
    const targetDist = 200 + Math.random() * 150;
    const bx = this.x + Math.cos(this.angle) * targetDist;
    const by = this.y + Math.sin(this.angle) * targetDist;

    this.blackHoles.push({
      id: Math.random().toString(),
      x: bx,
      y: by,
      radius: 12,
      life: 4.5,
      maxLife: 4.5,
      pullRadius: 280 + this.abilities.graviton_blackhole * 40,
    });
  }

  private fireFlakScatter() {
    sound.playLaser('scatter');
    const flakPellets = 6 + this.abilities.flak_cannon * 2;
    for (let f = 0; f < flakPellets; f++) {
      const spread = this.angle + (Math.random() - 0.5) * 1.2;
      const speed = 550 + Math.random() * 200;
      this.playerBullets.push({
        x: this.x,
        y: this.y,
        vx: Math.cos(spread) * speed,
        vy: Math.sin(spread) * speed,
        width: 6,
        height: 6,
        damage: 22,
        color: '#f59e0b',
        isPlayer: true,
        life: 0.55,
      });
    }
  }

  private updateBullets(dt: number) {
    // Player bullets
    for (let i = this.playerBullets.length - 1; i >= 0; i--) {
      const b = this.playerBullets[i];

      // Homing missile steering
      if (b.isHoming && this.enemies.length > 0) {
        let closestDist = Infinity;
        let target: EnemyEntity | null = null;
        for (const e of this.enemies) {
          const d = Math.hypot(e.x - b.x, e.y - b.y);
          if (d < closestDist) {
            closestDist = d;
            target = e;
          }
        }
        if (target && closestDist < 600) {
          const targetAngle = Math.atan2(target.y - b.y, target.x - b.x);
          const currentAngle = Math.atan2(b.vy, b.vx);
          let diff = targetAngle - currentAngle;
          while (diff < -Math.PI) diff += Math.PI * 2;
          while (diff > Math.PI) diff -= Math.PI * 2;
          const newAngle = currentAngle + diff * 6 * dt;
          const speed = Math.hypot(b.vx, b.vy);
          b.vx = Math.cos(newAngle) * speed;
          b.vy = Math.sin(newAngle) * speed;

          // Smoke trail
          if (Math.random() < 0.4) {
            this.particles.push({
              x: b.x,
              y: b.y,
              vx: (Math.random() - 0.5) * 20,
              vy: (Math.random() - 0.5) * 20,
              color: '#94a3b8',
              size: 2,
              life: 0.3,
              maxLife: 0.3,
              alpha: 0.6,
            });
          }
        }
      }

      b.x += b.vx * dt;
      b.y += b.vy * dt;

      if (b.life !== undefined) {
        b.life -= dt;
        if (b.life <= 0) {
          this.playerBullets.splice(i, 1);
          continue;
        }
      }

      if (b.x < 0 || b.x > WORLD_WIDTH || b.y < 0 || b.y > WORLD_HEIGHT) {
        this.playerBullets.splice(i, 1);
      }
    }

    // Enemy bullets
    for (let i = this.enemyBullets.length - 1; i >= 0; i--) {
      const b = this.enemyBullets[i];
      b.x += b.vx * dt;
      b.y += b.vy * dt;

      if (b.life !== undefined) {
        b.life -= dt;
        if (b.life <= 0) {
          this.enemyBullets.splice(i, 1);
          continue;
        }
      }

      if (b.x < 0 || b.x > WORLD_WIDTH || b.y < 0 || b.y > WORLD_HEIGHT) {
        this.enemyBullets.splice(i, 1);
      }
    }
  }

  private updateAsteroids(dt: number) {
    for (const a of this.asteroids) {
      a.x += a.vx * dt;
      a.y += a.vy * dt;
      a.angle += a.rotSpeed * dt;

      // Wrap around world borders
      if (a.x < 0) a.x += WORLD_WIDTH;
      if (a.x > WORLD_WIDTH) a.x -= WORLD_WIDTH;
      if (a.y < 0) a.y += WORLD_HEIGHT;
      if (a.y > WORLD_HEIGHT) a.y -= WORLD_HEIGHT;
    }
  }

  private updateBlackHoles(dt: number) {
    for (let i = this.blackHoles.length - 1; i >= 0; i--) {
      const bh = this.blackHoles[i];
      bh.life -= dt;

      // Pull enemies towards center
      for (const enemy of this.enemies) {
        const dx = bh.x - enemy.x;
        const dy = bh.y - enemy.y;
        const dist = Math.hypot(dx, dy);
        if (dist < bh.pullRadius && dist > 15) {
          const pullForce = (1 - dist / bh.pullRadius) * 350 * dt;
          enemy.x += (dx / dist) * pullForce;
          enemy.y += (dy / dist) * pullForce;
          enemy.hp -= 20 * dt;
        }
      }

      // Graviton particle accretion disk
      if (Math.random() < 0.6) {
        const a = Math.random() * Math.PI * 2;
        const r = 30 + Math.random() * 40;
        this.particles.push({
          x: bh.x + Math.cos(a) * r,
          y: bh.y + Math.sin(a) * r,
          vx: -Math.cos(a) * 80 - Math.sin(a) * 120,
          vy: -Math.sin(a) * 80 + Math.cos(a) * 120,
          color: '#a855f7',
          size: 2,
          life: 0.35,
          maxLife: 0.35,
          alpha: 0.8,
        });
      }

      if (bh.life <= 0) {
        this.createDeathExplosion(bh.x, bh.y, '#c084fc', 25);
        this.blackHoles.splice(i, 1);
      }
    }
  }

  private updateGems(dt: number) {
    const magnetRadius = 110 + this.abilities.magnetic_vacuum * 65;

    for (let i = this.gems.length - 1; i >= 0; i--) {
      const gem = this.gems[i];
      const dx = this.x - gem.x;
      const dy = this.y - gem.y;
      const dist = Math.hypot(dx, dy);

      if (dist < magnetRadius) {
        // Accelerate magnet pull
        const speed = 400 + (1 - dist / magnetRadius) * 450;
        gem.x += (dx / dist) * speed * dt;
        gem.y += (dy / dist) * speed * dt;
      }

      // Collection
      if (dist < 26) {
        sound.playXpTick();
        this.collectGem(gem);
        this.gems.splice(i, 1);
      }
    }
  }

  private collectGem(gem: StarlightGem) {
    this.currentXp += gem.xpValue;
    this.sessionScrap += gem.scrapValue;
    this.score += gem.xpValue * 10;

    // Check Level Up!
    if (this.currentXp >= this.xpToNextLevel) {
      this.triggerLevelUp();
    }

    this.callbacks.onScoreUpdate(this.score, this.sessionScrap, this.combo);
    this.callbacks.onPlayerStatusUpdate(
      this.hp,
      this.maxHp,
      this.boostEnergy,
      this.bombs,
      this.maxBombs,
      this.level,
      this.currentXp,
      this.xpToNextLevel
    );
  }

  private triggerLevelUp() {
    this.level++;
    this.currentXp -= this.xpToNextLevel;
    this.xpToNextLevel = Math.floor(this.xpToNextLevel * 1.35 + 50);

    sound.playLevelUp();
    this.spawnFloatingText(this.x, this.y - 45, `LEVEL UP! Lv.${this.level}`, '#facc15');

    if (this.level >= 10) {
      this.callbacks.onAchievementUnlock('level_10_survivor');
    }

    // Pick 3 random cards for the draft modal
    const availableCards = ABILITY_CARDS_CATALOG
      .map((c) => ({ ...c, level: this.abilities[c.id] || 0 }))
      .filter((c) => c.level < c.maxLevel);

    // Shuffle and pick up to 3
    const shuffled = [...availableCards].sort(() => Math.random() - 0.5);
    const choices = shuffled.slice(0, 3);

    if (choices.length > 0) {
      this.isLevelUpPaused = true;
      this.callbacks.onLevelUp(choices);
    }
  }

  private updateEnemies(dt: number) {
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const enemy = this.enemies[i];
      enemy.stateTimer += dt;

      // 360 AI Chasing behavior
      const dx = this.x - enemy.x;
      const dy = this.y - enemy.y;
      const dist = Math.hypot(dx, dy);

      if (enemy.type.startsWith('BOSS')) {
        // Boss AI
        this.updateBoss360(enemy, dt, dist, dx, dy);
      } else {
        // Standard mob chasing & shooting
        const speed = enemy.type === 'DRONE' ? 190 : 130;
        enemy.x += (dx / dist) * speed * dt;
        enemy.y += (dy / dist) * speed * dt;
        enemy.angle = Math.atan2(dy, dx);

        enemy.shootCooldown -= dt;
        if (enemy.shootCooldown <= 0 && dist < 450) {
          enemy.shootCooldown = 2.8 + Math.random() * 2;
          this.enemyFire(enemy);
        }
      }
    }
  }

  private updateBoss360(boss: EnemyEntity, dt: number, dist: number, dx: number, dy: number) {
    boss.angle = Math.atan2(dy, dx);
    const targetDist = 280;

    // Hover around target distance
    if (dist > targetDist + 50) {
      boss.x += (dx / dist) * 110 * dt;
      boss.y += (dy / dist) * 110 * dt;
    } else if (dist < targetDist - 50) {
      boss.x -= (dx / dist) * 80 * dt;
      boss.y -= (dy / dist) * 80 * dt;
    }

    boss.shootCooldown -= dt;
    if (boss.shootCooldown <= 0) {
      boss.bossAttackPattern = ((boss.bossAttackPattern || 0) + 1) % 3;
      boss.shootCooldown = 1.6;
      sound.playEnemyLaser();

      if (boss.bossAttackPattern === 0) {
        // Radial Nova Bullet Storm
        const bullets = 12;
        for (let b = 0; b < bullets; b++) {
          const a = (b / bullets) * Math.PI * 2 + boss.stateTimer;
          this.enemyBullets.push({
            x: boss.x,
            y: boss.y,
            vx: Math.cos(a) * 220,
            vy: Math.sin(a) * 220,
            width: 7,
            height: 7,
            damage: 16,
            color: '#fbbf24',
            isPlayer: false,
            life: 3.5,
          });
        }
      } else {
        // Targeted Tri-Barrage
        const baseA = Math.atan2(dy, dx);
        [-0.25, 0, 0.25].forEach((offset) => {
          this.enemyBullets.push({
            x: boss.x,
            y: boss.y,
            vx: Math.cos(baseA + offset) * 340,
            vy: Math.sin(baseA + offset) * 340,
            width: 8,
            height: 18,
            damage: 22,
            color: '#ef4444',
            isPlayer: false,
            life: 3.0,
          });
        });
      }
    }
  }

  private enemyFire(enemy: EnemyEntity) {
    sound.playEnemyLaser();
    const dx = this.x - enemy.x;
    const dy = this.y - enemy.y;
    const dist = Math.hypot(dx, dy) || 1;

    this.enemyBullets.push({
      x: enemy.x,
      y: enemy.y,
      vx: (dx / dist) * 280,
      vy: (dy / dist) * 280,
      width: 5,
      height: 12,
      damage: 12,
      color: '#f43f5e',
      isPlayer: false,
      life: 2.8,
    });
  }

  private spawnAlienWaves(dt: number) {
    // Escalate spawn rate based on survival time
    const maxEnemies = 25 + Math.floor(this.survivalTimer * 0.15);
    if (this.enemies.length < maxEnemies) {
      // Spawn at radius around player outside screen
      const angle = Math.random() * Math.PI * 2;
      const spawnDist = 650 + Math.random() * 200;
      const sx = this.x + Math.cos(angle) * spawnDist;
      const sy = this.y + Math.sin(angle) * spawnDist;

      const isKamikaze = Math.random() < 0.25;
      const isCommander = Math.random() < 0.15;

      this.enemies.push({
        id: Math.random().toString(),
        type: isCommander ? 'COMMANDER' : isKamikaze ? 'INTERCEPTOR' : 'DRONE',
        x: sx,
        y: sy,
        vx: 0,
        vy: 0,
        width: isCommander ? 38 : 28,
        height: isCommander ? 38 : 28,
        hp: isCommander ? 35 : isKamikaze ? 14 : 10,
        maxHp: isCommander ? 35 : isKamikaze ? 14 : 10,
        scoreValue: isCommander ? 300 : 120,
        scrapValue: isCommander ? 5 : 2,
        color: isCommander ? '#ef4444' : isKamikaze ? '#06b6d4' : '#22c55e',
        formationX: 0,
        formationY: 0,
        state: 'CHASE',
        stateTimer: 0,
        shootCooldown: 2.0 + Math.random() * 3,
      });
    }

    // Check Boss Spawn trigger
    if (this.survivalTimer >= this.nextBossAt) {
      this.nextBossAt += 180; // Next boss in 3 min
      this.spawnDreadnoughtBoss();
    }
  }

  private spawnDreadnoughtBoss() {
    sound.playBossAlarm();
    this.screenShake = 22;

    const angle = Math.random() * Math.PI * 2;
    const bx = this.x + Math.cos(angle) * 550;
    const by = this.y + Math.sin(angle) * 550;

    this.enemies.push({
      id: 'boss_' + Math.random(),
      type: 'BOSS_OVERLORD',
      x: bx,
      y: by,
      vx: 0,
      vy: 0,
      width: 140,
      height: 100,
      hp: 1200 + this.level * 250,
      maxHp: 1200 + this.level * 250,
      scoreValue: 8000,
      scrapValue: 120,
      color: '#ef4444',
      formationX: 0,
      formationY: 0,
      state: 'BOSS_PATTERN',
      stateTimer: 0,
      shootCooldown: 1.5,
    });

    this.callbacks.onBossAlert('외계 거대 기함 워프 감지!');
  }

  private checkCollisions() {
    // 1. Player Bullets vs Asteroids
    for (let bi = this.playerBullets.length - 1; bi >= 0; bi--) {
      const b = this.playerBullets[bi];
      for (let ai = this.asteroids.length - 1; ai >= 0; ai--) {
        const ast = this.asteroids[ai];
        const dist = Math.hypot(b.x - ast.x, b.y - ast.y);
        if (dist < ast.radius) {
          ast.hp -= b.damage;
          this.createSparkExplosion(b.x, b.y, '#94a3b8', 3);
          if (!b.piercing) {
            this.playerBullets.splice(bi, 1);
          }
          if (ast.hp <= 0) {
            this.destroyAsteroid(ast, ai);
          }
          break;
        }
      }
    }

    // 2. Player Bullets vs Enemies
    for (let bi = this.playerBullets.length - 1; bi >= 0; bi--) {
      const b = this.playerBullets[bi];
      for (let ei = this.enemies.length - 1; ei >= 0; ei--) {
        const enemy = this.enemies[ei];
        const dist = Math.hypot(b.x - enemy.x, b.y - enemy.y);
        if (dist < enemy.width / 2 + 5) {
          enemy.hp -= b.damage;
          this.combo++;
          this.createSparkExplosion(b.x, b.y, b.color, 4);

          if (!b.piercing) {
            this.playerBullets.splice(bi, 1);
          }

          if (enemy.hp <= 0) {
            this.destroyEnemy(enemy, ei);
          }
          break;
        }
      }
    }

    // 3. Enemy Bullets vs Player
    if (this.invulnerableTimer <= 0) {
      for (let bi = this.enemyBullets.length - 1; bi >= 0; bi--) {
        const b = this.enemyBullets[bi];
        const dist = Math.hypot(b.x - this.x, b.y - this.y);
        if (dist < 22) {
          this.handlePlayerDamage(b.damage);
          this.createSparkExplosion(b.x, b.y, '#f43f5e', 6);
          this.enemyBullets.splice(bi, 1);
          break;
        }
      }

      // 4. Enemy Ramming Player
      for (const enemy of this.enemies) {
        const dist = Math.hypot(enemy.x - this.x, enemy.y - this.y);
        if (dist < 28) {
          this.handlePlayerDamage(20);
          enemy.hp -= 30;
          this.createSparkExplosion(this.x, this.y, '#ef4444', 8);
          break;
        }
      }
    }
  }

  private handlePlayerDamage(damage: number) {
    this.hp -= damage;
    this.invulnerableTimer = 1.4;
    this.combo = 0;
    this.screenShake = 14;
    sound.playExplosion('small');

    this.callbacks.onPlayerStatusUpdate(
      this.hp,
      this.maxHp,
      this.boostEnergy,
      this.bombs,
      this.maxBombs,
      this.level,
      this.currentXp,
      this.xpToNextLevel
    );

    if (this.hp <= 0) {
      this.handleGameOver();
    }
  }

  private destroyEnemy(enemy: EnemyEntity, index: number) {
    const isBoss = enemy.type.startsWith('BOSS');
    sound.playExplosion(isBoss ? 'boss' : 'small');

    if (isBoss) {
      this.screenShake = 24;
      this.callbacks.onAchievementUnlock('gorgon_slayer');
    }

    this.score += enemy.scoreValue;
    this.createDeathExplosion(enemy.x, enemy.y, enemy.color, isBoss ? 45 : 16);

    // Drop Starlight XP Gems
    const gemCount = isBoss ? 15 : enemy.type === 'COMMANDER' ? 4 : 1;
    for (let g = 0; g < gemCount; g++) {
      const a = Math.random() * Math.PI * 2;
      const r = Math.random() * 25;
      this.gems.push({
        id: Math.random().toString(),
        x: enemy.x + Math.cos(a) * r,
        y: enemy.y + Math.sin(a) * r,
        vx: 0,
        vy: 0,
        xpValue: isBoss ? 80 : 25,
        scrapValue: isBoss ? 8 : 1,
        color: isBoss ? '#facc15' : '#38bdf8',
        radius: isBoss ? 6 : 4,
      });
    }

    this.enemies.splice(index, 1);
  }

  private destroyAsteroid(ast: AsteroidEntity, index: number) {
    sound.playExplosion('small');
    this.createDeathExplosion(ast.x, ast.y, '#94a3b8', 12);

    // Drop mineral scrap
    this.gems.push({
      id: Math.random().toString(),
      x: ast.x,
      y: ast.y,
      vx: 0,
      vy: 0,
      xpValue: 15,
      scrapValue: 3,
      color: '#34d399',
      radius: 4,
    });

    this.asteroids.splice(index, 1);

    // Respawn asteroid elsewhere
    const a = Math.random() * Math.PI * 2;
    this.spawnAsteroid(
      this.x + Math.cos(a) * (800 + Math.random() * 400),
      this.y + Math.sin(a) * (800 + Math.random() * 400),
      25 + Math.random() * 30
    );
  }

  private handleGameOver() {
    this.isRunning = false;
    sound.stopBgm();
    sound.playExplosion('boss');

    this.callbacks.onGameOver(this.score, this.sessionScrap, Math.floor(this.survivalTimer), this.level);
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
      fontSize: 14,
      life: 0.85,
      maxLife: 0.85,
    });
  }

  // ================= RENDER SYSTEM =================
  private render() {
    const ctx = this.ctx;

    ctx.save();
    if (this.screenShake > 0) {
      const shakeX = (Math.random() - 0.5) * this.screenShake;
      const shakeY = (Math.random() - 0.5) * this.screenShake;
      ctx.translate(shakeX, shakeY);
    }

    // Clear Screen
    ctx.fillStyle = '#030712';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Apply Camera Transform
    ctx.save();
    ctx.translate(CANVAS_WIDTH / 2 - this.camX, CANVAS_HEIGHT / 2 - this.camY);

    // Render Deep Galaxy Stars & Landmarks
    this.renderWorldBackground();

    // Render Asteroids
    this.renderAsteroids();

    // Render Black Holes
    this.renderBlackHoles();

    // Render Starlight Gems
    this.renderGems();

    // Render Bullets
    this.renderBullets();

    // Render Enemies
    this.renderEnemies();

    // Render Player Ship & Satellites
    this.renderPlayer();

    // Render Particles
    this.renderParticles();

    // Render Floating Texts
    this.renderFloatingTexts();

    ctx.restore(); // Restore camera transform

    ctx.restore(); // Restore shake
  }

  private renderWorldBackground() {
    const ctx = this.ctx;

    // Distant Starfield with parallax
    for (const star of this.stars) {
      ctx.fillStyle = star.color;
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
      ctx.fill();
    }

    // Central Sun Landmark
    const sunX = WORLD_WIDTH / 2;
    const sunY = WORLD_HEIGHT / 2;
    const sunGrad = ctx.createRadialGradient(sunX, sunY, 30, sunX, sunY, 320);
    sunGrad.addColorStop(0, 'rgba(245, 158, 11, 0.45)');
    sunGrad.addColorStop(0.5, 'rgba(239, 68, 68, 0.15)');
    sunGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = sunGrad;
    ctx.beginPath();
    ctx.arc(sunX, sunY, 320, 0, Math.PI * 2);
    ctx.fill();

    // World Boundary Grid border
    ctx.strokeStyle = 'rgba(6, 182, 212, 0.25)';
    ctx.lineWidth = 4;
    ctx.strokeRect(40, 40, WORLD_WIDTH - 80, WORLD_HEIGHT - 80);
  }

  private renderAsteroids() {
    const ctx = this.ctx;
    for (const a of this.asteroids) {
      ctx.save();
      ctx.translate(a.x, a.y);
      ctx.rotate(a.angle);

      ctx.fillStyle = '#334155';
      ctx.strokeStyle = '#64748b';
      ctx.lineWidth = 1.5;

      ctx.beginPath();
      for (let i = 0; i < a.points.length; i++) {
        const pt = a.points[i];
        if (i === 0) ctx.moveTo(pt.x, pt.y);
        else ctx.lineTo(pt.x, pt.y);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.restore();
    }
  }

  private renderBlackHoles() {
    const ctx = this.ctx;
    for (const bh of this.blackHoles) {
      ctx.save();
      ctx.translate(bh.x, bh.y);

      // Swirling outer ring
      ctx.beginPath();
      ctx.arc(0, 0, bh.pullRadius * 0.4, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(168, 85, 247, 0.3)';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Black Hole Event Horizon
      ctx.fillStyle = '#000000';
      ctx.beginPath();
      ctx.arc(0, 0, bh.radius, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#c084fc';
      ctx.lineWidth = 3;
      ctx.stroke();

      ctx.restore();
    }
  }

  private renderGems() {
    const ctx = this.ctx;
    for (const gem of this.gems) {
      ctx.save();
      ctx.translate(gem.x, gem.y);

      ctx.fillStyle = gem.color;
      ctx.shadowColor = gem.color;
      ctx.shadowBlur = 8;

      ctx.beginPath();
      ctx.arc(0, 0, gem.radius, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }
  }

  private renderBullets() {
    const ctx = this.ctx;

    // Player Bullets
    for (const b of this.playerBullets) {
      ctx.save();
      ctx.fillStyle = b.color;
      ctx.shadowColor = b.color;
      ctx.shadowBlur = b.piercing ? 12 : 6;

      ctx.beginPath();
      ctx.arc(b.x, b.y, b.width / 2, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }

    // Enemy Bullets
    for (const b of this.enemyBullets) {
      ctx.save();
      ctx.fillStyle = b.color;
      ctx.shadowColor = b.color;
      ctx.shadowBlur = 8;

      ctx.beginPath();
      ctx.arc(b.x, b.y, b.width / 2, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }
  }

  private renderEnemies() {
    const ctx = this.ctx;
    for (const enemy of this.enemies) {
      ctx.save();
      ctx.translate(enemy.x, enemy.y);
      ctx.rotate(enemy.angle || 0);

      ctx.fillStyle = enemy.color;
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.2;

      const w = enemy.width;
      const h = enemy.height;

      if (enemy.type.startsWith('BOSS')) {
        // Enormous Flagship
        ctx.beginPath();
        ctx.moveTo(w * 0.5, 0);
        ctx.lineTo(-w * 0.4, h * 0.45);
        ctx.lineTo(-w * 0.25, 0);
        ctx.lineTo(-w * 0.4, -h * 0.45);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#fbbf24';
        ctx.beginPath();
        ctx.arc(0, 0, 14, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // Starfighter
        ctx.beginPath();
        ctx.moveTo(w * 0.5, 0);
        ctx.lineTo(-w * 0.4, h * 0.35);
        ctx.lineTo(-w * 0.2, 0);
        ctx.lineTo(-w * 0.4, -h * 0.35);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }

      ctx.restore();
    }
  }

  private renderPlayer() {
    const ctx = this.ctx;

    if (this.invulnerableTimer > 0 && Math.floor(this.invulnerableTimer * 10) % 2 === 0) {
      return;
    }

    // Render Orbital Satellites
    const satCount = this.abilities.orbital_satellite;
    if (satCount > 0) {
      for (let s = 0; s < satCount; s++) {
        const a = this.satelliteAngle + (s / satCount) * Math.PI * 2;
        const sx = this.x + Math.cos(a) * 55;
        const sy = this.y + Math.sin(a) * 55;

        ctx.save();
        ctx.fillStyle = '#38bdf8';
        ctx.shadowColor = '#38bdf8';
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(sx, sy, 7, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }

    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);

    // Shield aura if invulnerable
    if (this.invulnerableTimer > 0) {
      ctx.beginPath();
      ctx.arc(0, 0, 34, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.7)';
      ctx.lineWidth = 2.5;
      ctx.stroke();
    }

    // Starfighter hull
    ctx.fillStyle = this.shipConfig.color;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;

    ctx.beginPath();
    ctx.moveTo(24, 0); // Nose pointing along positive X (which angle rotates)
    ctx.lineTo(-14, 18);
    ctx.lineTo(-8, 8);
    ctx.lineTo(-18, 0);
    ctx.lineTo(-8, -8);
    ctx.lineTo(-14, -18);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Canopy glass
    ctx.fillStyle = '#e0f2fe';
    ctx.beginPath();
    ctx.ellipse(2, 0, 8, 4, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  private renderParticles() {
    const ctx = this.ctx;
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * 0.016;
      p.y += p.vy * 0.016;
      p.life -= 0.016;
      p.alpha = Math.max(0, p.life / p.maxLife);

      if (p.life <= 0) {
        this.particles.splice(i, 1);
        continue;
      }

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
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i];
      ft.y -= 25 * 0.016;
      ft.life -= 0.016;

      if (ft.life <= 0) {
        this.floatingTexts.splice(i, 1);
        continue;
      }

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
}
