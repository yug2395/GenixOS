# GENIX OS

**The OS for Students, by Students**

GENIX OS is a university-themed desktop operating system simulation, developed to provide students with a real OS-like experience with a fully custom branded UI.

## Features

- 🖥️ Custom Desktop Environment with GENIX branding
- 🪟 Window Manager with drag, resize, and minimize
- 💻 GenixShell - Simulated Terminal with C backend
- 📝 GenixCode - IDE with Monaco Editor, compile & run
- 🌐 GenixCom - Browser with domain whitelist
- 📁 File Explorer scoped to project directory
- ⚙️ Settings & Profile management

## Tech Stack

- **Frontend**: React + TypeScript + Tailwind CSS
- **Shell**: Electron
- **Backend**: Node.js + WebSocket
- **Execution Engine**: C (GCC)
- **Base OS**: Linux (Ubuntu Minimal)

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- GCC compiler
- Linux (Ubuntu recommended)

### Installation

```bash
npm install
```

### Development

```bash
# Build C engine
npm run build:c

# Start development servers
npm run dev

# In another terminal, start Electron
npm run start:dev
```

### Production Build

```bash
npm run build
npm start
```

## Project Structure

```
genix/
├── src/
│   ├── main/           # Electron main process
│   └── renderer/       # React UI
├── backend/            # Node.js WebSocket server
├── c-engine/           # C execution engine
├── assets/             # Images, icons, branding
└── dist/               # Build output
```

## Architecture

```
React UI (Electron) <-> WebSocket (Node.js) <-> C Execution Engine <-> Linux
```

## License

MIT

