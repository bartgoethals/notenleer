import React, { useState } from 'react';
import { Music, Hash, Radio, BookOpen, Volume2, VolumeX, Eye, EyeOff } from 'lucide-react';
import './App.css';

import NotePractice from './components/NotePractice';
import KeyPractice from './components/KeyPractice';
import IntervalPractice from './components/IntervalPractice';
import { NamingSystem } from './utils/musicUtils';

type ExerciseType = 'notes' | 'keys' | 'intervals';

function App() {
  const [activeTab, setActiveTab] = useState<ExerciseType>('notes');
  const [namingSystem, setNamingSystem] = useState<NamingSystem>('solfege');
  const [volume, setVolume] = useState(true);
  const [cheatMode, setCheatMode] = useState(false);

  const [scores, setScores] = useState({
    notes: { correct: 0, total: 0 },
    keys: { correct: 0, total: 0 },
    intervals: { correct: 0, total: 0 }
  });

  const updateScore = (category: ExerciseType, isCorrect: boolean) => {
    if (cheatMode) return;
    setScores(prev => ({
      ...prev,
      [category]: {
        correct: prev[category].correct + (isCorrect ? 1 : 0),
        total: prev[category].total + 1
      }
    }));
  };

  return (
    <div className="app-container">
      <header className="main-header">
        <div className="logo">
          <Music className="logo-icon" />
          <h1>Notenleer</h1>
        </div>
        <nav className="main-nav">
          <button
            className={`nav-item ${activeTab === 'notes' ? 'active' : ''}`}
            onClick={() => setActiveTab('notes')}
          >
            <Music size={20} />
            <span>Noten</span>
          </button>
          <button
            className={`nav-item ${activeTab === 'keys' ? 'active' : ''}`}
            onClick={() => setActiveTab('keys')}
          >
            <Hash size={20} />
            <span>Toonaarden</span>
          </button>
          <button
            className={`nav-item ${activeTab === 'intervals' ? 'active' : ''}`}
            onClick={() => setActiveTab('intervals')}
          >
            <Radio size={20} />
            <span>Intervallen</span>
          </button>
        </nav>
        <div className="header-actions">
          <div className="naming-toggle-local">
            <button
              className={`btn-toggle-small ${namingSystem === 'solfege' ? 'active' : ''}`}
              onClick={() => setNamingSystem('solfege')}
            >
              Do,Re,Mi
            </button>
            <button
              className={`btn-toggle-small ${namingSystem === 'letters' ? 'active' : ''}`}
              onClick={() => setNamingSystem('letters')}
            >
              A,B,C
            </button>
          </div>
          <div className="icon-actions">
            <button
              className={`icon-btn volume-toggle ${volume ? 'active' : ''}`}
              onClick={() => setVolume(!volume)}
              title={volume ? 'Volume uit' : 'Volume aan'}
            >
              {volume ? <Volume2 size={22} /> : <VolumeX size={22} />}
            </button>
            <button
              className={`icon-btn cheat-toggle ${cheatMode ? 'active' : ''}`}
              onClick={() => setCheatMode(!cheatMode)}
              title={cheatMode ? 'Cheat mode uit' : 'Cheat mode aan'}
            >
              {cheatMode ? <Eye size={22} /> : <EyeOff size={22} />}
            </button>
          </div>
        </div>
      </header>

      <main className="content">
        <section className="exercise-view glass-card">
          {activeTab === 'notes' && <NotePractice namingSystem={namingSystem} setNamingSystem={setNamingSystem} volume={volume} cheatMode={cheatMode} globalScore={scores.notes} updateGlobalScore={(c) => updateScore('notes', c)} />}
          {activeTab === 'keys' && <KeyPractice namingSystem={namingSystem} setNamingSystem={setNamingSystem} volume={volume} cheatMode={cheatMode} globalScore={scores.keys} updateGlobalScore={(c) => updateScore('keys', c)} />}
          {activeTab === 'intervals' && <IntervalPractice volume={volume} cheatMode={cheatMode} globalScore={scores.intervals} updateGlobalScore={(c) => updateScore('intervals', c)} />}
        </section>

        <aside className="score-sidebar glass-card">
          <h2>Jouw Scores</h2>
          <div className="score-item">
            <span className="score-label"><Music size={16} /> Noten</span>
            <span className="score-value">{scores.notes.correct} / {scores.notes.total}</span>
          </div>
          <div className="score-item">
            <span className="score-label"><Hash size={16} /> Toonaarden</span>
            <span className="score-value">{scores.keys.correct} / {scores.keys.total}</span>
          </div>
          <div className="score-item">
            <span className="score-label"><Radio size={16} /> Intervallen</span>
            <span className="score-value">{scores.intervals.correct} / {scores.intervals.total}</span>
          </div>
          {cheatMode && (
            <div className="cheat-warning">
              Cheat mode is actief.<br />Scores worden niet bijgehouden.
            </div>
          )}
        </aside>
      </main>

      <footer className="main-footer">
        <p>© 2026 Notenleer App - Verbeter je muzikale oren en ogen.</p>
      </footer>
    </div>
  );
}

export default App;
