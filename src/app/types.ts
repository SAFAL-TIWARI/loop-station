export interface SynthNote {
    id: string;
    note: string;
    durationSteps: number;
    velocity?: number;
    instrumentId?: string;
}

// 16 steps, each step contains an array of notes starting at that step
export type SynthPattern = SynthNote[][];

export type EffectType =
    | 'Reverb'
    | 'Delay'
    | 'Distortion'
    | 'Chorus'
    | 'BitCrusher'
    | 'Echo'
    | 'Flanger'
    | 'Limiter'
    | 'Pitch'
    | 'Soft Clipper'
    | 'Stereo Width'
    | 'Compressor'
    | 'EQ';

export interface EffectConfig {
    id: string;
    type: EffectType;
    params: any;
    enabled: boolean;
}

export interface TrackEffects {
    [trackId: string]: EffectConfig[];
}
