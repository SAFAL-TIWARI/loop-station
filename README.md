# Music Creation Tool

A modern, web-based music production environment built with React and Tone.js. This tool offers a comprehensive suite for creating music directly in the browser, featuring a synthesizer, drum sequencer, and multi-track timeline.

[**🚀 Live Demo**](https://loop-station.netlify.app/) · [**🎨 View Figma Prototype**](https://board-ninth-61136515.figma.site)

## Key Features

- **Synthesizer**: Playable instruments including Guitar, Harmonium, Tabla, Dholak, and Flute. Features ADSR envelope controls and customizable presets.
- **Drum Sequencer**: Pattern-based beat creation with an intuitive grid interface.
- **Multi-Track Timeline**: Arrange and compose your tracks with real-time playback synchronization and scrubbing.
- **Effects Integration**: Drag-and-drop effects panel for audio processing.
- **Export Capabilities**: Export your compositions to audio files using FFmpeg.

## Tech Stack

- **Frontend**: React, TypeScript, Vite
- **Styling**: Tailwind CSS, Radix UI
- **Audio Engine**: Tone.js
- **Processing**: FFmpeg.wasm

## Getting Started

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Start Development Server**
   ```bash
   npm run dev
   ```

## Project Structure

- `src/app/components`: Core application components (Synthesizer, Timeline, etc.)
- `src/app/hooks`: Custom React hooks
- `src/app/utils`: Utility functions and helpers

---
*Based on the [original design](https://www.figma.com/design/AQzdjRR1GHULkagHqnCrvB/Music-Creation-Tool)*