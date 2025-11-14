# GENIX OS - Running Status

## ✅ Services Started

### 1. Backend WebSocket Server
- **Port**: 8080
- **Status**: Running
- **Location**: `dist/backend/server.js`
- **Purpose**: Handles WebSocket connections for terminal, file operations, and build commands

### 2. Frontend Dev Server
- **Port**: 3000
- **Status**: Running
- **URL**: http://localhost:3000
- **Purpose**: Serves React application with hot reload

### 3. Electron Application
- **Status**: Running (should open window)
- **Purpose**: Desktop environment for GENIX OS

## 🎮 How to Use

1. **Electron Window**: The GENIX OS desktop should open automatically
2. **Taskbar Apps**: Click app icons at the bottom:
   - 💻 GenixShell - Terminal
   - 📝 GenixCode - Code Editor
   - 🌐 GenixCom - Browser
   - 📁 GenixFiles - File Explorer
   - ⚙️ Settings - Configuration

## 🔧 Troubleshooting

### If Electron window doesn't open:
```bash
# Check if Electron process is running
ps aux | grep electron

# Manually start Electron
cd /Users/yugrajput/Desktop/genix
NODE_ENV=development npm run start:dev
```

### If backend connection fails:
```bash
# Check backend status
lsof -ti:8080

# Restart backend
npm run start:backend
```

### If frontend doesn't load:
```bash
# Check frontend status
lsof -ti:3000

# Restart frontend
npm run dev:renderer
```

## 🛑 Stopping Services

To stop all services:
```bash
# Kill all Node processes
pkill -f "node.*server.js"
pkill -f "webpack"
pkill -f "electron"

# Or kill by port
lsof -ti:8080 | xargs kill
lsof -ti:3000 | xargs kill
```

## 📝 Development Notes

- Backend logs to console - check terminal output
- Frontend has hot reload - changes update automatically
- Electron DevTools open automatically in dev mode
- WebSocket connection: `ws://localhost:8080`

## 🎨 Next Steps

1. Test GenixShell - Try commands like `ls`, `pwd`
2. Test GenixCode - Write C code and click Run
3. Test GenixFiles - Browse project files
4. Test GenixCom - Visit allowed websites
5. Customize Settings - Change wallpaper theme

Enjoy GENIX OS! 🚀

