import { ActionFeedbackEvent } from './types';

/**
 * Commodore 64 SID-inspired Web Audio Synthesizer
 * Uses pure Web Audio oscillators (square, sawtooth, triangle) and white-noise buffers
 * with fast 60Hz pitch arpeggios and ±8% pitch variation.
 */
class SIDAudioEngine {
  private ctx: AudioContext | null = null;
  public muted = false;

  private ensureContext(): AudioContext | null {
    if (this.muted) return null;
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  private playTone(
    freq: number,
    duration: number,
    type: OscillatorType = 'square',
    volume = 0.14,
    slideToFreq?: number,
    delayOffset = 0
  ): void {
    const ctx = this.ensureContext();
    if (!ctx) return;

    const now = ctx.currentTime + delayOffset;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    if (slideToFreq) {
      osc.frequency.exponentialRampToValueAtTime(
        Math.max(20, slideToFreq),
        now + duration
      );
    }

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(volume, now + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + duration + 0.01);
  }

  private playNoise(duration: number, volume = 0.15, delayOffset = 0): void {
    const ctx = this.ensureContext();
    if (!ctx) return;

    const now = ctx.currentTime + delayOffset;
    const sampleCount = Math.max(1, Math.floor(ctx.sampleRate * duration));
    const buffer = ctx.createBuffer(1, sampleCount, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    // 8-bit LFSR-like stepped noise
    let lastVal = 0;
    for (let i = 0; i < sampleCount; i++) {
      if (i % 4 === 0) {
        lastVal = Math.random() * 2 - 1;
      }
      data[i] = lastVal;
    }

    const src = ctx.createBufferSource();
    src.buffer = buffer;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    src.connect(gain);
    gain.connect(ctx.destination);
    src.start(now);
  }

  public playStartChime(): void {
    const notes = [261.63, 329.63, 392.0, 523.25, 659.25, 783.99];
    notes.forEach((n, idx) => {
      this.playTone(n, 0.09, 'square', 0.13, undefined, idx * 0.055);
    });
  }

  public playEvent(ev: ActionFeedbackEvent): void {
    if (this.muted) return;
    const pitchJitter = 1 + (Math.random() * 0.14 - 0.07);

    switch (ev.kind) {
      case 'move':
        this.playTone(95 * pitchJitter, 0.032, 'triangle', 0.08, 60);
        break;
      case 'bump_wall':
      case 'locked_door':
        this.playTone(70, 0.08, 'sawtooth', 0.12, 42);
        break;
      case 'open_door':
        this.playTone(140, 0.07, 'square', 0.1, 210);
        break;
      case 'unlock_door':
        this.playTone(440, 0.06, 'square', 0.13);
        this.playTone(660, 0.09, 'square', 0.13, undefined, 0.06);
        break;
      case 'attack_miss':
        this.playNoise(0.06, 0.08);
        this.playTone(220 * pitchJitter, 0.06, 'triangle', 0.08, 110);
        break;
      case 'attack_hit':
        this.playNoise(0.08, 0.16);
        this.playTone(180 * pitchJitter, 0.09, 'sawtooth', 0.15, 75);
        break;
      case 'attack_kill':
        this.playNoise(0.12, 0.18);
        this.playTone(220, 0.07, 'square', 0.15, 110);
        this.playTone(330, 0.07, 'square', 0.14, undefined, 0.06);
        this.playTone(440, 0.12, 'square', 0.15, undefined, 0.12);
        break;
      case 'player_hurt':
      case 'trap_hit':
        this.playNoise(0.11, 0.18);
        this.playTone(155 * pitchJitter, 0.14, 'sawtooth', 0.18, 55);
        break;
      case 'pickup_gold':
        this.playTone(587.33 * pitchJitter, 0.055, 'square', 0.12);
        this.playTone(880 * pitchJitter, 0.09, 'square', 0.12, undefined, 0.055);
        break;
      case 'pickup_key':
      case 'pickup_potion':
        this.playTone(523.25, 0.05, 'square', 0.12);
        this.playTone(659.25, 0.05, 'square', 0.12, undefined, 0.05);
        this.playTone(783.99, 0.09, 'square', 0.12, undefined, 0.1);
        break;
      case 'pickup_gear':
      case 'open_chest':
        [392, 493.88, 587.33, 783.99].forEach((f, i) => {
          this.playTone(f, 0.07, 'square', 0.13, undefined, i * 0.055);
        });
        break;
      case 'use_potion':
        this.playTone(260, 0.18, 'triangle', 0.15, 680);
        break;
      case 'use_scroll':
        this.playNoise(0.16, 0.16);
        this.playTone(620, 0.18, 'sawtooth', 0.14, 180);
        break;
      case 'enemy_telegraph':
        this.playTone(310, 0.06, 'sawtooth', 0.09, 440);
        break;
      case 'descend_stairs':
        [523.25, 440, 349.23, 261.63].forEach((f, i) => {
          this.playTone(f, 0.08, 'square', 0.13, undefined, i * 0.065);
        });
        break;
      case 'level_up':
      case 'victory':
        [261.63, 329.63, 392.0, 523.25, 659.25, 1046.5].forEach((f, i) => {
          this.playTone(f, 0.1, 'square', 0.15, undefined, i * 0.07);
        });
        break;
      case 'defeat':
        [246.94, 220, 196, 146.83].forEach((f, i) => {
          this.playTone(f, 0.16, 'sawtooth', 0.16, f * 0.9, i * 0.14);
        });
        break;
    }
  }
}

export const sidAudio = new SIDAudioEngine();
