import React, { useState, useEffect } from 'react';
import { Project, Track, Clip, Note, DrumPattern, SpatialPosition, SynthParameters } from './audio/types';
import { DEMO_PROJECTS } from './audio/demoSongs';
import { AudioEngine } from './audio/AudioEngine';
import { TransportBar } from './components/TransportBar';
import { ArrangerTimeline } from './components/ArrangerTimeline';
import { SpatialAcoustics3D } from './components/SpatialAcoustics3D';
import { PianoRoll } from './components/PianoRoll';
import { StepSequencer } from './components/StepSequencer';
import { SynthDesigner } from './components/SynthDesigner';
import { ChordAssistant } from './components/ChordAssistant';
import { MasterVisualizer } from './components/MasterVisualizer';
import { MicrophoneRecorder } from './components/MicrophoneRecorder';
import { ExportModal } from './components/ExportModal';
import { SYNTH_PRESETS } from './audio/presets';

export const App: React.FC = () => {
  const [project, setProject] = useState<Project>(DEMO_PROJECTS[0]);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentBeat, setCurrentBeat] = useState<number>(0);
  const [selectedTrackId, setSelectedTrackId] = useState<string>(project.tracks[0]?.id || '');
  const [selectedClipId, setSelectedClipId] = useState<string | undefined>(project.tracks[0]?.clips[0]?.id);
  const [activePanel, setActivePanel] = useState<'timeline' | 'pianoroll' | 'drums' | 'spatial' | 'synth' | 'chords'>('timeline');

  // Modals
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isMicOpen, setIsMicOpen] = useState(false);

  const audioEngine = AudioEngine.getInstance();

  // Listen to AudioEngine clock updates
  useEffect(() => {
    const unsubBeat = audioEngine.subscribeBeatUpdate((beat) => {
      setCurrentBeat(beat);
    });
    const unsubStop = audioEngine.subscribeStop(() => {
      setIsPlaying(false);
    });

    return () => {
      unsubBeat();
      unsubStop();
    };
  }, []);

  // Keyboard shortcut: Spacebar to toggle Play/Pause
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement).tagName)) {
        return;
      }
      if (e.code === 'Space') {
        e.preventDefault();
        if (isPlaying) {
          audioEngine.pausePlayback();
          setIsPlaying(false);
        } else {
          audioEngine.startPlayback(project, currentBeat);
          setIsPlaying(true);
        }
      } else if (e.code === 'Enter') {
        e.preventDefault();
        audioEngine.stopPlayback();
        setIsPlaying(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, project, currentBeat]);

  const handlePlay = () => {
    audioEngine.startPlayback(project, currentBeat);
    setIsPlaying(true);
  };

  const handlePause = () => {
    audioEngine.pausePlayback();
    setIsPlaying(false);
  };

  const handleStop = () => {
    audioEngine.stopPlayback();
    setIsPlaying(false);
  };

  const handleSeek = (beat: number) => {
    audioEngine.seekToBeat(beat);
    setCurrentBeat(beat);
  };

  const handleToggleLoop = () => {
    setProject(prev => ({ ...prev, isLooping: !prev.isLooping }));
  };

  const handleBpmChange = (bpm: number) => {
    setProject(prev => ({ ...prev, bpm }));
  };

  const handleKeyChange = (key: string) => {
    setProject(prev => ({ ...prev, key }));
  };

  const handleScaleChange = (scale: string) => {
    setProject(prev => ({ ...prev, scale }));
  };

  const handleMasterVolumeChange = (vol: number) => {
    setProject(prev => ({ ...prev, masterVolume: vol }));
    audioEngine.setMasterVolume(vol);
  };

  const handleSelectDemo = (demoId: string) => {
    audioEngine.stopPlayback();
    setIsPlaying(false);
    const chosen = DEMO_PROJECTS.find(d => d.id === demoId) || DEMO_PROJECTS[0];
    setProject(chosen);
    setSelectedTrackId(chosen.tracks[0]?.id || '');
    setSelectedClipId(chosen.tracks[0]?.clips[0]?.id);
  };

  // Track manipulation
  const handleUpdateTrack = (updatedTrack: Track) => {
    setProject(prev => ({
      ...prev,
      tracks: prev.tracks.map(t => t.id === updatedTrack.id ? updatedTrack : t)
    }));
    audioEngine.updateTrackVolume(updatedTrack.id, updatedTrack.volume, updatedTrack.muted);
    audioEngine.updateTrackSpatial(updatedTrack.id, updatedTrack.spatial);
  };

  const handleUpdateSpatial = (trackId: string, spatial: SpatialPosition) => {
    setProject(prev => ({
      ...prev,
      tracks: prev.tracks.map(t => t.id === trackId ? { ...t, spatial } : t)
    }));
    audioEngine.updateTrackSpatial(trackId, spatial);
  };

  const handleAddTrack = (type: 'synth' | 'drum' | 'bass' | 'ambient_pad' | 'audio') => {
    const trackColors: Record<string, string> = {
      synth: '#38bdf8',
      drum: '#f59e0b',
      bass: '#fb7185',
      ambient_pad: '#c084fc',
      audio: '#10b981'
    };

    const newTrackId = `track-${Date.now()}`;
    const newTrack: Track = {
      id: newTrackId,
      name: `New ${type.charAt(0).toUpperCase() + type.slice(1)}`,
      type,
      color: trackColors[type] || '#38bdf8',
      icon: 'Music',
      volume: 0.8,
      pan: 0,
      muted: false,
      solo: false,
      armed: false,
      synthParams: SYNTH_PRESETS.glassBell.params,
      spatial: { x: (Math.random() - 0.5) * 8, y: 0, z: (Math.random() - 0.5) * 8, roomAcoustic: 'studio' },
      clips: [
        {
          id: `clip-${Date.now()}`,
          name: `${type.toUpperCase()} Pattern 1`,
          trackId: newTrackId,
          startBeat: 0,
          durationBeats: 8,
          notes: [],
          color: trackColors[type] || '#38bdf8'
        }
      ]
    };

    setProject(prev => ({
      ...prev,
      tracks: [...prev.tracks, newTrack]
    }));
    setSelectedTrackId(newTrackId);
    setSelectedClipId(newTrack.clips[0].id);
    audioEngine.registerTrack(newTrack);
  };

  const handleDeleteTrack = (trackId: string) => {
    setProject(prev => {
      const remaining = prev.tracks.filter(t => t.id !== trackId);
      if (selectedTrackId === trackId && remaining.length > 0) {
        setSelectedTrackId(remaining[0].id);
        setSelectedClipId(remaining[0].clips[0]?.id);
      }
      return { ...prev, tracks: remaining };
    });
  };

  const handleAddClip = (trackId: string, startBeat: number) => {
    const track = project.tracks.find(t => t.id === trackId);
    if (!track) return;

    const newClip: Clip = {
      id: `clip-${Date.now()}`,
      name: `${track.name} Pattern`,
      trackId,
      startBeat,
      durationBeats: 8,
      notes: [],
      drumPattern: track.type === 'drum' ? {
        kick: Array(16).fill(false),
        snare: Array(16).fill(false),
        clap: Array(16).fill(false),
        hihatClosed: Array(16).fill(false),
        hihatOpen: Array(16).fill(false),
        tom: Array(16).fill(false),
        percussion: Array(16).fill(false)
      } : undefined,
      color: track.color
    };

    setProject(prev => ({
      ...prev,
      tracks: prev.tracks.map(t => t.id === trackId ? { ...t, clips: [...t.clips, newClip] } : t)
    }));
    setSelectedClipId(newClip.id);
  };

  const handleSelectClip = (clip: Clip) => {
    setSelectedClipId(clip.id);
    setSelectedTrackId(clip.trackId);
    // Switch to corresponding editor
    const track = project.tracks.find(t => t.id === clip.trackId);
    if (track?.type === 'drum') {
      setActivePanel('drums');
    } else {
      setActivePanel('pianoroll');
    }
  };

  // Update notes of a clip
  const handleUpdateClipNotes = (clipId: string, notes: Note[]) => {
    setProject(prev => ({
      ...prev,
      tracks: prev.tracks.map(t => ({
        ...t,
        clips: t.clips.map(c => c.id === clipId ? { ...c, notes } : c)
      }))
    }));
  };

  // Update drum pattern of a clip
  const handleUpdateDrumPattern = (clipId: string, pattern: DrumPattern) => {
    setProject(prev => ({
      ...prev,
      tracks: prev.tracks.map(t => ({
        ...t,
        clips: t.clips.map(c => c.id === clipId ? { ...c, drumPattern: pattern } : c)
      }))
    }));
  };

  // Add chord notes from Chord Assistant to current selected clip
  const handleAddChordToTrack = (chordNotes: Note[]) => {
    const track = project.tracks.find(t => t.id === selectedTrackId);
    if (!track || track.clips.length === 0) return;

    let targetClip = track.clips.find(c => c.id === selectedClipId) || track.clips[0];

    const updatedNotes = [...(targetClip.notes || []), ...chordNotes];
    handleUpdateClipNotes(targetClip.id, updatedNotes);
  };

  // Save Microphone Recording into a new track clip
  const handleSaveRecording = (_blob: Blob, durationSec: number) => {
    const durationBeats = Math.max(4, Math.ceil((durationSec * project.bpm) / 60));
    handleAddTrack('audio');
  };

  const selectedTrack = project.tracks.find(t => t.id === selectedTrackId) || project.tracks[0];
  const selectedClip = selectedTrack?.clips.find(c => c.id === selectedClipId) || selectedTrack?.clips[0];

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#faf7f2] text-stone-800">
      {/* Top Transport & Studio Bar */}
      <TransportBar
        project={project}
        isPlaying={isPlaying}
        currentBeat={currentBeat}
        onPlay={handlePlay}
        onPause={handlePause}
        onStop={handleStop}
        onToggleLoop={handleToggleLoop}
        onBpmChange={handleBpmChange}
        onKeyChange={handleKeyChange}
        onScaleChange={handleScaleChange}
        onMasterVolumeChange={handleMasterVolumeChange}
        onOpenExport={() => setIsExportOpen(true)}
        onOpenMic={() => setIsMicOpen(true)}
        onSelectDemo={handleSelectDemo}
        activePanel={activePanel}
        setActivePanel={setActivePanel}
      />

      {/* Main Workspace Body */}
      <div className="flex-1 flex overflow-hidden p-3 gap-3">
        {/* Center Panel (Timeline or Active Editor) */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {activePanel === 'timeline' && (
            <ArrangerTimeline
              project={project}
              currentBeat={currentBeat}
              selectedTrackId={selectedTrackId}
              onSelectTrack={setSelectedTrackId}
              onSeek={handleSeek}
              onUpdateTrack={handleUpdateTrack}
              onAddTrack={handleAddTrack}
              onDeleteTrack={handleDeleteTrack}
              onAddClip={handleAddClip}
              onSelectClip={handleSelectClip}
              selectedClipId={selectedClipId}
            />
          )}

          {activePanel === 'spatial' && (
            <SpatialAcoustics3D
              project={project}
              selectedTrackId={selectedTrackId}
              onSelectTrack={setSelectedTrackId}
              onUpdateSpatial={handleUpdateSpatial}
              isPlaying={isPlaying}
            />
          )}

          {activePanel === 'pianoroll' && (
            <PianoRoll
              project={project}
              track={selectedTrack}
              clip={selectedClip}
              onUpdateClipNotes={handleUpdateClipNotes}
            />
          )}

          {activePanel === 'drums' && (
            <StepSequencer
              track={selectedTrack}
              clip={selectedClip}
              currentBeat={currentBeat}
              onUpdateDrumPattern={handleUpdateDrumPattern}
            />
          )}

          {activePanel === 'synth' && (
            <SynthDesigner
              track={selectedTrack}
              onUpdateSynthParams={(trackId, params) => {
                const tr = project.tracks.find(t => t.id === trackId);
                if (tr) {
                  handleUpdateTrack({ ...tr, synthParams: params });
                }
              }}
            />
          )}

          {activePanel === 'chords' && (
            <ChordAssistant
              project={project}
              selectedTrack={selectedTrack}
              currentBeat={currentBeat}
              onAddChordToTrack={handleAddChordToTrack}
            />
          )}
        </main>

        {/* Right Master Strip & Visualizer */}
        <MasterVisualizer
          eq={project.masterEQ}
          onUpdateEQ={(newEq) => setProject(prev => ({ ...prev, masterEQ: newEq }))}
          masterVolume={project.masterVolume}
        />
      </div>

      {/* Modals */}
      <ExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        project={project}
        onImportProject={(imported) => {
          audioEngine.stopPlayback();
          setIsPlaying(false);
          setProject(imported);
          setSelectedTrackId(imported.tracks[0]?.id || '');
          setSelectedClipId(imported.tracks[0]?.clips[0]?.id);
        }}
      />

      <MicrophoneRecorder
        isOpen={isMicOpen}
        onClose={() => setIsMicOpen(false)}
        onSaveRecording={handleSaveRecording}
      />
    </div>
  );
};
