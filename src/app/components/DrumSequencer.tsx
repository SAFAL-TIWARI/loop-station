import { useEffect, useState, useRef } from 'react';
import * as Tone from 'tone';
import { Volume2, ChevronLeft, ChevronRight } from 'lucide-react';
import { TrackEffects, EffectConfig } from '../types';
import { SplineScene } from './SplineScene';

interface DrumSequencerProps {
  isPlaying: boolean;
  pattern: boolean[][];
  onPatternChange: (pattern: boolean[][]) => void;
  drumTypes: string[];
  onDrumTypeChange: (types: string[]) => void;
  effects?: TrackEffects;
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

export const DRUM_VARIANTS = {
  Kick: ['Modern', '808', 'Acoustic', 'Distorted'],
  Snare: ['Modern', '808', 'Trap', 'Rim'],
  'Hi-Hat': ['Closed', 'Open', 'Trap', 'Shaker'],
  Clap: ['Modern', '808', 'Snap', 'Digital'],
  Tom: ['Modern', '808', 'Electronic', 'Floor'],
  Rim: ['Wood', 'Metal', 'Click', 'Ping'],
  Crash: ['Modern', '808', 'Ride', 'Splash'],
  Ride: ['Bell', 'Ping', 'Clean', 'Dark'],
  Cowbell: ['808', 'Real', 'Digital', 'Clank'],
  Shaker: ['Modern', 'Maraca', 'Egg', 'Noise'],
};

export const STEPS = 16;

export function DrumSequencer({ isPlaying, pattern, onPatternChange, drumTypes, onDrumTypeChange, effects = {} }: DrumSequencerProps) {
  const [currentStep, setCurrentStep] = useState(-1);
  const [synths, setSynths] = useState<any[] | null>(null);
  const [activeView, setActiveView] = useState<'sequencer' | 'spline'>('sequencer');
  const synthOutputsRef = useRef<(Tone.Gain | null)[]>([]); // Output nodes for each synth
  const effectChainsRef = useRef<(Tone.ToneAudioNode[])[]>([]); // Effect chains for each track (array of arrays)

  const [activeTracks, setActiveTracks] = useState<boolean[]>(
    Array(DRUMS.length).fill(true)
  );
  const [volumes, setVolumes] = useState<number[]>(
    Array(DRUMS.length).fill(0)
  );

  // cleanup helper
  const cleanupEffects = (index: number) => {
    if (effectChainsRef.current[index]) {
      effectChainsRef.current[index].forEach(node => {
        if (!node.disposed) {
          node.disconnect();
          node.dispose();
        }
      });
      effectChainsRef.current[index] = [];
    }
  };

  useEffect(() => {
    // Initialize drum synths based on types
    const createSynth = (drumIndex: number, type: string) => {
      const drumName = DRUMS[drumIndex].name;
      const outputGain = new Tone.Gain(1);

      // Store output gain
      if (!synthOutputsRef.current[drumIndex]) {
        synthOutputsRef.current[drumIndex] = outputGain;
      } else {
        // If recreating, reuse the existing gain node if possible or dispose old?
        // Actually, creating new synth means connecting to output.
        // Let's dispose old output if we are fully re-initializing? 
        // But this runs on drumTypes change.
        // Better to keep outputGain stable if possible, but simpler to recreate.
        synthOutputsRef.current[drumIndex]?.dispose();
        synthOutputsRef.current[drumIndex] = outputGain;
      }

      let instr: any;

      switch (drumName) {
        case 'Kick':
          if (type === '808') instr = new Tone.MembraneSynth({ pitchDecay: 0.05, octaves: 4, oscillator: { type: "sine" }, envelope: { attack: 0.001, decay: 0.4, sustain: 0.01, release: 1.4 } });
          else if (type === 'Acoustic') instr = new Tone.MembraneSynth({ pitchDecay: 0.05, octaves: 2, oscillator: { type: "sine" } });
          else if (type === 'Distorted') instr = new Tone.MembraneSynth({ pitchDecay: 0.08, octaves: 2.5 });
          else instr = new Tone.MembraneSynth({ octaves: 2, pitchDecay: 0.05 });
          break;

        case 'Snare':
          if (type === '808') instr = new Tone.NoiseSynth({ noise: { type: 'white' }, envelope: { decay: 0.2 } });
          else if (type === 'Trap') instr = new Tone.NoiseSynth({ noise: { type: 'pink' }, envelope: { decay: 0.15 } });
          else if (type === 'Rim') instr = new Tone.MetalSynth({ frequency: 200, envelope: { decay: 0.05 } });
          else instr = new Tone.MembraneSynth({ pitchDecay: 0.05, octaves: 2 });
          break;

        case 'Hi-Hat':
          if (type === 'Trap') instr = new Tone.MetalSynth({ frequency: 400, envelope: { decay: 0.05 }, harmonicity: 5.1, modulationIndex: 32 });
          else instr = new Tone.MetalSynth({ frequency: 200, envelope: { decay: 0.1 } });
          break;

        case 'Clap':
          instr = new Tone.NoiseSynth({ noise: { type: 'white' }, envelope: { decay: 0.1 } });
          break;

        case 'Tom':
          if (type === '808') instr = new Tone.MembraneSynth({ pitchDecay: 0.1, octaves: 2 });
          else instr = new Tone.MembraneSynth({ octaves: 4, pitchDecay: 0.08 });
          break;

        default:
          if (drumName === 'Rim') instr = new Tone.MetalSynth({ frequency: 400, envelope: { decay: 0.05 } });
          else if (drumName === 'Crash') instr = new Tone.MetalSynth({ frequency: 150, envelope: { decay: 2, release: 3 } });
          else if (drumName === 'Ride') instr = new Tone.MetalSynth({ frequency: 800, envelope: { decay: 0.5 } });
          else if (drumName === 'Cowbell') instr = new Tone.MetalSynth({ frequency: 540, envelope: { decay: 0.2 } });
          else if (drumName === 'Shaker') instr = new Tone.NoiseSynth({ noise: { type: 'white' }, envelope: { attack: 0.005, decay: 0.05 } });
          else instr = new Tone.MembraneSynth();
          break;
      }

      instr.connect(outputGain);
      // Default connect output to destination (will be handled by effect chain logic generally, but init here)
      outputGain.toDestination();

      return instr;
    };

    const drumSynths = DRUMS.map((_, i) => createSynth(i, drumTypes[i]));

    setSynths(drumSynths);

    return () => {
      drumSynths.forEach(synth => synth.dispose());
      synthOutputsRef.current.forEach(g => g?.dispose());
    };
  }, [drumTypes]);

  // Apply Effects
  useEffect(() => {
    if (!synths) return;

    DRUMS.forEach((_, index) => {
      const trackEffectsList = effects[`drum-${index}`] || [];
      const outputGain = synthOutputsRef.current[index];

      if (!outputGain) return;

      // Cleanup old chain
      cleanupEffects(index);

      // Disconnect from destination to insert effects
      try { outputGain.disconnect(); } catch (e) { }

      const newChain: Tone.ToneAudioNode[] = [];

      trackEffectsList.forEach(effect => {
        if (!effect.enabled) return;
        try {
          let node: Tone.ToneAudioNode | null = null;
          switch (effect.type) {
            case 'Reverb': node = new Tone.Reverb({ decay: 1.5, wet: 0.3 }); break;
            case 'Delay': node = new Tone.FeedbackDelay("8n", 0.3); break;
            case 'Distortion': node = new Tone.Distortion(0.4); break;
            case 'BitCrusher': node = new Tone.BitCrusher(4); break;
            case 'Chorus': node = new Tone.Chorus(4, 2.5, 0.5).start(); break;
            case 'Echo': node = new Tone.PingPongDelay("8n", 0.2); break;
            case 'Flanger': node = new Tone.Phaser({ frequency: 15, octaves: 5, baseFrequency: 1000 }); break;
            case 'Limiter': node = new Tone.Limiter(-10); break;
            case 'Pitch': node = new Tone.PitchShift(7); break;
            case 'Soft Clipper': node = new Tone.Chebyshev(2); break;
            case 'Stereo Width': node = new Tone.StereoWidener(0.8); break;
            case 'Compressor': node = new Tone.Compressor(-30, 3); break;
            case 'EQ': node = new Tone.EQ3(0, -6, 0); break;
          }
          if (node) newChain.push(node);
        } catch (e) { console.error(e); }
      });

      // Connect Chain
      if (newChain.length > 0) {
        outputGain.connect(newChain[0]);
        for (let i = 0; i < newChain.length - 1; i++) {
          newChain[i].connect(newChain[i + 1]);
        }
        newChain[newChain.length - 1].toDestination();
      } else {
        outputGain.toDestination();
      }

      effectChainsRef.current[index] = newChain;
    });

  }, [effects, synths]);


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
            const synth = synths[drumIndex];

            // Trigger logic based on drum index (can be refined to be based on synth type)
            if (drumIndex === 0) {
              // Kick
              (synth as Tone.MembraneSynth).triggerAttackRelease('C1', '8n', time);
            } else if (drumIndex === 1) {
              // Snare
              if (synth instanceof Tone.NoiseSynth) {
                synth.triggerAttackRelease('8n', time);
              } else {
                (synth as Tone.MembraneSynth).triggerAttackRelease('C2', '8n', time);
              }
            } else if (drumIndex === 4) {
              // Tom
              (synth as Tone.MembraneSynth).triggerAttackRelease('C3', '8n', time);
            } else if (drumIndex === 5 || drumIndex === 6 || drumIndex === 7 || drumIndex === 8) {
              // Metals
              // @ts-ignore
              synth.triggerAttackRelease('16n', time);
            } else {
              // Noise/Others
              // @ts-ignore
              synth.triggerAttackRelease('16n', time);
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

  // No need for global scroll lock or container ref here as iframe handles its own events now.

  return (
    <div className="bg-gray-900 rounded-lg p-6">
      <div className="flex items-center gap-4 mb-4">
        <h2 className="text-white">Drum Sequencer</h2>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setActiveView(prev => prev === 'sequencer' ? 'spline' : 'sequencer')}
            className="p-1 hover:bg-gray-800 rounded-full text-gray-400 hover:text-white transition-colors"
            title={activeView === 'sequencer' ? "Switch to 3D View" : "Switch to Sequencer"}
          >
            <ChevronLeft size={20} />
          </button>
          <button
            onClick={() => setActiveView(prev => prev === 'sequencer' ? 'spline' : 'sequencer')}
            className="p-1 hover:bg-gray-800 rounded-full text-gray-400 hover:text-white transition-colors"
            title={activeView === 'sequencer' ? "Switch to 3D View" : "Switch to Sequencer"}
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      <div className={activeView === 'sequencer' ? '' : 'hidden'}>
        <div className="space-y-2">
          {DRUMS.map((drum, drumIndex) => (
            <div key={drum.name} className="flex items-center gap-2">
              <div className="flex flex-col w-20">
                <div className="text-white text-sm font-bold">{drum.name}</div>
                <select
                  value={drumTypes[drumIndex] || 'Modern'}
                  onChange={(e) => {
                    const newTypes = [...drumTypes];
                    newTypes[drumIndex] = e.target.value;
                    onDrumTypeChange(newTypes);
                  }}
                  className="text-[10px] bg-gray-800 text-gray-300 rounded border-none outline-none p-0.5 mt-0.5 cursor-pointer max-w-full"
                >
                  {(DRUM_VARIANTS[drum.name as keyof typeof DRUM_VARIANTS] || ['Modern']).map(v => (
                    <option key={v} value={v}>{v}</option>
                  ))}
                </select>
              </div>
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

      <div
        className="w-full h-[600px] border border-gray-800 rounded-lg overflow-hidden relative"
        style={{
          visibility: activeView === 'spline' ? 'visible' : 'hidden',
          display: activeView === 'spline' ? 'block' : 'block', // Always block
          position: activeView === 'spline' ? 'relative' : 'absolute',
          left: activeView === 'spline' ? 'auto' : '-9999px',
          height: activeView === 'spline' ? '600px' : '0px' // Collapse height when hidden offscreen
        }}
      >
        <SplineScene
          pattern={pattern}
          onPatternChange={onPatternChange}
          currentStep={currentStep}
          isPlaying={isPlaying}
          isInteractable={activeView === 'spline'}
        />
      </div>
    </div>
  );
}