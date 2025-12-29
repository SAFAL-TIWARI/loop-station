import { useState, useEffect, useCallback } from 'react';
import * as Tone from 'tone';
import { DrumSequencer, DRUMS, STEPS } from './components/DrumSequencer';
import { Synthesizer } from './components/Synthesizer';
import { TransportControls } from './components/TransportControls';
import { PresetControls, Preset } from './components/PresetControls';
import { Timeline } from './components/Timeline';
// SplineScene removed from here, now in DrumSequencer
import { SynthPattern, TrackEffects, EffectConfig } from './types';
import useUndoRedo from './hooks/useUndoRedo';

interface AppState {
  pattern: boolean[][];
  bpm: number;
  activePreset: string;
  drumTypes: string[];
  synthPattern: SynthPattern;
  trackEffects: TrackEffects;
}

export default function App() {
  const [isPlaying, setIsPlaying] = useState(false);

  // Initialize state from localStorage or defaults
  const getInitialState = (): AppState => {
    const saved = localStorage.getItem('loopStationState');
    const defaults: AppState = {
      pattern: Array(DRUMS.length).fill(null).map(() => Array(STEPS).fill(false)),
      bpm: 100,
      activePreset: '',
      drumTypes: Array(DRUMS.length).fill('Modern'),
      synthPattern: Array(STEPS).fill([]),
      trackEffects: {},
    };

    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Merge saved state with defaults to ensure all fields exist
        const state = { ...defaults, ...parsed };

        // Synth Pattern Migration
        if (state.synthPattern && Array.isArray(state.synthPattern)) {
          if (state.synthPattern.length > 0 && state.synthPattern.some((step: any) => Array.isArray(step) && step.length > 0 && typeof step[0] === 'string')) {
            state.synthPattern = state.synthPattern.map((step: string[]) =>
              step.map(note => ({
                id: crypto.randomUUID(),
                note,
                durationSteps: 2
              }))
            );
          }
        }
        return state;
      } catch (e) {
        console.error('Failed to load state', e);
      }
    }
    return defaults;
  };

  const [appState, setAppState, undo, redo] = useUndoRedo<AppState>(getInitialState());

  // Save state whenever it changes
  useEffect(() => {
    localStorage.setItem('loopStationState', JSON.stringify(appState));
  }, [appState]);

  const handleReset = () => {
    if (confirm('Reset all patterns and settings?')) {
      setAppState({
        pattern: Array(DRUMS.length).fill(null).map(() => Array(STEPS).fill(false)),
        synthPattern: Array(STEPS).fill([]),
        drumTypes: Array(DRUMS.length).fill('Modern'),
        trackEffects: {},
        bpm: 120,
        activePreset: ''
      });
    }
  };

  const handleLoadPreset = (preset: Preset) => {
    let newSynthPattern = Array(STEPS).fill([]);

    if (preset.synthPattern) {
      const rawPattern = preset.synthPattern as any;
      if (rawPattern.length > 0 && Array.isArray(rawPattern[0]) && rawPattern[0].length > 0 && typeof rawPattern[0][0] === 'string') {
        newSynthPattern = rawPattern.map((step: string[]) =>
          step.map(note => ({
            id: crypto.randomUUID(),
            note,
            durationSteps: 2
          }))
        );
      } else {
        newSynthPattern = rawPattern;
      }
    }

    setAppState(prev => ({
      ...prev,
      pattern: preset.pattern,
      bpm: preset.bpm,
      drumTypes: preset.drumTypes || Array(DRUMS.length).fill('Modern'),
      synthPattern: newSynthPattern
    }));
  };

  // State setters helpers to keep component signatures compatible-ish or just inline them
  const setPattern = (newPattern: boolean[][] | ((prev: boolean[][]) => boolean[][])) => {
    setAppState(prev => ({
      ...prev,
      pattern: typeof newPattern === 'function' ? newPattern(prev.pattern) : newPattern
    }));
  };

  const setBpm = (newBpm: number | ((prev: number) => number)) => {
    setAppState(prev => ({
      ...prev,
      bpm: typeof newBpm === 'function' ? newBpm(prev.bpm) : newBpm
    }));
  };

  const setActivePreset = (newPreset: string | ((prev: string) => string)) => {
    setAppState(prev => ({
      ...prev,
      activePreset: typeof newPreset === 'function' ? newPreset(prev.activePreset) : newPreset
    }));
  };

  const setDrumTypes = (newTypes: string[] | ((prev: string[]) => string[])) => {
    setAppState(prev => ({
      ...prev,
      drumTypes: typeof newTypes === 'function' ? newTypes(prev.drumTypes) : newTypes
    }));
  };

  const setSynthPattern = (newPattern: SynthPattern | ((prev: SynthPattern) => SynthPattern)) => {
    setAppState(prev => ({
      ...prev,
      synthPattern: typeof newPattern === 'function' ? newPattern(prev.synthPattern) : newPattern
    }));
  };

  const setTrackEffects = (newEffects: TrackEffects | ((prev: TrackEffects) => TrackEffects)) => {
    setAppState(prev => ({
      ...prev,
      trackEffects: typeof newEffects === 'function' ? newEffects(prev.trackEffects) : newEffects
    }));
  };

  const handleEffectChange = (trackName: string, effects: EffectConfig[]) => {
    setTrackEffects(prev => ({
      ...prev,
      [trackName]: effects
    }));
  };


  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in an input
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement).tagName)) return;

      const isCtrl = e.ctrlKey || e.metaKey;

      // Undo/Redo
      if (isCtrl && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        undo();
        return;
      }
      if (isCtrl && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        redo();
        return;
      }

      switch (e.key.toLowerCase()) {
        case 'p':
          // Toggle play/pause
          if (Tone.Transport.state === 'started') {
            Tone.Transport.pause();
            setIsPlaying(false);
          } else {
            Tone.start();
            Tone.Transport.start();
            setIsPlaying(true);
          }
          break;
        case 's':
          Tone.Transport.stop();
          setIsPlaying(false);
          break;
        case 'r':
          if (e.shiftKey) {
            handleReset();
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, undo, redo]);

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
          bpm={appState.bpm}
          onBpmChange={setBpm}
        />

        <PresetControls
          currentPattern={appState.pattern}
          currentBpm={appState.bpm}
          // @ts-ignore
          currentSynthPattern={appState.synthPattern}
          currentDrumTypes={appState.drumTypes}
          onLoadPreset={handleLoadPreset}
          selectedPreset={appState.activePreset}
          onSelectPreset={setActivePreset}
        />

        <DrumSequencer
          isPlaying={isPlaying}
          pattern={appState.pattern}
          onPatternChange={setPattern}
          drumTypes={appState.drumTypes}
          onDrumTypeChange={setDrumTypes}
          // @ts-ignore
          effects={appState.trackEffects}
        />

        <Synthesizer
          isPlaying={isPlaying}
          pattern={appState.synthPattern}
          onPatternChange={setSynthPattern}
          effects={appState.trackEffects['synth'] || []}
        />

        <Timeline
          isPlaying={isPlaying}
          bpm={appState.bpm}
          pattern={appState.pattern}
          synthPattern={appState.synthPattern}
          // @ts-ignore
          onPatternChange={setPattern}
          onSynthPatternChange={setSynthPattern}
          drumTypes={appState.drumTypes}
          trackEffects={appState.trackEffects}
          onTrackEffectsChange={handleEffectChange}
        />

        <div className="bg-gray-900 rounded-lg p-4">
          <p className="text-gray-400 text-sm text-center">
            Click on the drum grid to create patterns • Use the keyboard to play synth notes • Ctrl+Z to Undo, Ctrl+Y to Redo
          </p>
        </div>
      </div>
    </div>
  );
}
