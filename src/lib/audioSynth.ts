// ─── Lightweight Web Audio Polyphonic Synth (Ear-First Auditioning) ─────────
// Ported from ppt-visualiser/src/core/audio-synth.ts and adapted for chord & cadence auditioning.

export type SynthWaveform = 'warm-poly' | 'sine' | 'triangle';

interface Voice {
  midi: number;
  osc: OscillatorNode;
  subOsc?: OscillatorNode;
  filter: BiquadFilterNode;
  gain: GainNode;
  releaseTime: number;
}

export class AudioSynth {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private activeVoices: Map<number, Voice> = new Map();
  private isMuted: boolean = false;
  private volume: number = 0.65;
  private waveform: SynthWaveform = 'warm-poly';
  private strumTimers: ReturnType<typeof setTimeout>[] = [];

  private initContext() {
    if (!this.ctx) {
      if (typeof window === 'undefined') return;
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : this.volume, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public getAudioState(): 'running' | 'suspended' | 'closed' {
    if (!this.ctx) return 'suspended';
    const state = this.ctx.state as string;
    if (state === 'running') return 'running';
    if (state === 'closed') return 'closed';
    return 'suspended';
  }

  public async unlock(): Promise<'running' | 'suspended' | 'closed'> {
    this.initContext();
    if (this.ctx && this.ctx.state === 'suspended') {
      try {
        await this.ctx.resume();
      } catch {
        // Ignore resume failure without user gesture
      }
    }
    return this.getAudioState();
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : this.volume, this.ctx.currentTime);
    }
    if (muted) {
      this.stopAll(true);
    }
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  public setVolume(vol: number) {
    this.volume = Math.max(0, Math.min(1, vol));
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : this.volume, this.ctx.currentTime);
    }
  }

  public noteOn(midi: number, velocity: number = 0.75) {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx || !this.masterGain) return;

    if (this.activeVoices.has(midi)) {
      this.noteOff(midi);
    }

    const freq = 440 * Math.pow(2, (midi - 69) / 12);
    const now = this.ctx.currentTime;

    const voiceGain = this.ctx.createGain();
    const peakGain = Math.max(0.01, Math.min(1, velocity)) * 0.25;
    voiceGain.gain.setValueAtTime(0.0001, now);
    voiceGain.gain.exponentialRampToValueAtTime(peakGain, now + 0.012);
    voiceGain.gain.exponentialRampToValueAtTime(peakGain * 0.65, now + 0.22);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    const cutoff = Math.min(8000, freq * (2.5 + velocity * 3.0));
    filter.frequency.setValueAtTime(cutoff, now);
    filter.Q.setValueAtTime(1.5, now);

    let osc: OscillatorNode;
    let subOsc: OscillatorNode | undefined;

    if (this.waveform === 'warm-poly') {
      osc = this.ctx.createOscillator();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now);

      subOsc = this.ctx.createOscillator();
      subOsc.type = 'sine';
      subOsc.frequency.setValueAtTime(freq * 0.5, now);
      subOsc.detune.setValueAtTime(3, now);
      subOsc.connect(filter);
      subOsc.start(now);
    } else {
      osc = this.ctx.createOscillator();
      osc.type = this.waveform;
      osc.frequency.setValueAtTime(freq, now);
    }

    osc.connect(filter);
    filter.connect(voiceGain);
    voiceGain.connect(this.masterGain);
    osc.start(now);

    this.activeVoices.set(midi, {
      midi,
      osc,
      subOsc,
      filter,
      gain: voiceGain,
      releaseTime: 0.45,
    });
  }

  public noteOff(midi: number) {
    if (!this.ctx) return;
    const voice = this.activeVoices.get(midi);
    if (!voice) return;

    const now = this.ctx.currentTime;
    const release = voice.releaseTime;

    voice.gain.gain.cancelScheduledValues(now);
    voice.gain.gain.setValueAtTime(Math.max(0.0001, voice.gain.gain.value), now);
    voice.gain.gain.exponentialRampToValueAtTime(0.00001, now + release);

    voice.osc.stop(now + release + 0.05);
    if (voice.subOsc) {
      voice.subOsc.stop(now + release + 0.05);
    }

    setTimeout(() => {
      try {
        voice.osc.disconnect();
        if (voice.subOsc) voice.subOsc.disconnect();
        voice.filter.disconnect();
        voice.gain.disconnect();
      } catch {
        // Ignore already disconnected nodes
      }
    }, (release + 0.1) * 1000);

    this.activeVoices.delete(midi);
  }

  /**
   * Plays or gently strums a chord voicing (given root pitch class and intervals)
   */
  public playChordVoicing(root: number, intervals: number[], mode: 'block' | 'arpeggio' = 'arpeggio', baseOctave: number = 4) {
    if (this.isMuted || intervals.length === 0) return;

    for (const timer of this.strumTimers) {
      clearTimeout(timer);
    }
    this.strumTimers = [];
    this.stopAll(false);

    // Center voicing comfortably around C4 (MIDI 60)
    const span = Math.max(...intervals) - Math.min(...intervals);
    let baseMidi = (baseOctave + 1) * 12 + root;
    if (baseMidi + span > 82) baseMidi -= 12;
    if (baseMidi + Math.min(...intervals) < 42) baseMidi += 12;

    const sortedMidis = [...intervals].map(i => baseMidi + i).sort((a, b) => a - b);
    const delayStepMs = mode === 'arpeggio' ? 55 : 12;
    const durationMs = mode === 'arpeggio' ? 950 : 750;

    sortedMidis.forEach((midi, idx) => {
      const tOn = setTimeout(() => {
        this.noteOn(midi, 0.72);
      }, idx * delayStepMs);

      const tOff = setTimeout(() => {
        this.noteOff(midi);
      }, idx * delayStepMs + durationMs);

      this.strumTimers.push(tOn, tOff);
    });
  }

  public playSingleNote(midi: number, durationMs: number = 500) {
    if (this.isMuted) return;
    this.noteOn(midi, 0.78);
    const tOff = setTimeout(() => {
      this.noteOff(midi);
    }, durationMs);
    this.strumTimers.push(tOff);
  }

  public stopAll(immediate: boolean = false) {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    for (const [midi, voice] of this.activeVoices.entries()) {
      if (immediate) {
        try {
          voice.gain.gain.cancelScheduledValues(now);
          voice.gain.gain.setValueAtTime(0.00001, now);
          voice.osc.stop(now + 0.01);
          if (voice.subOsc) voice.subOsc.stop(now + 0.01);
          voice.osc.disconnect();
          if (voice.subOsc) voice.subOsc.disconnect();
          voice.filter.disconnect();
          voice.gain.disconnect();
        } catch {
          // Ignore
        }
      } else {
        this.noteOff(midi);
      }
    }
    if (immediate) {
      this.activeVoices.clear();
    }
  }
}

export const synthInstance = new AudioSynth();
