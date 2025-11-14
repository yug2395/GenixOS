# GENIX OS - Server Commands Guide

## 🚀 Starting Servers

### Option 1: Start Everything (Recommended)
```bash
npm run dev
```
This starts:
- ✅ Frontend (webpack dev server on port 3000)
- ✅ Backend (WebSocket server on port 18080)  
- ✅ Electron main process (watches for changes)

### Option 2: Start Separately (More Control)
**Terminal 1 - Frontend:**
```bash
npm run dev:renderer
```

**Terminal 2 - Backend:**
```bash
npm run dev:backend
```

**Terminal 3 - Electron (if not using Option 1):**
```bash
npm run start:dev
```

---

## 🛑 Stopping Servers

### If you started with `npm run dev`:
- Press **`Ctrl + C`** in the terminal
- This stops all processes at once

### If you started separately:
- Press **`Ctrl + C`** in each terminal window
- Stop them in any order

### Force Stop (if servers are stuck):
```bash
# Windows PowerShell
Get-Process -Name node | Stop-Process -Force
```

---

## 📋 Quick Reference

| Command | What it does |
|---------|-------------|
| `npm run dev` | Start everything (frontend + backend + electron) |
| `npm run dev:renderer` | Start only frontend |
| `npm run dev:backend` | Start only backend |
| `npm run start:dev` | Start Electron app |
| `Ctrl + C` | Stop current process |

---

## 🔍 Check Server Status

### Check if servers are running:
```bash
# Windows PowerShell
Get-Process -Name node
```

### Check ports:
- **Frontend**: http://localhost:3000
- **Backend WebSocket**: ws://localhost:18080

---

## 💡 Tips

1. **Always stop servers properly** with `Ctrl + C` before closing terminal
2. **If ports are in use**, use the force stop command above
3. **Frontend auto-reloads** when you change code
4. **Backend needs restart** if you change backend code (it watches TypeScript files)

---

## 🐛 Troubleshooting

### Port already in use?
```bash
# Stop all Node processes
Get-Process -Name node | Stop-Process -Force

# Then restart
npm run dev
```

### Can't connect to backend?
- Make sure backend is running: `npm run dev:backend`
- Check port 18080 is not blocked
- Check console for errors

### Frontend not loading?
- Make sure frontend is running: `npm run dev:renderer`
- Check port 3000 is not blocked
- Hard refresh browser: `Ctrl + Shift + R`

