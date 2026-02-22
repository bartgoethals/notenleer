import React, { useState, useEffect, useCallback } from 'react';
import * as Tone from 'tone';
import { Volume2, VolumeX, RotateCcw, Eye, EyeOff, Music, Play, ChevronLeft, ChevronRight } from 'lucide-react';
import ScoreRenderer from './ScoreRenderer';
import {
    getNoteDisplay,
    NamingSystem,
    KeyData,
    MAJOR_KEYS,
    MINOR_KEYS,
    getKeyDisplayName,
    MinorModeType,
    getMinorScaleVariant
} from '../utils/musicUtils';

interface KeyHistoryItem {
    key: KeyData;
    variant: MinorModeType;
    userGuess?: { name: string; variant?: MinorModeType };
    activeModes: ('major' | 'minor')[];
    includeVariants: boolean;
}

interface KeyPracticeProps {
    namingSystem: NamingSystem;
    setNamingSystem: (system: NamingSystem) => void;
    volume: boolean;
    cheatMode: boolean;
    globalScore: { correct: number, total: number };
    updateGlobalScore: (isCorrect: boolean) => void;
}

const KeyPractice: React.FC<KeyPracticeProps> = ({ namingSystem, setNamingSystem, volume, cheatMode, globalScore, updateGlobalScore }) => {
    const [activeModes, setActiveModes] = useState<('major' | 'minor')[]>(['major']);
    const [includeVariants, setIncludeVariants] = useState(false);
    const [showNotation, setShowNotation] = useState(true);

    const [history, setHistory] = useState<KeyHistoryItem[]>([]);
    const [historyIndex, setHistoryIndex] = useState(-1);

    const isHistoryView = historyIndex >= 0 && historyIndex < history.length - 1;
    const currentItem = historyIndex >= 0 ? history[historyIndex] : null;

    const currentKeyState = currentItem ? currentItem.key : MAJOR_KEYS[0];
    const minorVariantState = currentItem ? currentItem.variant : 'natural';

    // We store the modes that were active when the current exercise was created
    const [currentExerciseModes, setCurrentExerciseModes] = useState<('major' | 'minor')[]>(['major']);
    const [currentExerciseIncludeVariants, setCurrentExerciseIncludeVariants] = useState(includeVariants);

    const displayModes = currentItem ? currentItem.activeModes : currentExerciseModes;
    const displayIncludeVariants = currentItem ? currentItem.includeVariants : currentExerciseIncludeVariants;

    const [activePlaybackKey, setActivePlaybackKey] = useState<{ key: KeyData, variant?: MinorModeType } | null>(null);
    const playbackTimerRef = React.useRef<any>(null);

    const [feedback, setFeedback] = useState<{ type: 'success' | 'error' | null; message: string }>({ type: null, message: '' });
    const audioTimerRef = React.useRef<any>(null);

    const [hasCheatedThisExercise, setHasCheatedThisExercise] = useState(cheatMode);
    useEffect(() => {
        if (cheatMode && !isHistoryView) {
            setHasCheatedThisExercise(true);
        }
    }, [cheatMode, isHistoryView]);

    const volumeRef = React.useRef(volume);
    const currentKeyRef = React.useRef(currentKeyState);

    useEffect(() => {
        volumeRef.current = volume;
    }, [volume]);

    useEffect(() => {
        currentKeyRef.current = currentKeyState;
    }, [currentKeyState]);

    const playKeySounds = useCallback(async (key: KeyData, variant: MinorModeType = minorVariantState) => {
        if (!volumeRef.current) return;
        try {
            if (Tone.context.state !== 'running') {
                await Tone.start();
            }
            const synth = new Tone.PolySynth(Tone.Synth).toDestination();

            // Play scale - faster tempo
            const now = Tone.now();
            const scaleToPlay = key.mode === 'minor'
                ? getMinorScaleVariant(key.scale, variant)
                : key.scale;

            scaleToPlay.forEach((noteKey, i) => {
                const [note, octave] = noteKey.split('/');
                synth.triggerAttackRelease(`${note}${octave}`, '8n', now + i * 0.25);
            });

            // Play triad after scale
            const triadStartTime = now + key.scale.length * 0.25 + 0.5;
            key.triad.forEach(noteKey => {
                const [note, octave] = noteKey.split('/');
                synth.triggerAttack(`${note}${octave}`, triadStartTime);
            });
            synth.triggerRelease(key.triad.map(nk => {
                const [n, o] = nk.split('/');
                return `${n}${o}`;
            }), triadStartTime + 1);

        } catch (e) {
            console.error("Audio failed", e);
        }
    }, []); // Stable audio playback

    const generateRandomKey = useCallback((isRefresh: boolean | React.MouseEvent = false) => {
        const refresh = isRefresh === true;
        const availableKeys = [
            ...(activeModes.includes('major') ? MAJOR_KEYS : []),
            ...(activeModes.includes('minor') ? MINOR_KEYS : [])
        ];

        if (availableKeys.length === 0) return;

        let nextKey: KeyData;
        do {
            nextKey = availableKeys[Math.floor(Math.random() * availableKeys.length)];
        } while (availableKeys.length > 1 && nextKey.name === currentKeyRef.current.name);

        let targetVariant: MinorModeType = 'natural';
        // Randomize variant if "+wendingen" is active for minor keys
        if (includeVariants && nextKey.mode === 'minor') {
            const variants: MinorModeType[] = ['natural', 'harmonic', 'melodic'];
            targetVariant = variants[Math.floor(Math.random() * variants.length)];
            targetVariant = targetVariant = 'natural'; // Fix typing logic for empty
        }

        const newItem: KeyHistoryItem = { key: nextKey, variant: targetVariant, activeModes, includeVariants };
        setCurrentExerciseModes(activeModes);
        setCurrentExerciseIncludeVariants(includeVariants);
        setHistory(prev => {
            if (refresh && prev.length > 0 && feedback.type === null) {
                return [...prev.slice(0, prev.length - 1), newItem];
            }
            return [...prev.slice(0, historyIndex + 1), newItem];
        });
        setHistoryIndex(prev => refresh && history.length > 0 && feedback.type === null ? history.length - 1 : prev + 1);

        setFeedback({ type: null, message: '' });
        setHasCheatedThisExercise(cheatMode);

        // Clear any existing timer to prevent overlapping starts
        if (audioTimerRef.current) clearTimeout(audioTimerRef.current);

        // Play sounds after a short delay
        audioTimerRef.current = setTimeout(() => {
            playKeySounds(nextKey, targetVariant);
            audioTimerRef.current = null;
        }, 500);
    }, [activeModes, playKeySounds, includeVariants, historyIndex, cheatMode, history.length, feedback.type]);

    // Generate key on mount
    useEffect(() => {
        if (history.length === 0) {
            generateRandomKey();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Auto-show notation if both G and k are selected AND volume is off
    useEffect(() => {
        if (activeModes.includes('major') && activeModes.includes('minor') && !volume) {
            setShowNotation(true);
        }
    }, [activeModes, volume]);

    const handleGuess = (guessKeyName: string, guessVariant?: MinorModeType) => {
        if (feedback.type !== null || isHistoryView) return;

        const isCorrectName = guessKeyName === currentKeyState.name;
        const isCorrectMode = (guessVariant ? 'minor' : 'major') === currentKeyState.mode;
        const isCorrectVariant = !includeVariants || currentKeyState.mode === 'major' || guessVariant === minorVariantState;

        if (isCorrectMode && isCorrectName && isCorrectVariant) {
            setFeedback({ type: 'success', message: 'Correct!' });
            if (!hasCheatedThisExercise) {
                updateGlobalScore(true);
            }
            setTimeout(generateRandomKey, 1500);
        } else {
            let displayActual = getKeyDisplayName(currentKeyState.name, currentKeyState.mode, namingSystem);
            if (includeVariants && currentKeyState.mode === 'minor') {
                const variantLabel = minorVariantState === 'natural' ? 'natuurlijk' : minorVariantState === 'harmonic' ? 'harmonisch' : 'melodisch';
                displayActual += ` (${variantLabel})`;
            }
            setFeedback({ type: 'error', message: `Fout, dit is ${displayActual}.` });
            if (!hasCheatedThisExercise) {
                updateGlobalScore(false);
            }

            setHistory(prev => {
                const newHistory = [...prev];
                if (historyIndex >= 0 && historyIndex < newHistory.length) {
                    const curItem = { ...newHistory[historyIndex] };
                    curItem.userGuess = { name: guessKeyName, variant: guessVariant };
                    newHistory[historyIndex] = curItem;
                }
                return newHistory;
            });

            setTimeout(generateRandomKey, 1500);
        }
    };

    const toggleMode = (m: 'major' | 'minor') => {
        setActiveModes(prev => {
            if (prev.includes(m)) {
                if (prev.length === 1) return prev; // Keep at least one selected
                return prev.filter(item => item !== m);
            }
            return [...prev, m];
        });
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

    const handleHistoryPlay = (keyName: string, variant?: MinorModeType) => {
        if (!isHistoryView) return;

        const guessMode = variant ? 'minor' : 'major';
        const keyData = guessMode === 'major'
            ? MAJOR_KEYS.find(k => k.name === keyName)
            : MINOR_KEYS.find(k => k.name === keyName);

        if (!keyData) return;

        setActivePlaybackKey({ key: keyData, variant });
        playKeySounds(keyData, variant);

        if (playbackTimerRef.current) clearTimeout(playbackTimerRef.current);
        const durationMs = (keyData.scale.length * 250) + 500 + 1000 + 200; // rough duration of playKeySounds
        playbackTimerRef.current = setTimeout(() => {
            setActivePlaybackKey(null);
        }, durationMs);
    };

    const displayKeyData = activePlaybackKey?.key || currentKeyState;
    const displayVariant = activePlaybackKey?.variant || minorVariantState;

    const scaleNotes = React.useMemo(() => {
        if (!showNotation && feedback.type === null && !isHistoryView) return undefined;

        const scale = displayKeyData.mode === 'minor'
            ? getMinorScaleVariant(displayKeyData.scale, displayVariant)
            : displayKeyData.scale;

        return scale.map((n: string) => ({
            key: n,
            status: 'idle' as const
        }));
    }, [showNotation, feedback.type, isHistoryView, displayKeyData, displayVariant]);

    useEffect(() => {
        if (!isHistoryView && activePlaybackKey) {
            setActivePlaybackKey(null);
            if (playbackTimerRef.current) clearTimeout(playbackTimerRef.current);
        }
    }, [isHistoryView, activePlaybackKey]);

    return (
        <div className="practice-area">
            <p className="exercise-description">Herken de toonaard aan de hand van de voortekening en de toonladder.</p>
            <div className="practice-header">
                <div className="controls-group">
                    <div className="clef-toggle toggle-group">
                        <button
                            className={`btn-icon-toggle ${activeModes.includes('major') ? 'active' : ''}`}
                            onClick={() => toggleMode('major')}
                            title="Groot"
                        >
                            G
                        </button>
                        <button
                            className={`btn-icon-toggle ${activeModes.includes('minor') ? 'active' : ''}`}
                            onClick={() => toggleMode('minor')}
                            title="klein"
                        >
                            k
                        </button>
                        <button
                            className={`btn-toggle-small ${includeVariants ? 'active' : ''}`}
                            onClick={() => {
                                setIncludeVariants(!includeVariants);
                                // If turning off, reset to natural
                                if (!includeVariants && history.length > 0 && historyIndex === history.length - 1) {
                                    setHistory(h => {
                                        const newH = [...h];
                                        newH[newH.length - 1] = { ...newH[newH.length - 1], variant: 'natural' };
                                        return newH;
                                    });
                                }
                            }}
                            title="Extra wendingen toevoegen"
                        >
                            +wendingen
                        </button>
                        <button
                            className={`btn-icon-toggle ${showNotation ? 'active' : ''}`}
                            onClick={() => setShowNotation(!showNotation)}
                            title={showNotation ? "Verberg notenbalk" : "Toon notenbalk"}
                        >
                            <Music size={22} />
                        </button>
                    </div>
                </div>

                <div className="practice-header-right">
                    <button className="btn-icon-toggle" onClick={() => generateRandomKey(true)} title="Nieuwe opgave">
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

            <div className="renderer-container">
                <ScoreRenderer
                    clef="treble"
                    keySignature={displayKeyData.signature}
                    forceRed={!!activePlaybackKey}
                    notes={scaleNotes}
                    width={400}
                    height={180}
                />
                <div className="replay-container">
                    <button
                        className="btn-replay"
                        onClick={() => playKeySounds(currentKeyState, minorVariantState)}
                        title="Herbeluister"
                    >
                        <Play size={20} fill="currentColor" />
                    </button>
                </div>
            </div>

            <div className={`feedback-banner ${feedback.type || ''}`}>
                {feedback.message}
            </div>

            <div className={`key-buttons ${isHistoryView ? 'history-mode' : ''}`}>
                {MAJOR_KEYS.filter(k => displayModes.includes('major')).map(key => {
                    const isCorrectKey = currentKeyState.mode === 'major' && currentKeyState.name === key.name;
                    const shouldCheatHighlight = (cheatMode || isHistoryView) && isCorrectKey;
                    let isWrongKey = false;
                    if (isHistoryView && currentItem?.userGuess) {
                        isWrongKey = currentItem.userGuess.name === key.name && !currentItem.userGuess.variant;
                    }
                    return (
                        <button
                            key={key.name}
                            className={`btn-note ${shouldCheatHighlight ? 'cheat-active' : ''} ${isWrongKey ? 'error-active' : ''}`}
                            onClick={() => isHistoryView ? handleHistoryPlay(key.name) : handleGuess(key.name)}
                            disabled={feedback.type !== null && !isHistoryView}
                        >
                            <span className="btn-note-label">{getKeyDisplayName(key.name, 'major', namingSystem)}</span>
                            {isHistoryView && <Play size={16} fill="currentColor" className="hover-play-icon" />}
                        </button>
                    );
                })}
                {MINOR_KEYS.filter(k => displayModes.includes('minor')).map(key => {
                    if (displayIncludeVariants) {
                        return (['natural', 'harmonic', 'melodic'] as MinorModeType[]).map(v => {
                            const isCorrectVariant = currentKeyState.mode === 'minor' && currentKeyState.name === key.name && minorVariantState === v;
                            const shouldCheatHighlightV = (cheatMode || isHistoryView) && isCorrectVariant;
                            let isWrongVariant = false;
                            if (isHistoryView && currentItem?.userGuess) {
                                isWrongVariant = currentItem.userGuess.name === key.name && currentItem.userGuess.variant === v;
                            }
                            return (
                                <button
                                    key={`${key.name}-${v}`}
                                    className={`btn-note variant-btn ${shouldCheatHighlightV ? 'cheat-active' : ''} ${isWrongVariant ? 'error-active' : ''}`}
                                    onClick={() => isHistoryView ? handleHistoryPlay(key.name, v) : handleGuess(key.name, v)}
                                    disabled={feedback.type !== null && !isHistoryView}
                                >
                                    <span className="btn-note-label">
                                        {getKeyDisplayName(key.name, 'minor', namingSystem)}
                                        <span className="variant-label">
                                            ({v === 'natural' ? 'nat.' : v === 'harmonic' ? 'harm.' : 'mel.'})
                                        </span>
                                    </span>
                                    {isHistoryView && <Play size={16} fill="currentColor" className="hover-play-icon" />}
                                </button>
                            );
                        });
                    }
                    const isCorrectKeyFallback = currentKeyState.mode === 'minor' && currentKeyState.name === key.name;
                    const shouldCheatHighlightFallback = (cheatMode || isHistoryView) && isCorrectKeyFallback;
                    let isWrongKeyFallback = false;
                    if (isHistoryView && currentItem?.userGuess) {
                        isWrongKeyFallback = currentItem.userGuess.name === key.name;
                    }
                    return (
                        <button
                            key={key.name}
                            className={`btn-note ${shouldCheatHighlightFallback ? 'cheat-active' : ''} ${isWrongKeyFallback ? 'error-active' : ''}`}
                            onClick={() => handleGuess(key.name)}
                            disabled={feedback.type !== null || isHistoryView}
                        >
                            {getKeyDisplayName(key.name, 'minor', namingSystem)}
                        </button>
                    );
                })}
            </div>

            <style>{`
        .variant-toggle {
          margin-top: 0.5rem;
          display: flex;
          justify-content: center;
          gap: 0.5rem;
        }
        .key-buttons {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 0.5rem;
          margin-top: 1rem;
        }
        .variant-btn {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.1rem;
          padding: 0.5rem;
          line-height: 1.1;
        }
        .variant-label {
          font-size: 0.75rem;
          opacity: 0.8;
          font-weight: normal;
        }
        @media (min-width: 600px) {
          .key-buttons {
            grid-template-columns: repeat(6, 1fr);
          }
        }
        @media (min-width: 900px) {
          .key-buttons {
            grid-template-columns: repeat(8, 1fr);
          }
        }
      `}</style>
        </div>
    );
};

export default KeyPractice;
