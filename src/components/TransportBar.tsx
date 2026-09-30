import React from 'react';
import { 
  Play, 
  Pause, 
  Square, 
  Repeat, 
  Circle, 
  Volume2, 
  Sliders, 
  Download, 
  Mic, 
  Music, 
  Sparkles,
  Layers
} from 'lucide-react';
import { Project } from '../audio/types';

interface TransportBarProps {
  project: Project;
  isPlaying: boolean;
  currentBeat: number;
  onPlay: () => void;
  onPause: () => void;
  onStop: () => void;
  onToggleLoop: () => void;
  onBpmChange: (bpm: number) => void;
  onKeyChange: (key: string) => void;
  onScaleChange: (scale: string) => void;
  onMasterVolumeChange: (vol: number) => void;
  onOpenExport: () => void;
  onOpenMic: () => void;
  onSelectDemo: (demoId: string) => void;
  activePanel: 'timeline' | 'pianoroll' | 'drums' | 'spatial' | 'synth' | 'chords';
  setActivePanel: (panel: 'timeline' | 'pianoroll' | 'drums' | 'spatial' | 'synth' | 'chords') => void;
}

export const TransportBar: React.FC<TransportBarProps> = ({
  project,
  isPlaying,
  currentBeat,
  onPlay,
  onPause,
  onStop,
  onToggleLoop,
  onBpmChange,
  onKeyChange,
  onScaleChange,
  onMasterVolumeChange,
  onOpenExport,
  onOpenMic,
  onSelectDemo,
  activePanel,
  setActivePanel
}) => {
  // Format bar.beat.step
  const bar = Math.floor(currentBeat / 4) + 1;
  const beat = Math.floor(currentBeat % 4) + 1;
  const step = Math.floor((currentBeat * 4) % 4) + 1;

  // Format time (seconds)
  const totalSeconds = (currentBeat * 60) / project.bpm;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.floor(totalSeconds % 60);
  const ms = Math.floor((totalSeconds % 1) * 100);

  const keys = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B', 'Am', 'Dm', 'Em', 'F#m'];
  const scales = [
    { id: 'minor', label: 'Natural Minor' },
    { id: 'major', label: 'Major / Ionian' },
    { id: 'dorian', label: 'Dorian' },
    { id: 'pentatonic', label: 'Pentatonic' },
    { id: 'lydian', label: 'Lydian' }
  ];

  return (
    <header className="w-full glass-panel border-b border-stone-200/80 px-4 py-2.5 flex items-center justify-between gap-3 select-none z-30 sticky top-0">
      {/* Brand logo & demo project selector */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 pr-3 border-r border-stone-300/60">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-200 via-rose-200 to-sky-200 flex items-center justify-center shadow-inner text-base">
            🐇
          </div>
          <div>
            <div className="flex items-center gap-1.5 leading-none">
              <span className="font-extrabold text-stone-900 tracking-tight text-lg">hawa</span>
              <span className="text-[10px] uppercase tracking-wider font-semibold px-1.5 py-0.5 rounded bg-stone-900 text-white/90">DAW</span>
            </div>
            <p className="text-[11px] text-stone-500 font-medium">Glass Audio Workstation</p>
          </div>
        </div>

        {/* Demo switcher */}
        <div className="flex items-center gap-1.5 bg-stone-100/80 p-1 rounded-xl border border-stone-200/60">
          <button
            onClick={() => onSelectDemo('demo-aether-drift')}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
              project.id === 'demo-aether-drift'
                ? 'bg-white text-stone-900 shadow-sm font-semibold'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            Aether Drift
          </button>
          <button
            onClick={() => onSelectDemo('demo-tokyo-rain')}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
              project.id === 'demo-tokyo-rain'
                ? 'bg-white text-stone-900 shadow-sm font-semibold'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            Tokyo Rain
          </button>
        </div>
      </div>

      {/* Main Transport Controls */}
      <div className="flex items-center gap-4">
        {/* Playback Buttons */}
        <div className="flex items-center gap-1 bg-stone-100/90 p-1 rounded-2xl border border-stone-200/80 shadow-inner">
          <button
            onClick={onStop}
            title="Stop & Return to Start"
            className="w-9 h-9 rounded-xl flex items-center justify-center text-stone-600 hover:text-stone-900 hover:bg-stone-200/70 transition-all active:scale-95"
          >
            <Square className="w-4 h-4 fill-stone-600" />
          </button>

          <button
            onClick={isPlaying ? onPause : onPlay}
            title={isPlaying ? 'Pause (Space)' : 'Play (Space)'}
            className={`w-11 h-9 rounded-xl flex items-center justify-center transition-all active:scale-95 shadow-sm ${
              isPlaying
                ? 'bg-amber-400 text-stone-900 ring-2 ring-amber-300'
                : 'bg-stone-900 text-white hover:bg-stone-800'
            }`}
          >
            {isPlaying ? (
              <Pause className="w-4 h-4 fill-current" />
            ) : (
              <Play className="w-4 h-4 fill-current ml-0.5" />
            )}
          </button>

          <button
            onClick={onToggleLoop}
            title="Loop Cycle Region"
            className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
              project.isLooping
                ? 'bg-sky-500 text-white shadow-sm'
                : 'text-stone-500 hover:text-stone-800 hover:bg-stone-200/60'
            }`}
          >
            <Repeat className="w-4 h-4" />
          </button>

          <button
            onClick={onOpenMic}
            title="Record Audio / Microphone"
            className="w-9 h-9 rounded-xl flex items-center justify-center text-rose-500 hover:bg-rose-50 hover:text-rose-600 transition-all active:scale-95"
          >
            <Circle className="w-3.5 h-3.5 fill-rose-500" />
          </button>
        </div>

        {/* Bar & Time Counter (Logic Pro style glass display) */}
        <div className="flex items-center gap-3 bg-stone-900 text-stone-100 px-3.5 py-1.5 rounded-xl shadow-inner font-mono text-sm border border-stone-800">
          <div className="flex items-baseline gap-1">
            <span className="text-[10px] text-stone-400 font-sans tracking-wide">BAR</span>
            <span className="font-semibold text-amber-300 tracking-wider">
              {String(bar).padStart(3, '0')}.{beat}.{step}
            </span>
          </div>
          <div className="w-[1px] h-4 bg-stone-700" />
          <div className="flex items-baseline gap-1 text-xs text-stone-300">
            <span className="text-[10px] text-stone-400 font-sans">TIME</span>
            <span>
              {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}.{String(ms).padStart(2, '0')}
            </span>
          </div>
        </div>

        {/* BPM & Signature & Key */}
        <div className="flex items-center gap-2 bg-stone-100/90 px-3 py-1 rounded-xl border border-stone-200/80">
          {/* BPM */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-bold text-stone-500">BPM</span>
            <input
              type="number"
              min="40"
              max="240"
              value={project.bpm}
              onChange={(e) => onBpmChange(Number(e.target.value) || 120)}
              className="w-12 bg-white text-stone-900 font-mono text-xs font-semibold px-1.5 py-0.5 rounded border border-stone-300/80 focus:outline-none focus:ring-1 focus:ring-stone-400 text-center"
            />
          </div>

          <div className="w-[1px] h-4 bg-stone-300" />

          {/* Key */}
          <div className="flex items-center gap-1">
            <span className="text-[11px] font-bold text-stone-500">KEY</span>
            <select
              value={project.key}
              onChange={(e) => onKeyChange(e.target.value)}
              className="bg-white text-stone-900 text-xs font-semibold px-1 py-0.5 rounded border border-stone-300/80 focus:outline-none"
            >
              {keys.map((k) => (
                <option key={k} value={k}>{k}</option>
              ))}
            </select>
          </div>

          {/* Scale */}
          <select
            value={project.scale}
            onChange={(e) => onScaleChange(e.target.value)}
            className="bg-white text-stone-900 text-xs font-semibold px-1 py-0.5 rounded border border-stone-300/80 focus:outline-none"
          >
            {scales.map((s) => (
              <option key={s.id} value={s.id}>{s.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Studio View Navigation & Master Controls */}
      <div className="flex items-center gap-3">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-xl border border-stone-200/80 text-xs">
          <button
            onClick={() => setActivePanel('timeline')}
            className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
              activePanel === 'timeline'
                ? 'bg-stone-900 text-white shadow-sm'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            Timeline
          </button>
          <button
            onClick={() => setActivePanel('spatial')}
            className={`px-2.5 py-1 rounded-lg font-medium flex items-center gap-1 transition-all ${
              activePanel === 'spatial'
                ? 'bg-sky-600 text-white shadow-sm'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Sparkles className="w-3 h-3" />
            3D Spatial
          </button>
          <button
            onClick={() => setActivePanel('pianoroll')}
            className={`px-2.5 py-1 rounded-lg font-medium flex items-center gap-1 transition-all ${
              activePanel === 'pianoroll'
                ? 'bg-stone-900 text-white shadow-sm'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Music className="w-3 h-3" />
            Piano Roll
          </button>
          <button
            onClick={() => setActivePanel('drums')}
            className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
              activePanel === 'drums'
                ? 'bg-stone-900 text-white shadow-sm'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            Drums
          </button>
          <button
            onClick={() => setActivePanel('synth')}
            className={`px-2.5 py-1 rounded-lg font-medium flex items-center gap-1 transition-all ${
              activePanel === 'synth'
                ? 'bg-stone-900 text-white shadow-sm'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Sliders className="w-3 h-3" />
            Synth
          </button>
          <button
            onClick={() => setActivePanel('chords')}
            className={`px-2.5 py-1 rounded-lg font-medium flex items-center gap-1 transition-all ${
              activePanel === 'chords'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            Chords
          </button>
        </div>

        {/* Master Output Fader */}
        <div className="flex items-center gap-2 pl-2 border-l border-stone-300/60">
          <Volume2 className="w-4 h-4 text-stone-500" />
          <input
            type="range"
            min="0"
            max="1.2"
            step="0.01"
            value={project.masterVolume}
            onChange={(e) => onMasterVolumeChange(parseFloat(e.target.value))}
            className="w-20 accent-stone-800 cursor-pointer h-1.5 bg-stone-300 rounded-lg"
            title={`Master Volume: ${Math.round(project.masterVolume * 100)}%`}
          />
        </div>

        {/* Export / Share button */}
        <button
          onClick={onOpenExport}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-stone-900 to-stone-800 text-white text-xs font-semibold hover:shadow-md transition-all active:scale-95"
        >
          <Download className="w-3.5 h-3.5" />
          Export
        </button>
      </div>
    </header>
  );
};
