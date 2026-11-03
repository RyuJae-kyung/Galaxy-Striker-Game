/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Procedural Retro Arcade & Space Synthesizer using Web Audio API
class SoundController {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private bgmGain: GainNode | null = null;
  private isMuted: boolean = false;
  private isBgmMuted: boolean = false;
  private bgmInterval: number | null = null;
  private bgmStep: number = 0;

  constructor() {
    // Initialized on user interaction
  }

  private initCtx() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
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

  public setMute(muted: boolean) {
    this.isMuted = muted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(muted ? 0 : 0.8, this.ctx.currentTime);
    }
  }

  public setBgmMute(muted: boolean) {
    this.isBgmMuted = muted;
    if (this.bgmGain && this.ctx) {
      this.bgmGain.gain.setValueAtTime(muted ? 0 : 0.22, this.ctx.currentTime);
    }
  }

  public toggleMute() {
    this.setMute(!this.isMuted);
    return this.isMuted;
  }

  public toggleBgmMute() {
    this.setBgmMute(!this.isBgmMuted);
    return this.isBgmMuted;
  }

  public getMuted() {
    return this.isMuted;
  }

  public getBgmMuted() {
    return this.isBgmMuted;
  }

  // Laser shot sounds
  public playLaser(type: 'single' | 'dual' | 'plasma' | 'scatter' | 'homing' | 'missile' = 'single') {
    if (this.isMuted) return;
    try {
      this.initCtx();
      if (!this.ctx || !this.sfxGain) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const now = this.ctx.currentTime;
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
      } else if (type === 'dual') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(1050, now);
        osc.frequency.exponentialRampToValueAtTime(180, now + 0.14);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
        osc.start(now);
        osc.stop(now + 0.14);
      } else if (type === 'plasma') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(1400, now);
        osc.frequency.linearRampToValueAtTime(320, now + 0.2);
        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
        osc.start(now);
        osc.stop(now + 0.2);
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
      } else {
        // Homing chirp
        osc.type = 'sine';
        osc.frequency.setValueAtTime(400, now);
        osc.frequency.exponentialRampToValueAtTime(950, now + 0.08);
        osc.frequency.exponentialRampToValueAtTime(250, now + 0.16);
        gain.gain.setValueAtTime(0.16, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
        osc.start(now);
        osc.stop(now + 0.16);
      }
    } catch {
      // Audio error suppressed safely
    }
  }

  // Chain Lightning Electric Zap
  public playLightning() {
    if (this.isMuted) return;
    try {
      this.initCtx();
      if (!this.ctx || !this.sfxGain) return;
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
    } catch {
      // Audio error suppressed
    }
  }

  // Level Up fanfare
  public playLevelUp() {
    if (this.isMuted) return;
    try {
      this.initCtx();
      if (!this.ctx || !this.sfxGain) return;

      const notes = [440, 554, 659, 880, 1108]; // A4, C#5, E5, A5, C#6
      const now = this.ctx.currentTime;

      notes.forEach((freq, idx) => {
        if (!this.ctx || !this.sfxGain) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.value = freq;

        const noteStart = now + idx * 0.07;
        gain.gain.setValueAtTime(0.22, noteStart);
        gain.gain.exponentialRampToValueAtTime(0.001, noteStart + 0.2);

        osc.connect(gain);
        gain.connect(this.sfxGain);

        osc.start(noteStart);
        osc.stop(noteStart + 0.22);
      });
    } catch {
      // Audio error suppressed
    }
  }

  // Boost afterburner sound
  public playBoost() {
    if (this.isMuted) return;
    try {
      this.initCtx();
      if (!this.ctx || !this.sfxGain) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(110, now);
      osc.frequency.exponentialRampToValueAtTime(320, now + 0.25);

      gain.gain.setValueAtTime(0.14, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now);
      osc.stop(now + 0.25);
    } catch {
      // Audio error suppressed
    }
  }

  // Enemy shoot sound
  public playEnemyLaser() {
    if (this.isMuted) return;
    try {
      this.initCtx();
      if (!this.ctx || !this.sfxGain) return;

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
    } catch {
      // Audio error suppressed
    }
  }

  // Explosion with noise synthesizer
  public playExplosion(size: 'small' | 'medium' | 'boss' = 'small') {
    if (this.isMuted) return;
    try {
      this.initCtx();
      if (!this.ctx || !this.sfxGain) return;

      const duration = size === 'boss' ? 0.8 : size === 'medium' ? 0.35 : 0.2;
      const bufferSize = this.ctx.sampleRate * duration;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);

      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }

      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      const now = this.ctx.currentTime;

      if (size === 'boss') {
        filter.frequency.setValueAtTime(500, now);
        filter.frequency.exponentialRampToValueAtTime(40, now + duration);
      } else {
        filter.frequency.setValueAtTime(900, now);
        filter.frequency.exponentialRampToValueAtTime(80, now + duration);
      }

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(size === 'boss' ? 0.6 : size === 'medium' ? 0.35 : 0.22, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.sfxGain);

      noise.start(now);
      noise.stop(now + duration);

      if (size === 'boss') {
        const osc = this.ctx.createOscillator();
        const oscGain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(140, now);
        osc.frequency.exponentialRampToValueAtTime(25, now + duration);
        oscGain.gain.setValueAtTime(0.4, now);
        oscGain.gain.exponentialRampToValueAtTime(0.001, now + duration);

        osc.connect(oscGain);
        oscGain.connect(this.sfxGain);
        osc.start(now);
        osc.stop(now + duration);
      }
    } catch {
      // Audio error suppressed
    }
  }

  // Hit impact tick
  public playHit() {
    if (this.isMuted) return;
    try {
      this.initCtx();
      if (!this.ctx || !this.sfxGain) return;

      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.exponentialRampToValueAtTime(70, now + 0.05);

      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(now);
      osc.stop(now + 0.05);
    } catch {
      // Audio error suppressed
    }
  }

  // PowerUp / Crystal pickup chime
  public playPowerUp() {
    if (this.isMuted) return;
    try {
      this.initCtx();
      if (!this.ctx || !this.sfxGain) return;

      const notes = [440, 554, 659, 880];
      const now = this.ctx.currentTime;

      notes.forEach((freq, idx) => {
        if (!this.ctx || !this.sfxGain) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.value = freq;

        const noteStart = now + idx * 0.05;
        gain.gain.setValueAtTime(0.15, noteStart);
        gain.gain.exponentialRampToValueAtTime(0.001, noteStart + 0.12);

        osc.connect(gain);
        gain.connect(this.sfxGain);

        osc.start(noteStart);
        osc.stop(noteStart + 0.13);
      });
    } catch {
      // Audio error suppressed
    }
  }

  // XP gem pickup light tick
  public playXpTick() {
    if (this.isMuted) return;
    try {
      this.initCtx();
      if (!this.ctx || !this.sfxGain) return;

      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(600 + Math.random() * 400, now);
      gain.gain.setValueAtTime(0.06, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now);
      osc.stop(now + 0.04);
    } catch {
      // Audio error suppressed
    }
  }

  // EMP Screen Bomb sound
  public playBomb() {
    if (this.isMuted) return;
    try {
      this.initCtx();
      if (!this.ctx || !this.sfxGain) return;

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
    } catch {
      // Audio error suppressed
    }
  }

  // Boss warning alarm
  public playBossAlarm() {
    if (this.isMuted) return;
    try {
      this.initCtx();
      if (!this.ctx || !this.sfxGain) return;

      const now = this.ctx.currentTime;
      for (let i = 0; i < 3; i++) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sawtooth';
        const start = now + i * 0.35;
        osc.frequency.setValueAtTime(850, start);
        osc.frequency.linearRampToValueAtTime(350, start + 0.25);

        gain.gain.setValueAtTime(0.28, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.28);

        osc.connect(gain);
        gain.connect(this.sfxGain);

        osc.start(start);
        osc.stop(start + 0.3);
      }
    } catch {
      // Audio error suppressed
    }
  }

  // Dive bomb sound (authentic classic Galaga swoop whistle)
  public playDiveSwoop() {
    if (this.isMuted) return;
    try {
      this.initCtx();
      if (!this.ctx || !this.sfxGain) return;

      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(900, now);
      osc.frequency.exponentialRampToValueAtTime(250, now + 0.3);

      gain.gain.setValueAtTime(0.09, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(now);
      osc.stop(now + 0.3);
    } catch {
      // Audio error suppressed
    }
  }

  // Background arcade chiptune melody
  public startBgm() {
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
        const bassFreq = bassScale[this.bgmStep % bassScale.length];
        bassOsc.frequency.setValueAtTime(bassFreq, now);

        bassGain.gain.setValueAtTime(0.05, now);
        bassGain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);

        bassOsc.connect(bassGain);
        bassGain.connect(this.bgmGain);
        bassOsc.start(now);
        bassOsc.stop(now + 0.18);

        if (this.bgmStep % 2 === 0) {
          const leadOsc = this.ctx.createOscillator();
          const leadGain = this.ctx.createGain();
          leadOsc.type = 'triangle';
          const leadFreq = leadScale[(Math.floor(this.bgmStep / 2)) % leadScale.length];
          leadOsc.frequency.setValueAtTime(leadFreq, now);

          leadGain.gain.setValueAtTime(0.045, now);
          leadGain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

          leadOsc.connect(leadGain);
          leadGain.connect(this.bgmGain);
          leadOsc.start(now);
          leadOsc.stop(now + 0.3);
        }

        this.bgmStep = (this.bgmStep + 1) % 32;
      } catch {
        // Suppress audio step error
      }
    }, 180);
  }

  public stopBgm() {
    if (this.bgmInterval !== null) {
      clearInterval(this.bgmInterval);
      this.bgmInterval = null;
    }
  }
}

export const sound = new SoundController();
