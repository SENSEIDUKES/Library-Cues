# Library Cues

Library Cues is a premium, client-persistent audio synthesis and cue kit organizing application. It is designed as a custom atmospheric companion utility to the **[Light-Novels](https://github.com/SENSEIDUKES/Light-Novels)** repository, providing a curated sound-effects engine to generate, preview, and build custom audio packs and soundscapes to enrich immersive reading experiences.

---

## 📖 Companion App to Light-Novels

This application serves as a dedicated sound engine companion for readers, authors, and developers using the **[Light-Novels](https://github.com/SENSEIDUKES/Light-Novels)** workspace. 

When diving into atmospheric storytelling, custom-generated sound cues (like spell effects, combat clashing, wind rustling, sci-fi hums, or ambient drops) can dramatically enhance the reading immersion. Library Cues makes it effortless to:
- Generate highly tailored sound effects matching specific scene descriptions or themes from light novels.
- Audition and fine-tune multiple generated sound variations side-by-side.
- Classify generated audio as structured, Light-Novels-compatible cue assets stored locally in the browser.
- Export approved cues—or an explicit selection of candidates—as a manifest-backed cue kit.

---

## ✨ Features

- **Prompt-to-SFX Synthesis Engine**: Powered by ElevenLabs' advanced audio synthesis API to produce highly detailed, customized sound effects from natural language prompts.
- **Audio Processing**: Fine-tune generated audio with features to automatically trim silence, normalize loudness (EBU R128), and apply precise fade-in/fade-out transitions. Includes full undo support.
- **Side-by-Side Variations**: Every generation action synthesizes three concurrent, distinct audio variations to compare, audition, and pick from.
- **Precision Parameters**: Granular control over parameters like prompt influence, precise duration (seconds), and seamless loop generation.
- **Waveform Analytics & Player**: Powered by `wavesurfer.js` to render elegant, dynamic interactive waveforms with real-time tracking, speed playbacks, and audio controls.
- **Structured Cue Curation**: Review identity, playback, narrative matching, category-specific metadata, provenance, and approval state before a generated variation enters the library.
- **IndexedDB Persistence**: Persist audio and metadata safely across sessions, with an idempotent migration for legacy `localStorage` and loose IndexedDB records.
- **Manifest Cue-Kit Export**: Export `library-cues-kit/audio/*` plus `library-cues-kit/cue-manifest.json`; full export defaults to approved cues, while explicit selections may include candidates.

---

## 🛠️ Tech Stack

- **Frontend**: React 19, TypeScript, Vite
- **Styling**: Tailwind CSS
- **Animations**: Motion (framer-motion)
- **Audio Rendering**: WaveSurfer.js
- **Data Packaging**: JSZip & FileSaver.js
- **Backend Service**: Node.js & Express (Vite development middleware proxying ElevenLabs API)

---

## 🚀 Setup & Execution

### Prerequisite Environment Variables
Before running, you must configure your API keys. Define them in a `.env.local` file at the root (or use `.env`); the server loads either file and never exposes the key to the browser:

```env
# ElevenLabs API Key for generating high-quality sound effects
ELEVENLABS_API_KEY=your_eleven_labs_api_key

```

### Installation

Install all required dependencies:
```bash
npm install
```

### Running in Development

Start the development server with Vite:
```bash
npm run dev
```

The application will bind to `http://localhost:3000`.

### Building for Production

Compile the production builds:
```bash
npm run build
```

And start the compiled custom full-stack server:
```bash
npm run start
```
