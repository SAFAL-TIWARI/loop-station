import { useEffect, useState } from 'react';
import * as Tone from 'tone';
import { Volume2 } from 'lucide-react';

interface DrumSequencerProps {
  isPlaying: boolean;
  pattern: boolean[][];
  onPatternChange: (pattern: boolean[][]) => void;
}

export const DRUMS = [
  { name: 'Kick', color: 'bg-purple-500' },
  { name: 'Snare', color: 'bg-pink-500' },
  { name: 'Hi-Hat', color: 'bg-cyan-500' },
  { name: 'Clap', color: 'bg-orange-500' },
  { name: 'Tom', color: 'bg-red-500' },
  { name: 'Rim', color: 'bg-yellow-500' },
  { name: 'Crash', color: 'bg-blue-500' },
  { name: 'Ride', color: 'bg-green-500' },
  { name: 'Cowbell', color: 'bg-amber-500' },
  { name: 'Shaker', color: 'bg-teal-500' },
];

export const STEPS = 16;

export function DrumSequencer({ isPlaying, pattern, onPatternChange }: DrumSequencerProps) {
  const [currentStep, setCurrentStep] = useState(-1);
  const [synths, setSynths] = useState<Tone.MembraneSynth[] | null>(null);
  const [activeTracks, setActiveTracks] = useState<boolean[]>(
    Array(DRUMS.length).fill(true)
  );
  const [volumes, setVolumes] = useState<number[]>(
    Array(DRUMS.length).fill(-10)
  );

  useEffect(() => {
    // Initialize drum synths
    const drumSynths = [
      new Tone.MembraneSynth({ octaves: 2, pitchDecay: 0.05 }).toDestination(), // Kick
      new Tone.MembraneSynth({ pitchDecay: 0.05, octaves: 2 }).toDestination(), // Snare
      new Tone.MetalSynth({ frequency: 200, envelope: { decay: 0.1 } }).toDestination(), // Hi-Hat
      new Tone.NoiseSynth({ noise: { type: 'white' }, envelope: { decay: 0.1 } }).toDestination(), // Clap
      new Tone.MembraneSynth({ octaves: 4, pitchDecay: 0.08 }).toDestination(), // Tom
      new Tone.MetalSynth({ frequency: 400, envelope: { decay: 0.05 } }).toDestination(), // Rim
      new Tone.MetalSynth({ frequency: 150, envelope: { decay: 2, release: 3 } }).toDestination(), // Crash
      new Tone.MetalSynth({ frequency: 800, envelope: { decay: 0.5 } }).toDestination(), // Ride
      new Tone.MetalSynth({ frequency: 540, envelope: { decay: 0.2 } }).toDestination(), // Cowbell
      new Tone.NoiseSynth({ noise: { type: 'white' }, envelope: { attack: 0.005, decay: 0.05 } }).toDestination(), // Shaker
    ];

    setSynths(drumSynths as any);

    return () => {
      drumSynths.forEach(synth => synth.dispose());
    };
  }, []);

  useEffect(() => {
    if (!isPlaying || !synths) {
      setCurrentStep(-1);
      return;
    }

    const sequence = new Tone.Sequence(
      (time, step) => {
        setCurrentStep(step);

        pattern.forEach((row, drumIndex) => {
          if (row[step] && activeTracks[drumIndex]) {
            if (drumIndex === 0) {
              // Kick
              (synths[0] as Tone.MembraneSynth).triggerAttackRelease('C1', '8n', time);
            } else if (drumIndex === 1) {
              // Snare
              (synths[1] as Tone.MembraneSynth).triggerAttackRelease('C2', '8n', time);
            } else if (drumIndex === 2) {
              // Hi-Hat
              (synths[2] as any).triggerAttackRelease('16n', time);
            } else if (drumIndex === 3) {
              // Clap
              (synths[3] as any).triggerAttackRelease('8n', time);
            } else if (drumIndex === 4) {
              // Tom
              (synths[4] as Tone.MembraneSynth).triggerAttackRelease('C3', '8n', time);
            } else if (drumIndex === 5) {
              // Rim
              (synths[5] as Tone.MetalSynth).triggerAttackRelease('C4', '8n', time);
            } else if (drumIndex === 6) {
              // Crash
              (synths[6] as Tone.MetalSynth).triggerAttackRelease('16n', time);
            } else if (drumIndex === 7) {
              // Ride
              (synths[7] as Tone.MetalSynth).triggerAttackRelease('16n', time);
            } else if (drumIndex === 8) {
              // Cowbell
              (synths[8] as Tone.MetalSynth).triggerAttackRelease('16n', time);
            } else if (drumIndex === 9) {
              // Shaker
              (synths[9] as Tone.NoiseSynth).triggerAttackRelease('16n', time);
            }
          }
        });
      },
      [...Array(STEPS)].map((_, i) => i),
      '16n'
    );

    sequence.start(0);

    return () => {
      sequence.dispose();
    };
  }, [isPlaying, pattern, synths, activeTracks]);

  const toggleStep = (drumIndex: number, stepIndex: number) => {
    const newPattern = pattern.map(row => [...row]);
    newPattern[drumIndex][stepIndex] = !newPattern[drumIndex][stepIndex];
    onPatternChange(newPattern);
  };

  const handleVolumeChange = (index: number, value: number) => {
    const newVolumes = [...volumes];
    newVolumes[index] = value;
    setVolumes(newVolumes);

    if (synths && synths[index]) {
      // @ts-ignore - volume property exists on Tone.Instrument
      synths[index].volume.value = value;
    }
  };

  return (
    <div className="bg-gray-900 rounded-lg p-6">
      <h2 className="text-white mb-4">Drum Sequencer</h2>
      <div className="space-y-2">
        {DRUMS.map((drum, drumIndex) => (
          <div key={drum.name} className="flex items-center gap-2">
            <div className="w-16 text-white text-sm">{drum.name}</div>
            <input
              type="checkbox"
              checked={activeTracks[drumIndex]}
              onChange={() => {
                const newActive = [...activeTracks];
                newActive[drumIndex] = !newActive[drumIndex];
                setActiveTracks(newActive);
              }}
              className="w-4 h-4 accent-green-500 cursor-pointer"
              title="Toggle Instrument"
            />
            <div className="flex gap-1 overflow-x-auto pb-2 md:pb-0 min-w-0 flex-1 hide-scrollbar">
              <div className="flex gap-1 min-w-max">
                {pattern[drumIndex].map((active, stepIndex) => (
                  <button
                    key={stepIndex}
                    onClick={() => toggleStep(drumIndex, stepIndex)}
                    className={`
                      w-8 h-8 rounded transition-all shrink-0
                      ${active ? drum.color : 'bg-gray-700'}
                      ${currentStep === stepIndex ? 'ring-2 ring-white scale-110' : ''}
                      ${stepIndex % 4 === 0 ? 'ml-1' : ''}
                      hover:opacity-80
                    `}
                  />
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2 ml-2">
              <input
                type="range"
                min="-60"
                max="0"
                value={volumes[drumIndex]}
                onChange={(e) => handleVolumeChange(drumIndex, Number(e.target.value))}
                className="w-16 md:w-24 accent-gray-500"
                title="Volume"
              />
              <input
                type="number"
                min="-60"
                max="0"
                value={volumes[drumIndex]}
                onChange={(e) => handleVolumeChange(drumIndex, Math.min(0, Math.max(-60, Number(e.target.value))))}
                className="w-12 bg-gray-800 text-white px-1 py-0.5 rounded text-center text-xs"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}