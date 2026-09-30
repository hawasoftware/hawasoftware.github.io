import React, { useState } from 'react';
import { ChordPad, Clip, Note, Project, Track } from '../audio/types';
import { AudioEngine } from '../audio/AudioEngine';
import { Sparkles, Music, Plus, Wand2, Play, Volume2 } from 'lucide-react';

interface ChordAssistantProps {
  project: Project;
  selectedTrack: Track;
  currentBeat: number;
  onAddChordToTrack: (chordNotes: Note[]) => void;
}

export const ChordAssistant: React.FC<ChordAssistantProps> = ({
  project,
  selectedTrack,
  currentBeat,
  onAddChordToTrack
}) => {
  const audioEngine = AudioEngine.getInstance();
  const [activePadId, setActivePadId] = useState<string | null>(null);

  // Compute 7 diatonic glass chord pads for the current key
  const keyOffsetMap: Record<string, number> = {
    'C': 60, 'C#': 61, 'D': 62, 'D#': 63, 'E': 64, 'F': 65,
    'F#': 66, 'G': 67, 'G#': 68, 'A': 69, 'A#': 70, 'B': 71,
    'Am': 57, 'Dm': 62, 'Em': 64, 'F#m': 66
  };
  const basePitch = keyOffsetMap[project.key] || 60;

  // Scale degrees for minor or major
  const isMinor = project.scale === 'minor' || project.key.endsWith('m');
  const scaleDegrees = isMinor
    ? [
        { deg: 'i', name: 'Tonic Min9', offset: 0, intervals: [0, 3, 7, 10, 14] },
        { deg: 'ii°', name: 'Diminished', offset: 2, intervals: [0, 3, 6, 10] },
        { deg: 'III', name: 'Mediant Maj7', offset: 3, intervals: [0, 4, 7, 11] },
        { deg: 'iv', name: 'Subdom Min7', offset: 5, intervals: [0, 3, 7, 10] },
        { deg: 'v', name: 'Dominant Min7', offset: 7, intervals: [0, 3, 7, 10] },
        { deg: 'VI', name: 'Submed Maj7', offset: 8, intervals: [0, 4, 7, 11] },
        { deg: 'VII', name: 'Subtonic 7', offset: 10, intervals: [0, 4, 7, 10] }
      ]
    : [
        { deg: 'I', name: 'Tonic Maj9', offset: 0, intervals: [0, 4, 7, 11, 14] },
        { deg: 'ii', name: 'Supertonic Min7', offset: 2, intervals: [0, 3, 7, 10] },
        { deg: 'iii', name: 'Mediant Min7', offset: 4, intervals: [0, 3, 7, 10] },
        { deg: 'IV', name: 'Subdom Maj7', offset: 5, intervals: [0, 4, 7, 11] },
        { deg: 'V', name: 'Dominant 7/13', offset: 7, intervals: [0, 4, 7, 10, 14] },
        { deg: 'vi', name: 'Submed Min7', offset: 9, intervals: [0, 3, 7, 10] },
        { deg: 'vii°', name: 'Leading Tone', offset: 11, intervals: [0, 3, 6, 10] }
      ];

  const chordPads: ChordPad[] = scaleDegrees.map((sd, i) => {
    const root = basePitch + sd.offset;
    return {
      id: `pad-${i}`,
      name: sd.name,
      roman: sd.deg,
      root: project.key,
      quality: sd.name,
      notes: sd.intervals.map(inter => root + inter)
    };
  });

  const playPad = (pad: ChordPad) => {
    setActivePadId(pad.id);
    pad.notes.forEach(pitch => {
      audioEngine.playSynthNote(selectedTrack.id, pitch, 1.2, 0.85, selectedTrack.synthParams);
    });
    setTimeout(() => setActivePadId(null), 400);
  };

  const handleStampChord = (pad: ChordPad) => {
    // Generate Note objects starting at rounded current beat
    const startBeat = Math.round(currentBeat * 2) / 2;
    const durationBeats = 2.0;

    const notesToStamp: Note[] = pad.notes.map((pitch, idx) => ({
      id: `stamp-${Date.now()}-${idx}`,
      pitch,
      startBeat: 0, // relative to clip
      durationBeats,
      velocity: 0.8
    }));

    onAddChordToTrack(notesToStamp);
  };

  // Generate an Algorithmic Melody Motif
  const generateMotif = () => {
    const motifPitches = isMinor
      ? [basePitch + 12, basePitch + 15, basePitch + 19, basePitch + 17, basePitch + 14]
      : [basePitch + 12, basePitch + 16, basePitch + 19, basePitch + 21, basePitch + 14];

    const motifNotes: Note[] = [
      { id: `m1-${Date.now()}`, pitch: motifPitches[0], startBeat: 0.0, durationBeats: 0.5, velocity: 0.9 },
      { id: `m2-${Date.now()}`, pitch: motifPitches[1], startBeat: 0.5, durationBeats: 0.5, velocity: 0.8 },
      { id: `m3-${Date.now()}`, pitch: motifPitches[2], startBeat: 1.0, durationBeats: 1.0, velocity: 0.85 },
      { id: `m4-${Date.now()}`, pitch: motifPitches[3], startBeat: 2.0, durationBeats: 0.5, velocity: 0.8 },
      { id: `m5-${Date.now()}`, pitch: motifPitches[4], startBeat: 2.5, durationBeats: 1.5, velocity: 0.85 }
    ];

    onAddChordToTrack(motifNotes);
  };

  return (
    <div className="w-full h-full flex flex-col glass-panel rounded-2xl border border-stone-200/80 overflow-hidden shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-stone-200/80 bg-white/60 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-stone-800 uppercase tracking-wider">
            Chord Assistant & Harmony Engine
          </span>
          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-rose-100 text-rose-700">
            Diatonic Harmony in {project.key} {project.scale}
          </span>
        </div>

        {/* Generate Motif Action */}
        <div className="flex items-center gap-2">
          <button
            onClick={generateMotif}
            className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-gradient-to-r from-rose-500 to-amber-500 text-white text-xs font-bold shadow-xs hover:shadow-md transition-all active:scale-95"
          >
            <Wand2 className="w-3.5 h-3.5" />
            Generate Melody Motif
          </button>
        </div>
      </div>

      {/* Main Chord Pads Grid */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 bg-[#faf8f5]">
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3">
          {chordPads.map((pad) => {
            const isActive = activePadId === pad.id;

            return (
              <div
                key={pad.id}
                onClick={() => playPad(pad)}
                className={`h-40 rounded-2xl p-3 flex flex-col justify-between cursor-pointer transition-all border shadow-sm ${
                  isActive
                    ? 'bg-rose-500 text-white scale-95 shadow-md border-rose-600'
                    : 'glass-panel hover:bg-white border-white/90 hover:scale-[1.02]'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className={`text-2xl font-black ${isActive ? 'text-white' : 'text-stone-900'}`}>
                      {pad.roman}
                    </span>
                    <Play className={`w-3.5 h-3.5 ${isActive ? 'text-white fill-white' : 'text-stone-400'}`} />
                  </div>
                  <div className={`text-xs font-bold truncate mt-1 ${isActive ? 'text-rose-100' : 'text-stone-700'}`}>
                    {pad.name}
                  </div>
                </div>

                {/* Stamp Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleStampChord(pad);
                  }}
                  className={`w-full py-1.5 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1 transition-all ${
                    isActive
                      ? 'bg-white text-rose-600'
                      : 'bg-stone-100 hover:bg-stone-900 hover:text-white text-stone-800'
                  }`}
                  title="Stamp chord notes to selected track clip"
                >
                  <Plus className="w-3 h-3" /> Stamp
                </button>
              </div>
            );
          })}
        </div>

        {/* Chord Progression Guide Banner */}
        <div className="glass-panel p-4 rounded-2xl border border-white/80 shadow-xs flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center font-bold">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-stone-800">Classic Harmonic Progressions</div>
              <div className="text-[11px] text-stone-500">
                Click any chord pad above to preview in real-time. Hit "Stamp" to place rich polyphonic chords directly onto your track!
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs font-mono font-semibold text-stone-600">
            <span className="px-2 py-1 bg-white rounded-lg border border-stone-200">i — VI — III — VII</span>
            <span className="px-2 py-1 bg-white rounded-lg border border-stone-200">ii — V — I — vi</span>
          </div>
        </div>
      </div>
    </div>
  );
};
