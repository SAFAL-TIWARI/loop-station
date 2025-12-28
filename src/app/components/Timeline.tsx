import { useState, useRef, useEffect } from 'react';
import * as Tone from 'tone';
import {
    Play, Pause, Square, Scissors, Trash2, MousePointer2,
    Move, Plus, Minus, Settings, Music, Activity,
    ChevronRight, ChevronDown, Wand2, GripVertical,
    Mic2, Sliders, Waves, Zap, Speaker, XCircle
} from 'lucide-react';
import { DRUMS } from './DrumSequencer';
import { SynthPattern, SynthNote, TrackEffects, EffectConfig, EffectType } from '../types';

interface TimelineProps {
    isPlaying: boolean;
    bpm: number;
    pattern: boolean[][];
    synthPattern: SynthPattern;
    onPatternChange: (pattern: boolean[][]) => void;
    onSynthPatternChange: (pattern: SynthPattern) => void;
    drumTypes: string[];
    trackEffects: TrackEffects;
    onTrackEffectsChange: (trackName: string, effects: EffectConfig[]) => void;
}

type Tool = 'select' | 'trim';

const EFFECTS: { type: EffectType; icon: any; color: string }[] = [
    { type: 'Chorus', icon: Music, color: 'text-green-400' },
    { type: 'Compressor', icon: Sliders, color: 'text-indigo-400' },
    { type: 'Delay', icon: Activity, color: 'text-blue-400' },
    { type: 'Distortion', icon: Zap, color: 'text-red-400' },
    { type: 'Echo', icon: Waves, color: 'text-cyan-400' },
    { type: 'Flanger', icon: Waves, color: 'text-teal-400' },
    { type: 'Limiter', icon: Activity, color: 'text-yellow-400' },
    { type: 'Pitch', icon: Sliders, color: 'text-pink-400' },
    { type: 'Reverb', icon: Wand2, color: 'text-purple-400' },
    { type: 'Soft Clipper', icon: Zap, color: 'text-orange-400' },
    { type: 'Stereo Width', icon: Speaker, color: 'text-blue-300' },
    { type: 'BitCrusher', icon: Settings, color: 'text-gray-400' },
    { type: 'EQ', icon: Sliders, color: 'text-emerald-400' },
];

export function Timeline({
    isPlaying,
    bpm,
    pattern,
    synthPattern,
    onPatternChange,
    onSynthPatternChange,
    drumTypes,
    trackEffects,
    onTrackEffectsChange
}: TimelineProps) {
    const [zoom, setZoom] = useState(1);
    const [selectedTool, setSelectedTool] = useState<Tool>('select');
    const [trackHeight, setTrackHeight] = useState(64);
    const [currentTime, setCurrentTime] = useState(0);
    const [isScrubbing, setIsScrubbing] = useState(false);
    const [showEffects, setShowEffects] = useState(false);

    // Selection & Editing State
    const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
    const [dragState, setDragState] = useState<{
        type: 'move' | 'resize' | 'create';
        noteId?: string;
        startStep?: number;
        originalStep?: number;
        originalDuration?: number;
        startX?: number;
        currentStep?: number; // For visualization during drag
        newDuration?: number; // For visualization during resize
        isDuplicate?: boolean;
    } | null>(null);

    const containerRef = useRef<HTMLDivElement>(null);
    const rulerRef = useRef<HTMLDivElement>(null);
    const animationRef = useRef<number>();

    // Constants
    const BASE_STEP_WIDTH = 60;
    const STEP_WIDTH = BASE_STEP_WIDTH * zoom;
    const TOTAL_STEPS = 16;
    const TOTAL_WIDTH = TOTAL_STEPS * STEP_WIDTH;

    // Sync Playhead
    useEffect(() => {
        const loop = () => {
            const position = Tone.Transport.position as string;
            let currentStep = 0;
            if (typeof position === 'string' && position.includes(':')) {
                currentStep = position.split(':').reduce((acc, val, i) => {
                    if (i === 0) return acc + parseInt(val) * 16;
                    if (i === 1) return acc + parseInt(val) * 4;
                    return acc + parseFloat(val);
                }, 0);
            } else if (typeof position === 'number') {
                currentStep = (position * (bpm / 60) * 4);
            }

            const wrappedStep = currentStep % TOTAL_STEPS;
            setCurrentTime(wrappedStep);

            animationRef.current = requestAnimationFrame(loop);
        };

        if (isPlaying && !isScrubbing) {
            loop();
        }

        return () => {
            if (animationRef.current) cancelAnimationFrame(animationRef.current);
        };
    }, [isPlaying, bpm, isScrubbing]);

    // Waveform Generator (Visual only)
    const generateWaveformPath = (width: number, height: number, type: 'kick' | 'snare' | 'noise' | 'synth', seed: number) => {
        let path = `M 0 ${height / 2} `;
        const points = Math.max(10, width / 2); // Limit resolution needed

        for (let i = 0; i <= points; i++) {
            const x = (i / points) * width;
            let amplitude = 0;
            const t = i / points;

            if (type === 'kick') {
                const env = Math.pow(1 - t, 4);
                amplitude = Math.sin(t * 50) * env * (height / 2);
            } else if (type === 'snare') {
                const env = Math.pow(1 - t, 6);
                amplitude = (Math.random() - 0.5) * 2 * env * (height * 0.8);
            } else if (type === 'noise') {
                amplitude = (Math.random() - 0.5) * (height * 0.6);
            } else {
                amplitude = Math.sin(t * 30 + seed) * (height / 3) + Math.sin(t * 10) * (height / 6);
            }
            path += `L ${x} ${(height / 2) + amplitude} `;
        }
        return path;
    };

    // Scrubbing Logic
    const handleScrub = (e: React.MouseEvent | React.TouchEvent) => {
        if (!rulerRef.current) return;
        const rect = rulerRef.current.getBoundingClientRect();
        const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
        const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
        const step = (x / TOTAL_WIDTH) * TOTAL_STEPS;

        setCurrentTime(step);
        setIsScrubbing(true);

        const totalQuarterNotes = step / 4;
        const bars = Math.floor(totalQuarterNotes / 4);
        const quarters = Math.floor(totalQuarterNotes % 4);
        const sixteens = step % 4;
        Tone.Transport.position = `${bars}:${quarters}:${sixteens.toFixed(2)}`;
    };

    const handleScrubEnd = () => {
        setIsScrubbing(false);
    };

    // --- Drag & Drop Effects Logic --- //
    const handleDragStartEffect = (e: React.DragEvent, effect: EffectType) => {
        e.dataTransfer.setData('effect', effect);
    };

    const handleDropEffect = (e: React.DragEvent, trackId: string) => {
        e.preventDefault();
        const effectType = e.dataTransfer.getData('effect') as EffectType;
        if (effectType) {
            const currentEffects = trackEffects[trackId] || [];

            // Check if effect already exists
            if (currentEffects.some(e => e.type === effectType)) {
                alert(`${effectType} is already added to this track.`);
                return;
            }

            const newEffect: EffectConfig = {
                id: crypto.randomUUID(),
                type: effectType,
                params: {},
                enabled: true
            };
            onTrackEffectsChange(trackId, [...currentEffects, newEffect]);
        }
    };

    const handleRemoveEffect = (trackId: string, effectId: string) => {
        const currentEffects = trackEffects[trackId] || [];
        const newEffects = currentEffects.filter(e => e.id !== effectId);
        onTrackEffectsChange(trackId, newEffects);
    };

    // --- Note Editing Logic --- //

    // Helper to find step from x coordinate
    const getStepFromX = (x: number) => {
        if (!containerRef.current) return 0;
        const rect = containerRef.current.getBoundingClientRect();
        // Adjust x relative to container left and scroll
        const relX = x - rect.left + containerRef.current.scrollLeft;
        return Math.floor(relX / STEP_WIDTH);
    };

    const handleNoteMouseDown = (e: React.MouseEvent, stepIndex: number, note: SynthNote) => {
        e.stopPropagation();
        if (selectedTool !== 'select') return;

        setSelectedNoteId(note.id);
        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
        const offsetX = e.clientX - rect.left;

        // Check if resize (edge)
        const isResize = offsetX > rect.width - 10;

        if (isResize) {
            setDragState({
                type: 'resize',
                noteId: note.id,
                originalDuration: note.durationSteps,
                startX: e.clientX
            });
        } else {
            // Alt drag to duplicate
            const isDuplicate = e.altKey;
            setDragState({
                type: 'move',
                noteId: note.id,
                originalStep: stepIndex,
                startStep: stepIndex,
                originalDuration: note.durationSteps,
                startX: e.clientX,
                isDuplicate
            });
        }
    };

    const handleGlobalMouseMove = (e: MouseEvent) => {
        if (!dragState) return;

        if (dragState.type === 'move') {
            const diffSteps = Math.round((e.clientX - (dragState.startX || 0)) / STEP_WIDTH);
            let newStep = (dragState.originalStep || 0) + diffSteps;
            newStep = Math.max(0, Math.min(TOTAL_STEPS - 1, newStep)); // Clamp

            setDragState(prev => prev ? { ...prev, currentStep: newStep } : null);
        } else if (dragState.type === 'resize') {
            const diffPixels = e.clientX - (dragState.startX || 0);
            const diffSteps = Math.round(diffPixels / STEP_WIDTH);
            let newDuration = (dragState.originalDuration || 0) + diffSteps;
            newDuration = Math.max(1, Math.min(16, newDuration)); // Min 1 step

            setDragState(prev => prev ? { ...prev, newDuration } : null);
        }
    };

    const handleGlobalMouseUp = () => {
        if (!dragState) return;

        if (dragState.type === 'move') {
            const newStep = dragState.currentStep ?? dragState.originalStep;
            const noteId = dragState.noteId;
            const originalStep = dragState.originalStep!;

            if (newStep !== originalStep || dragState.isDuplicate) {
                // Perform move or duplicate
                const newPattern = synthPattern.map(step => [...(step as any[])]); // Deepish copy

                // Find note
                const noteIndex = newPattern[originalStep].findIndex((n: any) =>
                    typeof n === 'string' ? false : n.id === noteId
                );

                if (noteIndex !== -1) {
                    const note = newPattern[originalStep][noteIndex] as SynthNote;

                    if (!dragState.isDuplicate) {
                        // Remove from old
                        newPattern[originalStep].splice(noteIndex, 1);
                        // Add to new
                        if (!newPattern[newStep]) newPattern[newStep] = [];
                        newPattern[newStep].push(note);
                    } else {
                        // Duplicate
                        const newNote = { ...note, id: crypto.randomUUID() };
                        if (!newPattern[newStep]) newPattern[newStep] = [];
                        newPattern[newStep].push(newNote);
                    }
                    onSynthPatternChange(newPattern);
                }
            }
        } else if (dragState.type === 'resize') {
            const newDur = dragState.newDuration;
            const noteId = dragState.noteId;

            // Find and update note
            const newPattern = synthPattern.map(step => [...(step as any[])]);

            for (let i = 0; i < newPattern.length; i++) {
                const noteIndex = newPattern[i].findIndex((n: any) => typeof n === 'string' ? false : n.id === noteId);
                if (noteIndex !== -1) {
                    const note = newPattern[i][noteIndex] as SynthNote;
                    newPattern[i][noteIndex] = { ...note, durationSteps: newDur || note.durationSteps };
                    break;
                }
            }
            onSynthPatternChange(newPattern);
        }

        setDragState(null);
    };

    useEffect(() => {
        window.addEventListener('mousemove', handleGlobalMouseMove);
        window.addEventListener('mouseup', handleGlobalMouseUp);
        return () => {
            window.removeEventListener('mousemove', handleGlobalMouseMove);
            window.removeEventListener('mouseup', handleGlobalMouseUp);
        };
    }, [dragState]);

    const handleDelete = () => {
        if (!selectedNoteId) return;
        const newPattern = synthPattern.map(step =>
            (step as any[]).filter(n => typeof n === 'string' || n.id !== selectedNoteId)
        );
        onSynthPatternChange(newPattern);
        setSelectedNoteId(null);
    };


    return (
        <div className="bg-gray-950 rounded-lg border border-gray-800 flex flex-col select-none relative" style={{ height: '500px' }}>

            {/* Toolbar */}
            <div className="h-14 border-b border-gray-800 flex items-center px-4 gap-4 bg-gray-900 rounded-t-lg z-20 relative">
                <div className="flex bg-black/40 rounded-lg p-1 gap-1 border border-gray-700/50">
                    <button
                        onClick={() => setSelectedTool('select')}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-all ${selectedTool === 'select' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50' : 'text-gray-400 hover:text-white hover:bg-gray-800'}`}
                    >
                        <MousePointer2 size={16} />
                        <span>Select</span>
                    </button>
                    {/* Trim tool is somewhat redundant with resize handles but kept for UI consistency */}
                    <button
                        onClick={() => setSelectedTool('trim')}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-all ${selectedTool === 'trim' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50' : 'text-gray-400 hover:text-white hover:bg-gray-800'}`}
                    >
                        <Scissors size={16} />
                        <span>Split</span>
                    </button>
                </div>

                <button
                    onClick={handleDelete}
                    disabled={!selectedNoteId}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-all border border-gray-700/50 ${selectedNoteId ? 'text-red-400 hover:bg-red-900/20' : 'text-gray-600 cursor-not-allowed'}`}
                >
                    <Trash2 size={16} />
                </button>

                <div className="flex items-center gap-4 ml-auto">
                    <div className="flex items-center gap-2 bg-black/40 px-3 py-1.5 rounded-lg border border-gray-700/50">
                        <GripVertical size={14} className="text-gray-500" />
                        <span className="text-xs text-gray-400">Height</span>
                        <input
                            type="range"
                            min="32"
                            max="96"
                            value={trackHeight}
                            onChange={e => setTrackHeight(parseInt(e.target.value))}
                            className="w-20 accent-blue-500"
                        />
                    </div>

                    <div className="flex items-center gap-2 bg-black/40 px-3 py-1.5 rounded-lg border border-gray-700/50">
                        <Minus size={14} className="text-gray-400 cursor-pointer" onClick={() => setZoom(z => Math.max(0.5, z - 0.1))} />
                        <span className="text-xs text-gray-400 w-8 text-center">{Math.round(zoom * 100)}%</span>
                        <Plus size={14} className="text-gray-400 cursor-pointer" onClick={() => setZoom(z => Math.min(2, z + 0.1))} />
                    </div>

                    <button
                        onClick={() => setShowEffects(!showEffects)}
                        className={`p-2 rounded-lg border border-gray-700/50 transition-colors ${showEffects ? 'bg-purple-500/20 text-purple-400 border-purple-500/50' : 'bg-black/40 text-gray-400 hover:text-white'}`}
                    >
                        <Wand2 size={18} />
                    </button>
                </div>
            </div>

            <div
                className="flex flex-1 overflow-hidden relative"
                onWheel={(e) => {
                    if (e.altKey) {
                        e.preventDefault();
                        const delta = e.deltaY > 0 ? -0.1 : 0.1;
                        setZoom(z => Math.max(0.5, Math.min(2, z + delta)));
                    } else if (e.shiftKey) {
                        e.preventDefault();
                        const delta = e.deltaY > 0 ? -5 : 5;
                        setTrackHeight(h => Math.max(32, Math.min(128, h + delta)));
                    }
                }}
            >

                {/* Track Headers */}
                <div className="w-56 bg-gray-900 border-r border-gray-800 flex flex-col z-10 shadow-[4px_0_24px_rgba(0,0,0,0.5)] overflow-y-auto hide-scrollbar">
                    <div className="h-8 bg-gray-950 border-b border-gray-800 shrink-0 sticky top-0 z-10" />

                    {/* Synth Track */}
                    <div
                        className="border-b border-gray-800 flex flex-col justify-center px-4 gap-2 bg-gray-900 hover:bg-gray-800 transition-colors shrink-0 group relative"
                        style={{ height: Math.max(trackHeight, 80) }}
                        onDragOver={e => e.preventDefault()}
                        onDrop={e => handleDropEffect(e, 'synth')}
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 group-hover:scale-110 transition-transform">
                                <Music size={16} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="text-xs font-bold text-gray-200">Synthesizer</div>
                                <div className="text-[10px] text-gray-500">Poly Synth</div>
                            </div>
                        </div>
                        {/* FX List */}
                        <div className="flex flex-wrap gap-1">
                            {(trackEffects['synth'] || []).map(ef => (
                                <div key={ef.id} className="flex items-center gap-1 bg-gray-800 rounded px-1.5 py-0.5 border border-gray-700 text-[9px] text-gray-300 group/fx">
                                    <span>{ef.type}</span>
                                    <button
                                        className="hover:text-red-400 p-0.5"
                                        onClick={(e) => { e.stopPropagation(); handleRemoveEffect('synth', ef.id); }}
                                    >
                                        <XCircle size={10} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Drum Tracks */}
                    {DRUMS.map((drum, i) => (
                        <div
                            key={drum.name}
                            className="border-b border-gray-800 flex flex-col justify-center px-4 gap-2 bg-gray-900 hover:bg-gray-800 transition-colors shrink-0 group relative"
                            style={{ height: Math.max(trackHeight, 80) }}
                            onDragOver={e => e.preventDefault()}
                            onDrop={e => handleDropEffect(e, `drum-${i}`)}
                        >
                            <div className="flex items-center gap-3">
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold ${drum.color} shadow-lg shadow-black/20 group-hover:scale-110 transition-transform`}>
                                    {drum.name[0]}
                                </div>
                                <div className="flex-1 min-w-0 z-10">
                                    <div className="text-xs font-bold text-gray-300">{drum.name}</div>
                                    <div className="text-[10px] text-gray-500">{drumTypes[i]}</div>
                                </div>
                            </div>
                            {/* FX List */}
                            <div className="flex flex-wrap gap-1 relative z-20">
                                {(trackEffects[`drum-${i}`] || []).map(ef => (
                                    <div key={ef.id} className="flex items-center gap-1 bg-gray-800 rounded px-1.5 py-0.5 border border-gray-700 text-[9px] text-gray-300 group/fx">
                                        <span>{ef.type}</span>
                                        <button
                                            className="hover:text-red-400 p-0.5"
                                            onClick={(e) => { e.stopPropagation(); handleRemoveEffect(`drum-${i}`, ef.id); }}
                                        >
                                            <XCircle size={10} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Timeline Area */}
                <div className="flex-1 flex flex-col bg-[#1a1a1a] overflow-auto relative scroll-smooth" ref={containerRef}>
                    {/* Ruler */}
                    <div
                        ref={rulerRef}
                        className="h-8 border-b border-gray-700 bg-gray-900 flex sticky top-0 z-20 cursor-col-resize group"
                        style={{ width: TOTAL_WIDTH }}
                        onMouseDown={handleScrub}
                        onMouseMove={(e) => isScrubbing && handleScrub(e)}
                        onMouseUp={handleScrubEnd}
                        onMouseLeave={handleScrubEnd}
                    >
                        {[...Array(TOTAL_STEPS)].map((_, i) => (
                            <div
                                key={i}
                                className={`flex-1 border-r border-gray-700/30 text-[9px] text-gray-500 p-1 font-mono select-none ${i % 4 === 0 ? 'bg-white/5 text-gray-300 font-bold border-gray-600/50' : ''}`}
                                style={{ width: STEP_WIDTH, flexShrink: 0 }}
                            >
                                {i % 4 === 0 ? (i / 4) + 1 : ''}
                            </div>
                        ))}
                    </div>

                    {/* Playhead */}
                    <div
                        className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-30 pointer-events-none shadow-[0_0_10px_rgba(239,68,68,0.5)]"
                        style={{
                            left: (currentTime / TOTAL_STEPS) * TOTAL_WIDTH,
                            display: isPlaying || isScrubbing || currentTime > 0 ? 'block' : 'none'
                        }}
                    >
                        <div className="absolute -top-1 -left-1.5 w-3.5 h-3.5 bg-red-500 rotate-45 rounded-sm" />
                    </div>

                    {/* Tracks Content */}
                    <div className="relative" style={{ width: TOTAL_WIDTH }}>

                        {/* Synth Track */}
                        <div className="border-b border-gray-800 bg-[#1e1e1e] relative group" style={{ height: Math.max(trackHeight, 80) }}>
                            {/* Grid */}
                            {[...Array(TOTAL_STEPS)].map((_, i) => (
                                <div key={i} className={`absolute top-0 bottom-0 border-r border-white/5 ${i % 4 === 0 ? 'border-white/10' : ''}`} style={{ left: i * STEP_WIDTH, width: STEP_WIDTH }} />
                            ))}

                            {/* Render Synth Notes */}
                            {synthPattern.map((stepNotes, stepIndex) => {
                                if (!stepNotes) return null;
                                // Handle string[] (legacy) vs SynthNote[]
                                const notes = Array.isArray(stepNotes) ? stepNotes : [];

                                return notes.map((note, noteIdx) => {
                                    // Normalize note data
                                    const noteData = typeof note === 'string'
                                        ? { id: `legacy-${stepIndex}-${noteIdx}-${note}`, note: note, durationSteps: 2 }
                                        : note as SynthNote;

                                    // Determine visual props based on drag state
                                    const isBeingDragged = dragState?.noteId === noteData.id && dragState?.type === 'move';
                                    const isBeingResized = dragState?.noteId === noteData.id && dragState?.type === 'resize';

                                    let renderStep = stepIndex;
                                    let renderDuration = noteData.durationSteps;

                                    if (isBeingDragged) {
                                        renderStep = dragState.currentStep ?? stepIndex;
                                    }
                                    if (isBeingResized) {
                                        renderDuration = dragState.newDuration ?? noteData.durationSteps;
                                    }

                                    const isSelected = selectedNoteId === noteData.id;

                                    return (
                                        <div
                                            key={noteData.id}
                                            onMouseDown={(e) => handleNoteMouseDown(e, stepIndex, noteData)}
                                            className={`absolute top-1 bottom-1 rounded-md overflow-hidden transition-colors border group/note
                                                ${isSelected ? 'bg-blue-500/40 border-blue-400 z-20' : 'bg-blue-500/20 border-blue-500/50 z-10'}
                                                ${isBeingDragged ? 'opacity-80 cursor-grabbing shadow-xl' : 'hover:bg-blue-500/30 cursor-grab'}
                                            `}
                                            style={{
                                                left: renderStep * STEP_WIDTH,
                                                width: (renderDuration * STEP_WIDTH) - 2,
                                                transition: isBeingDragged || isBeingResized ? 'none' : 'left 0.1s, width 0.1s'
                                            }}
                                        >
                                            <div className="px-1 text-[10px] text-blue-200 font-bold truncate">
                                                {noteData.note}
                                            </div>
                                            <svg className="w-full h-full absolute top-0 left-0 opacity-50 pointer-events-none" preserveAspectRatio="none">
                                                <path d={generateWaveformPath(renderDuration * STEP_WIDTH, trackHeight, 'synth', stepIndex)} stroke="currentColor" strokeWidth="1" fill="none" className="text-blue-400" />
                                            </svg>

                                            {/* Resize Handle */}
                                            {isSelected && (
                                                <div className="absolute right-0 top-0 bottom-0 w-2 bg-blue-400/50 hover:bg-blue-300 cursor-ew-resize opacity-0 group-hover/note:opacity-100 transition-opacity" />
                                            )}
                                        </div>
                                    );
                                });
                            })}
                        </div>

                        {/* Drum Tracks */}
                        {pattern.map((row, drumIndex) => (
                            <div key={drumIndex} className="border-b border-gray-800 bg-[#1e1e1e] relative" style={{ height: Math.max(trackHeight, 80) }}>
                                {/* Grid */}
                                {[...Array(TOTAL_STEPS)].map((_, i) => (
                                    <div key={i} className={`absolute top-0 bottom-0 border-r border-white/5 ${i % 4 === 0 ? 'border-white/10' : ''}`} style={{ left: i * STEP_WIDTH, width: STEP_WIDTH }} />
                                ))}

                                {row.map((active, step) => {
                                    if (!active) return null;
                                    const drumName = DRUMS[drumIndex].name;
                                    return (
                                        <div
                                            key={step}
                                            className={`absolute top-0 bottom-0 flex items-center justify-center ${selectedTool === 'select' ? 'cursor-pointer hover:brightness-125' : ''}`}
                                            style={{ left: step * STEP_WIDTH, width: STEP_WIDTH }}
                                            onMouseDown={(e) => {
                                                const newPattern = pattern.map(r => [...r]);
                                                newPattern[drumIndex][step] = !newPattern[drumIndex][step];
                                                onPatternChange(newPattern);
                                            }}
                                        >
                                            <svg className="w-full h-full p-1" preserveAspectRatio="none">
                                                <path
                                                    d={generateWaveformPath(STEP_WIDTH, trackHeight, drumName === 'Kick' ? 'kick' : drumName === 'Snare' ? 'snare' : 'noise', step)}
                                                    stroke="currentColor"
                                                    strokeWidth={2}
                                                    fill="none"
                                                    className={DRUMS[drumIndex].color.replace('bg-', 'text-').replace('500', '400')}
                                                />
                                            </svg>
                                        </div>
                                    );
                                })}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Effects Panel */}
                <div
                    className={`absolute top-14 right-0 bottom-0 w-48 bg-[#0f0f11] border-l border-gray-700 shadow-2xl transition-transform duration-300 ease-in-out z-20 overflow-y-auto ${showEffects ? 'translate-x-0' : 'translate-x-full'}`}
                >
                    <div className="p-3 border-b border-gray-800 text-xs font-bold text-gray-400 uppercase tracking-wider">
                        Fairlight Effects
                    </div>
                    <div className="p-2 space-y-1">
                        {EFFECTS.map(effect => (
                            <div
                                key={effect.type}
                                draggable
                                onDragStart={(e) => handleDragStartEffect(e, effect.type)}
                                className="flex items-center gap-3 p-2 rounded hover:bg-white/5 cursor-grab active:cursor-grabbing group transition-colors"
                            >
                                <effect.icon size={16} className={`${effect.color} group-hover:scale-110 transition-transform`} />
                                <span className="text-gray-300 text-sm">{effect.type}</span>
                            </div>
                        ))}
                    </div>

                    <div className="p-3 mt-4 border-t border-gray-800">
                        <div className="text-xs text-gray-500 mb-2">Drag effects to track headers. One effect per type per track. Click 'X' to remove.</div>
                    </div>
                </div>

            </div>
        </div>
    );
}
