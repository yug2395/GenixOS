import React, { useState } from 'react';

const DEGREE_FUNCTIONS = new Set(['sin', 'cos', 'tan']);

function evaluateExpression(raw: string): { success: boolean; message: string } {
  try {
    const normalized = raw
      .replace(/\bpi\b/gi, `${Math.PI}`)
      .replace(/(\d+)!/g, (_, value: string) => {
        const n = Number(value);
        if (!Number.isInteger(n) || n < 0 || n > 20) {
          throw new Error('Factorial supports integers between 0 and 20.');
        }
        let result = 1;
        for (let i = 2; i <= n; i += 1) {
          result *= i;
        }
        return result.toString();
      })
      .replace(/(\w+)\s*\(/g, (match, fn: string) => {
        const lower = fn.toLowerCase();
        if (DEGREE_FUNCTIONS.has(lower)) {
          return `GENIX_DEG_${lower}(`;
        }
        return `Math.${lower}(`;
      });

    const scope = {
      GENIX_DEG_sin: (value: number) => Math.sin((value * Math.PI) / 180),
      GENIX_DEG_cos: (value: number) => Math.cos((value * Math.PI) / 180),
      GENIX_DEG_tan: (value: number) => Math.tan((value * Math.PI) / 180),
      sqrt: Math.sqrt,
      log: Math.log,
      pow: Math.pow,
    };

    // eslint-disable-next-line no-new-func
    const fn = new Function(
      ...Object.keys(scope),
      `"use strict"; return (${normalized});`
    );
    const result = fn(...Object.values(scope));
    if (typeof result !== 'number' || Number.isNaN(result) || !Number.isFinite(result)) {
      throw new Error('Expression result is not a finite number.');
    }
    return { success: true, message: result.toFixed(4) };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unable to evaluate expression.',
    };
  }
}

const GenixCalculator: React.FC = () => {
  const [history, setHistory] = useState<{ input: string; output: string; success: boolean }[]>([]);
  const [input, setInput] = useState('');

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = input.trim();
    if (!trimmed) {
      return;
    }

    if (trimmed.toLowerCase() === 'exit') {
      setHistory([]);
      setInput('');
      return;
    }

    const evaluation = evaluateExpression(trimmed);
    setHistory((prev) => [
      { input: trimmed, output: evaluation.message, success: evaluation.success },
      ...prev,
    ]);
    setInput('');
  };

  return (
    <div className="w-full h-full bg-slate-900 text-white flex flex-col">
      <header className="px-4 py-3 border-b border-slate-700">
        <h1 className="text-xl font-semibold">Scientific Calculator</h1>
        <p className="text-sm text-slate-300">
          Supports +, -, ×, ÷, ^, !, sin, cos, tan, log, sqrt. Use degrees for trig functions.
        </p>
      </header>

      <main className="flex-1 overflow-auto px-4 py-3 space-y-4">
        {history.length === 0 && (
          <div className="text-slate-400 text-sm">
            Enter an expression below and press Enter. Type <code>exit</code> to clear history.
          </div>
        )}
        <ul className="space-y-3">
          {history.map((entry, index) => (
            <li
              key={`${entry.input}-${index}`}
              className="bg-slate-800 rounded-lg p-3 border border-slate-700"
            >
              <div className="text-slate-300 font-mono text-sm">› {entry.input}</div>
              <div
                className={`mt-2 text-lg font-semibold ${
                  entry.success ? 'text-genix-yellow' : 'text-red-400'
                }`}
              >
                {entry.success ? `= ${entry.output}` : `Error: ${entry.output}`}
              </div>
            </li>
          ))}
        </ul>
      </main>

      <form onSubmit={handleSubmit} className="border-t border-slate-700 p-3 bg-slate-950">
        <input
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="Enter expression (e.g. sin(90) + log(10))"
          className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:ring-2 focus:ring-genix-yellow"
        />
      </form>
    </div>
  );
};

export default GenixCalculator;

