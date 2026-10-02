class AudioSystem {
  private ctx: AudioContext | null = null;
  private soundEnabled: boolean = true;
  private engineOsc: OscillatorNode | null = null;
  private engineGain: GainNode | null = null;
  private isEngineRunning: boolean = false;

  constructor() {
    const saved = localStorage.getItem('parking_master_sound');
    if (saved !== null) {
      this.soundEnabled = saved === 'true';
    }
  }

  private initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public isMuted(): boolean {
    return !this.soundEnabled;
  }

  public toggleSound(): boolean {
    this.soundEnabled = !this.soundEnabled;
    localStorage.setItem('parking_master_sound', String(this.soundEnabled));
    if (!this.soundEnabled) {
      this.stopEngine();
    }
    return this.soundEnabled;
  }

  public setSound(enabled: boolean): void {
    this.soundEnabled = enabled;
    localStorage.setItem('parking_master_sound', String(enabled));
    if (!enabled) {
      this.stopEngine();
    }
  }

  public playButtonClick() {
    if (!this.soundEnabled) return;
    try {
      this.initContext();
      if (!this.ctx) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const t = this.ctx.currentTime;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(480, t);
      osc.frequency.exponentialRampToValueAtTime(880, t + 0.05);

      gain.gain.setValueAtTime(0.12, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.07);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t);
      osc.stop(t + 0.08);
    } catch {
      // ignore audio errors
    }
  }

  public startEngine() {
    if (!this.soundEnabled || this.isEngineRunning) return;
    try {
      this.initContext();
      if (!this.ctx) return;

      this.engineOsc = this.ctx.createOscillator();
      this.engineGain = this.ctx.createGain();

      this.engineOsc.type = 'triangle';
      this.engineOsc.frequency.setValueAtTime(55, this.ctx.currentTime);

      this.engineGain.gain.setValueAtTime(0.03, this.ctx.currentTime);

      // Lowpass filter for smooth engine rumble
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(140, this.ctx.currentTime);

      this.engineOsc.connect(filter);
      filter.connect(this.engineGain);
      this.engineGain.connect(this.ctx.destination);

      this.engineOsc.start();
      this.isEngineRunning = true;
    } catch {
      // ignore
    }
  }

  public updateEngine(speed: number, isAccelerating: boolean) {
    if (!this.soundEnabled || !this.isEngineRunning || !this.engineOsc || !this.engineGain || !this.ctx) return;

    try {
      const absSpeed = Math.abs(speed);
      const baseFreq = 50 + absSpeed * 28 + (isAccelerating ? 25 : 0);
      const targetGain = 0.02 + Math.min(0.08, absSpeed * 0.02) + (isAccelerating ? 0.02 : 0);

      const t = this.ctx.currentTime;
      this.engineOsc.frequency.setTargetAtTime(baseFreq, t, 0.08);
      this.engineGain.gain.setTargetAtTime(targetGain, t, 0.08);
    } catch {
      // ignore
    }
  }

  public stopEngine() {
    if (this.engineOsc) {
      try {
        this.engineOsc.stop();
        this.engineOsc.disconnect();
      } catch {
        // ignore
      }
      this.engineOsc = null;
    }
    this.engineGain = null;
    this.isEngineRunning = false;
  }

  public playBrake() {
    if (!this.soundEnabled) return;
    try {
      this.initContext();
      if (!this.ctx) return;

      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(950, t);
      osc.frequency.linearRampToValueAtTime(800, t + 0.15);

      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1200, t);
      filter.Q.setValueAtTime(4, t);

      gain.gain.setValueAtTime(0.08, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t);
      osc.stop(t + 0.16);
    } catch {
      // ignore
    }
  }

  public playCollision() {
    this.stopEngine();
    if (!this.soundEnabled) return;
    try {
      this.initContext();
      if (!this.ctx) return;

      const t = this.ctx.currentTime;

      // Heavy low impact thud
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(160, t);
      osc.frequency.exponentialRampToValueAtTime(30, t + 0.35);

      gain.gain.setValueAtTime(0.4, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t);
      osc.stop(t + 0.42);

      // Noise metal crunch simulation using white noise buffer
      const bufferSize = this.ctx.sampleRate * 0.25;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.2));
      }

      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const noiseFilter = this.ctx.createBiquadFilter();
      noiseFilter.type = 'lowpass';
      noiseFilter.frequency.setValueAtTime(800, t);

      const noiseGain = this.ctx.createGain();
      noiseGain.gain.setValueAtTime(0.3, t);
      noiseGain.gain.exponentialRampToValueAtTime(0.01, t + 0.25);

      noise.connect(noiseFilter);
      noiseFilter.connect(noiseGain);
      noiseGain.connect(this.ctx.destination);

      noise.start(t);
    } catch {
      // ignore
    }
  }

  public playLevelComplete() {
    this.stopEngine();
    if (!this.soundEnabled) return;
    try {
      this.initContext();
      if (!this.ctx) return;

      const t = this.ctx.currentTime;
      const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
      const noteDuration = 0.12;

      notes.forEach((freq, idx) => {
        if (!this.ctx) return;
        const noteStartTime = t + idx * noteDuration;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, noteStartTime);

        gain.gain.setValueAtTime(0, noteStartTime);
        gain.gain.linearRampToValueAtTime(0.2, noteStartTime + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, noteStartTime + 0.25);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(noteStartTime);
        osc.stop(noteStartTime + 0.28);
      });
    } catch {
      // ignore
    }
  }

  public playGameOver() {
    this.stopEngine();
    if (!this.soundEnabled) return;
    try {
      this.initContext();
      if (!this.ctx) return;

      const t = this.ctx.currentTime;
      const notes = [330, 293.66, 261.63, 196]; // Descending
      const noteDuration = 0.14;

      notes.forEach((freq, idx) => {
        if (!this.ctx) return;
        const noteStartTime = t + idx * noteDuration;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, noteStartTime);

        gain.gain.setValueAtTime(0.18, noteStartTime);
        gain.gain.exponentialRampToValueAtTime(0.001, noteStartTime + 0.2);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(noteStartTime);
        osc.stop(noteStartTime + 0.22);
      });
    } catch {
      // ignore
    }
  }
}

export const audioSystem = new AudioSystem();
