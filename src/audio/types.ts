export type InstrumentType = 
  | 'synth' 
  | 'drum' 
  | 'piano' 
  | 'ambient_pad' 
  | 'bass' 
  | 'lead' 
  | 'audio';

export type WaveformType = 'sine' | 'triangle' | 'sawtooth' | 'square';

export interface SynthParameters {
  oscType: WaveformType;
  subOsc: boolean;
  subOscLevel: number; // 0 to 1
  detune: number; // -50 to 50 cents
  attack: number; // 0.005 to 2s
  decay: number; // 0.01 to 2s
  sustain: number; // 0 to 1
  release: number; // 0.01 to 4s
  filterCutoff: number; // 40 to 18000 Hz
  filterResonance: number; // 0.1 to 15
  filterEnvAmount: number; // -1 to 1
  lfoRate: number; // 0.1 to 20 Hz
  lfoDepth: number; // 0 to 1
  lfoTarget: 'pitch' | 'filter' | 'pan';
  chorus: number; // 0 to 1
  delayTime: number; // 0 to 1s
  delayFeedback: number; // 0 to 0.85
  reverb: number; // 0 to 1
  distortion: number; // 0 to 1
}

export interface SpatialPosition {
  x: number; // -10 to 10
  y: number; // -5 to 5
  z: number; // -10 to 10
  roomAcoustic: 'intimate' | 'studio' | 'hall' | 'cathedral' | 'ambient';
}

export interface Note {
  id: string;
  pitch: number; // MIDI number e.g. 60 for C4
  startBeat: number; // fractional beats from start of clip
  durationBeats: number; // length in beats
  velocity: number; // 0 to 1
}

export type DrumInstrument = 'kick' | 'snare' | 'clap' | 'hihatClosed' | 'hihatOpen' | 'tom' | 'percussion';

export interface DrumPattern {
  kick: boolean[];
  snare: boolean[];
  clap: boolean[];
  hihatClosed: boolean[];
  hihatOpen: boolean[];
  tom: boolean[];
  percussion: boolean[];
}

export interface Clip {
  id: string;
  name: string;
  trackId: string;
  startBeat: number;
  durationBeats: number;
  notes: Note[];
  drumPattern?: DrumPattern;
  audioData?: {
    duration: number;
    sampleRate: number;
    channels: number[];
  };
  color?: string;
}

export interface Track {
  id: string;
  name: string;
  type: InstrumentType;
  color: string;
  icon: string;
  volume: number; // 0 to 1.2, default 0.8
  pan: number; // -1 to 1, default 0
  muted: boolean;
  solo: boolean;
  armed: boolean;
  synthParams: SynthParameters;
  spatial: SpatialPosition;
  clips: Clip[];
}

export interface Project {
  id: string;
  title: string;
  bpm: number;
  timeSignature: [number, number]; // [4, 4]
  key: string; // e.g. "C", "D", "Am"
  scale: string; // 'major' | 'minor' | 'dorian' | 'pentatonic' | 'lydian'
  tracks: Track[];
  loopStart: number;
  loopEnd: number;
  isLooping: boolean;
  masterVolume: number;
  masterEQ: {
    low: number; // -12 to 12 dB
    mid: number;
    high: number;
  };
}

export interface ChordPad {
  id: string;
  name: string;
  roman: string;
  root: string;
  quality: string;
  notes: number[]; // MIDI note numbers
}
