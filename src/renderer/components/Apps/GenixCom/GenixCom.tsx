import React, { useState, useEffect, useRef } from 'react';

const ALLOWED_DOMAINS = [
  'localhost',
  '127.0.0.1',
  'github.com',
  'stackoverflow.com',
  'w3schools.com',
  'docs.python.org',
  'cppreference.com',
  // Sites that typically allow iframe embedding
  'example.com',
  'httpbin.org',
  'jsonplaceholder.typicode.com',
  'httpstat.us',
  'reqres.in',
  'dummyjson.com',
  'fakerjs.dev',
  'developer.mozilla.org',
  'www.w3.org',
  'validator.w3.org',
  'jsfiddle.net',
  'codepen.io',
  'repl.it',
  'codesandbox.io',
];

const GenixCom: React.FC = () => {
  const [url, setUrl] = useState('');
  const [currentUrl, setCurrentUrl] = useState('');
  const [error, setError] = useState('');
  const webviewRef = useRef<HTMLElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const isUrlAllowed = (urlString: string): boolean => {
    try {
      const urlObj = new URL(urlString.startsWith('http') ? urlString : `https://${urlString}`);
      return ALLOWED_DOMAINS.some((domain) => urlObj.hostname.includes(domain));
    } catch {
      return false;
    }
  };

  const handleNavigate = () => {
    if (!url) return;

    setError('');
    const fullUrl = url.startsWith('http') ? url : `https://${url}`;

    if (isUrlAllowed(fullUrl)) {
      setCurrentUrl(fullUrl);
    } else {
      setError('This domain is not in the whitelist. Allowed domains: ' + ALLOWED_DOMAINS.join(', '));
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleNavigate();
    }
  };

  const handleOpenExternal = () => {
    if (currentUrl) {
      const electron = (window as any).electron;
      if (electron && electron.shell) {
        electron.shell.openExternal(currentUrl);
      } else {
        // Fallback for web version
        window.open(currentUrl, '_blank');
      }
    }
  };

  const handleReload = () => {
    if (webviewRef.current) {
      const webview = webviewRef.current as any;
      if (webview && typeof webview.reload === 'function') {
        webview.reload();
      } else {
        // Fallback: reload the URL
        setCurrentUrl('');
        setTimeout(() => setCurrentUrl(currentUrl), 100);
      }
    } else {
      // Fallback: reload the URL
      setCurrentUrl('');
      setTimeout(() => setCurrentUrl(currentUrl), 100);
    }
  };

  const handleGoBack = () => {
    if (webviewRef.current) {
      const webview = webviewRef.current as any;
      if (webview && typeof webview.goBack === 'function') {
        webview.goBack();
      }
    }
  };

  // Create and manage webview element
  useEffect(() => {
    if (!containerRef.current || !currentUrl) {
      return;
    }

    // Remove existing webview if any
    if (webviewRef.current && webviewRef.current.parentNode) {
      webviewRef.current.parentNode.removeChild(webviewRef.current);
      webviewRef.current = null;
    }

    // Create new webview element
    const webview = document.createElement('webview') as any;
    webview.src = currentUrl;
    webview.allowpopups = true;
    webview.webpreferences = 'allowRunningInsecureContent=true, javascript=yes';
    webview.style.width = '100%';
    webview.style.height = '100%';
    webview.style.display = 'inline-flex';
    
    // Add event listeners
    const handleStartLoading = () => {
      setError('');
    };
    
    const handleStopLoading = () => {
      setError('');
    };
    
    const handleFailLoad = (e: any) => {
      if (e.errorCode !== 0) {
        setError(`Failed to load: ${e.errorDescription || 'Unknown error'}. Error code: ${e.errorCode}`);
      }
    };

    const handleNavigate = () => {
      if (webview.getURL) {
        const newUrl = webview.getURL();
        if (newUrl && newUrl !== currentUrl) {
          setUrl(newUrl);
        }
      }
    };
    
    webview.addEventListener('did-start-loading', handleStartLoading);
    webview.addEventListener('did-stop-loading', handleStopLoading);
    webview.addEventListener('did-fail-load', handleFailLoad);
    webview.addEventListener('did-navigate', handleNavigate);
    webview.addEventListener('did-navigate-in-page', handleNavigate);
    
    containerRef.current.appendChild(webview);
    webviewRef.current = webview;

    // Cleanup
    return () => {
      if (webviewRef.current) {
        const wv = webviewRef.current as any;
        wv.removeEventListener('did-start-loading', handleStartLoading);
        wv.removeEventListener('did-stop-loading', handleStopLoading);
        wv.removeEventListener('did-fail-load', handleFailLoad);
        wv.removeEventListener('did-navigate', handleNavigate);
        wv.removeEventListener('did-navigate-in-page', handleNavigate);
        if (wv.parentNode) {
          wv.parentNode.removeChild(wv);
        }
        webviewRef.current = null;
      }
    };
  }, [currentUrl]);

  return (
    <div className="w-full h-full flex flex-col bg-white">
      {/* Toolbar */}
      <div className="bg-genix-blue text-white px-4 py-2 flex items-center space-x-2">
        <button
          onClick={handleGoBack}
          className="px-3 py-1 bg-white bg-opacity-20 rounded hover:bg-opacity-30 transition-colors"
          title="Go back"
        >
          ←
        </button>
        <button
          onClick={handleReload}
          className="px-3 py-1 bg-white bg-opacity-20 rounded hover:bg-opacity-30 transition-colors"
          title="Reload"
        >
          ↻
        </button>
        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Enter URL..."
          className="flex-1 px-3 py-1 bg-white bg-opacity-20 rounded text-white placeholder-white placeholder-opacity-50 outline-none"
        />
        <button
          onClick={handleNavigate}
          className="px-4 py-1 bg-genix-yellow text-genix-blue rounded hover:bg-yellow-400 transition-colors font-medium"
        >
          Go
        </button>
        {currentUrl && (
          <button
            onClick={handleOpenExternal}
            className="px-3 py-1 bg-white bg-opacity-20 rounded hover:bg-opacity-30 transition-colors text-sm"
            title="Open in external browser"
          >
            🔗
          </button>
        )}
      </div>

      {error && (
        <div className="bg-red-100 text-red-700 px-4 py-2 text-sm">
          {error}
          {currentUrl && (
            <button
              onClick={handleOpenExternal}
              className="ml-2 px-2 py-1 bg-red-200 hover:bg-red-300 rounded text-sm"
            >
              Open in External Browser
            </button>
          )}
        </div>
      )}

      {/* Browser Content */}
      <div className="flex-1 overflow-hidden relative">
        {currentUrl ? (
          <>
            {/* Webview container - webview element will be created here by useEffect */}
            <div
              ref={containerRef}
              className="w-full h-full"
            />
            <div className="absolute bottom-2 right-2 z-10">
              <button
                onClick={handleOpenExternal}
                className="px-3 py-2 bg-genix-blue text-white rounded shadow-lg hover:bg-blue-700 transition-colors text-sm"
                title="Open in external browser"
              >
                🔗 Open in Browser
              </button>
            </div>
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-100">
            <div className="text-center">
              <div className="text-6xl mb-4">🌐</div>
              <div className="text-xl text-gray-600 mb-2">GenixCom Browser</div>
              <div className="text-sm text-gray-500">Enter a URL to get started</div>
              <div className="text-xs text-gray-400 mt-2">Note: Some sites like GitHub may block iframe embedding</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GenixCom;

