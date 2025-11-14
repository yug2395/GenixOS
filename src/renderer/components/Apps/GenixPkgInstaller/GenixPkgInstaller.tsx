import React, { useEffect, useState } from 'react';

const STORAGE_KEY = 'genix-pkg-registry';

function loadLibraries(): string[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed.filter((item) => typeof item === 'string');
  } catch {
    return [];
  }
}

function saveLibraries(libraries: string[]) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(libraries));
  } catch {
    // ignore
  }
}

const GenixPkgInstaller: React.FC = () => {
  const [registry, setRegistry] = useState<string[]>(() => loadLibraries());
  const [command, setCommand] = useState('');
  const [log, setLog] = useState<string[]>([]);

  useEffect(() => {
    saveLibraries(registry);
  }, [registry]);

  const appendLog = (message: string) => {
    setLog((prev) => [message, ...prev]);
  };

  const installLibrary = (library: string) => {
    if (registry.some((item) => item.toLowerCase() === library.toLowerCase())) {
      appendLog(`Library "${library}" is already installed.`);
      return;
    }
    setRegistry((prev) => [...prev, library]);
    appendLog(`Installing library: ${library}\nDone.`);
  };

  const removeLibrary = (library: string) => {
    const initialLength = registry.length;
    setRegistry((prev) => prev.filter((item) => item.toLowerCase() !== library.toLowerCase()));
    if (registry.length === initialLength) {
      appendLog(`Library "${library}" is not installed.`);
    } else {
      appendLog(`Removed library: ${library}`);
    }
  };

  const handleCommand = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const raw = command.trim();
    if (!raw) {
      return;
    }

    const [action, ...rest] = raw.split(/\s+/);
    const argument = rest.join(' ');

    switch (action.toLowerCase()) {
      case 'install':
        if (!argument) {
          appendLog('Usage: install <library>');
        } else {
          installLibrary(argument);
        }
        break;
      case 'remove':
        if (!argument) {
          appendLog('Usage: remove <library>');
        } else {
          removeLibrary(argument);
        }
        break;
      case 'list':
        appendLog(
          registry.length
            ? `Installed libraries:\n${registry.map((item) => ` - ${item}`).join('\n')}`
            : 'No libraries installed.'
        );
        break;
      case 'help':
        appendLog('Commands: install <name>, remove <name>, list, help');
        break;
      default:
        appendLog(`Unknown command: ${action}`);
        break;
    }

    setCommand('');
  };

  return (
    <div className="w-full h-full bg-slate-900 text-white flex flex-col">
      <header className="px-6 py-4 border-b border-slate-700">
        <h1 className="text-2xl font-semibold">Package Installer</h1>
        <p className="text-sm text-slate-300">
          Simulate installing and removing C libraries. Use commands below or manage directly from
          the registry list.
        </p>
      </header>

      <main className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6 p-6 overflow-auto">
        <section className="bg-slate-800 border border-slate-700 rounded-lg p-4 flex flex-col">
          <h2 className="text-lg font-semibold mb-3">Registry</h2>
          {registry.length === 0 ? (
            <p className="text-sm text-slate-400 flex-1">No libraries installed.</p>
          ) : (
            <ul className="space-y-2 flex-1 overflow-auto">
              {registry.map((library) => (
                <li
                  key={library}
                  className="flex items-center justify-between bg-slate-900 rounded px-3 py-2 border border-slate-700"
                >
                  <span className="text-sm">{library}</span>
                  <button
                    type="button"
                    onClick={() => removeLibrary(library)}
                    className="text-xs px-3 py-1 rounded bg-red-600 hover:bg-red-500"
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="bg-slate-800 border border-slate-700 rounded-lg p-4 flex flex-col">
          <h2 className="text-lg font-semibold mb-3">Command Console</h2>
          <form onSubmit={handleCommand} className="flex gap-2 mb-4">
            <input
              value={command}
              onChange={(event) => setCommand(event.target.value)}
              placeholder="install stdio"
              className="flex-1 bg-slate-900 border border-slate-700 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-genix-yellow"
            />
            <button
              type="submit"
              className="px-4 py-2 rounded bg-genix-yellow text-slate-900 font-semibold"
            >
              Run
            </button>
          </form>
          <div className="flex-1 bg-slate-900 border border-slate-700 rounded p-3 overflow-auto font-mono text-sm space-y-3">
            {log.length === 0 ? (
              <div className="text-slate-500">Command output will appear here.</div>
            ) : (
              log.map((entry, index) => (
                <pre key={`${entry}-${index}`} className="whitespace-pre-wrap">
                  {entry}
                </pre>
              ))
            )}
          </div>
        </section>
      </main>
    </div>
  );
};

export default GenixPkgInstaller;

