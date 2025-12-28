import { useEffect, useState } from 'react';
import * as Tone from 'tone';

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
];

export function Synthesizer() {
  const [synth, setSynth] = useState<Tone.PolySynth | null>(null);
  const [activeNotes, setActiveNotes] = useState<Set<string>>(new Set());
  const [waveform, setWaveform] = useState<'sine' | 'square' | 'sawtooth' | 'triangle'>('sine');

  useEffect(() => {
    const polySynth = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: waveform },
      envelope: {
        attack: 0.005,
        decay: 0.1,
        sustain: 0.3,
        release: 1,
      },
    }).toDestination();

    setSynth(polySynth);

    return () => {
      polySynth.dispose();
    };
  }, [waveform]);

  const playNote = (note: string) => {
    if (synth) {
      synth.triggerAttack(note);
      setActiveNotes(prev => new Set(prev).add(note));
    }
  };

  const stopNote = (note: string) => {
    if (synth) {
      synth.triggerRelease(note);
      setActiveNotes(prev => {
        const newSet = new Set(prev);
        newSet.delete(note);
        return newSet;
      });
    }
  };

  return (
    <div className="bg-gray-900 rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-white">Synthesizer</h2>
        <div className="flex gap-2">
          {(['sine', 'square', 'sawtooth', 'triangle'] as const).map(type => (
            <button
              key={type}
              onClick={() => setWaveform(type)}
              className={`
                px-3 py-1 rounded text-sm capitalize
                ${waveform === type ? 'bg-blue-500 text-white' : 'bg-gray-700 text-gray-300'}
                hover:opacity-80
              `}
            >
              {type}
            </button>
          ))}
        </div>
      </div>
      
      <div className="relative h-48 bg-gray-800 rounded-lg p-4">
        <div className="flex justify-center items-end h-full gap-0.5">
          {NOTES.map((noteObj, index) => (
            <button
              key={index}
              onMouseDown={() => playNote(noteObj.note)}
              onMouseUp={() => stopNote(noteObj.note)}
              onMouseLeave={() => stopNote(noteObj.note)}
              onTouchStart={(e) => {
                e.preventDefault();
                playNote(noteObj.note);
              }}
              onTouchEnd={(e) => {
                e.preventDefault();
                stopNote(noteObj.note);
              }}
              className={`
                relative transition-all
                ${noteObj.white 
                  ? 'w-12 h-full bg-white hover:bg-gray-200 border border-gray-400 rounded-b z-0' 
                  : 'w-8 h-32 bg-gray-900 hover:bg-gray-700 border border-gray-600 rounded-b -ml-4 z-10'
                }
                ${activeNotes.has(noteObj.note) 
                  ? noteObj.white ? 'bg-blue-300' : 'bg-blue-600'
                  : ''
                }
              `}
            >
              <span className={`
                absolute bottom-2 left-1/2 -translate-x-1/2 text-xs
                ${noteObj.white ? 'text-gray-600' : 'text-gray-300'}
              `}>
                {noteObj.label}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
