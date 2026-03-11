# Harmonic Geometry

Harmonic Geometry is an interactive web application designed for exploring music theory, harmony, and the visual relationships between musical notes. Created as a "Midlife Muso" tool, it provides an ear-first, highly visual approach to understanding chords, scales, intervals, and playing instruments.

## 🎵 Features

- **Interactive Visualizations**: 
  - **Pitch Clock**: See the geometric relationships of chords and scales on a circular graph.
  - **Piano Keyboard & Guitar Fretboard**: See how harmonies lock into physical instruments.
  - **Staff Notation**: View chords and scales on traditional sheet music.
- **Deep Harmonic Analysis**:
  - **Cadence Explorer**: Analyze voice leading and movement between chords.
  - **Harmonic Context**: See how chords function within a given scale or key.
  - **Dissonance Spectrum**: Measure the tension and intervals within any chord.
- **Advanced Controls**:
  - Toggle between different labeling modes: Notes, Intervals, Solfège, Scale Degrees, and Semitones.
  - Explore chord inversions and drop voicings.
  - "Lock" either the Scale or the Chord Quality to constrain your exploration to diatonic chords or parallel harmony.
- **MIDI Integration**: Connect a MIDI keyboard to play and instantly identify chords and intervals on screen.

## 🛠️ Technologies Used

This project is built with a modern React stack:

- **Framework**: [React](https://reactjs.org/) + [Vite](https://vitejs.dev/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **UI Components**: [shadcn/ui](https://ui.shadcn.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **State Management**: React Context (`HarmonyContext`)

## 🚀 Getting Started

To run this project locally on your machine, follow these steps:

### Prerequisites

You will need [Node.js](https://nodejs.org/) (which comes with npm) installed on your system.

### Installation

1. Clone the repository:
   ```bash
   git clone <YOUR_REPO_URL>
   cd harmony-geometry
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open your browser and navigate to `http://localhost:5173`.

## 📦 Building for Production

To create a production-ready build, run:
```bash
npm run build
```
The compiled assets will be placed in the `dist` directory, ready to be deployed to your hosting provider of choice.

## 🔗 Links and Resources

- **Midlife Muso Home**: [midlifemuso.com](https://midlifemuso.com)
- **Learning Resources**: [midlifemuso.com/learning](https://midlifemuso.com/learning)
- **About the Creator**: [midlifemuso.com/about-me](https://midlifemuso.com/about-me)
