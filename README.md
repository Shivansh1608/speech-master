# 🎙️ VoxScribe Studio — Intelligent Voice to Text

> A next-generation, browser-based voice dictation and speech intelligence studio built with React, Web Speech API, and a modern dark glassmorphic design system.

---

## ✨ Key Features

- **🎙️ Real-time Speech Recognition**: High-accuracy voice transcription powered by the Web Speech API with live continuous listening.
- **🎨 Dark Glassmorphic Studio UI**: Sleek frosted glass aesthetics, ambient glowing gradients, and custom responsive layouts.
- **📊 Live Audio Visualizer**: 12 dynamic bouncing equalizer sound wave bars indicating active microphone input.
- **🌍 Multi-Language Support**: Seamlessly switch between 13 global languages (English US/UK/India, Hindi, Spanish, French, German, Japanese, Chinese, Arabic, and more).
- **📝 Real-time Editable Canvas**: Freely edit, correct words, and format text directly in the dictation box during or after recording.
- **📈 Live Text Analytics**: Real-time word count, character count, and estimated reading time.
- **🔊 Text-to-Speech (Listen Back)**: Hear your notes read back to you with integrated browser speech synthesis.
- **📁 Dictation History**: Auto-saves past transcripts locally (`localStorage`) with timestamps, language indicators, and word counts.
- **💾 Export & Download**: Export transcripts to `.txt` or `.md` (Markdown) with a single click.
- **🗣️ Spoken Voice Commands**:
  - Say `"clear"` — clears the canvas.
  - Say `"reset"` — resets the speech recognizer.
  - Say `"stop listening"` — stops recording hands-free.

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v16+)
- Google Chrome, Microsoft Edge, or any Chromium-based browser (for Web Speech API support).

### Installation & Run

1. Clone or download the repository:
   ```bash
   cd speech-master
   ```

2. Install dependencies:
   ```bash
   npm install --legacy-peer-deps
   ```

3. Launch the development server:
   ```bash
   npm start
   ```

4. Open your browser and navigate to:
   ```
   http://localhost:3000
   ```

---

## 🛠️ Tech Stack

- **Framework**: [React 18](https://reactjs.org/)
- **Voice Recognition**: [`react-speech-recognition`](https://github.com/JamesBrill/react-speech-recognition)
- **Styling**: Vanilla CSS (Custom tokens, glassmorphism, responsive flex/grid layouts)
- **Typography**: [Google Fonts](https://fonts.google.com/) (*Outfit* & *JetBrains Mono*)
- **Storage**: Browser `localStorage`


live on vercel:https://speech-master-murex.vercel.app/
