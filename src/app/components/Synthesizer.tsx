import { useEffect, useState, useRef } from 'react';
import * as Tone from 'tone';
import { Music } from 'lucide-react';
import { InstrumentVisuals, VisualInstrumentType } from './InstrumentVisuals';
import { STEPS } from './DrumSequencer';
import { SynthPattern, SynthNote, EffectConfig } from '../types';

const NOTES = [
  { note: 'C4', label: 'C', white: true },
  { note: 'C#4', label: 'C#', white: false },
  { note: 'D4', label: 'D', white: true },
  { note: 'D#4', label: 'D#', white: false },
  { note: 'E4', label: 'E', white: true },
  { note: 'F4', label: 'F', white: true },
  { note: 'F#4', label: 'F#', white: false },
  { note: 'G4', label: 'G', white: true },
  { note: 'G#4', label: 'G#', white: false },
  { note: 'A4', label: 'A', white: true },
  { note: 'A#4', label: 'A#', white: false },
  { note: 'B4', label: 'B', white: true },
  { note: 'C5', label: 'C', white: true },
  { note: 'C#5', label: 'C#', white: false },
  { note: 'D5', label: 'D', white: true },
  { note: 'D#5', label: 'D#', white: false },
  { note: 'E5', label: 'E', white: true },
];

type InstrumentType = 'synth' | 'fm' | 'am' | 'duo' | 'membrane' | 'pluck' | 'metal';

interface Preset {
  id: string;
  name: string;
  engine: InstrumentType;
  visualType?: VisualInstrumentType;
  params?: any;
}

export const PRESETS: Preset[] = [
  {
    id: 'basic',
    name: 'Basic Sine',
    engine: 'synth',
    visualType: 'piano',
    params: {
      oscillator: { type: 'sine' },
      envelope: { attack: 0.005, decay: 0.1, sustain: 0.3, release: 1 }
    }
  },
  {
    id: 'intro-keys',
    name: 'Intro Keys',
    engine: 'synth',
    visualType: 'piano',
    params: {
      oscillator: { type: 'triangle' },
      envelope: { attack: 0.05, decay: 0.3, sustain: 0.4, release: 0.8 }
    }
  },
  {
    id: 'saw',
    name: 'Super Saw',
    engine: 'synth',
    visualType: 'piano',
    params: {
      oscillator: { type: 'fatsawtooth', count: 3, spread: 30 },
      envelope: { attack: 0.01, decay: 0.2, sustain: 0.5, release: 0.1 }
    }
  },
  {
    id: 'square',
    name: 'Retro Square',
    engine: 'synth',
    visualType: 'piano',
    params: {
      oscillator: { type: 'square' },
      envelope: { attack: 0.005, decay: 0.1, sustain: 0.3, release: 0.5 }
    }
  },
  {
    id: 'fm-keys',
    name: 'Electric Keys',
    engine: 'fm',
    visualType: 'piano',
    params: {
      harmonicity: 3,
      modulationIndex: 10,
      oscillator: { type: 'sine' },
      envelope: { attack: 0.01, decay: 0.2, sustain: 0.8, release: 1.5 },
      modulation: { type: "square" },
      modulationEnvelope: { attack: 0.5, decay: 0.1, sustain: 1, release: 0.5 }
    }
  },
  {
    id: 'harmonium',
    name: 'Harmonium',
    engine: 'am',
    visualType: 'harmonium',
    params: {
      harmonicity: 3,
      detune: 5,
      oscillator: { type: 'square' },
      envelope: { attack: 0.05, decay: 0.2, sustain: 1, release: 1 },
      modulation: { type: "sawtooth" },
      modulationEnvelope: { attack: 0.5, decay: 0, sustain: 1, release: 0.5 }
    }
  },
  {
    id: 'bell',
    name: 'Glass Bell',
    engine: 'fm',
    visualType: 'piano',
    params: {
      harmonicity: 1.1,
      modulationIndex: 10,
      oscillator: { type: 'sine' },
      envelope: { attack: 0.01, decay: 1.0, sustain: 0, release: 2 },
      modulation: { type: 'sine' }
    }
  },
  {
    id: 'bass',
    name: 'Thick Bass',
    engine: 'duo',
    visualType: 'piano',
    params: {
      vibratoAmount: 0.5,
      vibratoRate: 5,
      harmonicity: 1.5,
      voice0: { volume: -10, portamento: 0, oscillator: { type: 'sawtooth' }, filterEnvelope: { attack: 0.01, decay: 0, sustain: 1, release: 0.5 } },
      voice1: { volume: -10, portamento: 0, oscillator: { type: 'sine' }, filterEnvelope: { attack: 0.01, decay: 0, sustain: 1, release: 0.5 } }
    }
  },
  {
    id: 'guitar',
    name: 'Plucky Guitar',
    engine: 'fm',
    visualType: 'guitar',
    params: {
      harmonicity: 0.5,
      modulationIndex: 5,
      oscillator: { type: 'sawtooth' },
      envelope: { attack: 0.01, decay: 0.3, sustain: 0.1, release: 0.8 },
      modulation: { type: 'square' },
      modulationEnvelope: { attack: 0.01, decay: 0.5, sustain: 0.2, release: 0.5 }
    }
  },
  {
    id: 'tabla',
    name: 'Tabla',
    engine: 'membrane',
    visualType: 'tabla',
    params: {
      pitchDecay: 0.02,
      octaves: 4,
      oscillator: { type: "sine" },
      envelope: { attack: 0.001, decay: 0.2, sustain: 0, release: 0.5 }
    }
  },
  {
    id: 'dholak',
    name: 'Dholak',
    engine: 'membrane',
    visualType: 'dholak',
    params: {
      pitchDecay: 0.05,
      octaves: 2,
      oscillator: { type: "sine" },
      envelope: { attack: 0.001, decay: 0.4, sustain: 0, release: 0.4 }
    }
  },
  {
    id: 'flute',
    name: 'Bamboo Flute',
    engine: 'synth',
    visualType: 'flute',
    params: {
      oscillator: { type: 'triangle' },
      envelope: { attack: 0.1, decay: 0.1, sustain: 0.8, release: 0.5 }
    }
  },
  {
    id: 'metal',
    name: 'Metallic Shot',
    engine: 'metal',
    visualType: 'piano',
    params: {
      harmonicity: 5.1,
      resonance: 400,
      modulationIndex: 10,
      envelope: { decay: 0.4, release: 0.1 },
      octaves: 1.5
    }
  },
  {
    id: 'kalimba',
    name: 'Kalimba',
    engine: 'fm',
    visualType: 'piano',
    params: {
      harmonicity: 8,
      modulationIndex: 2,
      oscillator: { type: 'sine' },
      envelope: { attack: 0.001, decay: 2.0, sustain: 0.1, release: 2 },
      modulation: { type: "square" },
      modulationEnvelope: { attack: 0.002, decay: 0.2, sustain: 0, release: 0.2 }
    }
  },
];

interface SynthesizerProps {
  isPlaying?: boolean;
  pattern?: SynthPattern;
  onPatternChange?: (pattern: SynthPattern) => void;
  effects?: EffectConfig[];
}

export function Synthesizer({ isPlaying = false, pattern = [], onPatternChange, effects = [] }: SynthesizerProps) {
  // Registry of initialized synths: instrumentId -> PolySynth
  const synthsRef = useRef<Map<string, Tone.PolySynth>>(new Map());
  const [activeNotes, setActiveNotes] = useState<Set<string>>(new Set());
  const [currentStep, setCurrentStep] = useState(-1);
  const [selectedPresetId, setSelectedPresetId] = useState<string>('basic');
  const effectChainRef = useRef<Tone.ToneAudioNode[]>([]);
  const synthOutputRef = useRef<Tone.Gain | null>(null);

  const currentPreset = PRESETS.find(p => p.id === selectedPresetId) || PRESETS[0];

  // Initialize generic output gain
  useEffect(() => {
    const outputGain = new Tone.Gain(1).toDestination();
    synthOutputRef.current = outputGain;
    return () => {
      outputGain.dispose();
    };
  }, []);

  // Helper to get or create a synth for a specific preset
  const getOrInitSynth = (presetId: string): Tone.PolySynth | null => {
    if (!synthOutputRef.current) return null;

    // If already exists, return it
    if (synthsRef.current.has(presetId)) {
      return synthsRef.current.get(presetId)!;
    }

    const preset = PRESETS.find(p => p.id === presetId);
    if (!preset) return null;

    try {
      let polySynth: Tone.PolySynth;
      switch (preset.engine) {
        case 'fm':
          polySynth = new Tone.PolySynth(Tone.FMSynth, preset.params);
          break;
        case 'am':
          polySynth = new Tone.PolySynth(Tone.AMSynth, preset.params);
          break;
        case 'duo':
          polySynth = new Tone.PolySynth(Tone.DuoSynth, preset.params);
          break;
        case 'membrane':
          polySynth = new Tone.PolySynth(Tone.MembraneSynth, preset.params);
          break;
        case 'pluck':
          // @ts-ignore
          polySynth = new Tone.PolySynth(Tone.PluckSynth, preset.params);
          break;
        case 'metal':
          // @ts-ignore
          polySynth = new Tone.PolySynth(Tone.MetalSynth, preset.params);
          break;
        case 'synth':
        default:
          polySynth = new Tone.PolySynth(Tone.Synth, preset.params);
          break;
      }

      polySynth.volume.value = -8;
      // Connect to the main output gain (which goes to effects -> master)
      polySynth.connect(synthOutputRef.current);

      synthsRef.current.set(presetId, polySynth);
      return polySynth;
    } catch (e) {
      console.error(`Failed to init synth for ${presetId}`, e);
      return null;
    }
  };

  // Ensure the CURRENTLY selected synth is initialized so we can play it
  useEffect(() => {
    getOrInitSynth(selectedPresetId);
  }, [selectedPresetId]);

  // Handle Effects (Global for now, applied to the main output gain)
  useEffect(() => {
    if (!synthOutputRef.current) return;

    // Clean up previous effects
    effectChainRef.current.forEach(node => {
      if (!node.disposed) {
        node.disconnect();
        node.dispose();
      }
    });
    effectChainRef.current = [];

    // Disconnect output from destination to insert effects
    try {
      synthOutputRef.current.disconnect();
    } catch (e) { }

    const newChain: Tone.ToneAudioNode[] = [];

    effects.forEach(effect => {
      if (!effect.enabled) return;

      let audioNode: Tone.ToneAudioNode | null = null;
      try {
        switch (effect.type) {
          case 'Reverb':
            audioNode = new Tone.Reverb({ decay: 2.5, preDelay: 0, wet: 0.4 });
            break;
          case 'Delay':
            audioNode = new Tone.FeedbackDelay("8n", 0.4);
            break;
          case 'Distortion':
            audioNode = new Tone.Distortion(0.8);
            break;
          case 'BitCrusher':
            audioNode = new Tone.BitCrusher(4);
            break;
          case 'Chorus':
            audioNode = new Tone.Chorus(4, 2.5, 0.5);
            (audioNode as Tone.Chorus).start();
            break;
          case 'Echo':
            audioNode = new Tone.PingPongDelay("8n", 0.2);
            break;
          case 'Flanger':
            audioNode = new Tone.Phaser({ frequency: 15, octaves: 5, baseFrequency: 1000 });
            break;
          case 'Limiter':
            audioNode = new Tone.Limiter(-10);
            break;
          case 'Pitch':
            audioNode = new Tone.PitchShift(7);
            break;
          case 'Soft Clipper':
            audioNode = new Tone.Chebyshev(2);
            break;
          case 'Stereo Width':
            audioNode = new Tone.StereoWidener(0.8);
            break;
          case 'Compressor':
            audioNode = new Tone.Compressor(-30, 3);
            break;
          case 'EQ':
            audioNode = new Tone.EQ3(0, -6, 0);
            break;
        }

        if (audioNode) {
          newChain.push(audioNode);
        }
      } catch (e) {
        console.error("Error creating effect", effect, e);
      }
    });

    // Chain them: Output -> Eff1 -> Eff2 -> Dest
    if (newChain.length > 0) {
      synthOutputRef.current.connect(newChain[0]);
      for (let i = 0; i < newChain.length - 1; i++) {
        newChain[i].connect(newChain[i + 1]);
      }
      newChain[newChain.length - 1].toDestination();
    } else {
      synthOutputRef.current.toDestination();
    }

    effectChainRef.current = newChain;

  }, [effects]);

  // Sequencer Logic
  useEffect(() => {
    if (!isPlaying || pattern.length === 0) {
      setCurrentStep(-1);
      return;
    }

    const safePattern = pattern.length === STEPS ? pattern : Array(STEPS).fill([]);

    const sequence = new Tone.Sequence(
      (time, step) => {
        Tone.Draw.schedule(() => {
          setCurrentStep(step);
        }, time);

        const notesObj = safePattern[step];
        if (notesObj && notesObj.length > 0) {
          notesObj.forEach(n => {
            // Determine which instrument to play
            // Default to 'basic' if undefined (legacy notes)
            const instrumentId = (typeof n !== 'string' && n.instrumentId) ? n.instrumentId : 'basic';

            // Ensure synth is ready
            const synthToPlay = getOrInitSynth(instrumentId);

            if (synthToPlay) {
              if (typeof n === 'string') {
                synthToPlay.triggerAttackRelease(n, '8n', time);
              } else {
                const durationTime = Tone.Time("16n").toSeconds() * n.durationSteps;
                synthToPlay.triggerAttackRelease(n.note, durationTime, time);
              }
            }
          });
        }
      },
      [...Array(STEPS)].map((_, i) => i),
      '16n'
    );

    sequence.start(0);

    return () => {
      sequence.dispose();
    };
  }, [isPlaying, pattern]);

  const playNote = (note: string) => {
    // Always play on the currently selected preset
    const synth = getOrInitSynth(selectedPresetId);
    if (synth) {
      synth.triggerAttack(note);
      setActiveNotes(prev => new Set(prev).add(note));

      // Recording Logic
      if (isPlaying && onPatternChange && pattern.length > 0) {
        const position = Tone.Transport.position.toString().split(':');
        if (position.length >= 3) {
          const beat = parseInt(position[1]);
          const sixteenth = Math.round(parseFloat(position[2]));
          let stepIndex = (beat * 4) + sixteenth;
          stepIndex = stepIndex % STEPS;

          if (stepIndex >= 0 && stepIndex < STEPS) {
            const newPattern = [...pattern];
            if (!newPattern[stepIndex]) newPattern[stepIndex] = [];

            // Check existence logic ... simplified for new object structure
            // We allow same note if different instrument? For now, avoid dupes on same step/note roughly
            const exists = newPattern[stepIndex].some(n => {
              if (typeof n === 'string') return n === note;
              return n.note === note && n.instrumentId === selectedPresetId;
            });

            if (!exists) {
              const newNote: SynthNote = {
                id: crypto.randomUUID(),
                note,
                durationSteps: 2,
                velocity: 1,
                instrumentId: selectedPresetId // Record with CURRENT instrument
              };
              newPattern[stepIndex] = [...newPattern[stepIndex], newNote];
              onPatternChange(newPattern);
            }
          }
        }
      }
    }
  };

  const stopNote = (note: string) => {
    // Release on the currently selected synth (assuming user lifts finger from the same instrument they pressed)
    const synth = getOrInitSynth(selectedPresetId);
    if (synth) {
      synth.triggerRelease(note);
      setActiveNotes(prev => {
        const newSet = new Set(prev);
        newSet.delete(note);
        return newSet;
      });
    }
  };

  const clearPattern = () => {
    if (onPatternChange) {
      onPatternChange(Array(STEPS).fill([]).map(() => []));
    }
  };

  // Categorize Presets
  const synthPresets = PRESETS.filter(p => !['guitar', 'tabla', 'dholak', 'flute', 'harmonium'].includes(p.visualType || ''));
  const instrumentPresets = PRESETS.filter(p => ['guitar', 'tabla', 'dholak', 'flute', 'harmonium'].includes(p.visualType || ''));

  return (
    <div className="bg-gray-900 rounded-lg p-6 border-t border-gray-800">
      <div className="flex flex-col md:flex-row items-center justify-between mb-6 gap-4">
        <div className="flex items-center gap-2">
          <h2 className="text-white text-lg font-semibold flex items-center gap-2">
            <Music size={20} /> Synthesizer
          </h2>
          {isPlaying && (
            <span className="text-xs px-2 py-0.5 rounded bg-red-900 text-red-100 animate-pulse flex items-center gap-1">
              <div className="w-2 h-2 bg-red-500 rounded-full" />
              REC
            </span>
          )}
        </div>

        <div className="flex flex-wrap gap-4 items-center justify-center md:justify-end">

          <div className="flex items-center gap-2">

            <select
              value={selectedPresetId}
              onChange={(e) => setSelectedPresetId(e.target.value)}
              className="bg-gray-800 text-white text-xs rounded px-2 py-1 outline-none focus:ring-1 focus:ring-blue-500 border border-gray-700"
            >
              <optgroup label="Real Instruments">
                {instrumentPresets.map(preset => (
                  <option key={preset.id} value={preset.id}>
                    {preset.name}
                  </option>
                ))}
              </optgroup>
              <optgroup label="Synthesizers">
                {synthPresets.map(preset => (
                  <option key={preset.id} value={preset.id}>
                    {preset.name}
                  </option>
                ))}
              </optgroup>
            </select>
          </div>

          <button
            onClick={clearPattern}
            className="text-xs text-red-400 hover:text-red-300 ml-2 px-2 py-1 hover:bg-red-900/20 rounded"
          >
            Clear
          </button>
        </div>
      </div>

      <InstrumentVisuals
        instrument={currentPreset.visualType || 'piano'}
        onPlay={playNote}
        onStop={stopNote}
        activeNotes={activeNotes}
      />

      <div className="mt-4 flex gap-1 h-3 w-full bg-gray-800 rounded overflow-hidden p-0.5">
        {pattern.map((notes, i) => (
          <div
            key={i}
            className={`flex-1 rounded-sm transition-colors ${i === currentStep ? 'bg-white' : (notes && notes.length > 0 ? 'bg-blue-500' : 'bg-gray-700/50')}`}
          />
        ))}
      </div>
    </div>
  );
}
