# 🎯 Coachify

**Your AI-Powered Real-Time Assistant**

*Talk, share your screen, and get intelligent guidance on anything*

[![React](https://img.shields.io/badge/React-19.2-61DAFB?logo=react&logoColor=white)](https://reactjs.org/)
[![Gemini](https://img.shields.io/badge/Gemini-3-4285F4?logo=google&logoColor=white)](https://ai.google.dev/)
[![Gemini](https://img.shields.io/badge/Gemini-2.5_Flash-4285F4?logo=google&logoColor=white)](https://ai.google.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-6.2-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)

</div>

---

## ✨ What is Coachify?

Coachify is a **real-time AI assistant** powered by Google's Gemini 2.5 Flash with native audio capabilities. It can see your screen, hear your voice, and provide intelligent guidance on virtually anything — from coding and design to learning and troubleshooting.

### 🔥 Key Features

| Feature | Description |
|---------|-------------|
| 🎙️ **Voice Conversation** | Natural, real-time voice interaction with AI |
| 🖥️ **Screen Sharing** | Share your screen for context-aware assistance |
| 💻 **Smart Code Generation** | Request code snippets by voice — appears in a dedicated panel |
| 🌓 **Dark/Light Mode** | Beautiful adaptive UI with theme persistence |
| ⚡ **Low Latency** | Powered by Gemini's native audio streaming |

---

## 🎬 How It Works

1. **Start a Session** — Click "Start Coaching" to connect with the AI
2. **Set Your Goal** — Optionally describe what you want to accomplish
3. **Talk Naturally** — Just speak! The AI listens and responds in real-time
4. **Share Your Screen** — Let the AI see what you're working on for better context
5. **Request Code** — Ask for code examples and they'll appear in the code panel

---

## 🛠️ Tech Stack

- **Frontend:** React 19 + TypeScript
- **AI Engine:** 
  - **Code Generation:** Google Gemini 3 (Text/Code)
  - **Audio Capture:** Google Gemini 2.5 Flash
- **Build Tool:** Vite 6
- **Styling:** Tailwind CSS
- **Audio:** Web Audio API with PCM streaming

---

## 🚀 Quick Start

### Prerequisites
- Node.js (v18 or higher recommended)
- A [Gemini API Key](https://aistudio.google.com/app/apikey)

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/Coachify.git
cd Coachify

# Install dependencies
npm install

# Set your API key
# Edit .env.local and add your Gemini API key:
# GEMINI_API_KEY=your_api_key_here

# Run the development server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 📁 Project Structure

```
Coachify/
├── App.tsx              # Main application component
├── index.tsx            # React entry point
├── types.ts             # TypeScript type definitions
├── hooks/
│   └── useLiveCoach.ts  # Core hook for Gemini Live API integration
├── components/
│   ├── CoachPanel.tsx   # Chat & code display panel
│   ├── ContextPanel.tsx # Goal input & screen preview
│   ├── ControlBar.tsx   # Session controls (start, stop, mute, share)
│   ├── CodeBlock.tsx    # Syntax-highlighted code display
│   └── icons/           # SVG icon components
└── services/
    └── audioService.ts  # PCM audio encoding/decoding utilities
```

---

## 🎨 Features in Detail

### 🎙️ Voice-First Experience
Coachify uses Gemini's native audio capabilities for ultra-low latency voice conversations. Just speak naturally — no buttons to hold!

### 🖥️ Screen Awareness
Share your screen and the AI automatically captures frames when you speak, providing contextual help based on what you're looking at.

### 💡 Intelligent Code Generation
When you ask for code, the AI generates it separately and displays it in a dedicated code panel with syntax highlighting — keeping the conversation clean.

### 🎯 Goal-Oriented Sessions
Set a learning goal at the start of your session, and the AI tailors its responses to help you progress toward that objective.

---

## 🔑 Environment Variables

| Variable | Description |
|----------|-------------|
| `GEMINI_API_KEY` | Your Google Gemini API key (required) |

---

## 📜 License

MIT License

Copyright (c) 2026 Coachify Team

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

---

<div align="center">

**Built with ❤️ using Google Gemini**

[Report Bug](https://github.com/yourusername/Coachify/issues) · [Request Feature](https://github.com/yourusername/Coachify/issues)

</div>
