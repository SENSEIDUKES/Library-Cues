# Library Cues

Library Cues is a premium, client-persistent audio synthesis and cue kit organizing application. It is designed as a custom atmospheric companion utility to the **[Light-Novels](https://github.com/SENSEIDUKES/Light-Novels)** repository, providing a curated sound-effects engine to generate, preview, and build custom audio packs and soundscapes to enrich immersive reading experiences.

---

## 📖 Companion App to Light-Novels

This application serves as a dedicated sound engine companion for readers, authors, and developers using the **[Light-Novels](https://github.com/SENSEIDUKES/Light-Novels)** workspace. 

When diving into atmospheric storytelling, custom-generated sound cues (like spell effects, combat clashing, wind rustling, sci-fi hums, or ambient drops) can dramatically enhance the reading immersion. Library Cues makes it effortless to:
- Generate highly tailored sound effects matching specific scene descriptions or themes from light novels.
- Audition and fine-tune multiple generated sound variations side-by-side.
- Organize sound cues into a custom-named "Saved Kit" library stored locally in the browser.
- Export entire curated cue packs directly as compressed ZIP archives to combine with reading apps or multimedia novel projects.

---

## ✨ Features

- **Prompt-to-SFX Synthesis Engine**: Powered by ElevenLabs' advanced audio synthesis API to produce highly detailed, customized sound effects from natural language prompts.
- **Side-by-Side Variations**: Every generation action synthesizes three concurrent, distinct audio variations to compare, audition, and pick from.
- **Precision Parameters**: Granular control over parameters like prompt influence, precise duration (seconds), and seamless loop generation.
- **Waveform Analytics & Player**: Powered by `wavesurfer.js` to render elegant, dynamic interactive waveforms with real-time tracking, speed playbacks, and audio controls.
- **User-Authored Saved Kits**: Persist your curated cues safely across sessions via `localStorage`. Rename individual sound files on-the-fly to construct structured soundboards.
- **Full ZIP Export**: Bundle and download your entire saved kit library instantly with a single click.

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
Before running, you must configure your API keys. Define them in a `.env` file at the root:

```env
# ElevenLabs API Key for generating high-quality sound effects
ELEVENLABS_API_KEY=your_eleven_labs_api_key

# Gemini API Key (Required for server environment)
GEMINI_API_KEY=your_gemini_api_key
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
