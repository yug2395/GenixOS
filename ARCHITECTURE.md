# GENIX OS Architecture

## Overview

GENIX OS follows a three-tier architecture:

```
React UI (Electron) <-> WebSocket (Node.js) <-> C Execution Engine <-> Linux
```

## Components

### Frontend (React + Electron)

- **Desktop Shell**: Wallpaper, taskbar, window manager
- **Window Manager**: Drag, resize, minimize, focus stacking
- **Apps**:
  - GenixShell: Terminal UI with xterm.js
  - GenixCode: IDE with Monaco Editor
  - GenixCom: Browser with iframe
  - GenixFiles: File explorer
  - Settings: Configuration UI

### Backend (Node.js + WebSocket)

- **WebSocket Server**: Handles real-time communication
- **Message Protocol**: JSON-based (P1)
- **Handlers**:
  - Command Handler: Terminal commands (ls, cd, mkdir, etc.)
  - File Handler: File operations (read, write, list)
  - Build Handler: Compile and run C/C++ code

### C Execution Engine

- **Shell**: Simulated shell commands
- **VFS**: Virtual File System operations
- **Compiler Runner**: GCC/G++ invocation

## Message Protocol

### Command Messages

```json
{
  "type": "command",
  "action": "ls",
  "path": "."
}
```

### File Messages

```json
{
  "type": "file",
  "action": "read",
  "path": "main.c"
}
```

### Build Messages

```json
{
  "type": "build",
  "action": "compile",
  "file": "main.c"
}
```

## Directory Structure

- `/home/user/projects`: User project files
- `/home/genix-sandbox`: Compiled executables and runtime

## Security

- Sandboxed execution environment
- Path validation to prevent directory traversal
- Domain whitelist for browser
- Resource limits (future)

