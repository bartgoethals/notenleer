import React, { useState, useEffect, useCallback, useRef } from 'react';
import * as Tone from 'tone';
import { Volume2, VolumeX, RotateCcw, Play, ChevronLeft, ChevronRight, Music } from 'lucide-react';
import ScoreRenderer, { NoteData } from './ScoreRenderer';
import { getNoteDisplay, NamingSystem } from '../utils/musicUtils';

interface NoteHistoryItem {
  clef: 'treble' | 'bass';
  sequence: NoteData[];
}

const NOTES_LIST = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];

interface NotePracticeProps {
  namingSystem: NamingSystem;
  setNamingSystem: (system: NamingSystem) => void;
  volume: boolean;
  cheatMode: boolean;
  globalScore: { correct: number, total: number };
  updateGlobalScore: (isCorrect: boolean) => void;
}

const NotePractice: React.FC<NotePracticeProps> = ({ namingSystem, setNamingSystem, volume, cheatMode, globalScore, updateGlobalScore }) => {
  const [activeClefs, setActiveClefs] = useState<('treble' | 'bass')[]>(['treble']);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showNotation, setShowNotation] = useState(true);

  const [history, setHistory] = useState<NoteHistoryItem[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  const [playbackIndex, setPlaybackIndex] = useState(-1);

  const isHistoryView = historyIndex >= 0 && historyIndex < history.length - 1;
  const currentItem = historyIndex >= 0 ? history[historyIndex] : null;

  const baseSequenceState = currentItem ? currentItem.sequence : [];
  const clefState = currentItem ? currentItem.clef : 'treble';

  const [feedback, setFeedback] = useState<{ type: 'success' | 'error' | null; message: string }>({ type: null, message: '' });
  const [transitionState, setTransitionState] = useState<{ active: boolean, dots: number }>({ active: false, dots: 0 });
  const transitionIntervalRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const effectiveShowNotation = showNotation || !volume || cheatMode;

  const sequenceState = isHistoryView ? baseSequenceState.map((n, i) => ({
    ...n,
    isCurrent: i === playbackIndex
  })) : baseSequenceState.map((n, i) => ({
    ...n,
    isHidden: !effectiveShowNotation && n.status === 'idle',
    isTransitioning: transitionState.active && i === currentIndex + 1
  }));
  const [hasCheatedThisExercise, setHasCheatedThisExercise] = useState(cheatMode);

  useEffect(() => {
    if (cheatMode && !isHistoryView) {
      setHasCheatedThisExercise(true);
    }
  }, [cheatMode, isHistoryView]);

  // Use a ref for volume to avoid resetting callbacks that only need it for audio triggering
  const volumeRef = React.useRef(volume);
  useEffect(() => {
    volumeRef.current = volume;
  }, [volume]);

  const playNote = useCallback(async (noteKey: string) => {
    if (!volumeRef.current) return;
    try {
      if (Tone.context.state !== 'running') {
        await Tone.start();
      }
      const synth = new Tone.Synth().toDestination();
      const [note, octave] = noteKey.split('/');
      synth.triggerAttackRelease(`${note}${octave}`, '4n');
    } catch (e) {
      // This part of the snippet seems to refer to a different context (playSynthRef, freq, now)
      // but I'm inserting it faithfully as requested.
      // Original: console.error("Audio failed", e);
      // Assuming playSynthRef, freq, now are defined elsewhere or will be.
      // For now, I'll keep the original console.error to avoid undefined variables.
      // If the user intended to replace with a different synth logic, that would require more context.
      console.error("Audio failed", e);
    }
  }, [volume]); // Changed dependency from [] to [volume] as per snippet

  const stopPlayback = useCallback(() => {
    setPlaybackIndex(-1);
  }, []);

  useEffect(() => {
    stopPlayback();
  }, [historyIndex, isHistoryView, stopPlayback]);

  const handleNextPlaybackNote = useCallback(() => {
    if (!baseSequenceState || baseSequenceState.length === 0) return;
    const nextIndex = playbackIndex >= baseSequenceState.length - 1 ? 0 : playbackIndex + 1;
    setPlaybackIndex(nextIndex);
    playNote(baseSequenceState[nextIndex].key);
  }, [playbackIndex, baseSequenceState, playNote]);

  const generateSequence = useCallback((isRefresh: boolean | React.MouseEvent = false) => {
    if (transitionIntervalRef.current) clearTimeout(transitionIntervalRef.current);
    setTransitionState({ active: false, dots: 0 });

    const refresh = isRefresh === true;
    const newSequence: NoteData[] = [];
    const randomClef = activeClefs[Math.floor(Math.random() * activeClefs.length)];

    const usedNotePitches = new Set<string>();
    while (newSequence.length < 8) {
      const noteName = NOTES_LIST[Math.floor(Math.random() * NOTES_LIST.length)];
      const octave = randomClef === 'treble' ? 4 + Math.floor(Math.random() * 2) : 2 + Math.floor(Math.random() * 2);
      const noteKey = `${noteName.toLowerCase()}/${octave}`;

      if (!usedNotePitches.has(noteKey)) {
        usedNotePitches.add(noteKey);
        newSequence.push({
          key: noteKey,
          status: 'idle',
          isCurrent: newSequence.length === 0
        });
      }
    }

    const newHistoryItem: NoteHistoryItem = { clef: randomClef, sequence: newSequence };

    setHistory(prev => {
      if (refresh && prev.length > 0 && currentIndex === 0) {
        return [...prev.slice(0, prev.length - 1), newHistoryItem];
      }
      return [...prev.slice(0, historyIndex + 1), newHistoryItem];
    });
    setHistoryIndex(prev => refresh && history.length > 0 && currentIndex === 0 ? history.length - 1 : prev + 1);
    setCurrentIndex(0);
    setFeedback({ type: null, message: '' });
    setHasCheatedThisExercise(cheatMode);

    // Play the first note
    setTimeout(() => playNote(newSequence[0].key), 500);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeClefs, playNote, historyIndex, cheatMode, history.length, currentIndex]);

  useEffect(() => {
    if (history.length === 0) {
      generateSequence();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleClef = (c: 'treble' | 'bass') => {
    setActiveClefs(prev => {
      if (prev.includes(c)) {
        if (prev.length === 1) return prev;
        return prev.filter(item => item !== c);
      }
      return [...prev, c];
    });
  };

  const handleGuess = (guess: string) => {
    if (isHistoryView || currentIndex >= baseSequenceState.length) return;

    const currentNote = baseSequenceState[currentIndex];
    const actualNoteName = currentNote.key.split('/')[0].toUpperCase();

    if (guess === actualNoteName) {
      setFeedback({ type: 'success', message: 'Correct!' });
      if (!hasCheatedThisExercise) {
        updateGlobalScore(true);
      }

      setHistory(prev => {
        const newHistory = [...prev];
        const curItem = { ...newHistory[historyIndex] };
        const newSeq = [...curItem.sequence];

        newSeq[currentIndex] = { ...newSeq[currentIndex], status: 'correct', isCurrent: false };

        const nextIndex = currentIndex + 1;
        if (nextIndex < newSeq.length) {
          newSeq[nextIndex] = { ...newSeq[nextIndex], isCurrent: true };
        }

        curItem.sequence = newSeq;
        newHistory[historyIndex] = curItem;
        return newHistory;
      });

      const nextIndex = currentIndex + 1;
      if (nextIndex < sequenceState.length) {
        if (transitionIntervalRef.current) clearTimeout(transitionIntervalRef.current);

        if (volumeRef.current) {
          setTransitionState({ active: true, dots: 0 });
          transitionIntervalRef.current = setTimeout(() => {
            setTransitionState({ active: false, dots: 0 });
            setCurrentIndex(nextIndex);
            playNote(sequenceState[nextIndex].key);
          }, 1200);
        } else {
          // Skip animation if muted
          transitionIntervalRef.current = setTimeout(() => {
            setCurrentIndex(nextIndex);
          }, 400);
        }
      } else {
        setFeedback({ type: 'success', message: 'Reeks voltooid! Nieuwe reeks...' });
        setTimeout(generateSequence, 1500);
      }
    } else {
      setFeedback({ type: 'error', message: 'Fout!' });
      if (!hasCheatedThisExercise) {
        updateGlobalScore(false);
      }

      const actualPitch = currentNote.key.split('/')[0][0].toUpperCase();
      const actualOctave = parseInt(currentNote.key.split('/')[1], 10);

      const pitchMap: Record<string, number> = { 'C': 0, 'D': 1, 'E': 2, 'F': 3, 'G': 4, 'A': 5, 'B': 6 };
      const actualIndex = actualOctave * 7 + (pitchMap[actualPitch] || 0);
      const guessVal = pitchMap[guess.toUpperCase()] || 0;

      let bestOctave = actualOctave;
      let minDistance = Infinity;

      for (let oct = actualOctave - 1; oct <= actualOctave + 1; oct++) {
        const dist = Math.abs((oct * 7 + guessVal) - actualIndex);
        if (dist < minDistance) {
          minDistance = dist;
          bestOctave = oct;
        }
      }

      const guessedKey = `${guess.toLowerCase()}/${bestOctave}`;

      setHistory(prev => {
        const newHistory = [...prev];
        const curItem = { ...newHistory[historyIndex] };
        const newSeq = [...curItem.sequence];

        newSeq[currentIndex] = { ...newSeq[currentIndex], status: 'incorrect', guessedKey, isCurrent: false };

        const nextIndex = currentIndex + 1;
        if (nextIndex < newSeq.length) {
          newSeq[nextIndex] = { ...newSeq[nextIndex], isCurrent: true };
        }

        curItem.sequence = newSeq;
        newHistory[historyIndex] = curItem;
        return newHistory;
      });

      const nextIndex = currentIndex + 1;
      if (nextIndex < sequenceState.length) {
        if (transitionIntervalRef.current) clearTimeout(transitionIntervalRef.current);

        if (volumeRef.current) {
          setTransitionState({ active: true, dots: 0 });
          transitionIntervalRef.current = setTimeout(() => {
            setTransitionState({ active: false, dots: 0 });
            setCurrentIndex(nextIndex);
            playNote(sequenceState[nextIndex].key);
          }, 1200);
        } else {
          // Skip animation if muted
          transitionIntervalRef.current = setTimeout(() => {
            setCurrentIndex(nextIndex);
          }, 400);
        }
      } else {
        setFeedback({ type: 'error', message: 'Reeks voltooid! Nieuwe reeks...' });
        setTimeout(generateSequence, 1500);
      }
    }
  };

  const handlePrev = () => {
    if (historyIndex > 0) {
      setHistoryIndex(i => i - 1);
      setFeedback({ type: null, message: 'Geschiedenisweergave (Alleen lezen)' });
    }
  };

  const handleNext = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(i => i + 1);
      if (historyIndex + 1 === history.length - 1) {
        setFeedback({ type: null, message: '' }); // Back to current
      }
    }
  };

  return (
    <div className="practice-area">

      <div className="practice-header">
        <div className="controls-group">
          <div className="clef-toggle toggle-group">
            <button
              className={`btn-icon-toggle ${activeClefs.includes('treble') ? 'active' : ''}`}
              onClick={() => toggleClef('treble')}
              title="Solsleutel"
            >
              𝄞
            </button>
            <button
              className={`btn-icon-toggle ${activeClefs.includes('bass') ? 'active' : ''}`}
              onClick={() => toggleClef('bass')}
              title="Fasleutel"
            >
              𝄢
            </button>
            <button
              className={`btn-icon-toggle ${effectiveShowNotation ? 'active' : ''}`}
              style={{ marginLeft: '1rem' }}
              onClick={() => {
                if (!volume || cheatMode) return;
                setShowNotation(prev => {
                  const newVal = !prev;
                  setTimeout(() => generateSequence(true), 0);
                  return newVal;
                });
              }}
              title={effectiveShowNotation ? 'Verberg Notatie (Gehoortraining)' : 'Toon Notatie'}
            >
              <Music size={22} />
            </button>
          </div>
        </div>
        <div className="practice-header-right">
          <button className="btn-icon-toggle" onClick={() => generateSequence(true)} title="Nieuwe opgave">
            <RotateCcw size={22} />
          </button>
          <div className="history-nav">
            <button
              className="btn-icon-toggle"
              onClick={handlePrev}
              disabled={historyIndex <= 0}
              title="Vorige oefening"
            >
              <ChevronLeft size={22} />
            </button>
            <button
              className="btn-icon-toggle"
              onClick={handleNext}
              disabled={historyIndex >= history.length - 1}
              title="Volgende oefening"
            >
              <ChevronRight size={22} />
            </button>
          </div>
        </div>
      </div>

      <div className="renderer-container sequence-view">
        <ScoreRenderer key={historyIndex} clef={clefState} notes={sequenceState} width={400} height={180} />
        <div className="replay-container">
          <button
            className={`btn-replay ${transitionState.active ? 'is-transitioning' : ''}`}
            onClick={() => {
              if (isHistoryView) {
                handleNextPlaybackNote();
              } else {
                playNote(sequenceState[currentIndex]?.key);
              }
            }}
            title="Herbeluister"
            disabled={(!isHistoryView && currentIndex >= sequenceState.length) || transitionState.active}
          >
            <Play size={20} fill="currentColor" style={{ zIndex: 1 }} />
            <svg className="play-progress-circle" viewBox="0 0 40 40">
              <circle cx="20" cy="20" r="18" />
            </svg>
          </button>
        </div>
      </div>

      <div className={`feedback-banner ${feedback.type || ''}`}>
        {feedback.message}
      </div>

      <div className={`note-buttons ${isHistoryView ? 'history-mode' : ''}`}>
        {NOTES_LIST.map(note => {
          let isCorrectNote = false;
          let isWrongNote = false;
          let showHighlight = false;
          if (isHistoryView) {
            if (playbackIndex >= 0 && playbackIndex < sequenceState.length) {
              const currentPlayItem = sequenceState[playbackIndex];
              const currentPlayNote = currentPlayItem.key.split('/')[0].toUpperCase();
              isCorrectNote = currentPlayNote === note.toUpperCase();
              showHighlight = isCorrectNote; // Always highlight the currently playing note in history playback
              if (currentPlayItem.guessedKey) {
                const guessedNote = currentPlayItem.guessedKey.split('/')[0].toUpperCase();
                isWrongNote = guessedNote === note.toUpperCase();
              }
            }
          } else {
            isCorrectNote = sequenceState.length > 0 && sequenceState[currentIndex]?.key.split('/')[0].toUpperCase() === note.toUpperCase();
            showHighlight = cheatMode && isCorrectNote;
          }

          return (
            <button
              key={note}
              className={`btn-note ${showHighlight ? 'cheat-active' : ''} ${isWrongNote ? 'error-active' : ''}`}
              onClick={() => handleGuess(note)}
              disabled={isHistoryView || transitionState.active || feedback.message.includes('Reeks voltooid')}
            >
              {getNoteDisplay(note, namingSystem)}
            </button>
          );
        })}
      </div>

    </div>
  );
};

export default NotePractice;
