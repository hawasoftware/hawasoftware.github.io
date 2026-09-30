import React, { useState } from 'react';
import { Project } from '../audio/types';
import { AudioEngine } from '../audio/AudioEngine';
import { Download, FileText, Upload, Check, Loader2, X, Music } from 'lucide-react';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project;
  onImportProject: (imported: Project) => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  project,
  onImportProject
}) => {
  const [isExportingWav, setIsExportingWav] = useState(false);
  const [wavDone, setWavDone] = useState(false);
  const audioEngine = AudioEngine.getInstance();

  if (!isOpen) return null;

  const handleExportWAV = async () => {
    try {
      setIsExportingWav(true);
      setWavDone(false);
      const wavBlob = await audioEngine.exportProjectWAV(project);
      const url = URL.createObjectURL(wavBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${project.title.toLowerCase().replace(/[^a-z0-9]/g, '-')}.wav`;
      a.click();
      URL.revokeObjectURL(url);
      setWavDone(true);
    } catch (err) {
      console.error('Export failed', err);
    } finally {
      setIsExportingWav(false);
    }
  };

  const handleExportJSON = () => {
    const jsonStr = JSON.stringify(project, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${project.title.toLowerCase().replace(/[^a-z0-9]/g, '-')}-project.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed.tracks && parsed.bpm) {
          onImportProject(parsed);
          onClose();
        }
      } catch (err) {
        console.error('Invalid project JSON', err);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/40 backdrop-blur-sm p-4">
      <div className="glass-panel w-full max-w-lg p-6 rounded-3xl border border-white/80 shadow-2xl flex flex-col gap-5 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-stone-900 text-white flex items-center justify-center">
              <Download className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-stone-900">Export & Project Manager</h3>
              <p className="text-xs text-stone-500">Render high-fidelity audio or save project files</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-stone-100 text-stone-400">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Options */}
        <div className="flex flex-col gap-3">
          {/* WAV Export Card */}
          <div className="glass-panel p-4 rounded-2xl border border-white/90 shadow-xs flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
                <Music className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-bold text-stone-900">Master WAV Audio (44.1kHz 16-bit)</div>
                <div className="text-[11px] text-stone-500">
                  Renders the full multi-track project with 3D spatial acoustics & reverb tail
                </div>
              </div>
            </div>

            <button
              onClick={handleExportWAV}
              disabled={isExportingWav}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold transition-all disabled:opacity-50"
            >
              {isExportingWav ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Rendering...
                </>
              ) : wavDone ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" /> Exported!
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5" /> Export WAV
                </>
              )}
            </button>
          </div>

          {/* Project JSON Save & Load */}
          <div className="grid grid-cols-2 gap-3">
            {/* Export JSON */}
            <div className="glass-panel p-4 rounded-2xl border border-white/90 shadow-xs flex flex-col justify-between gap-3">
              <div>
                <div className="text-xs font-bold text-stone-900">Save Project File</div>
                <div className="text-[11px] text-stone-500 mt-1">
                  Export tracks, notes, patterns & spatial coordinates as JSON
                </div>
              </div>
              <button
                onClick={handleExportJSON}
                className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-bold transition-all"
              >
                <FileText className="w-3.5 h-3.5" /> Save .json
              </button>
            </div>

            {/* Import JSON */}
            <div className="glass-panel p-4 rounded-2xl border border-white/90 shadow-xs flex flex-col justify-between gap-3">
              <div>
                <div className="text-xs font-bold text-stone-900">Load Project File</div>
                <div className="text-[11px] text-stone-500 mt-1">
                  Restore previously saved .json project file
                </div>
              </div>
              <label className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-bold transition-all cursor-pointer">
                <Upload className="w-3.5 h-3.5" /> Open .json
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImportJSON}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
