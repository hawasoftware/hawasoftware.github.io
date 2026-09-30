import React, { useEffect, useState } from 'react';
import { SynthParameters, Track, WaveformType } from '../audio/types';
import { SYNTH_PRESETS } from '../audio/presets';
import { AudioEngine } from '../audio/AudioEngine';
import { Sliders, Sparkles, Activity, Layers, Disc } from 'lucide-react';

interface SynthDesignerProps {
  track: Track;
  onUpdateSynthParams: (trackId: string, params: SynthParameters) => void;
}

export const SynthDesigner: React.FC<SynthDesignerProps> = ({
  track,
  onUpdateSynthParams
}) => {
  const params = track.synthParams;
  const audioEngine = AudioEngine.getInstance();
  const [activeNote, setActiveNote] = useState<number | null>(null);

  const updateParam = <K extends keyof SynthParameters>(key: K, value: SynthParameters[K]) => {
    onUpdateSynthParams(track.id, {
      ...params,
      [key]: value
    });
  };

  const handlePresetSelect = (presetKey: string) => {
    const preset = SYNTH_PRESETS[presetKey];
    if (preset) {
      onUpdateSynthParams(track.id, preset.params);
    }
  };

  // Virtual keyboard notes (C3 to B4 = 24 semitones)
  const virtualKeys = [
    { pitch: 48, note: 'C3', key: 'a', isBlack: false },
    { pitch: 49, note: 'C#3', key: 'w', isBlack: true },
    { pitch: 50, note: 'D3', key: 's', isBlack: false },
    { pitch: 51, note: 'D#3', key: 'e', isBlack: true },
    { pitch: 52, note: 'E3', key: 'd', isBlack: false },
    { pitch: 53, note: 'F3', key: 'f', isBlack: false },
    { pitch: 54, note: 'F#3', key: 't', isBlack: true },
    { pitch: 55, note: 'G3', key: 'g', isBlack: false },
    { pitch: 56, note: 'G#3', key: 'y', isBlack: true },
    { pitch: 57, note: 'A3', key: 'h', isBlack: false },
    { pitch: 58, note: 'A#3', key: 'u', isBlack: true },
    { pitch: 59, note: 'B3', key: 'j', isBlack: false },
    { pitch: 60, note: 'C4', key: 'k', isBlack: false },
    { pitch: 61, note: 'C#4', key: 'o', isBlack: true },
    { pitch: 62, note: 'D4', key: 'l', isBlack: false },
    { pitch: 63, note: 'D#4', key: 'p', isBlack: true },
    { pitch: 64, note: 'E4', key: ';', isBlack: false }
  ];

  // Computer keyboard listener for virtual synth playing
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.repeat || ['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement).tagName)) {
        return;
      }
      const match = virtualKeys.find(k => k.key.toLowerCase() === e.key.toLowerCase());
      if (match) {
        audioEngine.startPreviewNote(match.pitch, params);
        setActiveNote(match.pitch);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const match = virtualKeys.find(k => k.key.toLowerCase() === e.key.toLowerCase());
      if (match) {
        audioEngine.stopPreviewNote(match.pitch);
        setActiveNote(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [params]);

  // ADSR SVG Path computation
  const getAdsrPath = () => {
    const w = 240;
    const h = 70;
    const totalTime = params.attack + params.decay + 1.0 + params.release;
    const aX = (params.attack / totalTime) * w;
    const dX = aX + (params.decay / totalTime) * w;
    const sX = dX + (1.0 / totalTime) * w;
    const rX = w;

    const peakY = 8;
    const sustainY = h - params.sustain * (h - 16);
    const zeroY = h - 4;

    return `M 0,${zeroY} L ${aX},${peakY} L ${dX},${sustainY} L ${sX},${sustainY} L ${rX},${zeroY}`;
  };

  return (
    <div className="w-full h-full flex flex-col glass-panel rounded-2xl border border-stone-200/80 overflow-hidden shadow-sm">
      {/* Top Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-stone-200/80 bg-white/60 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-stone-800 uppercase tracking-wider">
            Synthesizer Sound Designer — {track.name}
          </span>
        </div>

        {/* Presets dropdown */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 bg-stone-100 p-1 rounded-xl text-xs">
            <Sparkles className="w-3.5 h-3.5 text-amber-500 ml-1" />
            <span className="text-[11px] font-semibold text-stone-500">Preset:</span>
            <select
              onChange={(e) => handlePresetSelect(e.target.value)}
              className="bg-white rounded px-2 py-0.5 font-medium border border-stone-200 text-stone-800 text-xs focus:outline-none"
              defaultValue=""
            >
              <option value="" disabled>Select Preset...</option>
              {Object.entries(SYNTH_PRESETS).map(([k, v]) => (
                <option key={k} value={k}>{v.name} ({v.category})</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Main Synthesizer Control Racks */}
      <div className="flex-1 overflow-y-auto p-4 grid grid-cols-1 md:grid-cols-4 gap-4 bg-[#faf8f5]">
        {/* Module 1: Oscillators */}
        <div className="glass-panel p-3.5 rounded-2xl border border-white/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-stone-800 uppercase tracking-wider">Oscillator</span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-stone-200 text-stone-700">OSC 1</span>
            </div>

            {/* Waveform Selector */}
            <div className="grid grid-cols-4 gap-1 mb-3">
              {(['sine', 'triangle', 'sawtooth', 'square'] as WaveformType[]).map((w) => (
                <button
                  key={w}
                  onClick={() => updateParam('oscType', w)}
                  className={`py-1.5 rounded-lg text-center capitalize text-xs font-semibold transition-all ${
                    params.oscType === w
                      ? 'bg-stone-900 text-white shadow-sm'
                      : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
                  }`}
                >
                  {w.slice(0, 4)}
                </button>
              ))}
            </div>

            {/* Detune Slider */}
            <div className="flex flex-col gap-1 mb-3">
              <div className="flex justify-between text-xs">
                <span className="text-stone-500">Detune:</span>
                <span className="font-mono font-bold text-stone-800">{params.detune} cents</span>
              </div>
              <input
                type="range"
                min="-50"
                max="50"
                value={params.detune}
                onChange={(e) => updateParam('detune', parseInt(e.target.value))}
                className="w-full accent-stone-800 h-1 bg-stone-200 rounded cursor-pointer"
              />
            </div>

            {/* Sub-Oscillator */}
            <div className="pt-2 border-t border-stone-200 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-stone-700">Sub-Oscillator (-1 Oct):</span>
                <input
                  type="checkbox"
                  checked={params.subOsc}
                  onChange={(e) => updateParam('subOsc', e.target.checked)}
                  className="w-4 h-4 accent-stone-900 rounded cursor-pointer"
                />
              </div>
              {params.subOsc && (
                <div className="flex flex-col gap-1">
                  <div className="flex justify-between text-[11px] text-stone-500">
                    <span>Sub Level:</span>
                    <span className="font-mono font-bold">{Math.round(params.subOscLevel * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={params.subOscLevel}
                    onChange={(e) => updateParam('subOscLevel', parseFloat(e.target.value))}
                    className="w-full accent-stone-800 h-1 bg-stone-200 rounded cursor-pointer"
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Module 2: Lowpass Filter */}
        <div className="glass-panel p-3.5 rounded-2xl border border-white/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-stone-800 uppercase tracking-wider">Filter (24dB)</span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-stone-200 text-stone-700">VCF</span>
            </div>

            {/* Cutoff frequency */}
            <div className="flex flex-col gap-1 mb-3">
              <div className="flex justify-between text-xs">
                <span className="text-stone-500">Cutoff:</span>
                <span className="font-mono font-bold text-stone-800">{Math.round(params.filterCutoff)} Hz</span>
              </div>
              <input
                type="range"
                min="60"
                max="18000"
                step="20"
                value={params.filterCutoff}
                onChange={(e) => updateParam('filterCutoff', parseFloat(e.target.value))}
                className="w-full accent-sky-600 h-1 bg-stone-200 rounded cursor-pointer"
              />
            </div>

            {/* Resonance (Q) */}
            <div className="flex flex-col gap-1 mb-3">
              <div className="flex justify-between text-xs">
                <span className="text-stone-500">Resonance (Q):</span>
                <span className="font-mono font-bold text-stone-800">{params.filterResonance.toFixed(1)}</span>
              </div>
              <input
                type="range"
                min="0.1"
                max="12"
                step="0.1"
                value={params.filterResonance}
                onChange={(e) => updateParam('filterResonance', parseFloat(e.target.value))}
                className="w-full accent-sky-600 h-1 bg-stone-200 rounded cursor-pointer"
              />
            </div>

            {/* Filter Envelope Amount */}
            <div className="flex flex-col gap-1">
              <div className="flex justify-between text-xs">
                <span className="text-stone-500">Env Modulation:</span>
                <span className="font-mono font-bold text-stone-800">{Math.round(params.filterEnvAmount * 100)}%</span>
              </div>
              <input
                type="range"
                min="-1"
                max="1"
                step="0.05"
                value={params.filterEnvAmount}
                onChange={(e) => updateParam('filterEnvAmount', parseFloat(e.target.value))}
                className="w-full accent-sky-600 h-1 bg-stone-200 rounded cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Module 3: Amp Envelope (ADSR) */}
        <div className="glass-panel p-3.5 rounded-2xl border border-white/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-stone-800 uppercase tracking-wider">Amp Envelope</span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-stone-200 text-stone-700">ADSR</span>
            </div>

            {/* SVG Visualizer */}
            <div className="w-full h-16 bg-white/70 rounded-xl mb-3 border border-stone-200/80 flex items-center justify-center p-1">
              <svg viewBox="0 0 240 70" className="w-full h-full">
                <path
                  d={getAdsrPath()}
                  fill="rgba(245, 158, 11, 0.15)"
                  stroke="#f59e0b"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>

            {/* 4 ADSR Sliders */}
            <div className="grid grid-cols-4 gap-1.5 text-center text-[10px]">
              <div>
                <span className="text-stone-400 font-bold block mb-1">A</span>
                <input
                  type="range"
                  min="0.005"
                  max="1.5"
                  step="0.01"
                  value={params.attack}
                  onChange={(e) => updateParam('attack', parseFloat(e.target.value))}
                  className="w-full accent-amber-500 h-1 bg-stone-200 rounded cursor-pointer"
                />
                <span className="font-mono">{params.attack.toFixed(2)}s</span>
              </div>
              <div>
                <span className="text-stone-400 font-bold block mb-1">D</span>
                <input
                  type="range"
                  min="0.02"
                  max="2.0"
                  step="0.02"
                  value={params.decay}
                  onChange={(e) => updateParam('decay', parseFloat(e.target.value))}
                  className="w-full accent-amber-500 h-1 bg-stone-200 rounded cursor-pointer"
                />
                <span className="font-mono">{params.decay.toFixed(2)}s</span>
              </div>
              <div>
                <span className="text-stone-400 font-bold block mb-1">S</span>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.02"
                  value={params.sustain}
                  onChange={(e) => updateParam('sustain', parseFloat(e.target.value))}
                  className="w-full accent-amber-500 h-1 bg-stone-200 rounded cursor-pointer"
                />
                <span className="font-mono">{Math.round(params.sustain * 100)}%</span>
              </div>
              <div>
                <span className="text-stone-400 font-bold block mb-1">R</span>
                <input
                  type="range"
                  min="0.02"
                  max="3.0"
                  step="0.05"
                  value={params.release}
                  onChange={(e) => updateParam('release', parseFloat(e.target.value))}
                  className="w-full accent-amber-500 h-1 bg-stone-200 rounded cursor-pointer"
                />
                <span className="font-mono">{params.release.toFixed(2)}s</span>
              </div>
            </div>
          </div>
        </div>

        {/* Module 4: Glass Space Effects */}
        <div className="glass-panel p-3.5 rounded-2xl border border-white/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-stone-800 uppercase tracking-wider">Acoustic FX</span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-stone-200 text-stone-700">SPACE</span>
            </div>

            {/* Reverb wet */}
            <div className="flex flex-col gap-1 mb-2.5">
              <div className="flex justify-between text-xs">
                <span className="text-stone-500">Glass Reverb:</span>
                <span className="font-mono font-bold text-stone-800">{Math.round(params.reverb * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.02"
                value={params.reverb}
                onChange={(e) => updateParam('reverb', parseFloat(e.target.value))}
                className="w-full accent-purple-600 h-1 bg-stone-200 rounded cursor-pointer"
              />
            </div>

            {/* Stereo Delay */}
            <div className="flex flex-col gap-1 mb-2.5">
              <div className="flex justify-between text-xs">
                <span className="text-stone-500">Stereo Delay:</span>
                <span className="font-mono font-bold text-stone-800">{Math.round(params.delayFeedback * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="0.85"
                step="0.02"
                value={params.delayFeedback}
                onChange={(e) => updateParam('delayFeedback', parseFloat(e.target.value))}
                className="w-full accent-purple-600 h-1 bg-stone-200 rounded cursor-pointer"
              />
            </div>

            {/* Saturation / Distortion */}
            <div className="flex flex-col gap-1">
              <div className="flex justify-between text-xs">
                <span className="text-stone-500">Analog Warmth:</span>
                <span className="font-mono font-bold text-stone-800">{Math.round(params.distortion * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="0.6"
                step="0.02"
                value={params.distortion}
                onChange={(e) => updateParam('distortion', parseFloat(e.target.value))}
                className="w-full accent-purple-600 h-1 bg-stone-200 rounded cursor-pointer"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Bottom Piano Keyboard */}
      <div className="p-3 border-t border-stone-200/80 bg-white/70 backdrop-blur-md flex flex-col items-center">
        <div className="text-[11px] text-stone-400 font-semibold mb-1.5">
          Virtual Keyboard (Play with mouse or keyboard keys A-S-D-F-G-H-J-K)
        </div>

        <div className="flex relative h-24 select-none">
          {virtualKeys.map((k) => (
            <div
              key={k.pitch}
              onMouseDown={() => {
                audioEngine.startPreviewNote(k.pitch, params);
                setActiveNote(k.pitch);
              }}
              onMouseUp={() => {
                audioEngine.stopPreviewNote(k.pitch);
                setActiveNote(null);
              }}
              onMouseLeave={() => {
                audioEngine.stopPreviewNote(k.pitch);
                setActiveNote(null);
              }}
              className={`flex flex-col justify-end items-center pb-2 cursor-pointer transition-colors ${
                k.isBlack
                  ? `w-8 h-14 -mx-4 z-10 rounded-b-md ${
                      activeNote === k.pitch ? 'bg-amber-400 text-stone-900' : 'bg-stone-900 text-stone-200'
                    } shadow-md`
                  : `w-12 h-24 rounded-b-xl border border-stone-200 ${
                      activeNote === k.pitch ? 'bg-amber-200' : 'bg-white hover:bg-stone-50'
                    } shadow-sm`
              }`}
            >
              <span className="text-[10px] font-bold uppercase">{k.key}</span>
              <span className="text-[8px] opacity-60 font-mono">{k.note}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
