import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { GENIX_BOT_URL } from '../../../config';

type MessageRole = 'user' | 'bot';
type MessageStatus = 'loading' | 'error' | 'complete';

interface Message {
  id: string;
  role: MessageRole;
  text: string;
  status: MessageStatus;
}

const createMessage = (role: MessageRole, text: string, status: MessageStatus = 'complete'): Message => ({
  id: `${role}-${Date.now()}-${Math.random().toString(16).slice(2)}`,
  role,
  text,
  status,
});

const GenixBot: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [messages, setMessages] = useState<Message[]>(() => [
    createMessage(
      'bot',
      "Hi, I'm GenixBot. Ask me anything about coding or your Genix OS workspace!",
      'complete'
    ),
  ]);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'checking' | 'connected' | 'disconnected'>('checking');
  const containerRef = useRef<HTMLDivElement>(null);

  // Check connection status on mount
  useEffect(() => {
    const checkConnection = async () => {
      try {
        // Try a simple OPTIONS request to check if server is reachable
        const response = await fetch(GENIX_BOT_URL, {
          method: 'OPTIONS',
        });
        setConnectionStatus(response.status === 204 || response.ok ? 'connected' : 'disconnected');
      } catch (err) {
        setConnectionStatus('disconnected');
        setError('Cannot connect to GenixBot server. Make sure the backend is running on port 5000.');
      }
    };

    checkConnection();
  }, [GENIX_BOT_URL]);

  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  }, [messages]);

  const sendPrompt = useCallback(
    async (rawPrompt: string) => {
      const trimmed = rawPrompt.trim();
      if (!trimmed || isSending) {
        return;
      }

      const userMessage = createMessage('user', trimmed);
      const placeholder = createMessage('bot', 'Thinking...', 'loading');
      setMessages((prev) => [...prev, userMessage, placeholder]);
      setPrompt('');
      setIsSending(true);
      setError(null);

      try {
        const response = await fetch(GENIX_BOT_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt: trimmed }),
        });

        if (!response.ok) {
          const text = await response.text();
          throw new Error(`GenixBot request failed (${response.status}): ${text || 'No response body'}`);
        }

        const data = await response.json();
        const replyText = typeof data?.response === 'string' && data.response.trim()
          ? data.response.trim()
          : 'GenixBot responded without text.';

        setMessages((prev) =>
          prev.map((message) =>
            message.id === placeholder.id
              ? { ...message, text: replyText, status: 'complete' }
              : message
          )
        );
        setConnectionStatus('connected');
        setError(null);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Unknown error contacting GenixBot.';
        setError(message);
        setConnectionStatus('disconnected');
        setMessages((prev) =>
          prev.map((item) =>
            item.id === placeholder.id
              ? { ...item, text: `Error: ${message}`, status: 'error' }
              : item
          )
        );
      } finally {
        setIsSending(false);
      }
    },
    [GENIX_BOT_URL, isSending]
  );

  const handleSubmit = useCallback(
    (event: React.FormEvent) => {
      event.preventDefault();
      sendPrompt(prompt);
    },
    [prompt, sendPrompt]
  );

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        sendPrompt(prompt);
      }
    },
    [prompt, sendPrompt]
  );

  const statusMessage = useMemo(() => {
    if (connectionStatus === 'checking') {
      return 'Checking connection...';
    }
    if (connectionStatus === 'disconnected') {
      return 'Connection lost. Make sure the backend server is running on port 5000.';
    }
    if (isSending) {
      return 'Waiting for GenixBot...';
    }
    if (error) {
      return `Last error: ${error}`;
    }
    return 'Ready for your next prompt.';
  }, [isSending, error, connectionStatus]);

  return (
    <div className="flex h-full w-full flex-col bg-slate-950 text-white">
      <header className="border-b border-slate-800 bg-slate-900 px-4 py-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-genix-yellow">GenixBot Assistant</h1>
            <p className="text-xs text-slate-300">
              Send prompts to the Gemini-powered backend. Use Ctrl+Enter (or Cmd+Enter) to submit quickly.
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <div
              className={`h-3 w-3 rounded-full ${
                connectionStatus === 'connected'
                  ? 'bg-green-500'
                  : connectionStatus === 'checking'
                  ? 'bg-yellow-500 animate-pulse'
                  : 'bg-red-500'
              }`}
              title={
                connectionStatus === 'connected'
                  ? 'Connected'
                  : connectionStatus === 'checking'
                  ? 'Checking...'
                  : 'Disconnected'
              }
            />
            <span className="text-xs text-slate-400">
              {connectionStatus === 'connected'
                ? 'Connected'
                : connectionStatus === 'checking'
                ? 'Checking...'
                : 'Disconnected'}
            </span>
          </div>
        </div>
      </header>

      <div ref={containerRef} className="flex-1 space-y-4 overflow-y-auto bg-slate-950 p-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`max-w-3xl rounded-lg px-4 py-3 text-sm leading-relaxed shadow ${
              message.role === 'user'
                ? 'ml-auto bg-genix-blue text-white'
                : message.status === 'error'
                ? 'bg-red-900/60 text-red-200 border border-red-500/40'
                : 'bg-slate-800 text-slate-100 border border-slate-700'
            }`}
          >
            <div className="mb-1 text-xs uppercase tracking-wider opacity-70">
              {message.role === 'user' ? 'You' : 'GenixBot'}
              {message.status === 'loading' ? ' • typing…' : ''}
            </div>
            <div className="whitespace-pre-wrap">{message.text}</div>
          </div>
        ))}
      </div>

      <footer className="border-t border-slate-800 bg-slate-900/80 p-4 backdrop-blur">
        <form onSubmit={handleSubmit} className="flex flex-col space-y-3">
          <textarea
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask GenixBot something…"
            rows={3}
            className="w-full resize-none rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-white outline-none transition focus:border-genix-yellow focus:ring-2 focus:ring-genix-yellow/40"
          />
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400">{statusMessage}</span>
            <button
              type="submit"
              disabled={isSending || !prompt.trim() || connectionStatus !== 'connected'}
              className="rounded-lg bg-genix-yellow px-4 py-2 text-sm font-semibold text-genix-blue transition hover:bg-yellow-400 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
            >
              {isSending ? 'Sending…' : connectionStatus !== 'connected' ? 'Not Connected' : 'Send to GenixBot'}
            </button>
          </div>
        </form>
      </footer>
    </div>
  );
};

export default GenixBot;

