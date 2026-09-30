import React, { useState, useRef } from 'react';
import { Clip, Note, Project, Track } from '../audio/types';
import { AudioEngine, midiToNoteName } from '../audio/AudioEngine';
import { Play, Plus, Trash2, Wand2, Sparkles, Check } from 'lucide-react';

interface PianoRollProps {
  project: Project;
  track: Track;
  clip?: Clip;
  onUpdateClipNotes: (clipId: string, notes: Note[]) => void;
}

export const PianoRoll: React.FC<PianoRollProps> = ({
  project,
  track,
  clip,
  onUpdateClipNotes
}) => {
  const [selectedChordType, setSelectedChordType] = useState<string>('triad');
  const [currentVelocity, setCurrentVelocity] = useState<number>(0.8);
  const audioEngine = AudioEngine.getInstance();

  // Pitch range: C3 (48) down to C6 (84) = 37 semitones
  const minPitch = 48; // C3
  const maxPitch = 84; // C6
  const pitches: number[] = [];
  for (let p = maxPitch; p >= minPitch; p--) {
    pitches.push(p);
  }

  // 16 16th steps per bar. Clip length in steps:
  const durationBeats = clip?.durationBeats || 8;
  const stepsPerBeat = 4;
  const totalSteps = durationBeats * stepsPerBeat; // e.g. 32 steps for 8 beats

  const notes = clip?.notes || [];

  // Determine if a pitch is in the project scale
  const isPitchInKey = (pitch: number): boolean => {
    // Relative pitch class 0-11
    const pc = pitch % 12;
    // Scale intervals relative to C
    // Simplified scale mapping based on key
    const keyOffsetMap: Record<string, number> = {
      'C': 0, 'C#': 1, 'D': 2, 'D#': 3, 'E': 4, 'F': 5,
      'F#': 6, 'G': 7, 'G#': 8, 'A': 9, 'A#': 10, 'B': 11,
      'Am': 9, 'Dm': 2, 'Em': 4, 'F#m': 6
    };
    const root = keyOffsetMap[project.key] || 0;
    const rel = (pc - root + 12) % 12;

    if (project.scale === 'minor' || project.key.endsWith('m')) {
      // Natural minor intervals: 0, 2, 3, 5, 7, 8, 10
      return [0, 2, 3, 5, 7, 8, 10].includes(rel);
    } else if (project.scale === 'pentatonic') {
      return [0, 2, 4, 7, 9].includes(rel);
    } else if (project.scale === 'dorian') {
      return [0, 2, 3, 5, 7, 9, 10].includes(rel);
    }
    // Default Major: 0, 2, 4, 5, 7, 9, 11
    return [0, 2, 4, 5, 7, 9, 11].includes(rel);
  };

  // Handle note click: toggle note on/off
  const handleCellClick = (pitch: number, step: number) => {
    if (!clip) return;
    const startBeat = step / stepsPerBeat;

    // Check if a note already exists at this pitch and beat
    const existingIndex = notes.findIndex(
      n => n.pitch === pitch && Math.abs(n.startBeat - startBeat) < 0.2
    );

    if (existingIndex >= 0) {
      // Remove note
      const updated = notes.filter((_, idx) => idx !== existingIndex);
      onUpdateClipNotes(clip.id, updated);
    } else {
      // Preview note sound
      audioEngine.playSynthNote(track.id, pitch, 0.4, currentVelocity, track.synthParams);

      // Add new note
      const newNote: Note = {
        id: `note-${Date.now()}-${Math.random()}`,
        pitch,
        startBeat,
        durationBeats: 1.0, // Default 1 beat note
        velocity: currentVelocity
      };
      onUpdateClipNotes(clip.id, [...notes, newNote]);
    }
  };

  // Stamp full chord at current position
  const stampChord = (basePitch: number, startBeat: number = 0) => {
    if (!clip) return;
    let chordIntervals: number[] = [0, 4, 7]; // Major triad

    if (selectedChordType === 'minor_triad') chordIntervals = [0, 3, 7];
    if (selectedChordType === 'maj7') chordIntervals = [0, 4, 7, 11];
    if (selectedChordType === 'min7') chordIntervals = [0, 3, 7, 10];
    if (selectedChordType === 'sus4') chordIntervals = [0, 5, 7];
    if (selectedChordType === '9th') chordIntervals = [0, 4, 7, 11, 14];

    const chordNotes: Note[] = chordIntervals.map((interval) => ({
      id: `chord-${Date.now()}-${interval}`,
      pitch: basePitch + interval,
      startBeat,
      durationBeats: 2.0,
      velocity: currentVelocity
    }));

    // Preview chord
    chordNotes.forEach(cn => {
      audioEngine.playSynthNote(track.id, cn.pitch, 0.6, currentVelocity, track.synthParams);
    });

    onUpdateClipNotes(clip.id, [...notes, ...chordNotes]);
  };

  return (
    <div className="w-full h-full flex flex-col glass-panel rounded-2xl border border-stone-200/80 overflow-hidden shadow-sm">
      {/* Top Piano Roll Controls */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-stone-200/80 bg-white/60 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-stone-800 uppercase tracking-wider">
            Piano Roll — {clip ? clip.name : track.name}
          </span>
          <span className="text-[11px] px-2 py-0.5 rounded-full bg-stone-100 font-semibold text-stone-600">
            Scale: {project.key} {project.scale}
          </span>
        </div>

        {/* Chord Stamper & Quantize */}
        <div className="flex items-center gap-2">
          {/* Chord Stamper Selector */}
          <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-xl text-xs">
            <Sparkles className="w-3 h-3 text-amber-500 ml-1" />
            <span className="text-[11px] font-semibold text-stone-500">Chord Tool:</span>
            <select
              value={selectedChordType}
              onChange={(e) => setSelectedChordType(e.target.value)}
              className="bg-white rounded px-1.5 py-0.5 font-medium border border-stone-200 text-stone-800 text-xs focus:outline-none"
            >
              <option value="triad">Major Triad</option>
              <option value="minor_triad">Minor Triad</option>
              <option value="maj7">Major 7th</option>
              <option value="min7">Minor 7th (Neo-Soul)</option>
              <option value="sus4">Sus4</option>
              <option value="9th">Lush 9th</option>
            </select>
          </div>

          {/* Velocity slider */}
          <div className="flex items-center gap-1.5 bg-stone-100 px-2 py-1 rounded-xl text-xs">
            <span className="text-[11px] font-semibold text-stone-500">Velocity:</span>
            <input
              type="range"
              min="0.1"
              max="1.0"
              step="0.05"
              value={currentVelocity}
              onChange={(e) => setCurrentVelocity(parseFloat(e.target.value))}
              className="w-16 accent-stone-800 h-1 bg-stone-200 rounded cursor-pointer"
            />
            <span className="text-[10px] font-mono font-bold w-6">{Math.round(currentVelocity * 100)}%</span>
          </div>

          {/* Clear notes */}
          {clip && notes.length > 0 && (
            <button
              onClick={() => onUpdateClipNotes(clip.id, [])}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 transition-all"
            >
              <Trash2 className="w-3 h-3" /> Clear
            </button>
          )}
        </div>
      </div>

      {/* Main Piano Roll Container (Piano Keys + Beat Matrix Grid) */}
      <div className="flex-1 flex overflow-y-auto overflow-x-auto relative bg-[#faf8f5]">
        {/* Left Vertical Piano Keyboard (Sticky) */}
        <div className="w-20 flex-shrink-0 sticky left-0 z-20 shadow-md">
          {pitches.map((pitch) => {
            const isBlack = [1, 3, 6, 8, 10].includes(pitch % 12);
            const noteName = midiToNoteName(pitch);
            const inKey = isPitchInKey(pitch);

            return (
              <div
                key={pitch}
                onMouseDown={() => {
                  audioEngine.startPreviewNote(pitch, track.synthParams);
                }}
                onMouseUp={() => {
                  audioEngine.stopPreviewNote(pitch);
                }}
                onMouseLeave={() => {
                  audioEngine.stopPreviewNote(pitch);
                }}
                className={`h-6 border-b border-stone-200/80 flex items-center justify-between px-2 text-[10px] font-mono font-bold cursor-pointer transition-colors ${
                  isBlack
                    ? 'bg-stone-800 text-stone-200 hover:bg-stone-700'
                    : 'bg-white text-stone-800 hover:bg-stone-100'
                }`}
              >
                <span>{noteName}</span>
                {inKey && (
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-xs" title="In Key" />
                )}
              </div>
            );
          })}
        </div>

        {/* Right Note Grid */}
        <div className="flex-1 flex flex-col min-w-max">
          {pitches.map((pitch) => {
            const isBlack = [1, 3, 6, 8, 10].includes(pitch % 12);
            const inKey = isPitchInKey(pitch);

            return (
              <div
                key={pitch}
                className={`h-6 border-b border-stone-200/60 flex relative ${
                  inKey ? 'bg-white/40' : isBlack ? 'bg-stone-100/50' : 'bg-transparent'
                }`}
              >
                {/* 16th Note Steps */}
                {Array.from({ length: totalSteps }).map((_, stepIdx) => {
                  const isBeatStart = stepIdx % 4 === 0;
                  const isBarStart = stepIdx % 16 === 0;
                  const stepBeat = stepIdx / stepsPerBeat;

                  // Find if a note occupies this pitch at this step
                  const activeNote = notes.find(
                    n => n.pitch === pitch &&
                         stepBeat >= n.startBeat &&
                         stepBeat < n.startBeat + n.durationBeats
                  );
                  const isNoteHead = activeNote && Math.abs(activeNote.startBeat - stepBeat) < 0.12;

                  return (
                    <div
                      key={stepIdx}
                      onClick={() => handleCellClick(pitch, stepIdx)}
                      className={`w-7 h-full border-r cursor-pointer transition-colors relative ${
                        isBarStart
                          ? 'border-stone-400/80'
                          : isBeatStart
                          ? 'border-stone-300/60'
                          : 'border-stone-200/30'
                      } ${
                        activeNote
                          ? 'bg-amber-400 text-stone-900 font-bold'
                          : 'hover:bg-amber-100/60'
                      }`}
                    >
                      {activeNote && isNoteHead && (
                        <div
                          className="absolute inset-0.5 rounded shadow-sm flex items-center px-1 text-[8px] font-mono truncate"
                          style={{
                            backgroundColor: track.color,
                            color: '#ffffff'
                          }}
                        >
                          {midiToNoteName(pitch)}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
