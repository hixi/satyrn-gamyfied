/**
 * Synthesized SFX: WebAudio oscillators, no audio files. Default off; every
 * method is safe to call with no AudioContext (tests, disabled state).
 */

type Wave = OscillatorType;

export class SoundBank {
  enabled = false;
  private context: AudioContext | null = null;
  private master: GainNode | null = null;

  setEnabled(on: boolean): void {
    this.enabled = on;
    if (on) this.ensureContext();
  }

  click(): void {
    this.blip('square', 660, 0.05);
  }

  toggleBlip(): void {
    this.blip('square', 660, 0.05);
    this.blip('square', 990, 0.07, 0.06);
  }

  success(): void {
    this.blip('sine', 523, 0.09);
    this.blip('sine', 784, 0.12, 0.09);
  }

  fail(): void {
    this.blip('triangle', 196, 0.15);
  }

  reveal(): void {
    this.blip('sine', 392, 0.2);
    this.blip('sine', 523, 0.25, 0.12);
  }

  private ensureContext(): void {
    if (this.context || typeof window === 'undefined') return;
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return;
    this.context = new Ctor();
    this.master = this.context.createGain();
    this.master.gain.value = 0.15;
    this.master.connect(this.context.destination);
  }

  private blip(wave: Wave, frequency: number, duration: number, delay = 0): void {
    if (!this.enabled) return;
    this.ensureContext();
    if (!this.context || !this.master) return;
    const start = this.context.currentTime + delay;
    const osc = this.context.createOscillator();
    const gain = this.context.createGain();
    osc.type = wave;
    osc.frequency.value = frequency;
    gain.gain.setValueAtTime(0.6, start);
    gain.gain.exponentialRampToValueAtTime(0.001, start + duration);
    osc.connect(gain);
    gain.connect(this.master);
    osc.start(start);
    osc.stop(start + duration + 0.02);
  }
}
