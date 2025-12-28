import { useState } from 'react';
import * as Tone from 'tone';
import { DrumSequencer, DRUMS, STEPS } from './components/DrumSequencer';
import { Synthesizer } from './components/Synthesizer';
import { TransportControls } from './components/TransportControls';

export default function App() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [pattern, setPattern] = useState<boolean[][]>(
    Array(DRUMS.length).fill(null).map(() => Array(STEPS).fill(false))
  );

  const handleReset = () => {
    setPattern(Array(DRUMS.length).fill(null).map(() => Array(STEPS).fill(false)));
  };

  const handlePlayPause = async () => {
    await Tone.start();

    if (isPlaying) {
      Tone.getTransport().pause();
    } else {
      Tone.getTransport().start();
    }

    setIsPlaying(!isPlaying);
  };

  const handleStop = () => {
    Tone.getTransport().stop();
    setIsPlaying(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 to-gray-900 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="text-center mb-8">
          <h1 className="text-white text-4xl mb-2">Loop Station</h1>
          <p className="text-gray-400">Create beats with drum patterns and synthesizer sounds</p>
        </div>

        <TransportControls
          isPlaying={isPlaying}
          onPlayPause={handlePlayPause}
          onStop={handleStop}
          onReset={handleReset}
        />

        <DrumSequencer
          isPlaying={isPlaying}
          pattern={pattern}
          onPatternChange={setPattern}
        />

        <Synthesizer />

        <div className="bg-gray-900 rounded-lg p-4">
          <p className="text-gray-400 text-sm text-center">
            Click on the drum grid to create patterns • Use the keyboard to play synth notes • Adjust BPM and waveform
          </p>
        </div>
      </div>
    </div>
  );
}
