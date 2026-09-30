import React, { useRef } from 'react';
import { 
  Plus, 
  Volume2, 
  Sliders, 
  Trash2, 
  Copy, 
  Music, 
  Disc, 
  Radio, 
  Cloud, 
  Sparkles, 
  Mic, 
  Eye, 
  Compass,
  Play
} from 'lucide-react';
import { Clip, Project, Track } from '../audio/types';

interface ArrangerTimelineProps {
  project: Project;
  currentBeat: number;
  selectedTrackId: string;
  onSelectTrack: (trackId: string) => void;
  onSeek: (beat: number) => void;
  onUpdateTrack: (track: Track) => void;
  onAddTrack: (type: 'synth' | 'drum' | 'bass' | 'ambient_pad' | 'audio') => void;
  onDeleteTrack: (trackId: string) => void;
  onAddClip: (trackId: string, startBeat: number) => void;
  onSelectClip: (clip: Clip) => void;
  selectedClipId?: string;
}

export const ArrangerTimeline: React.FC<ArrangerTimelineProps> = ({
  project,
  currentBeat,
  selectedTrackId,
  onSelectTrack,
  onSeek,
  onUpdateTrack,
  onAddTrack,
  onDeleteTrack,
  onAddClip,
  onSelectClip,
  selectedClipId
}) => {
  const rulerRef = useRef<HTMLDivElement>(null);
  const totalBars = 20; // 20 bars visible
  const beatsPerBar = 4;
  const totalBeats = totalBars * beatsPerBar;
  const pixelsPerBeat = 40; // 40px per beat = 160px per 4/4 bar

  const handleRulerClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!rulerRef.current) return;
    const rect = rulerRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickedBeat = Math.max(0, clickX / pixelsPerBeat);
    // Snap to nearest 1/4 or 1/2 beat
    const snappedBeat = Math.round(clickedBeat * 2) / 2;
    onSeek(snappedBeat);
  };

  const getTrackIcon = (type: string) => {
    switch (type) {
      case 'drum': return <Disc className="w-3.5 h-3.5" />;
      case 'bass': return <Radio className="w-3.5 h-3.5" />;
      case 'ambient_pad': return <Cloud className="w-3.5 h-3.5" />;
      case 'lead': return <Sparkles className="w-3.5 h-3.5" />;
      case 'audio': return <Mic className="w-3.5 h-3.5" />;
      default: return <Music className="w-3.5 h-3.5" />;
    }
  };

  return (
    <div className="w-full h-full flex flex-col glass-panel rounded-2xl border border-stone-200/80 overflow-hidden shadow-sm select-none">
      {/* Arranger Top Bar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-stone-200/80 bg-white/50 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-stone-700 uppercase tracking-wider">Tracks & Arranger</span>
          <span className="text-[11px] text-stone-500 font-medium">({project.tracks.length} Tracks)</span>
        </div>

        {/* Add Track Actions */}
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] text-stone-400 font-semibold mr-1">New:</span>
          <button
            onClick={() => onAddTrack('synth')}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-medium transition-all"
          >
            <Plus className="w-3 h-3" /> Synth
          </button>
          <button
            onClick={() => onAddTrack('drum')}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-medium transition-all"
          >
            <Plus className="w-3 h-3" /> Drums
          </button>
          <button
            onClick={() => onAddTrack('bass')}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-medium transition-all"
          >
            <Plus className="w-3 h-3" /> Bass
          </button>
          <button
            onClick={() => onAddTrack('ambient_pad')}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-medium transition-all"
          >
            <Plus className="w-3 h-3" /> Pad
          </button>
        </div>
      </div>

      {/* Main Timeline Scrollable Container */}
      <div className="flex-1 flex overflow-y-auto overflow-x-hidden">
        {/* Left Track Headers Column (Fixed Width 260px) */}
        <div className="w-64 flex-shrink-0 border-r border-stone-200/80 bg-stone-50/70 backdrop-blur-sm flex flex-col">
          {/* Header Spacer for Ruler */}
          <div className="h-8 border-b border-stone-200/80 px-3 flex items-center justify-between text-[11px] font-bold text-stone-400 uppercase tracking-wider">
            <span>Track Name</span>
            <span>M / S / R</span>
          </div>

          {/* Track Headers */}
          {project.tracks.map((track) => {
            const isSelected = track.id === selectedTrackId;
            return (
              <div
                key={track.id}
                onClick={() => onSelectTrack(track.id)}
                className={`h-24 px-3 py-2 border-b border-stone-200/80 flex flex-col justify-between cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-white shadow-sm ring-1 ring-stone-300'
                    : 'hover:bg-white/60'
                }`}
              >
                {/* Track Title and Controls */}
                <div className="flex items-center justify-between gap-1">
                  <div className="flex items-center gap-2 overflow-hidden">
                    <div
                      className="w-3.5 h-3.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: track.color }}
                    />
                    <div className="flex items-center gap-1.5 overflow-hidden">
                      <span className="text-stone-500">{getTrackIcon(track.type)}</span>
                      <input
                        type="text"
                        value={track.name}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => onUpdateTrack({ ...track, name: e.target.value })}
                        className="text-xs font-bold text-stone-800 bg-transparent truncate focus:outline-none focus:bg-white rounded px-0.5"
                      />
                    </div>
                  </div>

                  {/* Mute, Solo, Arm Buttons */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onUpdateTrack({ ...track, muted: !track.muted });
                      }}
                      className={`w-5 h-5 rounded text-[10px] font-bold transition-all ${
                        track.muted
                          ? 'bg-rose-500 text-white shadow-sm'
                          : 'bg-stone-200/80 text-stone-600 hover:bg-stone-300'
                      }`}
                      title="Mute Track"
                    >
                      M
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onUpdateTrack({ ...track, solo: !track.solo });
                      }}
                      className={`w-5 h-5 rounded text-[10px] font-bold transition-all ${
                        track.solo
                          ? 'bg-amber-400 text-stone-900 shadow-sm'
                          : 'bg-stone-200/80 text-stone-600 hover:bg-stone-300'
                      }`}
                      title="Solo Track"
                    >
                      S
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onUpdateTrack({ ...track, armed: !track.armed });
                      }}
                      className={`w-5 h-5 rounded text-[10px] font-bold transition-all ${
                        track.armed
                          ? 'bg-rose-600 text-white animate-pulse'
                          : 'bg-stone-200/80 text-stone-600 hover:bg-stone-300'
                      }`}
                      title="Arm for Recording"
                    >
                      R
                    </button>
                  </div>
                </div>

                {/* Volume Fader, Pan dial, & Spatial info */}
                <div className="flex items-center justify-between gap-2 pt-1 border-t border-stone-100">
                  {/* Volume Slider */}
                  <div className="flex items-center gap-1.5 flex-1">
                    <Volume2 className="w-3 h-3 text-stone-400" />
                    <input
                      type="range"
                      min="0"
                      max="1.2"
                      step="0.01"
                      value={track.volume}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => onUpdateTrack({ ...track, volume: parseFloat(e.target.value) })}
                      className="w-full accent-stone-700 h-1 bg-stone-200 rounded cursor-pointer"
                      title={`Volume: ${Math.round(track.volume * 100)}%`}
                    />
                  </div>

                  {/* 3D Spatial Position Tag */}
                  <div 
                    className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-sky-50 text-sky-800 text-[9px] font-mono border border-sky-200"
                    title={`3D Spatial: X ${track.spatial.x}m, Z ${track.spatial.z}m`}
                  >
                    <Compass className="w-2.5 h-2.5" />
                    <span>{track.spatial.x > 0 ? `+${track.spatial.x}` : track.spatial.x}m</span>
                  </div>

                  {/* Delete button (if more than 1 track) */}
                  {project.tracks.length > 1 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteTrack(track.id);
                      }}
                      className="text-stone-400 hover:text-rose-600 p-0.5 rounded"
                      title="Delete Track"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Arranger Grid (Horizontal Scrollable) */}
        <div className="flex-1 overflow-x-auto relative bg-[#faf8f5]">
          <div
            style={{ width: `${totalBeats * pixelsPerBeat}px` }}
            className="relative min-h-full flex flex-col"
          >
            {/* Top Time Ruler */}
            <div
              ref={rulerRef}
              onClick={handleRulerClick}
              className="h-8 border-b border-stone-200/90 bg-stone-100/90 sticky top-0 z-20 flex cursor-pointer"
            >
              {Array.from({ length: totalBars }).map((_, barIdx) => (
                <div
                  key={barIdx}
                  style={{ width: `${beatsPerBar * pixelsPerBeat}px` }}
                  className="h-full border-r border-stone-300/80 flex items-center px-1.5 text-[10px] font-mono font-bold text-stone-500 relative"
                >
                  <span>{barIdx + 1}</span>
                  {/* Beat tick marks inside bar */}
                  <div className="absolute bottom-0 left-0 right-0 h-2 flex justify-between px-1">
                    <span className="w-[1px] h-2 bg-stone-300" />
                    <span className="w-[1px] h-1.5 bg-stone-200" />
                    <span className="w-[1px] h-2 bg-stone-300" />
                    <span className="w-[1px] h-1.5 bg-stone-200" />
                  </div>
                </div>
              ))}
            </div>

            {/* Loop Range Highlight Box */}
            {project.isLooping && (
              <div
                style={{
                  left: `${project.loopStart * pixelsPerBeat}px`,
                  width: `${(project.loopEnd - project.loopStart) * pixelsPerBeat}px`
                }}
                className="absolute top-0 bottom-0 bg-sky-400/10 border-x border-sky-400/40 pointer-events-none z-10"
              />
            )}

            {/* Red Playhead Scrubber Line */}
            <div
              style={{
                left: `${currentBeat * pixelsPerBeat}px`,
                transform: 'translateX(-50%)'
              }}
              className="absolute top-0 bottom-0 w-[2px] bg-rose-500 z-30 pointer-events-none shadow-sm transition-transform duration-75"
            >
              {/* Playhead arrow flag */}
              <div className="w-3 h-3 bg-rose-500 rotate-45 -translate-x-[5px] -translate-y-1 shadow-sm" />
            </div>

            {/* Track Lanes */}
            {project.tracks.map((track) => (
              <div
                key={track.id}
                className="h-24 border-b border-stone-200/80 relative flex items-center group"
                onClick={(e) => {
                  // If clicked on empty lane area, prompt adding a clip
                  const rect = e.currentTarget.getBoundingClientRect();
                  const clickBeat = Math.max(0, (e.clientX - rect.left) / pixelsPerBeat);
                  const snapBeat = Math.floor(clickBeat / 4) * 4;
                  onAddClip(track.id, snapBeat);
                }}
              >
                {/* Vertical bar grid lines background */}
                {Array.from({ length: totalBars }).map((_, barIdx) => (
                  <div
                    key={barIdx}
                    style={{
                      left: `${barIdx * beatsPerBar * pixelsPerBeat}px`,
                      width: `${beatsPerBar * pixelsPerBeat}px`
                    }}
                    className="absolute top-0 bottom-0 border-r border-stone-200/40 pointer-events-none"
                  />
                ))}

                {/* Clips in this track */}
                {track.clips.map((clip) => {
                  const clipLeft = clip.startBeat * pixelsPerBeat;
                  const clipWidth = clip.durationBeats * pixelsPerBeat;
                  const isClipSelected = clip.id === selectedClipId;

                  return (
                    <div
                      key={clip.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectTrack(track.id);
                        onSelectClip(clip);
                      }}
                      style={{
                        left: `${clipLeft}px`,
                        width: `${clipWidth}px`,
                        borderColor: track.color
                      }}
                      className={`absolute top-2 bottom-2 rounded-xl p-2 cursor-pointer transition-all flex flex-col justify-between overflow-hidden shadow-sm backdrop-blur-sm border-2 ${
                        isClipSelected
                          ? 'ring-2 ring-stone-900 shadow-md scale-[1.01] z-10'
                          : 'hover:shadow-md'
                      }`}
                    >
                      {/* Glass backdrop with track tint */}
                      <div
                        className="absolute inset-0 opacity-20 pointer-events-none"
                        style={{ backgroundColor: track.color }}
                      />

                      {/* Clip Header Label */}
                      <div className="flex items-center justify-between text-xs font-bold text-stone-800 relative z-10">
                        <span className="truncate pr-1">{clip.name}</span>
                        <span className="text-[10px] font-mono opacity-60">
                          {clip.durationBeats}b
                        </span>
                      </div>

                      {/* Mini Note Preview / Drum Preview inside Clip */}
                      <div className="h-9 w-full relative z-10 bg-white/40 rounded-lg p-1 overflow-hidden flex items-center">
                        {clip.notes && clip.notes.length > 0 && (
                          <div className="w-full h-full relative">
                            {clip.notes.map((note) => {
                              const noteLeftPercent = (note.startBeat / clip.durationBeats) * 100;
                              const noteWidthPercent = Math.max(1.5, (note.durationBeats / clip.durationBeats) * 100);
                              // Normalize pitch between 36 (C2) and 84 (C6)
                              const pitchPercent = Math.max(0, Math.min(100, ((note.pitch - 36) / 48) * 100));

                              return (
                                <div
                                  key={note.id}
                                  style={{
                                    left: `${noteLeftPercent}%`,
                                    width: `${noteWidthPercent}%`,
                                    bottom: `${pitchPercent}%`,
                                    backgroundColor: track.color
                                  }}
                                  className="absolute h-1.5 rounded-full shadow-xs opacity-85"
                                />
                              );
                            })}
                          </div>
                        )}

                        {/* Drum pattern dots preview */}
                        {clip.drumPattern && (
                          <div className="w-full h-full flex items-center justify-around px-1">
                            {Array.from({ length: 16 }).map((_, stepIdx) => {
                              const isKick = clip.drumPattern?.kick[stepIdx];
                              const isSnare = clip.drumPattern?.snare[stepIdx];
                              const isHat = clip.drumPattern?.hihatClosed[stepIdx];
                              const hasHit = isKick || isSnare || isHat;

                              return (
                                <div
                                  key={stepIdx}
                                  className={`w-1 h-3 rounded-full transition-all ${
                                    hasHit
                                      ? 'bg-amber-500 shadow-xs'
                                      : 'bg-stone-300/40'
                                  }`}
                                />
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
