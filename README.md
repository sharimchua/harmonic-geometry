# Harmonic Geometry

Harmonic Geometry is an interactive web application designed for exploring music theory, harmony, and the visual relationships between musical notes. Created as a "Midlife Muso" tool, it provides an ear-first, highly visual approach to understanding chords, scales, intervals, and playing instruments.

## 🎵 Features

![Pitch Clock Demonstration](docs/assets/pitch_clock_demo.webp)

- **Interactive Visualizations**: 
  - **Pitch Clock**: See the geometric relationships of chords and scales on a circular graph. The visualization updates in real-time as you change the root note, scale type, or label mode, making harmonic patterns instantly recognizable.
  - **Piano Keyboard & Guitar Fretboard**: See how harmonies lock into physical instruments. The instruments dynamically highlight active chord degrees and calculate valid guitar voicings on the fly relative to the current key.
  - **Staff Notation**: View chords and scales on traditional sheet music.
- **Deep Harmonic Analysis**:
  - **Cadence Explorer**: Analyze voice leading and movement between chords.
  - **Harmonic Context**: See how chords function within a given scale or key.
  - **Dissonance Spectrum**: Measure the tension and intervals within any chord. Watch this alongside the Staff Notation to understand how theoretical tension translates to notation.
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

## 📚 Third-Party Attributions

This project relies on several fantastic open-source libraries and assets. We'd like to acknowledge and thank the creators of:

### Libraries
- **[React](https://reactjs.org/)**: Released under the MIT License.
- **[Vite](https://vitejs.dev/)**: Released under the MIT License.
- **[Tailwind CSS](https://tailwindcss.com/)**: Released under the MIT License.
- **[shadcn/ui](https://ui.shadcn.com/)**: Released under the MIT License.
- **[Radix UI](https://www.radix-ui.com/)**: Released under the MIT License.
- **[Lucide React](https://lucide.dev/)** (Icons): Released under the ISC License.
- **[React Router](https://reactrouter.com/)**: Released under the MIT License.
- **[TanStack Query](https://tanstack.com/query)**: Released under the MIT License.
- **[Embla Carousel](https://www.embla-carousel.com/)**: Released under the MIT License.
- **[Recharts](https://recharts.org/)**: Released under the MIT License.
- **[date-fns](https://date-fns.org/)**: Released under the MIT License.
- **[Zod](https://zod.dev/)**: Released under the MIT License.
- **[Sonner](https://sonner.emilkowal.ski/)**: Released under the MIT License.
- **[Vaul](https://vaul.emilkowal.ski/)**: Released under the MIT License.
- **[react-day-picker](https://react-day-picker.js.org/)**: Released under the MIT License.

### Fonts
This project uses **[JetBrains Mono](https://www.jetbrains.com/lp/mono/)**, released under the SIL Open Font License (OFL) 1.1.

### Assets
- **Logo/Icon**: The Midlife Muso icon (`midlife-muso-icon.webp`) is proprietary to Midlife Muso and is used with permission.

## 📄 License

These projects are released under the MIT License.

I have chosen this permissive license to ensure that these tools remain as accessible as possible. You are free to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the software, provided that the original copyright notice and this permission notice are included in all copies or substantial portions of the software.

The MIT License (MIT)

Copyright (c) 2026 Sharim Chua

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.