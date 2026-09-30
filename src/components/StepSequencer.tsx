import React from 'react';
import { Clip, DrumInstrument, DrumPattern, Track } from '../audio/types';
import { AudioEngine } from '../audio/AudioEngine';
import { Play, RotateCcw, Sparkles, Volume2 } from 'lucide-react';

interface StepSequencerProps {
  track: Track;
  clip?: Clip;
  currentBeat: number;
  onUpdateDrumPattern: (clipId: string, pattern: DrumPattern) => void;
}

export const StepSequencer: React.FC<StepSequencerProps> = ({
  track,
  clip,
  currentBeat,
  onUpdateDrumPattern
}) => {
  const audioEngine = AudioEngine.getInstance();

  const defaultPattern: DrumPattern = {
    kick: Array(16).fill(false),
    snare: Array(16).fill(false),
    clap: Array(16).fill(false),
    hihatClosed: Array(16).fill(false),
    hihatOpen: Array(16).fill(false),
    tom: Array(16).fill(false),
    percussion: Array(16).fill(false)
  };

  const pattern = clip?.drumPattern || defaultPattern;

  // Active step (0 to 15) calculated from current beat
  const currentStep = Math.floor((currentBeat * 4) % 16);

  const instruments: { id: DrumInstrument; label: string; color: string }[] = [
    { id: 'kick', label: '808 Kick', color: '#f59e0b' },
    { id: 'snare', label: 'Snappy Snare', color: '#fb7185' },
    { id: 'clap', label: 'Studio Clap', color: '#c084fc' },
    { id: 'hihatClosed', label: 'Hi-Hat (Closed)', color: '#38bdf8' },
    { id: 'hihatOpen', label: 'Hi-Hat (Open)', color: '#06b6d4' },
    { id: 'tom', label: 'Analog Tom', color: '#10b981' },
    { id: 'percussion', label: 'FM Percussion', color: '#a855f7' }
  ];

  const toggleStep = (inst: DrumInstrument, stepIdx: number) => {
    if (!clip) return;
    const currentSteps = pattern[inst] || Array(16).fill(false);
    const updatedSteps = [...currentSteps];
    updatedSteps[stepIdx] = !updatedSteps[stepIdx];

    // Preview sound if turned on
    if (updatedSteps[stepIdx]) {
      audioEngine.playDrumSound(inst, track.id, 0.9);
    }

    const newPattern: DrumPattern = {
      ...pattern,
      [inst]: updatedSteps
    };
    onUpdateDrumPattern(clip.id, newPattern);
  };

  const previewSound = (inst: DrumInstrument) => {
    audioEngine.playDrumSound(inst, track.id, 0.9);
  };

  // Pattern Preset Loader
  const loadPreset = (presetName: 'house' | 'trap' | 'lofi' | 'boombap') => {
    if (!clip) return;
    let newPattern: DrumPattern = {
      kick: Array(16).fill(false),
      snare: Array(16).fill(false),
      clap: Array(16).fill(false),
      hihatClosed: Array(16).fill(false),
      hihatOpen: Array(16).fill(false),
      tom: Array(16).fill(false),
      percussion: Array(16).fill(false)
    };

    if (presetName === 'house') {
      newPattern.kick = [true, false, false, false, true, false, false, false, true, false, false, false, true, false, false, false];
      newPattern.clap = [false, false, false, false, true, false, false, false, false, false, false, false, true, false, false, false];
      newPattern.hihatOpen = [false, false, true, false, false, false, true, false, false, false, true, false, false, false, true, false];
      newPattern.hihatClosed = [true, true, false, true, true, true, false, true, true, true, false, true, true, true, false, true];
    } else if (presetName === 'trap') {
      newPattern.kick = [true, false, false, false, false, false, true, false, false, false, true, false, false, true, false, false];
      newPattern.snare = [false, false, false, false, true, false, false, false, false, false, false, false, true, false, false, false];
      newPattern.hihatClosed = [true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true];
      newPattern.percussion = [false, false, false, true, false, false, false, false, false, true, false, false, false, false, false, true];
    } else if (presetName === 'lofi') {
      newPattern.kick = [true, false, false, false, false, false, true, false, false, true, false, false, false, false, false, false];
      newPattern.snare = [false, false, false, false, true, false, false, false, false, false, false, false, true, false, false, false];
      newPattern.hihatClosed = [true, false, true, true, false, true, true, false, true, false, true, true, false, true, true, false];
      newPattern.percussion = [false, false, true, false, false, false, false, true, false, false, false, false, false, false, true, false];
    } else if (presetName === 'boombap') {
      newPattern.kick = [true, false, false, false, false, false, false, false, false, false, true, false, false, false, false, false];
      newPattern.snare = [false, false, false, false, true, false, false, false, false, false, false, false, true, false, false, false];
      newPattern.hihatClosed = [true, false, true, false, true, false, true, false, true, false, true, false, true, false, true, false];
      newPattern.hihatOpen = [false, false, false, false, false, false, false, false, false, false, false, false, false, false, true, false];
    }

    onUpdateDrumPattern(clip.id, newPattern);
  };

  const clearPattern = () => {
    if (!clip) return;
    onUpdateDrumPattern(clip.id, defaultPattern);
  };

  return (
    <div className="w-full h-full flex flex-col glass-panel rounded-2xl border border-stone-200/80 overflow-hidden shadow-sm">
      {/* Sequencer Header Bar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-stone-200/80 bg-white/60 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-stone-800 uppercase tracking-wider">
            Drum Sequencer — 16-Step Matrix
          </span>
          <span className="text-[11px] text-stone-500 font-medium">({clip?.name || 'Drum Pattern'})</span>
        </div>

        {/* Groove Presets */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-xl text-xs">
            <Sparkles className="w-3 h-3 text-amber-500 ml-1" />
            <span className="text-[11px] font-semibold text-stone-500">Groove Preset:</span>
            <button
              onClick={() => loadPreset('house')}
              className="px-2 py-0.5 rounded bg-white hover:bg-stone-50 border border-stone-200 font-medium text-stone-800 text-[11px]"
            >
              4x4 House
            </button>
            <button
              onClick={() => loadPreset('trap')}
              className="px-2 py-0.5 rounded bg-white hover:bg-stone-50 border border-stone-200 font-medium text-stone-800 text-[11px]"
            >
              Trap Bounce
            </button>
            <button
              onClick={() => loadPreset('lofi')}
              className="px-2 py-0.5 rounded bg-white hover:bg-stone-50 border border-stone-200 font-medium text-stone-800 text-[11px]"
            >
              Lo-Fi Chill
            </button>
            <button
              onClick={() => loadPreset('boombap')}
              className="px-2 py-0.5 rounded bg-white hover:bg-stone-50 border border-stone-200 font-medium text-stone-800 text-[11px]"
            >
              Boom Bap
            </button>
          </div>

          <button
            onClick={clearPattern}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold text-stone-600 bg-stone-100 hover:bg-stone-200 transition-all"
          >
            <RotateCcw className="w-3 h-3" /> Clear
          </button>
        </div>
      </div>

      {/* 16-Step Matrix Grid */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2.5 bg-[#faf8f5]">
        {/* Step Numbers Top Indicator Header */}
        <div className="flex items-center gap-3">
          <div className="w-40 flex-shrink-0" />
          <div className="flex-1 grid grid-cols-16 gap-1.5 font-mono text-[10px] text-center font-bold text-stone-400">
            {Array.from({ length: 16 }).map((_, stepIdx) => (
              <div
                key={stepIdx}
                className={`py-0.5 rounded ${
                  stepIdx === currentStep
                    ? 'bg-amber-400 text-stone-900 font-extrabold shadow-xs'
                    : stepIdx % 4 === 0
                    ? 'text-stone-700'
                    : 'text-stone-400'
                }`}
              >
                {stepIdx + 1}
              </div>
            ))}
          </div>
        </div>

        {/* Matrix Rows */}
        {instruments.map((inst) => {
          const rowSteps = pattern[inst.id] || Array(16).fill(false);

          return (
            <div key={inst.id} className="flex items-center gap-3">
              {/* Instrument Header Label & Preview button */}
              <div className="w-40 flex-shrink-0 flex items-center justify-between bg-white px-3 py-2 rounded-xl border border-stone-200/80 shadow-xs">
                <div className="flex items-center gap-2">
                  <div
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: inst.color }}
                  />
                  <span className="text-xs font-bold text-stone-800 truncate">{inst.label}</span>
                </div>
                <button
                  onClick={() => previewSound(inst.id)}
                  className="p-1 rounded-lg hover:bg-stone-100 text-stone-500 hover:text-stone-900"
                  title="Audition Sound"
                >
                  <Play className="w-3 h-3 fill-current ml-0.5" />
                </button>
              </div>

              {/* 16 Step Buttons */}
              <div className="flex-1 grid grid-cols-16 gap-1.5">
                {rowSteps.map((isActive, stepIdx) => {
                  const isCurrent = stepIdx === currentStep;
                  const isBeatQuarter = stepIdx % 4 === 0;

                  return (
                    <button
                      key={stepIdx}
                      onClick={() => toggleStep(inst.id, stepIdx)}
                      className={`h-11 rounded-xl transition-all flex items-center justify-center border ${
                        isActive
                          ? 'shadow-sm text-white scale-100'
                          : isBeatQuarter
                          ? 'bg-stone-200/70 hover:bg-stone-300 border-stone-300'
                          : 'bg-stone-100/80 hover:bg-stone-200/90 border-stone-200/80'
                      } ${
                        isCurrent
                          ? 'ring-2 ring-amber-400 ring-offset-1'
                          : ''
                      }`}
                      style={{
                        backgroundColor: isActive ? inst.color : undefined
                      }}
                    >
                      {isActive && (
                        <div className="w-2 h-2 rounded-full bg-white shadow-xs" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
