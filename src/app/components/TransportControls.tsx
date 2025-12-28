import { useEffect, useState } from 'react';
import * as Tone from 'tone';
import { Play, Pause, Square, RotateCcw, Volume2 } from 'lucide-react';

interface TransportControlsProps {
  isPlaying: boolean;
  onPlayPause: () => void;
  onStop: () => void;
  onReset: () => void;
  bpm: number;
  onBpmChange: (bpm: number) => void;
}

export function TransportControls({ isPlaying, onPlayPause, onStop, onReset, bpm, onBpmChange }: TransportControlsProps) {
  const [volume, setVolume] = useState(0);

  useEffect(() => {
    Tone.Destination.volume.value = volume;
  }, [volume]);

  useEffect(() => {
    Tone.getTransport().bpm.value = bpm;
  }, [bpm]);

  return (
    <div className="bg-gray-900 rounded-lg p-6">
      <div className="flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <button
            onClick={onPlayPause}
            className="w-12 h-12 rounded-full bg-green-500 hover:bg-green-600 flex items-center justify-center transition-colors"
          >
            {isPlaying ? (
              <Pause className="text-white" size={24} />
            ) : (
              <Play className="text-white ml-1" size={24} />
            )}
          </button>

          <button
            onClick={onStop}
            className="w-12 h-12 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center transition-colors"
          >
            <Square className="text-white" size={20} />
          </button>

          <button
            onClick={onReset}
            className="w-12 h-12 rounded-full bg-yellow-500 hover:bg-yellow-600 flex items-center justify-center transition-colors"
            title="Reset Pattern"
          >
            <RotateCcw className="text-white" size={20} />
          </button>
        </div>

        <div className="flex flex-col md:flex-row items-center gap-6 w-full md:w-auto">
          <label className="text-white flex items-center gap-2">
            <span className="w-10">BPM</span>
            <input
              type="range"
              min="60"
              max="180"
              value={bpm}
              onChange={(e) => onBpmChange(Number(e.target.value))}
              className="w-32 md:w-32"
            />
            <input
              type="number"
              min="60"
              max="180"
              value={bpm}
              onChange={(e) => onBpmChange(Math.min(180, Math.max(60, Number(e.target.value))))}
              className="w-16 bg-gray-800 text-white px-2 py-1 rounded text-center"
            />
          </label>

          <label className="text-white flex items-center gap-2">
            <Volume2 size={20} className="text-gray-400" />
            <input
              type="range"
              min="-60"
              max="0"
              value={volume}
              onChange={(e) => setVolume(Number(e.target.value))}
              className="w-24 md:w-32"
            />
            <input
              type="number"
              min="-60"
              max="0"
              value={volume}
              onChange={(e) => setVolume(Math.min(0, Math.max(-60, Number(e.target.value))))}
              className="w-16 bg-gray-800 text-white px-2 py-1 rounded text-center"
            />
          </label>
        </div>
      </div>
    </div>
  );
}
