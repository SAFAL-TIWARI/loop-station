import { useState, useEffect } from 'react';
import { Save, Trash2, FolderOpen, Download, Loader2 } from 'lucide-react';
import { DRUMS, STEPS } from './DrumSequencer';
import { renderPattern, bufferToMp3, bufferToWav, downloadBlob } from '../utils/audioExport';

export interface Preset {
    name: string;
    bpm: number;
    pattern: boolean[][];
    synthPattern?: any[][]; // Supports legacy string[][] and new SynthNote[][]
    drumTypes?: string[];
}

const DEFAULT_PRESETS: Preset[] = [
    {
        name: 'Techno',
        bpm: 130,
        pattern: DRUMS.map((_, i) => Array(STEPS).fill(false).map((__, j) => {
            if (i === 0) return j % 4 === 0; // Kick on beat
            if (i === 2) return j % 2 === 1; // Hi-hat off beat
            return false;
        })),
        drumTypes: DRUMS.map(d => {
            if (d.name === 'Kick') return '909';
            if (d.name === 'Hi-Hat') return 'Closed';
            return 'Modern';
        }),
        synthPattern: Array(STEPS).fill([]).map((_, i) => {
            if (i % 4 === 2) return ['C2', 'C3']; // Off-beat bass
            return [];
        })
    },
    {
        name: 'Hip Hop',
        bpm: 90,
        pattern: DRUMS.map((_, i) => Array(STEPS).fill(false).map((__, j) => {
            if (i === 0) return j === 0 || j === 7 || j === 10; // Kick
            if (i === 1) return j === 4 || j === 12; // Snare
            if (i === 2) return j % 2 === 0; // Hi-hat
            return false;
        })),
        drumTypes: DRUMS.map(d => {
            if (d.name === 'Kick') return '808';
            if (d.name === 'Snare') return 'Trap';
            if (d.name === 'Hi-Hat') return 'Trap';
            return '808';
        }),
        synthPattern: Array(STEPS).fill([]).map((_, i) => {
            if (i === 0) return ['C2'];
            if (i === 8) return ['G2'];
            return [];
        })
    },
    {
        name: 'House',
        bpm: 124,
        pattern: DRUMS.map((_, i) => Array(STEPS).fill(false).map((__, j) => {
            if (i === 0) return j % 4 === 0; // Kick
            if (i === 2) return j % 2 === 1; // Open Hat
            if (i === 3) return j === 4 || j === 12; // Clap
            return false;
        })),
        drumTypes: DRUMS.map(d => 'Modern'),
        synthPattern: Array(STEPS).fill([]).map((_, i) => {
            if (i === 0) return ['C2'];
            if (i === 2) return ['C2'];
            if (i === 3) return ['E2'];
            if (i === 4) return ['G2'];
            if (i === 6) return ['A2'];
            if (i === 8) return ['C2'];
            if (i === 10) return ['C2'];
            if (i === 12) return ['G2'];
            if (i === 14) return ['Bb2'];
            return [];
        })
    },
    {
        name: 'Trap',
        bpm: 140,
        pattern: DRUMS.map((_, i) => Array(STEPS).fill(false).map((__, j) => {
            if (i === 0) return j === 0 || j === 10; // Kick
            if (i === 1) return j === 8; // Snare
            if (i === 2) return j % 2 === 0 || j % 3 === 0; // Fast Hats
            return false;
        })),
        drumTypes: DRUMS.map(d => {
            if (d.name === 'Kick') return 'Distorted';
            if (d.name === 'Snare') return 'Trap';
            if (d.name === 'Hi-Hat') return 'Trap';
            return '808';
        }),
        synthPattern: Array(STEPS).fill([]).map((_, i) => {
            if (i === 0) return ['D2'];
            if (i === 3) return ['D2'];
            if (i === 6) return ['F2'];
            return [];
        })
    },
    {
        name: '80s Pop',
        bpm: 110,
        pattern: DRUMS.map((_, i) => Array(STEPS).fill(false).map((__, j) => {
            if (i === 0) return j === 0 || j === 8; // Kick
            if (i === 1) return j === 4 || j === 12; // Snare
            return false;
        })),
        drumTypes: DRUMS.map(d => {
            if (d.name === 'Snare') return '808';
            return 'Modern';
        }),
        synthPattern: Array(STEPS).fill([]).map((_, i) => {
            if (i % 2 === 0) return ['C3', 'E3', 'G3']; // Chords
            return [];
        })
    },
    {
        name: 'Lofi',
        bpm: 80,
        pattern: DRUMS.map((_, i) => Array(STEPS).fill(false).map((__, j) => {
            if (i === 0) return j === 0 || j === 8 || j === 11;
            if (i === 1) return j === 4 || j === 12;
            if (i === 2) return j % 2 === 0;
            return false;
        })),
        drumTypes: DRUMS.map(d => 'Acoustic'),
        synthPattern: Array(STEPS).fill([]).map((_, i) => {
            if (i === 0) return ['E3', 'G3', 'B3'];
            if (i === 8) return ['D3', 'F#3', 'A3'];
            return [];
        })
    },
    {
        name: 'DnB',
        bpm: 174,
        pattern: DRUMS.map((_, i) => Array(STEPS).fill(false).map((__, j) => {
            if (i === 0) return j === 0 || j === 10;
            if (i === 1) return j === 4 || j === 12;
            if (i === 2) return true;
            return false;
        })),
        drumTypes: DRUMS.map(d => {
            if (d.name === 'Snare') return 'Rim';
            return 'Modern';
        }),
        synthPattern: Array(STEPS).fill([]).map((_, i) => {
            if (i === 0) return ['F2'];
            if (i === 2) return ['C3'];
            if (i === 10) return ['F2'];
            return [];
        })
    },
    {
        name: 'Dubstep',
        bpm: 140,
        pattern: DRUMS.map((_, i) => Array(STEPS).fill(false).map((__, j) => {
            if (i === 0) return j === 0; // Kick
            if (i === 1) return j === 8; // Snare
            if (i === 2) return j % 2 === 0; // Hat
            return false;
        })),
        drumTypes: DRUMS.map(d => {
            if (d.name === 'Kick') return 'Distorted';
            if (d.name === 'Snare') return 'Trap';
            return '808';
        }),
        synthPattern: Array(STEPS).fill([]).map((_, i) => {
            if (i === 0) return ['D1', 'D2']; // Wub wub base
            if (i === 1) return ['D1', 'D2'];
            return [];
        })
    }
];

interface PresetControlsProps {
    currentPattern: boolean[][];
    currentBpm: number;
    currentSynthPattern: any[][];
    currentDrumTypes: string[];
    onLoadPreset: (preset: Preset) => void;
    selectedPreset: string;
    onSelectPreset: (name: string) => void;
}

export function PresetControls({ currentPattern, currentBpm, currentSynthPattern, currentDrumTypes, onLoadPreset, selectedPreset, onSelectPreset }: PresetControlsProps) {
    const [presets, setPresets] = useState<Preset[]>([]);
    const [presetName, setPresetName] = useState('');
    const [isExporting, setIsExporting] = useState(false);
    const [showExportMenu, setShowExportMenu] = useState(false);

    useEffect(() => {
        // Load saved presets
        const saved = localStorage.getItem('userPresets');
        if (saved) {
            setPresets(JSON.parse(saved));
        }
    }, []);

    const handleSave = () => {
        if (!presetName.trim()) return;

        const newPreset: Preset = {
            name: presetName,
            bpm: currentBpm,
            pattern: currentPattern,
            synthPattern: currentSynthPattern,
            drumTypes: currentDrumTypes
        };

        const newPresets = [...presets, newPreset];
        setPresets(newPresets);
        localStorage.setItem('userPresets', JSON.stringify(newPresets));
        setPresetName('');
        alert('Preset saved!');
    };

    const handleLoad = (name: string) => {
        onSelectPreset(name);
        if (!name) return;

        const preset = [...DEFAULT_PRESETS, ...presets].find(p => p.name === name);
        if (preset) {
            onLoadPreset(preset);
        }
    };

    const handleDelete = (name: string) => {
        if (confirm(`Delete preset "${name}"?`)) {
            const newPresets = presets.filter(p => p.name !== name);
            setPresets(newPresets);
            localStorage.setItem('userPresets', JSON.stringify(newPresets));
            onSelectPreset('');
        }
    };

    const handleExport = async (format: 'wav' | 'mp3') => {
        setIsExporting(true);
        setShowExportMenu(false);
        try {
            const currentPreset: Preset = {
                name: presetName || 'Current-Project',
                bpm: currentBpm,
                pattern: currentPattern,
                synthPattern: currentSynthPattern,
                drumTypes: currentDrumTypes
            };

            const buffer = await renderPattern(currentPreset);
            let blob: Blob;

            if (format === 'wav') {
                blob = bufferToWav(buffer);
            } else {
                blob = await bufferToMp3(buffer);
            }

            downloadBlob(blob, `${selectedPreset || presetName || currentPreset.name || 'Current-Project'}.${format}`);

        } catch (error) {
            console.error("Export Failed", error);
            alert("Export failed, see console.");
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <div className="bg-gray-900 rounded-lg p-6 flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1 w-full">
                <label className="text-white text-sm block mb-2">Load Preset</label>
                <div className="flex gap-2">
                    <select
                        value={selectedPreset}
                        onChange={(e) => handleLoad(e.target.value)}
                        className="bg-gray-800 text-white rounded px-3 py-2 flex-1 outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="">Select a preset...</option>
                        <optgroup label="Defaults">
                            {DEFAULT_PRESETS.map(p => (
                                <option key={p.name} value={p.name}>{p.name}</option>
                            ))}
                        </optgroup>
                        <optgroup label="User Saved">
                            {presets.map(p => (
                                <option key={p.name} value={p.name}>{p.name}</option>
                            ))}
                        </optgroup>
                    </select>
                </div>
            </div>

            <div className="flex-1 w-full">
                <label className="text-white text-sm block mb-2">Save / Export</label>
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={presetName}
                        onChange={(e) => setPresetName(e.target.value)}
                        placeholder="Preset Name"
                        className="bg-gray-800 text-white rounded px-3 py-2 flex-1 outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                        onClick={handleSave}
                        className="bg-blue-600 hover:bg-blue-700 text-white rounded px-4 py-2 flex items-center gap-2 transition-colors"
                        title="Save Preset"
                    >
                        <Save size={18} />
                    </button>

                    <div className="relative">
                        <button
                            onClick={() => setShowExportMenu(!showExportMenu)}
                            disabled={isExporting}
                            className={`
                                h-full px-4 py-2 rounded flex items-center gap-2 transition-colors
                                ${isExporting ? 'bg-gray-700 text-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700 text-white'}
                            `}
                            title="Export to Audio"
                        >
                            {isExporting ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}
                        </button>

                        {showExportMenu && (
                            <div className="absolute right-0 top-full mt-2 bg-gray-800 rounded shadow-xl border border-gray-700 z-50 flex flex-col min-w-[120px]">
                                <button
                                    onClick={() => handleExport('wav')}
                                    className="px-4 py-2 text-left text-white hover:bg-gray-700 first:rounded-t"
                                >
                                    WAV (Lossless)
                                </button>
                                <button
                                    onClick={() => handleExport('mp3')}
                                    className="px-4 py-2 text-left text-white hover:bg-gray-700 last:rounded-b"
                                >
                                    MP3 (Compressed)
                                </button>
                            </div>
                        )}
                        {/* Overlay to close menu */}
                        {showExportMenu && (
                            <div
                                className="fixed inset-0 z-40"
                                onClick={() => setShowExportMenu(false)}
                            />
                        )}
                    </div>

                </div>
            </div>

            {selectedPreset && !DEFAULT_PRESETS.find(p => p.name === selectedPreset) && (
                <button
                    onClick={() => handleDelete(selectedPreset)}
                    className="bg-red-600 hover:bg-red-700 text-white rounded px-4 py-2 flex items-center gap-2 transition-colors"
                >
                    <Trash2 size={18} />
                </button>
            )}
        </div>
    );
}
