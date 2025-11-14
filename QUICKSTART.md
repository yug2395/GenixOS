# GENIX OS - Quick Start Guide

## 🚀 Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Setup Directories

```bash
bash scripts/setup.sh
```

This creates:
- `~/projects` - Your project files
- `~/genix-sandbox` - Compiled executables

### 3. Build C Engine

```bash
npm run build:c
```

### 4. Start Development

**Option A: Start Everything (Recommended)**

```bash
# Terminal 1: Start backend
npm run dev:backend

# Terminal 2: Start frontend dev server
npm run dev:renderer

# Terminal 3: Start Electron
npm run start:dev
```

**Option B: Build and Run**

```bash
npm run build
npm start
```

## 📁 Project Structure

```
genix/
├── src/
│   ├── main/              # Electron main process
│   └── renderer/          # React UI components
├── backend/               # Node.js WebSocket server
├── c-engine/             # C execution engine
└── dist/                 # Build output
```

## 🎮 Using GENIX OS

### Opening Apps

Click app icons in the taskbar:
- 💻 **GenixShell**: Terminal
- 📝 **GenixCode**: Code editor
- 🌐 **GenixCom**: Browser
- 📁 **GenixFiles**: File explorer
- ⚙️ **Settings**: Configuration

### Window Management

- **Drag**: Click and drag window header
- **Resize**: Drag bottom-right corner
- **Minimize**: Click yellow circle (left side)
- **Maximize**: Click white circle
- **Close**: Click yellow circle (far left)

### GenixCode

1. Open GenixCode
2. Write C/C++ code
3. Click "Run" button
4. View output in bottom panel

### GenixShell

1. Open GenixShell
2. Type commands: `ls`, `cd`, `mkdir`, `touch`, `cat`
3. Compile: `gcc filename.c`
4. Run: `./a.out`

## 🔧 Troubleshooting

### WebSocket Connection Failed
- Ensure backend is running: `npm run dev:backend`
- Check port 8080 is available

### C Compilation Failed
- Install GCC: `sudo apt-get install gcc` (Ubuntu)
- Check file permissions

### Build Errors
- Clear cache: `rm -rf dist node_modules`
- Reinstall: `npm install`

## 📚 Documentation

- [Architecture](ARCHITECTURE.md) - System design
- [Development](DEVELOPMENT.md) - Developer guide
- [README](README.md) - Project overview

## 🎨 Branding

- **Primary Color**: GENIX Blue (#00659D)
- **Accent Color**: Golden Yellow (#FFCA00)
- **Motto**: "The OS for Students, by Students"

## 🛠️ Next Steps

1. Add your GENIX logo to `assets/logo.png`
2. Customize wallpaper in `src/renderer/components/Desktop/Wallpaper.tsx`
3. Extend terminal commands in `backend/handlers/commandHandler.ts`
4. Add more apps in `src/renderer/components/Apps/`

Enjoy building with GENIX OS! 🎓

