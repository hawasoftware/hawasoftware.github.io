import React, { useEffect, useRef, useState } from 'react';
import { AudioEngine } from '../audio/AudioEngine';
import { Activity, Sliders, Volume2 } from 'lucide-react';

interface MasterVisualizerProps {
  eq: { low: number; mid: number; high: number };
  onUpdateEQ: (eq: { low: number; mid: number; high: number }) => void;
  masterVolume: number;
}

export const MasterVisualizer: React.FC<MasterVisualizerProps> = ({
  eq,
  onUpdateEQ,
  masterVolume
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [visMode, setVisMode] = useState<'spectrum' | 'oscilloscope'>('spectrum');
  const audioEngine = AudioEngine.getInstance();

  useEffect(() => {
    let animId: number;

    const render = () => {
      animId = requestAnimationFrame(render);
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const { freq, time } = audioEngine.getVisualizerData();
      const width = canvas.width;
      const height = canvas.height;

      ctx.clearRect(0, 0, width, height);

      if (visMode === 'spectrum') {
        // FFT Spectrum Bars with Glass Shimmer
        const barCount = 48;
        const barWidth = (width / barCount) - 1.5;
        const step = Math.floor(freq.length / (barCount * 1.5));

        for (let i = 0; i < barCount; i++) {
          const val = freq[i * step] || 0;
          const barHeight = (val / 255) * (height - 6);

          // Glass gradient: amber to rose to sky blue
          const grad = ctx.createLinearGradient(0, height, 0, height - barHeight);
          grad.addColorStop(0, 'rgba(245, 158, 11, 0.7)');
          grad.addColorStop(0.5, 'rgba(251, 113, 133, 0.85)');
          grad.addColorStop(1, 'rgba(56, 189, 248, 0.95)');

          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.roundRect(i * (barWidth + 1.5) + 1, height - barHeight, barWidth, barHeight, [2, 2, 0, 0]);
          ctx.fill();
        }
      } else {
        // Oscilloscope Waveform
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#38bdf8';
        ctx.beginPath();

        const sliceWidth = width / time.length;
        let x = 0;

        for (let i = 0; i < time.length; i++) {
          const v = time[i] / 128.0;
          const y = (v * height) / 2;

          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
          x += sliceWidth;
        }

        ctx.lineTo(width, height / 2);
        ctx.stroke();
      }
    };

    render();
    return () => cancelAnimationFrame(animId);
  }, [visMode]);

  return (
    <div className="w-64 glass-panel border-l border-stone-200/80 p-3.5 flex flex-col justify-between overflow-y-auto select-none">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-stone-700" />
            <span className="text-xs font-bold text-stone-800 uppercase tracking-wider">Master Bus</span>
          </div>

          <div className="flex items-center gap-1 bg-stone-100 p-0.5 rounded-lg text-[10px]">
            <button
              onClick={() => setVisMode('spectrum')}
              className={`px-1.5 py-0.5 rounded font-semibold ${
                visMode === 'spectrum' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-500'
              }`}
            >
              FFT
            </button>
            <button
              onClick={() => setVisMode('oscilloscope')}
              className={`px-1.5 py-0.5 rounded font-semibold ${
                visMode === 'oscilloscope' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-500'
              }`}
            >
              Wave
            </button>
          </div>
        </div>

        {/* Glass FFT Canvas */}
        <div className="w-full h-24 bg-stone-900/90 rounded-xl overflow-hidden border border-stone-800 shadow-inner p-1 mb-3.5">
          <canvas ref={canvasRef} width={220} height={88} className="w-full h-full" />
        </div>

        {/* Master 3-Band Equalizer */}
        <div className="bg-white/60 p-3 rounded-2xl border border-stone-200/80 shadow-xs mb-3">
          <div className="text-[11px] font-bold text-stone-700 uppercase tracking-wider mb-2">
            Master 3-Band EQ
          </div>

          <div className="flex flex-col gap-2.5">
            {/* Low Shelf */}
            <div className="flex items-center justify-between gap-2 text-xs">
              <span className="text-stone-500 font-semibold w-10">Low:</span>
              <input
                type="range"
                min="-10"
                max="10"
                step="0.5"
                value={eq.low}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  onUpdateEQ({ ...eq, low: val });
                  audioEngine.setMasterEQ(val, eq.mid, eq.high);
                }}
                className="flex-1 accent-amber-500 h-1 bg-stone-200 rounded cursor-pointer"
              />
              <span className="font-mono text-[10px] w-8 text-right font-bold">
                {eq.low > 0 ? `+${eq.low}` : eq.low}dB
              </span>
            </div>

            {/* Mid Peaking */}
            <div className="flex items-center justify-between gap-2 text-xs">
              <span className="text-stone-500 font-semibold w-10">Mid:</span>
              <input
                type="range"
                min="-10"
                max="10"
                step="0.5"
                value={eq.mid}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  onUpdateEQ({ ...eq, mid: val });
                  audioEngine.setMasterEQ(eq.low, val, eq.high);
                }}
                className="flex-1 accent-rose-500 h-1 bg-stone-200 rounded cursor-pointer"
              />
              <span className="font-mono text-[10px] w-8 text-right font-bold">
                {eq.mid > 0 ? `+${eq.mid}` : eq.mid}dB
              </span>
            </div>

            {/* High Shelf */}
            <div className="flex items-center justify-between gap-2 text-xs">
              <span className="text-stone-500 font-semibold w-10">Air:</span>
              <input
                type="range"
                min="-10"
                max="10"
                step="0.5"
                value={eq.high}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  onUpdateEQ({ ...eq, high: val });
                  audioEngine.setMasterEQ(eq.low, eq.mid, val);
                }}
                className="flex-1 accent-sky-500 h-1 bg-stone-200 rounded cursor-pointer"
              />
              <span className="font-mono text-[10px] w-8 text-right font-bold">
                {eq.high > 0 ? `+${eq.high}` : eq.high}dB
              </span>
            </div>
          </div>
        </div>

        {/* Master Acoustics Info */}
        <div className="p-3 bg-stone-100/70 rounded-2xl border border-stone-200/60 text-xs text-stone-600 flex flex-col gap-1.5">
          <div className="flex justify-between font-mono text-[10px]">
            <span>Limiter:</span>
            <span className="text-emerald-600 font-bold">Active (-1.5dB)</span>
          </div>
          <div className="flex justify-between font-mono text-[10px]">
            <span>Reverb Engine:</span>
            <span className="text-stone-800 font-bold">Glass Impulse</span>
          </div>
          <div className="flex justify-between font-mono text-[10px]">
            <span>Spatial Model:</span>
            <span className="text-sky-600 font-bold">HRTF 3D Panner</span>
          </div>
        </div>
      </div>
    </div>
  );
};
