import { Clip, DrumInstrument, Note, Project, SpatialPosition, SynthParameters, Track } from './types';

// Convert MIDI pitch to frequency (Hz)
export function midiToFreq(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

// Convert note name to MIDI (e.g. C4 -> 60)
export const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
export function midiToNoteName(midi: number): string {
  const octave = Math.floor(midi / 12) - 1;
  const name = NOTE_NAMES[midi % 12];
  return `${name}${octave}`;
}

export class AudioEngine {
  private static instance: AudioEngine | null = null;
  public ctx: AudioContext | null = null;

  // Master bus
  public masterGain: GainNode | null = null;
  public masterEQ: {
    low: BiquadFilterNode;
    mid: BiquadFilterNode;
    high: BiquadFilterNode;
  } | null = null;
  public masterCompressor: DynamicsCompressorNode | null = null;
  public masterAnalyser: AnalyserNode | null = null;
  public reverbConvolver: ConvolverNode | null = null;
  public reverbGain: GainNode | null = null;

  // Track channels: trackId -> channel nodes
  private trackChannels: Map<string, {
    gain: GainNode;
    panner: PannerNode;
    reverbSend: GainNode;
  }> = new Map();

  // Active playing preview notes (for interactive keys)
  private activePreviewVoices: Map<number, { stop: () => void }> = new Map();

  // Sequencer state
  public isPlaying: boolean = false;
  private currentBeat: number = 0;
  private bpm: number = 120;
  private currentProject: Project | null = null;
  private lookaheadMs: number = 25.0; // Interval of scheduling runner
  private scheduleAheadSec: number = 0.1; // How far ahead to schedule audio (sec)
  private timerID: number | null = null;
  private nextBeatToSchedule: number = 0;
  private onBeatUpdateCallbacks: Set<(beat: number) => void> = new Set();
  private onStopCallbacks: Set<() => void> = new Set();

  // Microphone recording
  private mediaStream: MediaStream | null = null;
  private mediaRecorder: MediaRecorder | null = null;
  private recordedChunks: Blob[] = [];

  private constructor() {
    // Lazy initialized on first user interaction
  }

  public static getInstance(): AudioEngine {
    if (!AudioEngine.instance) {
      AudioEngine.instance = new AudioEngine();
    }
    return AudioEngine.instance;
  }

  public init() {
    if (this.ctx) return;
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    this.ctx = new AudioCtx();

    // Master Analyser
    this.masterAnalyser = this.ctx.createAnalyser();
    this.masterAnalyser.fftSize = 1024;
    this.masterAnalyser.smoothingTimeConstant = 0.85;

    // Master Compressor / Limiter
    this.masterCompressor = this.ctx.createDynamicsCompressor();
    this.masterCompressor.threshold.setValueAtTime(-1.5, this.ctx.currentTime);
    this.masterCompressor.knee.setValueAtTime(4, this.ctx.currentTime);
    this.masterCompressor.ratio.setValueAtTime(12, this.ctx.currentTime);
    this.masterCompressor.attack.setValueAtTime(0.003, this.ctx.currentTime);
    this.masterCompressor.release.setValueAtTime(0.25, this.ctx.currentTime);

    // Master EQ
    const low = this.ctx.createBiquadFilter();
    low.type = 'lowshelf';
    low.frequency.setValueAtTime(250, this.ctx.currentTime);

    const mid = this.ctx.createBiquadFilter();
    mid.type = 'peaking';
    mid.frequency.setValueAtTime(1200, this.ctx.currentTime);
    mid.Q.setValueAtTime(1.0, this.ctx.currentTime);

    const high = this.ctx.createBiquadFilter();
    high.type = 'highshelf';
    high.frequency.setValueAtTime(6000, this.ctx.currentTime);

    this.masterEQ = { low, mid, high };

    // Master Gain
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.setValueAtTime(0.85, this.ctx.currentTime);

    // Master Reverb Convolver
    this.reverbConvolver = this.ctx.createConvolver();
    this.reverbConvolver.buffer = this.createGlassReverbImpulse(2.2, 2.0);
    this.reverbGain = this.ctx.createGain();
    this.reverbGain.gain.setValueAtTime(0.4, this.ctx.currentTime);
    this.reverbConvolver.connect(this.reverbGain);
    this.reverbGain.connect(low);

    // Chain: low -> mid -> high -> masterCompressor -> masterGain -> masterAnalyser -> destination
    low.connect(mid);
    mid.connect(high);
    high.connect(this.masterCompressor);
    this.masterCompressor.connect(this.masterGain);
    this.masterGain.connect(this.masterAnalyser);
    this.masterAnalyser.connect(this.ctx.destination);
  }

  public async resumeContext(): Promise<void> {
    this.init();
    if (this.ctx && this.ctx.state === 'suspended') {
      await this.ctx.resume();
    }
  }

  // Create synthetic impulse response for glass reverb
  private createGlassReverbImpulse(durationSec: number, decay: number): AudioBuffer {
    if (!this.ctx) throw new Error('AudioContext not ready');
    const sampleRate = this.ctx.sampleRate;
    const length = sampleRate * durationSec;
    const impulse = this.ctx.createBuffer(2, length, sampleRate);
    const left = impulse.getChannelData(0);
    const right = impulse.getChannelData(1);

    for (let i = 0; i < length; i++) {
      const t = i / length;
      // Exponential decay with shimmer diffusion
      const factor = Math.pow(1 - t, decay);
      left[i] = (Math.random() * 2 - 1) * factor;
      right[i] = (Math.random() * 2 - 1) * factor;
    }
    return impulse;
  }

  // Ensure track channel is configured with PannerNode & Gain
  public registerTrack(track: Track) {
    this.init();
    if (!this.ctx || !this.masterEQ || !this.reverbConvolver) return;

    let channel = this.trackChannels.get(track.id);
    if (!channel) {
      const gain = this.ctx.createGain();
      
      // 3D Spatial Panner Node
      const panner = this.ctx.createPanner();
      panner.panningModel = 'HRTF';
      panner.distanceModel = 'inverse';
      panner.refDistance = 1;
      panner.maxDistance = 10000;
      panner.rolloffFactor = 1;
      panner.coneInnerAngle = 360;
      panner.coneOuterAngle = 360;
      panner.coneOuterGain = 0;

      const reverbSend = this.ctx.createGain();
      reverbSend.gain.setValueAtTime(0.3, this.ctx.currentTime);

      gain.connect(panner);
      panner.connect(this.masterEQ.low);

      gain.connect(reverbSend);
      reverbSend.connect(this.reverbConvolver);

      channel = { gain, panner, reverbSend };
      this.trackChannels.set(track.id, channel);
    }

    // Apply track parameters
    const effectiveGain = track.muted ? 0 : track.volume;
    channel.gain.gain.setValueAtTime(effectiveGain, this.ctx.currentTime);

    // Apply 3D spatial coords
    this.updateTrackSpatial(track.id, track.spatial);
  }

  public updateTrackSpatial(trackId: string, spatial: SpatialPosition) {
    if (!this.ctx) return;
    const channel = this.trackChannels.get(trackId);
    if (!channel) return;

    const time = this.ctx.currentTime;
    channel.panner.positionX.setTargetAtTime(spatial.x, time, 0.05);
    channel.panner.positionY.setTargetAtTime(spatial.y, time, 0.05);
    channel.panner.positionZ.setTargetAtTime(spatial.z, time, 0.05);
  }

  public updateTrackVolume(trackId: string, volume: number, isMuted: boolean = false) {
    if (!this.ctx) return;
    const channel = this.trackChannels.get(trackId);
    if (!channel) return;
    channel.gain.gain.setValueAtTime(isMuted ? 0 : volume, this.ctx.currentTime);
  }

  public setMasterVolume(val: number) {
    if (!this.ctx || !this.masterGain) return;
    this.masterGain.gain.setValueAtTime(Math.max(0, Math.min(1.5, val)), this.ctx.currentTime);
  }

  public setMasterEQ(lowDb: number, midDb: number, highDb: number) {
    if (!this.ctx || !this.masterEQ) return;
    const t = this.ctx.currentTime;
    this.masterEQ.low.gain.setTargetAtTime(lowDb, t, 0.05);
    this.masterEQ.mid.gain.setTargetAtTime(midDb, t, 0.05);
    this.masterEQ.high.gain.setTargetAtTime(highDb, t, 0.05);
  }

  // --- Polyphonic Synthesizer Voice Generator ---
  public playSynthNote(
    trackId: string,
    pitch: number,
    durationSec: number,
    velocity: number = 0.8,
    params: SynthParameters,
    startTime?: number
  ) {
    if (!this.ctx) return;
    const channel = this.trackChannels.get(trackId);
    const dest = channel ? channel.gain : this.masterGain;
    if (!dest) return;

    const t0 = startTime ?? this.ctx.currentTime;
    const freq = midiToFreq(pitch);

    // Oscillator 1 (Main)
    const osc = this.ctx.createOscillator();
    osc.type = params.oscType;
    osc.frequency.setValueAtTime(freq, t0);
    osc.detune.setValueAtTime(params.detune, t0);

    // Oscillator 2 (Sub / Detune layer)
    let subOsc: OscillatorNode | null = null;
    let subGain: GainNode | null = null;
    if (params.subOsc) {
      subOsc = this.ctx.createOscillator();
      subOsc.type = 'sine';
      subOsc.frequency.setValueAtTime(freq * 0.5, t0); // One octave lower
      subGain = this.ctx.createGain();
      subGain.gain.setValueAtTime(params.subOscLevel ?? 0.3, t0);
      subOsc.connect(subGain);
    }

    // Filter
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(params.filterCutoff, t0);
    filter.Q.setValueAtTime(params.filterResonance, t0);

    // Filter Envelope
    const filterEnvTarget = Math.min(
      20000,
      Math.max(20, params.filterCutoff + params.filterEnvAmount * 4000)
    );
    filter.frequency.exponentialRampToValueAtTime(Math.max(20, filterEnvTarget), t0 + params.attack);
    filter.frequency.exponentialRampToValueAtTime(
      Math.max(20, params.filterCutoff),
      t0 + params.attack + params.decay
    );

    // LFO Modulation
    if (params.lfoDepth > 0) {
      const lfo = this.ctx.createOscillator();
      lfo.frequency.setValueAtTime(params.lfoRate, t0);
      const lfoGain = this.ctx.createGain();

      if (params.lfoTarget === 'filter') {
        lfoGain.gain.setValueAtTime(params.lfoDepth * 1500, t0);
        lfo.connect(lfoGain);
        lfoGain.connect(filter.frequency);
      } else if (params.lfoTarget === 'pitch') {
        lfoGain.gain.setValueAtTime(params.lfoDepth * 50, t0);
        lfo.connect(lfoGain);
        lfoGain.connect(osc.detune);
      }
      lfo.start(t0);
      lfo.stop(t0 + durationSec + params.release);
    }

    // Delay FX
    let delayNode: DelayNode | null = null;
    let delayGain: GainNode | null = null;
    if (params.delayTime > 0.01 && params.delayFeedback > 0.01) {
      delayNode = this.ctx.createDelay();
      delayNode.delayTime.setValueAtTime(params.delayTime, t0);
      delayGain = this.ctx.createGain();
      delayGain.gain.setValueAtTime(params.delayFeedback, t0);
      delayNode.connect(delayGain);
      delayGain.connect(delayNode);
    }

    // Amp Envelope Gain
    const ampGain = this.ctx.createGain();
    const peakGain = Math.max(0.01, velocity * 0.45);
    ampGain.gain.setValueAtTime(0.0001, t0);
    // Attack
    ampGain.gain.exponentialRampToValueAtTime(peakGain, t0 + Math.max(0.005, params.attack));
    // Decay -> Sustain
    const sustainGain = Math.max(0.0001, peakGain * params.sustain);
    ampGain.gain.exponentialRampToValueAtTime(sustainGain, t0 + params.attack + params.decay);
    // Release
    const noteEndTime = t0 + durationSec;
    ampGain.gain.setValueAtTime(sustainGain, noteEndTime);
    ampGain.gain.exponentialRampToValueAtTime(0.0001, noteEndTime + Math.max(0.01, params.release));

    // Connect nodes
    osc.connect(filter);
    if (subOsc && subGain) {
      subGain.connect(filter);
      subOsc.start(t0);
      subOsc.stop(noteEndTime + params.release + 0.1);
    }

    filter.connect(ampGain);
    ampGain.connect(dest);

    if (delayNode && delayGain) {
      ampGain.connect(delayNode);
      delayNode.connect(dest);
    }

    osc.start(t0);
    osc.stop(noteEndTime + params.release + 0.1);
  }

  // Interactive preview note on / note off (for piano roll keyboard & chord pads)
  public startPreviewNote(pitch: number, params: SynthParameters): () => void {
    this.resumeContext();
    if (!this.ctx || !this.masterGain) return () => {};

    const freq = midiToFreq(pitch);
    const t0 = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    osc.type = params.oscType;
    osc.frequency.setValueAtTime(freq, t0);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(params.filterCutoff, t0);
    filter.Q.setValueAtTime(params.filterResonance, t0);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(0.4, t0 + Math.max(0.005, params.attack));

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    osc.start(t0);

    const stopFn = () => {
      if (!this.ctx) return;
      const tEnd = this.ctx.currentTime;
      gain.gain.cancelScheduledValues(tEnd);
      gain.gain.setValueAtTime(gain.gain.value, tEnd);
      gain.gain.exponentialRampToValueAtTime(0.0001, tEnd + Math.max(0.01, params.release));
      osc.stop(tEnd + params.release + 0.05);
      this.activePreviewVoices.delete(pitch);
    };

    this.activePreviewVoices.set(pitch, { stop: stopFn });
    return stopFn;
  }

  public stopPreviewNote(pitch: number) {
    const voice = this.activePreviewVoices.get(pitch);
    if (voice) {
      voice.stop();
    }
  }

  // --- Drum Voice Synthesizers ---
  public playDrumSound(
    instrument: DrumInstrument,
    trackId: string,
    velocity: number = 0.9,
    startTime?: number
  ) {
    if (!this.ctx) return;
    const channel = this.trackChannels.get(trackId);
    const dest = channel ? channel.gain : this.masterGain;
    if (!dest) return;

    const t = startTime ?? this.ctx.currentTime;
    const velGain = Math.max(0.1, velocity);

    switch (instrument) {
      case 'kick': {
        // Punchy 808 sub kick
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.frequency.setValueAtTime(140, t);
        osc.frequency.exponentialRampToValueAtTime(38, t + 0.08);

        gain.gain.setValueAtTime(velGain * 1.1, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.45);

        osc.connect(gain);
        gain.connect(dest);
        osc.start(t);
        osc.stop(t + 0.46);
        break;
      }
      case 'snare': {
        // Dual-tone body + snappy white noise
        const osc = this.ctx.createOscillator();
        const oscGain = this.ctx.createGain();
        osc.frequency.setValueAtTime(180, t);
        osc.frequency.exponentialRampToValueAtTime(90, t + 0.12);
        oscGain.gain.setValueAtTime(velGain * 0.6, t);
        oscGain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
        osc.connect(oscGain);
        oscGain.connect(dest);
        osc.start(t);
        osc.stop(t + 0.2);

        // Noise buffer
        const noiseBuffer = this.createNoiseBuffer(0.22);
        const noise = this.ctx.createBufferSource();
        noise.buffer = noiseBuffer;
        const noiseFilter = this.ctx.createBiquadFilter();
        noiseFilter.type = 'highpass';
        noiseFilter.frequency.setValueAtTime(900, t);

        const noiseGain = this.ctx.createGain();
        noiseGain.gain.setValueAtTime(velGain * 0.7, t);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);

        noise.connect(noiseFilter);
        noiseFilter.connect(noiseGain);
        noiseGain.connect(dest);
        noise.start(t);
        break;
      }
      case 'clap': {
        // Multi-trigger burst clap
        const noise = this.ctx.createBufferSource();
        noise.buffer = this.createNoiseBuffer(0.3);
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(1200, t);
        filter.Q.setValueAtTime(2.0, t);

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.001, t);
        // 3 mini burst impulses followed by tail
        gain.gain.setValueAtTime(velGain * 0.6, t);
        gain.gain.setValueAtTime(0.001, t + 0.012);
        gain.gain.setValueAtTime(velGain * 0.7, t + 0.024);
        gain.gain.setValueAtTime(0.001, t + 0.036);
        gain.gain.setValueAtTime(velGain * 0.9, t + 0.048);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.28);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(dest);
        noise.start(t);
        break;
      }
      case 'hihatClosed': {
        // Crisp highpassed metallic noise
        const noise = this.ctx.createBufferSource();
        noise.buffer = this.createNoiseBuffer(0.06);
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.setValueAtTime(7500, t);

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(velGain * 0.55, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.055);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(dest);
        noise.start(t);
        break;
      }
      case 'hihatOpen': {
        const noise = this.ctx.createBufferSource();
        noise.buffer = this.createNoiseBuffer(0.35);
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.setValueAtTime(6500, t);

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(velGain * 0.5, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(dest);
        noise.start(t);
        break;
      }
      case 'tom': {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.frequency.setValueAtTime(120, t);
        osc.frequency.exponentialRampToValueAtTime(65, t + 0.25);
        gain.gain.setValueAtTime(velGain * 0.7, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);

        osc.connect(gain);
        gain.connect(dest);
        osc.start(t);
        osc.stop(t + 0.32);
        break;
      }
      case 'percussion': {
        // Metallic FM bell
        const carrier = this.ctx.createOscillator();
        const mod = this.ctx.createOscillator();
        const modGain = this.ctx.createGain();
        const gain = this.ctx.createGain();

        carrier.frequency.setValueAtTime(880, t);
        mod.frequency.setValueAtTime(1320, t);
        modGain.gain.setValueAtTime(500, t);
        modGain.gain.exponentialRampToValueAtTime(10, t + 0.15);

        mod.connect(modGain);
        modGain.connect(carrier.frequency);

        gain.gain.setValueAtTime(velGain * 0.5, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);

        carrier.connect(gain);
        gain.connect(dest);

        carrier.start(t);
        mod.start(t);
        carrier.stop(t + 0.23);
        mod.stop(t + 0.23);
        break;
      }
    }
  }

  private createNoiseBuffer(durationSec: number): AudioBuffer {
    if (!this.ctx) throw new Error('AudioContext missing');
    const length = Math.floor(this.ctx.sampleRate * durationSec);
    const buffer = this.ctx.createBuffer(1, length, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    return buffer;
  }

  // --- Sequencer & Arranger Playback Engine ---
  public startPlayback(project: Project, startBeat: number = 0) {
    this.resumeContext();
    this.currentProject = project;
    this.bpm = project.bpm;
    this.currentBeat = startBeat;
    this.nextBeatToSchedule = startBeat;
    this.isPlaying = true;

    // Register all tracks
    project.tracks.forEach(t => this.registerTrack(t));

    // Start scheduling lookahead loop
    this.scheduler();
  }

  public pausePlayback() {
    this.isPlaying = false;
    if (this.timerID !== null) {
      window.clearTimeout(this.timerID);
      this.timerID = null;
    }
  }

  public stopPlayback() {
    this.pausePlayback();
    this.currentBeat = 0;
    this.nextBeatToSchedule = 0;
    this.onBeatUpdateCallbacks.forEach(cb => cb(0));
    this.onStopCallbacks.forEach(cb => cb());
  }

  public seekToBeat(beat: number) {
    this.currentBeat = beat;
    this.nextBeatToSchedule = beat;
    this.onBeatUpdateCallbacks.forEach(cb => cb(beat));
  }

  private scheduler = () => {
    if (!this.isPlaying || !this.ctx || !this.currentProject) return;

    const secondsPerBeat = 60.0 / this.bpm;
    const scheduleWindowSec = this.scheduleAheadSec;
    const beatsToAdvance = scheduleWindowSec / secondsPerBeat;

    // While next scheduled beat is within lookahead window
    while (this.nextBeatToSchedule < this.currentBeat + beatsToAdvance) {
      this.scheduleBeat(this.nextBeatToSchedule);
      this.nextBeatToSchedule += 0.25; // 16th note steps

      // Handle loop bounds
      if (
        this.currentProject.isLooping &&
        this.nextBeatToSchedule >= this.currentProject.loopEnd
      ) {
        this.nextBeatToSchedule = this.currentProject.loopStart;
        this.currentBeat = this.currentProject.loopStart;
      }
    }

    // Advance currentBeat playback indicator based on actual clock
    this.currentBeat += (this.lookaheadMs / 1000.0) / secondsPerBeat;
    if (
      this.currentProject.isLooping &&
      this.currentBeat >= this.currentProject.loopEnd
    ) {
      this.currentBeat = this.currentProject.loopStart;
    }

    // Notify listeners
    this.onBeatUpdateCallbacks.forEach(cb => cb(this.currentBeat));

    // Next tick
    this.timerID = window.setTimeout(this.scheduler, this.lookaheadMs);
  };

  private scheduleBeat(beat: number) {
    if (!this.ctx || !this.currentProject) return;

    const secondsPerBeat = 60.0 / this.bpm;
    // Calculate audio context timestamp for this beat
    const timeDelta = (beat - this.currentBeat) * secondsPerBeat;
    const scheduleTime = Math.max(this.ctx.currentTime, this.ctx.currentTime + timeDelta);

    const hasSolo = this.currentProject.tracks.some(t => t.solo);

    for (const track of this.currentProject.tracks) {
      if (track.muted) continue;
      if (hasSolo && !track.solo) continue;

      for (const clip of track.clips) {
        const clipEnd = clip.startBeat + clip.durationBeats;
        if (beat < clip.startBeat || beat >= clipEnd) continue;

        const beatInClip = beat - clip.startBeat;

        // Schedule Synthesizer / Instrument Notes
        if (clip.notes && clip.notes.length > 0) {
          for (const note of clip.notes) {
            // Check if note starts at this 16th step window (allow +- 0.125 beats)
            if (Math.abs(note.startBeat - beatInClip) < 0.12) {
              const noteDurationSec = note.durationBeats * secondsPerBeat;
              this.playSynthNote(
                track.id,
                note.pitch,
                noteDurationSec,
                note.velocity,
                track.synthParams,
                scheduleTime
              );
            }
          }
        }

        // Schedule Drum Sequencer Pattern
        if (clip.drumPattern) {
          // 16 steps per 4 beats (each step is 0.25 beat)
          const stepIndex = Math.floor((beatInClip % 4) * 4);
          const instruments: DrumInstrument[] = [
            'kick', 'snare', 'clap', 'hihatClosed', 'hihatOpen', 'tom', 'percussion'
          ];
          for (const inst of instruments) {
            const patternRow = clip.drumPattern[inst];
            if (patternRow && patternRow[stepIndex]) {
              this.playDrumSound(inst, track.id, 0.85, scheduleTime);
            }
          }
        }
      }
    }
  }

  public subscribeBeatUpdate(cb: (beat: number) => void): () => void {
    this.onBeatUpdateCallbacks.add(cb);
    return () => this.onBeatUpdateCallbacks.delete(cb);
  }

  public subscribeStop(cb: () => void): () => void {
    this.onStopCallbacks.add(cb);
    return () => this.onStopCallbacks.delete(cb);
  }

  // --- Analyser Frequency & Time Domain Data ---
  public getVisualizerData(): { freq: Uint8Array; time: Uint8Array } {
    if (!this.masterAnalyser) {
      return { freq: new Uint8Array(0), time: new Uint8Array(0) };
    }
    const freq = new Uint8Array(this.masterAnalyser.frequencyBinCount);
    const time = new Uint8Array(this.masterAnalyser.fftSize);
    this.masterAnalyser.getByteFrequencyData(freq);
    this.masterAnalyser.getByteTimeDomainData(time);
    return { freq, time };
  }

  // --- Real Microphone Recording ---
  public async startMicrophoneRecording(): Promise<boolean> {
    try {
      this.mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.recordedChunks = [];
      this.mediaRecorder = new MediaRecorder(this.mediaStream);

      this.mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          this.recordedChunks.push(e.data);
        }
      };

      this.mediaRecorder.start();
      return true;
    } catch (err) {
      console.warn('Microphone permission denied or not available', err);
      return false;
    }
  }

  public async stopMicrophoneRecording(): Promise<Blob | null> {
    return new Promise((resolve) => {
      if (!this.mediaRecorder || this.mediaRecorder.state === 'inactive') {
        resolve(null);
        return;
      }

      this.mediaRecorder.onstop = () => {
        const audioBlob = new Blob(this.recordedChunks, { type: 'audio/webm' });
        if (this.mediaStream) {
          this.mediaStream.getTracks().forEach(track => track.stop());
          this.mediaStream = null;
        }
        resolve(audioBlob);
      };

      this.mediaRecorder.stop();
    });
  }

  // --- Full Project Audio Export (WAV file generation) ---
  public async exportProjectWAV(project: Project): Promise<Blob> {
    const totalDurationBeats = project.tracks.reduce((max, track) => {
      const trackMax = track.clips.reduce((tMax, clip) => {
        return Math.max(tMax, clip.startBeat + clip.durationBeats);
      }, 0);
      return Math.max(max, trackMax);
    }, 16);

    const secondsPerBeat = 60.0 / project.bpm;
    const totalDurationSec = Math.max(4, totalDurationBeats * secondsPerBeat + 3); // 3 sec reverb tail
    const sampleRate = 44100;
    const length = Math.ceil(sampleRate * totalDurationSec);

    const offlineCtx = new OfflineAudioContext(2, length, sampleRate);
    const offlineMasterGain = offlineCtx.createGain();
    offlineMasterGain.gain.setValueAtTime(project.masterVolume, 0);
    offlineMasterGain.connect(offlineCtx.destination);

    // Render notes into offline context
    for (const track of project.tracks) {
      if (track.muted) continue;
      const trackGain = offlineCtx.createGain();
      trackGain.gain.setValueAtTime(track.volume, 0);
      trackGain.connect(offlineMasterGain);

      for (const clip of track.clips) {
        if (clip.notes) {
          for (const note of clip.notes) {
            const noteStartSec = (clip.startBeat + note.startBeat) * secondsPerBeat;
            const noteDurationSec = note.durationBeats * secondsPerBeat;
            if (noteStartSec >= totalDurationSec) continue;

            const osc = offlineCtx.createOscillator();
            osc.type = track.synthParams.oscType;
            osc.frequency.setValueAtTime(midiToFreq(note.pitch), noteStartSec);

            const ampGain = offlineCtx.createGain();
            const peakGain = note.velocity * 0.4;
            ampGain.gain.setValueAtTime(0.001, noteStartSec);
            ampGain.gain.exponentialRampToValueAtTime(
              peakGain,
              noteStartSec + Math.max(0.005, track.synthParams.attack)
            );
            ampGain.gain.exponentialRampToValueAtTime(
              Math.max(0.001, peakGain * track.synthParams.sustain),
              noteStartSec + track.synthParams.attack + track.synthParams.decay
            );
            const endTime = noteStartSec + noteDurationSec;
            ampGain.gain.setValueAtTime(
              Math.max(0.001, peakGain * track.synthParams.sustain),
              endTime
            );
            ampGain.gain.exponentialRampToValueAtTime(
              0.001,
              endTime + Math.max(0.01, track.synthParams.release)
            );

            osc.connect(ampGain);
            ampGain.connect(trackGain);
            osc.start(noteStartSec);
            osc.stop(endTime + track.synthParams.release + 0.1);
          }
        }
      }
    }

    const renderedBuffer = await offlineCtx.startRendering();
    return this.audioBufferToWav(renderedBuffer);
  }

  private audioBufferToWav(buffer: AudioBuffer): Blob {
    const numChannels = buffer.numberOfChannels;
    const sampleRate = buffer.sampleRate;
    const format = 1; // PCM
    const bitDepth = 16;
    const bytesPerSample = bitDepth / 8;
    const blockAlign = numChannels * bytesPerSample;

    const dataLength = buffer.length * blockAlign;
    const bufferLength = 44 + dataLength;
    const arrayBuffer = new ArrayBuffer(bufferLength);
    const view = new DataView(arrayBuffer);

    // RIFF chunk descriptor
    this.writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + dataLength, true);
    this.writeString(view, 8, 'WAVE');
    // FMT sub-chunk
    this.writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, format, true);
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * blockAlign, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, bitDepth, true);
    // data sub-chunk
    this.writeString(view, 36, 'data');
    view.setUint32(40, dataLength, true);

    // Interleave channel samples
    let offset = 44;
    const channels = [];
    for (let c = 0; c < numChannels; c++) {
      channels.push(buffer.getChannelData(c));
    }

    for (let i = 0; i < buffer.length; i++) {
      for (let c = 0; c < numChannels; c++) {
        let sample = Math.max(-1, Math.min(1, channels[c][i]));
        sample = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
        view.setInt16(offset, sample, true);
        offset += 2;
      }
    }

    return new Blob([arrayBuffer], { type: 'audio/wav' });
  }

  private writeString(view: DataView, offset: number, string: string) {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  }
}
