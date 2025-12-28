import React from 'react';

// We treat instrument as string for flexibility
export type VisualInstrumentType = 'piano' | 'guitar' | 'tabla' | 'flute' | 'harmonium' | 'dholak';

interface InstrumentVisualsProps {
    instrument: string; // 'InstrumentType' or string like 'Guitar', 'Tabla'
    onPlay: (note: string) => void;
    onStop: (note: string) => void;
    activeNotes: Set<string>;
}

// Map logical notes to instrument-specific positions or zones
const NOTES = [
    { note: 'C4', label: 'C' }, { note: 'C#4', label: 'C#' },
    { note: 'D4', label: 'D' }, { note: 'D#4', label: 'D#' },
    { note: 'E4', label: 'E' },
    { note: 'F4', label: 'F' }, { note: 'F#4', label: 'F#' },
    { note: 'G4', label: 'G' }, { note: 'G#4', label: 'G#' },
    { note: 'A4', label: 'A' }, { note: 'A#4', label: 'A#' },
    { note: 'B4', label: 'B' },
    { note: 'C5', label: 'C' }
];

export function InstrumentVisuals({ instrument, onPlay, onStop, activeNotes }: InstrumentVisualsProps) {

    // --- Guitar Visualization ---
    if (instrument === 'guitar' || instrument === 'pluck') {
        return (
            <div className="relative w-full h-48 bg-[#2a1a10] rounded-lg overflow-hidden border-4 border-[#3e2723] shadow-inner flex items-center justify-center select-none">
                {/* Fretboard */}
                <div className="relative w-full h-32 flex flex-col justify-between py-2 bg-[#3e2723]">
                    {/* Strings */}
                    {[0, 1, 2, 3, 4, 5].map(stringIdx => (
                        <div key={stringIdx} className="relative w-full h-0.5 bg-yellow-600 shadow-sm opacity-80" />
                    ))}

                    {/* Frets Vertical Lines */}
                    <div className="absolute inset-0 flex">
                        {[...Array(13)].map((_, i) => (
                            <div key={i} className="flex-1 border-r-2 border-gray-400/50 relative group">
                                {/* In a real guitar, strings x frets = notes. Simplified mapping here: Vertical slices play notes */}
                                <button
                                    className={`absolute inset-0 w-full h-full opacity-0 hover:opacity-10 active:opacity-20 bg-white transition-opacity ${activeNotes.has(NOTES[i]?.note) ? 'opacity-30 bg-blue-500' : ''}`}
                                    onMouseDown={() => onPlay(NOTES[i]?.note)}
                                    onMouseUp={() => onStop(NOTES[i]?.note)}
                                    onMouseLeave={() => onStop(NOTES[i]?.note)}
                                />
                                {i === 3 || i === 5 || i === 7 || i === 9 ? (
                                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-gray-300 opacity-50 pointer-events-none" />
                                ) : null}
                                {i === 12 && (
                                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex gap-1 pointer-events-none">
                                        <div className="w-3 h-3 rounded-full bg-gray-300 opacity-50" />
                                        <div className="w-3 h-3 rounded-full bg-gray-300 opacity-50" />
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    // --- Tabla Visualization ---
    if (instrument === 'tabla') {
        return (
            <div className="relative w-full h-48 bg-[#1a1a1a] rounded-lg flex items-center justify-center gap-8 select-none">
                {/* Dayan (Right, Treble) */}
                <div
                    className={`w-32 h-32 rounded-full bg-[#d4a373] border-4 border-[#a98467] relative shadow-lg cursor-pointer transition-transform ${activeNotes.has('C4') ? 'scale-95 ring-4 ring-blue-500/50' : 'active:scale-95'}`}
                    onMouseDown={() => onPlay('C4')} // Mapping root note
                    onMouseUp={() => onStop('C4')}
                    onMouseLeave={() => onStop('C4')}
                >
                    <div className="absolute inset-4 rounded-full bg-black flex items-center justify-center">
                        <div className="w-8 h-8 rounded-full bg-gray-800 opacity-50" />
                    </div>
                    {/* Rim hits */}
                    <div className="absolute inset-0 rounded-full border-[12px] border-transparent hover:border-white/10" />
                </div>

                {/* Bayan (Left, Bass) */}
                <div
                    className={`w-40 h-40 rounded-full bg-[#a8dadc] border-4 border-[#457b9d] relative shadow-lg cursor-pointer transition-transform ${activeNotes.has('C3') ? 'scale-95 ring-4 ring-blue-500/50' : 'active:scale-95'}`}
                    style={{ background: 'radial-gradient(circle at 30% 30%, #457b9d, #1d3557)' }}
                    onMouseDown={() => onPlay('C3')} // Bass note
                    onMouseUp={() => onStop('C3')}
                    onMouseLeave={() => onStop('C3')}
                >
                    <div className="absolute top-4 left-4 w-12 h-12 rounded-full bg-black opacity-80 blur-sm" />
                </div>
            </div>
        );
    }

    // --- Dholak Visualization ---
    if (instrument === 'dholak') {
        return (
            <div className="relative w-full h-48 bg-[#1a1a1a] rounded-lg flex items-center justify-center select-none overflow-hidden">
                {/* Dholak Body */}
                <div className="relative w-3/4 h-32 bg-[#5d4037] rounded-xl flex items-center justify-between shadow-2xl skew-x-[-5deg]">
                    {/* Rope styling */}
                    <div className="absolute inset-0 w-full h-full opacity-30 pointer-events-none"
                        style={{
                            backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, #3e2723 10px, #3e2723 12px)'
                        }}
                    />

                    {/* Left Head (Bass) */}
                    <div
                        className={`w-24 h-36 -ml-4 rounded-l-md rounded-r-3xl bg-[#3e2723] border-r-8 border-[#8d6e63] relative cursor-pointer shadow-lg active:scale-95 transition-transform flex items-center justify-center ${activeNotes.has('C3') ? 'scale-95 brightness-110' : ''}`}
                        style={{ background: 'radial-gradient(circle at 30% 50%, #5d4037, #271c19)' }}
                        onMouseDown={() => onPlay('C3')}
                        onMouseUp={() => onStop('C3')}
                        onMouseLeave={() => onStop('C3')}
                    >
                        <div className="w-16 h-28 rounded-[40%] bg-black/40 blur-sm" />
                    </div>

                    {/* Right Head (Treble) */}
                    <div
                        className={`w-20 h-28 -mr-4 rounded-r-md rounded-l-xl bg-[#d7ccc8] border-l-8 border-[#8d6e63] relative cursor-pointer shadow-lg active:scale-95 transition-transform flex items-center justify-center ${activeNotes.has('C4') ? 'scale-95 brightness-90' : ''}`}
                        onMouseDown={() => onPlay('C4')}
                        onMouseUp={() => onStop('C4')}
                        onMouseLeave={() => onStop('C4')}
                    >
                        <div className="w-10 h-10 rounded-full bg-black opacity-80" />
                    </div>
                </div>
            </div>
        );
    }

    // --- Flute Visualization ---
    if (instrument === 'flute') {
        return (
            <div className="relative w-full h-48 bg-[#1a1a1a] flex items-center justify-center select-none">
                <div className="w-4/5 h-8 bg-amber-200 rounded-full flex justify-between items-center px-8 shadow-[0_4px_10px_rgba(0,0,0,0.5)] border border-amber-300/50">
                    <div className="w-12 h-4 bg-black/20 rounded-full blur-[2px] absolute left-4" /> {/* Mouth hole */}

                    {/* Finger Holes */}
                    {NOTES.slice(0, 7).map((n, i) => (
                        <button
                            key={n.note}
                            className={`w-6 h-6 rounded-full border-2 border-amber-900 shadow-inner transition-colors ${activeNotes.has(n.note) ? 'bg-black scale-90' : 'bg-amber-900/40 hover:bg-amber-900/60'}`}
                            onMouseDown={() => onPlay(n.note)}
                            onMouseUp={() => onStop(n.note)}
                            onMouseLeave={() => onStop(n.note)}
                        />
                    ))}
                </div>
            </div>
        );
    }

    // --- Harmonium / Piano (Keys) ---
    return (
        <div className="relative h-48 bg-gray-800 rounded-lg p-4 shadow-inner overflow-hidden select-none">

            {/* Styling tweak for Harmonium to look woodier */}
            {instrument === 'harmonium' && (
                <>
                    <div className="absolute inset-0 bg-[#5d4037] z-0" />
                    {/* Bellows visual hint */}
                    <div className="absolute top-0 left-0 right-0 h-4 bg-[#3e2723] opacity-80 z-0" />
                    <div className="absolute bottom-0 left-0 right-0 h-4 bg-[#3e2723] opacity-80 z-0" />
                </>
            )}

            <div className="flex justify-center items-end h-full gap-0.5 relative z-10">
                {NOTES.map((noteObj, index) => {
                    const isWhite = !noteObj.note.includes('#');
                    return (
                        <button
                            key={index}
                            onMouseDown={() => onPlay(noteObj.note)}
                            onMouseUp={() => onStop(noteObj.note)}
                            onMouseLeave={() => onStop(noteObj.note)}
                            // Mobile touch support
                            onTouchStart={(e) => { e.preventDefault(); onPlay(noteObj.note); }}
                            onTouchEnd={(e) => { e.preventDefault(); onStop(noteObj.note); }}
                            className={`
                    relative transition-all duration-75 group
                    ${isWhite
                                    ? 'w-12 h-full bg-white hover:bg-blue-50 border-gray-400 rounded-b'
                                    : 'w-8 h-32 bg-gray-900 hover:bg-gray-800 border-gray-600 rounded-b -ml-4 z-20 shadow-lg'
                                }
                    ${activeNotes.has(noteObj.note)
                                    ? 'bg-blue-500 !border-blue-600 shadow-[0_0_15px_rgba(59,130,246,0.5)] translate-y-1'
                                    : ''
                                }
                    border-b-4 border-r
                    ${instrument === 'harmonium' && isWhite ? '!bg-[#fff8e1]' : ''}
                `}
                        >
                            <span className={`
                    absolute bottom-2 left-1/2 -translate-x-1/2 text-xs font-bold pointer-events-none
                    ${isWhite ? 'text-gray-400 group-hover:text-blue-500' : 'text-gray-500 group-hover:text-blue-300'}
                `}>
                                {noteObj.label}
                            </span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
