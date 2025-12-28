import * as Tone from 'tone';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';

// @ts-ignore
import coreJsURL from '@ffmpeg/core?url';
// @ts-ignore
import coreWasmURL from '@ffmpeg/core/wasm?url';

import { Preset as ControlPreset } from '../components/PresetControls';
import { PRESETS } from '../components/Synthesizer';
import { DRUMS } from '../components/DrumSequencer';
const createInstrumentSynth = (presetId: string): Tone.PolySynth<any> => {
    const preset = PRESETS.find(p => p.id === presetId) || PRESETS[0];
    const params = preset.params || {};
    let polySynth: Tone.PolySynth<any>;

    try {
        switch (preset.engine) {
            case 'fm':
                polySynth = new Tone.PolySynth(Tone.FMSynth, params);
                break;
            case 'am':
                polySynth = new Tone.PolySynth(Tone.AMSynth, params);
                break;
            case 'duo':
                // @ts-ignore
                polySynth = new Tone.PolySynth(Tone.DuoSynth, params);
                break;
            case 'membrane':
                polySynth = new Tone.PolySynth(Tone.MembraneSynth, params);
                break;
            case 'pluck':
                // @ts-ignore
                polySynth = new Tone.PolySynth(Tone.PluckSynth, params);
                break;
            case 'metal':
                // @ts-ignore
                polySynth = new Tone.PolySynth(Tone.MetalSynth, params);
                break;
            case 'synth':
            default:
                polySynth = new Tone.PolySynth(Tone.Synth, params);
                break;
        }
        polySynth.volume.value = -8;
        return polySynth;
    } catch (e) {
        return new Tone.PolySynth(Tone.Synth);
    }
};

const createDrumSynth = (drumIndex: number, type: string): Tone.Instrument<any> => {
    const drumName = DRUMS[drumIndex].name;

    // Helper to create the options object
    const getOptions = () => {
        switch (drumName) {
            case 'Kick':
                if (type === '808') return { pitchDecay: 0.05, octaves: 4, oscillator: { type: "sine" }, envelope: { attack: 0.001, decay: 0.4, sustain: 0.01, release: 1.4 } };
                else if (type === 'Acoustic') return { pitchDecay: 0.05, octaves: 2, oscillator: { type: "sine" } };
                else if (type === 'Distorted') return { pitchDecay: 0.08, octaves: 2.5 };
                else return { octaves: 2, pitchDecay: 0.05 };

            case 'Snare':
                if (type === '808') return { noise: { type: 'white' }, envelope: { decay: 0.2 } };
                else if (type === 'Trap') return { noise: { type: 'pink' }, envelope: { decay: 0.15 } };
                else if (type === 'Rim') return { frequency: 200, envelope: { decay: 0.05 } };
                else return { pitchDecay: 0.05, octaves: 2 };

            case 'Hi-Hat':
                if (type === 'Trap') return { frequency: 400, envelope: { decay: 0.05 }, harmonicity: 5.1, modulationIndex: 32 };
                else return { frequency: 200, envelope: { decay: 0.1 } };

            case 'Clap':
                return { noise: { type: 'white' }, envelope: { decay: 0.1 } };

            case 'Tom':
                if (type === '808') return { pitchDecay: 0.1, octaves: 2 };
                else return { octaves: 4, pitchDecay: 0.08 };

            default:
                if (drumName === 'Rim') return { frequency: 400, envelope: { decay: 0.05 } };
                else if (drumName === 'Crash') return { frequency: 150, envelope: { decay: 2, release: 3 } };
                else if (drumName === 'Ride') return { frequency: 800, envelope: { decay: 0.5 } };
                else if (drumName === 'Cowbell') return { frequency: 540, envelope: { decay: 0.2 } };
                else if (drumName === 'Shaker') return { noise: { type: 'white' }, envelope: { attack: 0.005, decay: 0.05 } };
                else return {};
        }
    };

    const isNoise = (drumName === 'Snare' && (type === '808' || type === 'Trap')) || drumName === 'Clap' || (drumName === 'Shaker');
    const isMetal = (drumName === 'Hi-Hat' || (drumName === 'Snare' && type === 'Rim') || ['Rim', 'Crash', 'Ride', 'Cowbell'].includes(drumName));

    if (isNoise) {
        // NoiseSynth cannot be wrapped in PolySynth
        // @ts-ignore
        return new Tone.NoiseSynth(getOptions());
    } else {
        // Membrane and Metal should be wrapped to avoid scheduling errors (polyphony helps)
        const sType = isMetal ? Tone.MetalSynth : Tone.MembraneSynth;
        // @ts-ignore
        return new Tone.PolySynth(sType, getOptions());
    }
};

export const renderPattern = async (preset: ControlPreset): Promise<AudioBuffer> => {
    const bpm = preset.bpm || 120;
    const steps = 16;
    const stepDuration = (60 / bpm) / 4; // 16th note duration in seconds
    const totalDuration = stepDuration * steps + 1; // +1s for release tail

    // Render Offline
    const buffer = await Tone.Offline(({ transport }) => {
        transport.bpm.value = bpm;

        // 1. Setup Drums
        const drumSynths = DRUMS.map((_, i) => {
            const type = (preset.drumTypes && preset.drumTypes[i]) ? preset.drumTypes[i] : 'Modern';
            const synth = createDrumSynth(i, type);
            synth.toDestination();
            return synth;
        });

        // 2. Setup Synths
        const usedPresets = new Set<string>();
        // Collect all used instrument IDs first
        preset.synthPattern?.forEach(step => {
            step.forEach((note: any) => {
                if (typeof note === 'string') usedPresets.add('basic');
                else if (note.instrumentId) usedPresets.add(note.instrumentId);
                else usedPresets.add('basic');
            });
        });

        const synthMap = new Map<string, Tone.PolySynth>();
        usedPresets.forEach(id => {
            const synth = createInstrumentSynth(id);
            synth.toDestination();
            synthMap.set(id, synth);
        });

        // 3. Schedule Events
        // We will schedule everything relative to Transport Time 0

        // Schedule Drums
        preset.pattern.forEach((row, drumIndex) => {
            row.forEach((active, step) => {
                if (active) {
                    const time = step * stepDuration;
                    const synth = drumSynths[drumIndex];

                    if (time >= 0) {
                        try {
                            // Unified triggering for PolySynth vs NoiseSynth
                            if (synth instanceof Tone.PolySynth) {
                                // Kick
                                if (drumIndex === 0) synth.triggerAttackRelease('C1', '8n', time);
                                // Snare (Tonal) or Tom
                                else if (drumIndex === 1 || drumIndex === 4) {
                                    // Check if it's Tom (4) or Snare (1)
                                    const note = drumIndex === 4 ? 'C3' : 'C2';
                                    synth.triggerAttackRelease(note, '8n', time);
                                }
                                // Others (HiHat, Metal)
                                else synth.triggerAttackRelease('G4', '16n', time); // High pitch for metal
                            } else {
                                // NoiseSynth
                                // @ts-ignore
                                synth.triggerAttackRelease('8n', time);
                            }
                        } catch (e) { console.error("Schedule error drum", e) }
                    }
                }
            });
        });

        // Schedule Synths
        preset.synthPattern?.forEach((stepNotes, step) => {
            const time = step * stepDuration;
            stepNotes.forEach((n: any) => {
                const instrumentId = (typeof n !== 'string' && n.instrumentId) ? n.instrumentId : 'basic';
                const synth = synthMap.get(instrumentId);
                if (synth && time >= 0) {
                    try {
                        if (typeof n === 'string') {
                            synth.triggerAttackRelease(n, '8n', time);
                        } else {
                            const durationTime = stepDuration * n.durationSteps;
                            synth.triggerAttackRelease(n.note, durationTime, time);
                        }
                    } catch (e) { console.error("Schedule error synth", e) }
                }
            });
        });

        // Start Transport to play the scheduled events
        transport.start(0);

    }, totalDuration);

    return buffer.get() as AudioBuffer;
};


// Convert AudioBuffer to WAV Blob
export const bufferToWav = (buffer: AudioBuffer): Blob => {
    const numOfChan = buffer.numberOfChannels;
    const length = buffer.length * numOfChan * 2 + 44;
    const bufferArr = new ArrayBuffer(length);
    const view = new DataView(bufferArr);
    const channels = [];
    let i;
    let sample;
    let offset = 0;
    let pos = 0;

    // write WAVE header
    setUint32(0x46464952);                         // "RIFF"
    setUint32(length - 8);                         // file length - 8
    setUint32(0x45564157);                         // "WAVE"

    setUint32(0x20746d66);                         // "fmt " chunk
    setUint32(16);                                 // length = 16
    setUint16(1);                                  // PCM (uncompressed)
    setUint16(numOfChan);
    setUint32(buffer.sampleRate);
    setUint32(buffer.sampleRate * 2 * numOfChan);  // avg. bytes/sec
    setUint16(numOfChan * 2);                      // block-align
    setUint16(16);                                 // 16-bit (hardcoded in this example)

    setUint32(0x61746164);                         // "data" - chunk
    setUint32(length - pos - 4);                   // chunk length

    // write interleaved data
    for (i = 0; i < buffer.numberOfChannels; i++)
        channels.push(buffer.getChannelData(i));

    while (pos < buffer.length) {
        for (i = 0; i < numOfChan; i++) {             // interleave channels
            sample = Math.max(-1, Math.min(1, channels[i][pos])); // clamp
            sample = (0.5 + sample < 0 ? sample * 32768 : sample * 32767) | 0; // scale to 16-bit signed int
            view.setInt16(44 + offset, sample, true);
            offset += 2;
        }
        pos++;
    }

    function setUint16(data: any) {
        view.setUint16(pos, data, true);
        pos += 2;
    }

    function setUint32(data: any) {
        view.setUint32(pos, data, true);
        pos += 4;
    }

    return new Blob([bufferArr], { type: 'audio/wav' });
};

// Output MP3 Blob using FFmpeg
let ffmpeg: FFmpeg | null = null;

export const bufferToMp3 = async (buffer: AudioBuffer): Promise<Blob> => {
    if (!ffmpeg) {
        ffmpeg = new FFmpeg();
        await ffmpeg.load({
            coreURL: await toBlobURL(coreJsURL, 'text/javascript'),
            wasmURL: await toBlobURL(coreWasmURL, 'application/wasm'),
        });
    }

    // 1. Convert AudioBuffer to WAV Blob first (as intermediate format)
    const wavBlob = bufferToWav(buffer);

    // 2. Write file to FFmpeg FS
    const inputName = 'input.wav';
    const outputName = 'output.mp3';

    await ffmpeg.writeFile(inputName, await fetchFile(wavBlob));

    // 3. Run conversion
    await ffmpeg.exec(['-i', inputName, '-b:a', '192k', outputName]);

    // 4. Read output
    const data = await ffmpeg.readFile(outputName);

    // 5. Cleanup (optional but good practice)
    // await ffmpeg.deleteFile(inputName);
    // await ffmpeg.deleteFile(outputName);

    return new Blob([data as any], { type: 'audio/mp3' });
};

export const downloadBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    document.body.appendChild(a);
    a.style.display = 'none';
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
};
