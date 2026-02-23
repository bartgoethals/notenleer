import React, { useState, useEffect, useCallback } from 'react';
import * as Tone from 'tone';
import ScoreRenderer from './ScoreRenderer';
import { Play, RotateCcw, Music, ChevronLeft, ChevronRight } from 'lucide-react';

interface IntervalHistoryItem {
    interval: typeof INTERVALS[0];
    baseNote: { name: string; octave: number; freq: number };
    targetNote: { name: string; octave: number; freq: number };
    userGuess?: string;
}
const INTERVALS = [
    { name: 'k2', semitones: 1, short: 'k2', fullName: 'Kleine Secunde' },
    { name: 'G2', semitones: 2, short: 'G2', fullName: 'Grote Secunde' },
    { name: 'k3', semitones: 3, short: 'k3', fullName: 'Kleine Terts' },
    { name: 'G3', semitones: 4, short: 'G3', fullName: 'Grote Terts' },
    { name: '4', semitones: 5, short: '4', fullName: 'Rein Kwart' },
    { name: '5', semitones: 7, short: '5', fullName: 'Rein Kwint' },
    { name: 'k6', semitones: 8, short: 'k6', fullName: 'Kleine Sext' },
    { name: 'G6', semitones: 9, short: 'G6', fullName: 'Grote Sext' },
    { name: 'k7', semitones: 10, short: 'k7', fullName: 'Klein Septiem' },
    { name: 'G7', semitones: 11, short: 'G7', fullName: 'Groot Septiem' },
    { name: '8', semitones: 12, short: '8', fullName: 'Octaaf' },
];

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

interface IntervalPracticeProps {
    volume: boolean;
    cheatMode: boolean;
    globalScore: { correct: number, total: number };
    updateGlobalScore: (isCorrect: boolean) => void;
}

const IntervalPractice: React.FC<IntervalPracticeProps> = ({ volume, cheatMode, globalScore, updateGlobalScore }) => {
    const [history, setHistory] = useState<IntervalHistoryItem[]>([]);
    const [historyIndex, setHistoryIndex] = useState(-1);

    const isHistoryView = historyIndex >= 0 && historyIndex < history.length - 1;
    const currentItem = historyIndex >= 0 ? history[historyIndex] : null;

    const currentIntervalState = currentItem ? currentItem.interval : INTERVALS[2];
    const baseNoteState = currentItem ? currentItem.baseNote : { name: 'C', octave: 4, freq: 261.63 };
    const targetNoteState = currentItem ? currentItem.targetNote : { name: 'Eb', octave: 4, freq: 311.13 };
    const [feedback, setFeedback] = useState<{ type: 'success' | 'error' | null; message: string }>({ type: null, message: '' });
    const [isPlaying, setIsPlaying] = useState(false);
    const [showNotation, setShowNotation] = useState(true);

    const [hasCheatedThisExercise, setHasCheatedThisExercise] = useState(cheatMode);
    useEffect(() => {
        if (cheatMode && !isHistoryView) {
            setHasCheatedThisExercise(true);
        }
    }, [cheatMode, isHistoryView]);

    const generateRandomInterval = useCallback((isRefresh: boolean | React.MouseEvent = false) => {
        const refresh = isRefresh === true;
        const interval = INTERVALS[Math.floor(Math.random() * INTERVALS.length)];
        const baseIndex = Math.floor(Math.random() * 12);
        const baseOctave = 4;

        // Simplistic frequency calculation for Tone.js
        const baseFreq = Tone.Frequency(`${NOTE_NAMES[baseIndex]}${baseOctave}`).toFrequency();
        const targetFreq = Tone.Frequency(baseFreq).transpose(interval.semitones).toFrequency();
        const targetName = Tone.Frequency(targetFreq).toNote();

        // Ensure proper VexFlow format for name/octave
        const noteName = targetName.slice(0, -1);
        const octave = parseInt(targetName.slice(-1));

        const newItem: IntervalHistoryItem = {
            interval,
            baseNote: { name: NOTE_NAMES[baseIndex], octave: baseOctave, freq: baseFreq },
            targetNote: { name: noteName, octave, freq: targetFreq }
        };

        setHistory(prev => {
            if (refresh && prev.length > 0 && feedback.type === null) {
                return [...prev.slice(0, prev.length - 1), newItem];
            }
            return [...prev.slice(0, historyIndex + 1), newItem];
        });
        setHistoryIndex(prev => refresh && history.length > 0 && feedback.type === null ? history.length - 1 : prev + 1);
        setFeedback({ type: null, message: '' });
        setHasCheatedThisExercise(cheatMode);
    }, [historyIndex, cheatMode, history.length, feedback.type]);

    useEffect(() => {
        generateRandomInterval();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const playInterval = useCallback(async () => {
        if (!volume) return; // Note: removed isPlaying check to allow re-trigger on rapid guessing

        await Tone.start();
        const synth = new Tone.PolySynth(Tone.Synth).toDestination();

        const now = Tone.now();
        synth.triggerAttackRelease(baseNoteState.freq, "4n", now);
        synth.triggerAttackRelease(targetNoteState.freq, "4n", now + 0.5);

        setIsPlaying(true);
        setTimeout(() => setIsPlaying(false), 1000);
    }, [baseNoteState.freq, targetNoteState.freq, volume, isHistoryView]);

    // Auto-play when interval changes
    useEffect(() => {
        if (isHistoryView || history.length === 0) return;
        // slight delay to feel natural after visual update
        const timeout = setTimeout(() => {
            playInterval();
        }, 100);
        return () => clearTimeout(timeout);
    }, [historyIndex, playInterval, isHistoryView, history.length]);

    const handleGuess = (guess: string) => {
        if (isHistoryView) return;
        if (guess === currentIntervalState.name) {
            setFeedback({ type: 'success', message: 'Correct!' });
            if (!hasCheatedThisExercise) {
                updateGlobalScore(true);
            }
            setTimeout(generateRandomInterval, 1200);
        } else {
            setFeedback({ type: 'error', message: `Fout, dit was een ${currentIntervalState.fullName}.` });
            updateGlobalScore(false);

            setHistory(prev => {
                const newHistory = [...prev];
                const curItem = { ...newHistory[historyIndex] };
                curItem.userGuess = guess;
                newHistory[historyIndex] = curItem;
                return newHistory;
            });

            setTimeout(generateRandomInterval, 1500);
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
                    <button
                        className={`btn-icon-toggle ${showNotation ? 'active' : ''}`}
                        onClick={() => setShowNotation(!showNotation)}
                        title={showNotation ? "Verberg notenbalk" : "Toon notenbalk"}
                    >
                        <Music size={22} />
                    </button>
                </div>

                <div className="practice-header-right">
                    <button className="btn-icon-toggle" onClick={() => generateRandomInterval(true)} title="Nieuwe opgave">
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
                <ScoreRenderer
                    clef="treble"
                    notes={(showNotation || feedback.type !== null || isHistoryView) ? [
                        { key: `${baseNoteState.name}/${baseNoteState.octave}`, status: 'idle' },
                        { key: `${targetNoteState.name}/${targetNoteState.octave}`, status: 'idle' }
                    ] : undefined}
                    width={280}
                    height={150}
                />
                <div className="replay-container">
                    <button
                        className="btn-replay"
                        onClick={playInterval}
                        title="Herbeluister"
                        disabled={isPlaying}
                    >
                        <Play size={20} fill="currentColor" />
                    </button>
                </div>
            </div>

            <div className={`feedback-banner ${feedback.type || ''}`}>
                {feedback.message}
            </div>

            <div className={`interval-buttons ${isHistoryView ? 'history-mode' : ''}`}>
                {INTERVALS.map(interval => {
                    const isCorrectInterval = currentIntervalState.name === interval.name;
                    const shouldCheatHighlight = (cheatMode || isHistoryView) && isCorrectInterval;
                    let isWrongInterval = false;
                    if (isHistoryView && currentItem?.userGuess) {
                        isWrongInterval = currentItem.userGuess === interval.name;
                    }
                    return (
                        <button
                            key={interval.name}
                            className={`btn-note ${shouldCheatHighlight ? 'cheat-active' : ''} ${isWrongInterval ? 'error-active' : ''}`}
                            onClick={() => handleGuess(interval.name)}
                            disabled={feedback.type !== null || isHistoryView}
                        >
                            <span className="short-name">{interval.short}</span>
                            <span className="full-name">{interval.fullName}</span>
                        </button>
                    );
                })}
            </div>

            <style>{`
        .interval-buttons {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 0.5rem;
        }
        .btn-note {
          flex-direction: column;
          height: auto;
          padding: 0.75rem;
        }
        .short-name {
          font-size: 1.2rem;
          display: block;
        }
        .full-name {
          font-size: 0.75rem;
          font-weight: 500;
          color: var(--text-muted);
        }
        @media (min-width: 600px) {
          .interval-buttons {
            grid-template-columns: repeat(6, 1fr);
          }
        }
      `}</style>
        </div>
    );
};

export default IntervalPractice;
