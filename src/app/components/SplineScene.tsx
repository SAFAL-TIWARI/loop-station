

interface SplineSceneProps {
    pattern?: boolean[][];
    onPatternChange?: (pattern: boolean[][]) => void;
    currentStep?: number;
    isPlaying?: boolean;
    isInteractable?: boolean;
}

export function SplineScene({ pattern, onPatternChange, currentStep, isPlaying, isInteractable = true }: SplineSceneProps) {
    return (
        <div
            className={`w-full h-full relative bg-gray-900 rounded-lg overflow-hidden min-h-[400px] flex items-center justify-center border border-gray-800 ${!isInteractable ? 'pointer-events-none' : ''}`}
        >
            {/* @ts-ignore */}
            <spline-viewer url="https://prod.spline.design/R-BtReKfYEgLGrx4/scene.splinecode"></spline-viewer>
        </div>
    );
}
