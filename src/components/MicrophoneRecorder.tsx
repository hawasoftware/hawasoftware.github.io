import React, { useState, useEffect, useRef } from 'react';
import { AudioEngine } from '../audio/AudioEngine';
import { Mic, Square, Circle, Check, X } from 'lucide-react';

interface MicrophoneRecorderProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveRecording: (audioBlob: Blob, durationSec: number) => void;
}

export const MicrophoneRecorder: React.FC<MicrophoneRecorderProps> = ({
  isOpen,
  onClose,
  onSaveRecording
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [elapsedSec, setElapsedSec] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const audioEngine = AudioEngine.getInstance();
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    if (isRecording) {
      const start = Date.now();
      timerRef.current = window.setInterval(() => {
        setElapsedSec((Date.now() - start) / 1000);
      }, 50);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRecording]);

  if (!isOpen) return null;

  const handleStart = async () => {
    const ok = await audioEngine.startMicrophoneRecording();
    if (ok) {
      setIsRecording(true);
      setElapsedSec(0);
      setAudioBlob(null);
    }
  };

  const handleStop = async () => {
    setIsRecording(false);
    const blob = await audioEngine.stopMicrophoneRecording();
    if (blob) {
      setAudioBlob(blob);
    }
  };

  const handleSave = () => {
    if (audioBlob) {
      onSaveRecording(audioBlob, elapsedSec);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/40 backdrop-blur-sm p-4">
      <div className="glass-panel w-full max-w-md p-6 rounded-3xl border border-white/80 shadow-2xl flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center">
              <Mic className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-stone-900">Record Live Audio</h3>
              <p className="text-xs text-stone-500">Record vocal takes, instruments, or acoustic ambient audio</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-stone-100 text-stone-400">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Live Timer & Pulse Display */}
        <div className="bg-stone-900 text-white rounded-2xl p-6 flex flex-col items-center justify-center gap-3">
          <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
            isRecording ? 'bg-rose-500/20 ring-4 ring-rose-500/50 animate-pulse' : 'bg-white/10'
          }`}>
            <Mic className={`w-8 h-8 ${isRecording ? 'text-rose-400' : 'text-stone-400'}`} />
          </div>

          <div className="font-mono text-3xl font-bold tracking-wider">
            {elapsedSec.toFixed(1)}s
          </div>

          <div className="text-xs text-stone-400">
            {isRecording ? 'Recording in progress...' : audioBlob ? 'Take recorded!' : 'Ready to record'}
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-3 pt-2">
          {!isRecording && !audioBlob && (
            <button
              onClick={handleStart}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rose-600 text-white text-xs font-bold shadow-md hover:bg-rose-700 transition-all active:scale-95"
            >
              <Circle className="w-3.5 h-3.5 fill-current" />
              Start Recording
            </button>
          )}

          {isRecording && (
            <button
              onClick={handleStop}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-stone-900 text-white text-xs font-bold shadow-md hover:bg-stone-800 transition-all active:scale-95"
            >
              <Square className="w-3.5 h-3.5 fill-current" />
              Stop Recording
            </button>
          )}

          {audioBlob && !isRecording && (
            <div className="flex items-center gap-2">
              <button
                onClick={handleStart}
                className="px-4 py-2 rounded-xl bg-stone-100 text-stone-800 text-xs font-semibold hover:bg-stone-200"
              >
                Retake
              </button>
              <button
                onClick={handleSave}
                className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold shadow-md hover:bg-emerald-700"
              >
                <Check className="w-4 h-4" /> Add to Timeline
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
