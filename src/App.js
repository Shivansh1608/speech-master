import React, { useState, useEffect, useRef } from 'react';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';
import './App.css';

// Supported Recognition Languages
const LANGUAGES = [
  { code: 'en-US', name: 'English (US)', flag: '🇺🇸' },
  { code: 'en-IN', name: 'English (India)', flag: '🇮🇳' },
  { code: 'en-GB', name: 'English (UK)', flag: '🇬🇧' },
  { code: 'hi-IN', name: 'Hindi (हिंदी)', flag: '🇮🇳' },
  { code: 'es-ES', name: 'Spanish (Español)', flag: '🇪🇸' },
  { code: 'fr-FR', name: 'French (Français)', flag: '🇫🇷' },
  { code: 'de-DE', name: 'German (Deutsch)', flag: '🇩🇪' },
  { code: 'it-IT', name: 'Italian (Italiano)', flag: '🇮🇹' },
  { code: 'pt-BR', name: 'Portuguese (Brasil)', flag: '🇧🇷' },
  { code: 'ja-JP', name: 'Japanese (日本語)', flag: '🇯🇵' },
  { code: 'zh-CN', name: 'Chinese (Mandarin)', flag: '🇨🇳' },
  { code: 'ar-SA', name: 'Arabic (العربية)', flag: '🇸🇦' },
  { code: 'ru-RU', name: 'Russian (Русский)', flag: '🇷🇺' }
];

const App = () => {
  // Main dictation state
  const [text, setText] = useState('');
  const [selectedLang, setSelectedLang] = useState('en-US');
  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const [exportMenuOpen, setExportMenuOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [commandsModalOpen, setCommandsModalOpen] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [toast, setToast] = useState(null);

  // History state synced with localStorage
  const [history, setHistory] = useState(() => {
    try {
      const saved = localStorage.getItem('voxscribe_history');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const textareaRef = useRef(null);

  // Toast notification helper
  const showToast = (message) => {
    setToast(message);
    setTimeout(() => {
      setToast(null);
    }, 2800);
  };

  // Voice Commands setup
  const commands = [
    {
      command: 'clear',
      callback: () => {
        setText('');
        resetTranscript();
        showToast('Voice Command: Text Cleared');
      }
    },
    {
      command: 'reset',
      callback: () => {
        setText('');
        resetTranscript();
        showToast('Voice Command: Canvas Reset');
      }
    },
    {
      command: 'stop listening',
      callback: () => {
        SpeechRecognition.stopListening();
        showToast('Voice Command: Stopped Listening');
      }
    }
  ];

  const {
    transcript,
    listening,
    resetTranscript,
    browserSupportsSpeechRecognition
  } = useSpeechRecognition({ commands });

  // Sync incoming speech transcript with editable text
  useEffect(() => {
    if (transcript) {
      setText(transcript);
    }
  }, [transcript]);

  // Statistics calculation
  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
  const charCount = text.length;
  const readingTimeMinutes = Math.max(1, Math.ceil(wordCount / 200));

  // Toggle Listening
  const handleToggleListening = () => {
    if (listening) {
      SpeechRecognition.stopListening();
    } else {
      if (isSpeaking) {
        window.speechSynthesis.cancel();
        setIsSpeaking(false);
      }
      resetTranscript();
      SpeechRecognition.startListening({ continuous: true, language: selectedLang });
    }
  };

  // Switch recognition language
  const handleSelectLang = (code) => {
    setSelectedLang(code);
    setLangMenuOpen(false);
    if (listening) {
      SpeechRecognition.stopListening();
      setTimeout(() => {
        SpeechRecognition.startListening({ continuous: true, language: code });
      }, 300);
    }
    const chosen = LANGUAGES.find((l) => l.code === code);
    showToast(`Language set to ${chosen ? chosen.name : code}`);
  };

  // Clear Canvas
  const handleClear = () => {
    setText('');
    resetTranscript();
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
    showToast('Canvas cleared');
  };

  // Copy to Clipboard
  const handleCopy = () => {
    if (!text.trim()) {
      showToast('Canvas is empty.');
      return;
    }
    navigator.clipboard.writeText(text).then(() => {
      setIsCopied(true);
      showToast('Copied to clipboard!');
      setTimeout(() => setIsCopied(false), 2000);
    });
  };

  // Text-To-Speech Playback
  const handleToggleTTS = () => {
    if (!('speechSynthesis' in window)) {
      showToast('Text-to-speech is not supported in this browser.');
      return;
    }

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      showToast('Speech playback paused');
      return;
    }

    if (!text.trim()) {
      showToast('Nothing to read back yet.');
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = selectedLang;
    utterance.rate = 1.0;
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
    showToast('Reading note aloud...');
  };

  // Download transcript
  const handleDownload = (format) => {
    setExportMenuOpen(false);
    if (!text.trim()) {
      showToast('No text to download.');
      return;
    }
    const mime = format === 'md' ? 'text/markdown' : 'text/plain';
    const blob = new Blob([text], { type: `${mime};charset=utf-8` });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `voxscribe-note-${new Date().toISOString().slice(0, 10)}.${format}`;
    link.click();
    URL.revokeObjectURL(url);
    showToast(`Exported as .${format}!`);
  };

  // Save to Local History
  const handleSaveToHistory = () => {
    if (!text.trim()) {
      showToast('Cannot save empty note.');
      return;
    }
    const currentLangObj = LANGUAGES.find((l) => l.code === selectedLang);
    const newEntry = {
      id: Date.now(),
      text: text.trim(),
      languageName: currentLangObj ? currentLangObj.name : selectedLang,
      flag: currentLangObj ? currentLangObj.flag : '🌐',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' · ' + new Date().toLocaleDateString(),
      words: wordCount,
      chars: charCount
    };
    const updated = [newEntry, ...history.slice(0, 24)];
    setHistory(updated);
    localStorage.setItem('voxscribe_history', JSON.stringify(updated));
    showToast('Saved to history!');
  };

  // Restore Note from History
  const handleRestoreFromHistory = (item) => {
    setText(item.text);
    setHistoryOpen(false);
    showToast('Note loaded into canvas!');
  };

  // Delete Note from History
  const handleDeleteHistoryItem = (id, e) => {
    e.stopPropagation();
    const filtered = history.filter((item) => item.id !== id);
    setHistory(filtered);
    localStorage.setItem('voxscribe_history', JSON.stringify(filtered));
    showToast('Item deleted');
  };

  // Clear all history
  const handleClearAllHistory = () => {
    setHistory([]);
    localStorage.removeItem('voxscribe_history');
    showToast('History wiped clean');
  };

  // Browser support check
  if (!browserSupportsSpeechRecognition) {
    return (
      <div className="unsupported-banner">
        <h2>Speech Recognition Not Supported</h2>
        <p style={{ marginTop: '12px' }}>
          Your browser does not support the Web Speech API. Please open this app in Google Chrome, Microsoft Edge, or a Chromium-based browser for full voice dictation support.
        </p>
      </div>
    );
  }

  const currentLang = LANGUAGES.find((l) => l.code === selectedLang) || LANGUAGES[0];

  return (
    <div className="app-wrapper">
      {/* Toast Notification */}
      {toast && (
        <div className="toast-banner">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 16v-4M12 8h.01" />
          </svg>
          {toast}
        </div>
      )}

      {/* Top Navigation */}
      <nav className="top-nav">
        <div className="brand">
          <div className="brand-icon-wrapper">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
              <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
              <line x1="12" y1="19" x2="12" y2="23"/>
              <line x1="8" y1="23" x2="16" y2="23"/>
            </svg>
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <span className="brand-title">VoxScribe</span>
              <span className="brand-badge">STUDIO</span>
            </div>
          </div>
        </div>

        <div className="nav-actions">
          {/* Language Selector Dropdown */}
          <div className="lang-selector-container">
            <button
              className="lang-select-btn"
              onClick={() => {
                setLangMenuOpen(!langMenuOpen);
                setExportMenuOpen(false);
              }}
              title="Select Recognition Language"
            >
              <span>{currentLang.flag}</span>
              <span>{currentLang.name}</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="6 9 12 15 18 9"/>
              </svg>
            </button>

            {langMenuOpen && (
              <div className="lang-dropdown-menu">
                {LANGUAGES.map((lang) => (
                  <button
                    key={lang.code}
                    className={`lang-option ${lang.code === selectedLang ? 'active' : ''}`}
                    onClick={() => handleSelectLang(lang.code)}
                  >
                    <span>{lang.flag} {lang.name}</span>
                    {lang.code === selectedLang && (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Voice Commands Cheat Sheet Button */}
          <button
            className="nav-btn"
            onClick={() => setCommandsModalOpen(true)}
            title="Spoken Commands Guide"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
            <span>Commands</span>
          </button>

          {/* Saved History Button */}
          <button
            className="nav-btn"
            onClick={() => setHistoryOpen(true)}
            title="Saved Dictations"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <polyline points="12 6 12 12 16 14"/>
            </svg>
            <span>History</span>
            {history.length > 0 && <span className="badge-count">{history.length}</span>}
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero-section">
        <div className={`hero-status-pill ${listening ? 'listening' : 'idle'}`}>
          <span className="status-dot"></span>
          <span>{listening ? 'RECORDING LIVE' : 'MIC READY'}</span>
        </div>
        <h1 className="hero-title">Intelligent Speech to Text</h1>
        <p className="hero-desc">
          High-accuracy voice transcription with multi-language synthesis, live audio visualization, and real-time editing.
        </p>
      </section>

      {/* Main Glassmorphic Studio Card */}
      <main className={`studio-canvas-card ${listening ? 'is-listening' : ''}`}>
        {/* Header Stats & Quick Actions */}
        <div className="canvas-header">
          <div className="canvas-stats">
            <div className="stat-chip">
              <span>Words:</span>
              <span className="stat-value">{wordCount}</span>
            </div>
            <div className="stat-chip">
              <span>Chars:</span>
              <span className="stat-value">{charCount}</span>
            </div>
            <div className="stat-chip">
              <span>Est. Read:</span>
              <span className="stat-value">{readingTimeMinutes}m</span>
            </div>
          </div>

          <div className="canvas-quick-actions">
            {/* Listen back / Text-to-speech */}
            <button
              className={`quick-btn ${isSpeaking ? 'active-speak' : ''}`}
              onClick={handleToggleTTS}
              disabled={!text.trim()}
              title="Listen back to your dictation"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                {isSpeaking ? (
                  <>
                    <rect x="6" y="4" width="4" height="16"/>
                    <rect x="14" y="4" width="4" height="16"/>
                  </>
                ) : (
                  <>
                    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
                    <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
                    <path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>
                  </>
                )}
              </svg>
              <span>{isSpeaking ? 'Stop Audio' : 'Speak'}</span>
            </button>

            {/* Save Note to History */}
            <button
              className="quick-btn"
              onClick={handleSaveToHistory}
              disabled={!text.trim()}
              title="Save current note to history"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
                <polyline points="17 21 17 13 7 13 7 21"/>
                <polyline points="7 3 7 8 15 8"/>
              </svg>
              <span>Save Note</span>
            </button>

            {/* Clear button */}
            <button
              className="quick-btn"
              onClick={handleClear}
              disabled={!text.trim() && !transcript}
              title="Clear canvas text"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="3 6 5 6 21 6"/>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
              </svg>
              <span>Clear</span>
            </button>
          </div>
        </div>

        {/* Editable Dictation Area */}
        <div className="dictation-textarea-wrapper">
          <textarea
            ref={textareaRef}
            className="dictation-textarea"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Press 'Start Listening' and begin speaking, or freely type/edit your text here anytime..."
          />
        </div>

        {/* Audio Waveform Visualizer */}
        <div className={`waveform-container ${listening ? 'active' : ''}`}>
          <div className="wave-bar"></div>
          <div className="wave-bar"></div>
          <div className="wave-bar"></div>
          <div className="wave-bar"></div>
          <div className="wave-bar"></div>
          <div className="wave-bar"></div>
          <div className="wave-bar"></div>
          <div className="wave-bar"></div>
          <div className="wave-bar"></div>
          <div className="wave-bar"></div>
          <div className="wave-bar"></div>
          <div className="wave-bar"></div>
        </div>
      </main>

      {/* Bottom Control Dock */}
      <footer className="control-dock">
        {/* Main Hero Start / Stop Button */}
        <button
          className={`btn-record-hero ${listening ? 'stop' : 'start'}`}
          onClick={handleToggleListening}
        >
          {listening ? (
            <>
              <svg viewBox="0 0 24 24" fill="currentColor">
                <rect x="6" y="6" width="12" height="12" rx="2"/>
              </svg>
              <span>Stop Listening</span>
            </>
          ) : (
            <>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                <line x1="12" y1="19" x2="12" y2="23"/>
                <line x1="8" y1="23" x2="16" y2="23"/>
              </svg>
              <span>Start Listening</span>
            </>
          )}
        </button>

        {/* Copy to Clipboard */}
        <button
          className={`btn-dock-action ${isCopied ? 'copied' : ''}`}
          onClick={handleCopy}
          disabled={!text.trim()}
          title="Copy text to clipboard"
        >
          {isCopied ? (
            <>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              <span>Copied!</span>
            </>
          ) : (
            <>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
              </svg>
              <span>Copy</span>
            </>
          )}
        </button>

        {/* Export / Download Group */}
        <div className="export-group-container">
          <button
            className="btn-dock-action"
            onClick={() => setExportMenuOpen(!exportMenuOpen)}
            disabled={!text.trim()}
            title="Export & Download options"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            <span>Download</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </button>

          {exportMenuOpen && (
            <div className="export-menu">
              <button className="export-menu-item" onClick={() => handleDownload('txt')}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                  <line x1="16" y1="13" x2="8" y2="13"/>
                  <line x1="16" y1="17" x2="8" y2="17"/>
                  <polyline points="10 9 9 9 8 9"/>
                </svg>
                <span>Text File (.txt)</span>
              </button>
              <button className="export-menu-item" onClick={() => handleDownload('md')}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                </svg>
                <span>Markdown (.md)</span>
              </button>
            </div>
          )}
        </div>
      </footer>

      {/* History Side Drawer */}
      {historyOpen && (
        <div className="drawer-backdrop" onClick={() => setHistoryOpen(false)}>
          <div className="drawer-content" onClick={(e) => e.stopPropagation()}>
            <div className="drawer-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <polyline points="12 6 12 12 16 14"/>
                </svg>
                <h3 className="drawer-title">Dictation History</h3>
              </div>
              <button className="drawer-close-btn" onClick={() => setHistoryOpen(false)}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>

            <div className="drawer-body">
              {history.length === 0 ? (
                <div className="empty-history-placeholder">
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    <circle cx="12" cy="14" r="2"/>
                  </svg>
                  <p>No saved dictations yet.</p>
                  <span style={{ fontSize: '13px' }}>Click "Save Note" on the canvas to save transcripts.</span>
                </div>
              ) : (
                history.map((item) => (
                  <div key={item.id} className="history-item-card" onClick={() => handleRestoreFromHistory(item)}>
                    <div className="history-meta">
                      <span>{item.flag} {item.languageName}</span>
                      <span>{item.timestamp}</span>
                    </div>
                    <p className="history-text-preview">{item.text}</p>
                    <div className="history-actions">
                      <button
                        className="history-action-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigator.clipboard.writeText(item.text);
                          showToast('Note copied!');
                        }}
                      >
                        Copy
                      </button>
                      <button
                        className="history-action-btn"
                        onClick={() => handleRestoreFromHistory(item)}
                      >
                        Load to Canvas
                      </button>
                      <button
                        className="history-action-btn delete"
                        onClick={(e) => handleDeleteHistoryItem(item.id, e)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {history.length > 0 && (
              <div className="drawer-footer">
                <button className="quick-btn" onClick={handleClearAllHistory}>
                  Clear All History
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Voice Commands Modal */}
      {commandsModalOpen && (
        <div className="modal-overlay" onClick={() => setCommandsModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ fontSize: '20px', fontWeight: '700' }}>Spoken Voice Commands</h3>
              <button className="drawer-close-btn" onClick={() => setCommandsModalOpen(false)}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '16px' }}>
              While the microphone is active, say any of these phrases out loud to execute actions hands-free:
            </p>
            <div className="command-list">
              <div className="command-row">
                <span className="command-key">"clear"</span>
                <span className="command-desc">Wipes the canvas completely</span>
              </div>
              <div className="command-row">
                <span className="command-key">"reset"</span>
                <span className="command-desc">Resets the speech recognizer</span>
              </div>
              <div className="command-row">
                <span className="command-key">"stop listening"</span>
                <span className="command-desc">Stops microphone recording</span>
              </div>
            </div>
            <button
              className="btn-dock-action"
              style={{ width: '100%', justifyContent: 'center' }}
              onClick={() => setCommandsModalOpen(false)}
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;