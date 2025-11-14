# Development Guide

## Prerequisites

- Node.js 18+
- npm or yarn
- GCC compiler (for C engine)
- Linux (Ubuntu recommended)

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Build C engine:**
   ```bash
   npm run build:c
   ```

3. **Create directories:**
   ```bash
   bash scripts/setup.sh
   ```

## Development Workflow

### Start all services:

```bash
# Terminal 1: Backend server
npm run dev:backend

# Terminal 2: Frontend dev server
npm run dev:renderer

# Terminal 3: Electron app
npm run start:dev
```

Or use concurrently (if configured):
```bash
npm run dev
```

### Build for production:

```bash
npm run build
npm start
```

## Project Structure

```
genix/
├── src/
│   ├── main/              # Electron main process
│   └── renderer/          # React UI
│       ├── components/
│       │   ├── Desktop/   # Desktop shell
│       │   ├── WindowManager/  # Window management
│       │   └── Apps/      # Application components
│       └── types/         # TypeScript types
├── backend/               # Node.js backend
│   ├── server.ts         # WebSocket server
│   └── handlers/         # Message handlers
├── c-engine/             # C execution engine
│   ├── main.c
│   ├── shell.c
│   └── vfs.c
└── dist/                 # Build output
```

## Adding New Features

### Adding a New App

1. Create component in `src/renderer/components/Apps/YourApp/`
2. Add to Taskbar apps array
3. Implement WebSocket communication if needed

### Adding a New Command

1. Add handler in `backend/handlers/commandHandler.ts`
2. Update terminal UI to handle the command
3. Test with GenixShell

## Debugging

- **Electron**: Use DevTools (automatically opens in dev mode)
- **Backend**: Check console output
- **C Engine**: Compile with debug flags: `gcc -g`

## Testing

- Manual testing through UI
- WebSocket messages can be tested with `wscat`:
  ```bash
  wscat -c ws://localhost:8080
  ```

## Troubleshooting

### WebSocket connection fails
- Ensure backend server is running on port 8080
- Check firewall settings

### C compilation fails
- Ensure GCC is installed: `gcc --version`
- Check file permissions in sandbox directory

### Window manager issues
- Check browser console for errors
- Verify z-index calculations

