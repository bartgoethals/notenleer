import React, { useState, useEffect, useRef, useCallback } from 'react';
import { RotateCcw, ChevronLeft, ChevronRight, Play } from 'lucide-react';
import * as Tone from 'tone';
import RhythmRenderer from './RhythmRenderer';
import RhythmCircleRenderer from './RhythmCircleRenderer';
import BeatVisualizer from './BeatVisualizer';
import {
    TimeSignature,
    RhythmItem,
    generateRhythmForSignature,
    TEMPO_NAMES,
    generateWrongRhythms
} from '../utils/rhythmUtils';

interface RhythmHistoryItem {
    signature: TimeSignature;
    tempo: { name: string; bpm: number };
    sequence: RhythmItem[];
    choices: RhythmItem[][];
    correctChoiceIndex: number;
    userChoiceIndex?: number;
}

interface RhythmPracticeProps {
    volume: boolean;
    cheatMode: boolean;
    globalScore: { correct: number, total: number };
    updateGlobalScore: (isCorrect: boolean) => void;
}

const SIGNATURES: TimeSignature[] = ['2/4', '3/4', '4/4', '6/8', '9/8'];

const RhythmPractice: React.FC<RhythmPracticeProps> = ({ volume, cheatMode, globalScore, updateGlobalScore }) => {
    const [activeSignatures, setActiveSignatures] = useState<TimeSignature[]>(['4/4']);
    const [selectedTempo, setSelectedTempo] = useState({ name: 'Moderato', bpm: 108 });
    const [customBpmInput, setCustomBpmInput] = useState('108');
    const [history, setHistory] = useState<RhythmHistoryItem[]>([]);
    const [historyIndex, setHistoryIndex] = useState(-1);
    const [feedback, setFeedback] = useState<{ type: 'success' | 'error' | null, message: string }>({ type: null, message: '' });
    const [hasCheatedThisExercise, setHasCheatedThisExercise] = useState(false);

    // Playback state
    const [isPlaying, setIsPlaying] = useState(false);
    const [progress, setProgress] = useState(0);
    const [activeSequence, setActiveSequence] = useState<RhythmItem[] | null>(null);
    const synthRef = useRef<Tone.Synth | null>(null);
    const animationRef = useRef<number | null>(null);
    const isHistoryView = history.length > 0 && historyIndex < history.length - 1;

    // Derived current item
    const currentItem = history[historyIndex];

    const generateExercise = useCallback((isRefresh: boolean | React.MouseEvent = false) => {
        const refresh = isRefresh === true;
        if (activeSignatures.length === 0) return;

        const signature = activeSignatures[Math.floor(Math.random() * activeSignatures.length)];
        const sequence = generateRhythmForSignature(signature);
        const wrongChoices = generateWrongRhythms(sequence, signature);

        // Shuffle the correct answer into the wrong choices
        const choices = [...wrongChoices];
        const correctChoiceIndex = Math.floor(Math.random() * 4);
        choices.splice(correctChoiceIndex, 0, sequence);

        // By default use the selectedTempo for this new exercise
        const newItem: RhythmHistoryItem = { signature, tempo: selectedTempo, sequence, choices, correctChoiceIndex };

        setHistory(prev => {
            if (refresh && prev.length > 0 && feedback.type === null) {
                return [...prev.slice(0, prev.length - 1), newItem];
            }
            return [...prev.slice(0, historyIndex + 1), newItem];
        });
        setHistoryIndex(prev => refresh && history.length > 0 && feedback.type === null ? history.length - 1 : prev + 1);

        setFeedback({ type: null, message: '' });
        setHasCheatedThisExercise(cheatMode);
        setProgress(0);
        setIsPlaying(false);
    }, [activeSignatures, historyIndex, cheatMode, feedback.type, history.length, selectedTempo]);

    useEffect(() => {
        if (history.length === 0) {
            generateExercise();
        }

        // Initialize Synth
        if (!synthRef.current) {
            synthRef.current = new Tone.Synth({
                oscillator: { type: 'square' },
                envelope: { attack: 0.01, decay: 0.2, sustain: 0.2, release: 0.5 }
            }).toDestination();
        }
    }, [generateExercise, history.length]);

    // Handle Cheat Mode Tracking
    useEffect(() => {
        if (cheatMode) {
            setHasCheatedThisExercise(true);
        }
    }, [cheatMode]);

    const playRhythm = async () => {
        if (!currentItem || isPlaying || !synthRef.current) return;
        await Tone.start();

        setIsPlaying(true);
        setProgress(0);
        setActiveSequence(null);

        const synth = synthRef.current;
        synth.volume.value = volume ? -5 : -Infinity;

        const { sequence, tempo, signature } = currentItem;
        const secondsPerQuarter = 60 / tempo.bpm;

        let totalQuarterBeats = 4.0;
        switch (signature) {
            case '2/4': totalQuarterBeats = 2.0; break;
            case '3/4': totalQuarterBeats = 3.0; break;
            case '4/4': totalQuarterBeats = 4.0; break;
            case '6/8': totalQuarterBeats = 3.0; break;
            case '9/8': totalQuarterBeats = 4.5; break;
        }

        const exactTotalDurationSec = totalQuarterBeats * secondsPerQuarter;
        const startTime = Tone.now() + 0.1; // small buffer

        let accTicks = 0;
        sequence.forEach(item => {
            if (!item.isRest) {
                const noteStart = startTime + accTicks * secondsPerQuarter;
                const noteDuration = item.ticks * secondsPerQuarter;
                // Leave a tiny gap (0.05s) between notes for articulation, unless it's very short
                const articulationGap = Math.min(0.05, noteDuration * 0.1);
                synth.triggerAttackRelease("C4", noteDuration - articulationGap, noteStart);
            }
            accTicks += item.ticks;
        });

        // Animation Loop
        const animate = () => {
            const now = Tone.now();
            if (now < startTime) {
                animationRef.current = requestAnimationFrame(animate);
                return;
            }
            const elapsed = now - startTime;
            const currentProgress = elapsed / exactTotalDurationSec;

            if (currentProgress < 1.0) {
                setProgress(currentProgress);
                animationRef.current = requestAnimationFrame(animate);
            } else {
                setProgress(1.0);
                setIsPlaying(false);
                setActiveSequence(null);
            }
        };
        animationRef.current = requestAnimationFrame(animate);
    };

    const playSpecificRhythm = async (sequence: RhythmItem[], e: React.MouseEvent) => {
        e.stopPropagation();
        if (!synthRef.current || !currentItem || isPlaying) return;

        await Tone.start();
        setIsPlaying(true);
        setProgress(0);
        setActiveSequence(sequence);

        const synth = synthRef.current;
        synth.volume.value = volume ? -5 : -Infinity;

        const { tempo, signature } = currentItem;
        const secondsPerQuarter = 60 / tempo.bpm;

        let totalQuarterBeats = 4.0;
        switch (signature) {
            case '2/4': totalQuarterBeats = 2.0; break;
            case '3/4': totalQuarterBeats = 3.0; break;
            case '4/4': totalQuarterBeats = 4.0; break;
            case '6/8': totalQuarterBeats = 3.0; break;
            case '9/8': totalQuarterBeats = 4.5; break;
        }

        const exactTotalDurationSec = totalQuarterBeats * secondsPerQuarter;
        const startTime = Tone.now() + 0.1;

        let accTicks = 0;
        sequence.forEach(item => {
            if (!item.isRest) {
                const noteStart = startTime + accTicks * secondsPerQuarter;
                const noteDuration = item.ticks * secondsPerQuarter;
                const articulationGap = Math.min(0.05, noteDuration * 0.1);
                synth.triggerAttackRelease("C4", noteDuration - articulationGap, noteStart);
            }
            accTicks += item.ticks;
        });

        // Animation Loop
        const animate = () => {
            const now = Tone.now();
            if (now < startTime) {
                animationRef.current = requestAnimationFrame(animate);
                return;
            }
            const elapsed = now - startTime;
            const currentProgress = elapsed / exactTotalDurationSec;

            if (currentProgress < 1.0) {
                setProgress(currentProgress);
                animationRef.current = requestAnimationFrame(animate);
            } else {
                setProgress(1.0);
                setIsPlaying(false);
                setActiveSequence(null);
            }
        };
        animationRef.current = requestAnimationFrame(animate);
    };

    // Cleanup animation on unmount
    useEffect(() => {
        return () => {
            if (animationRef.current) cancelAnimationFrame(animationRef.current);
            if (synthRef.current) {
                synthRef.current.dispose();
                synthRef.current = null;
            }
        };
    }, []);

    const handleTempoChange = (bpm: number, name: string) => {
        if (isHistoryView) return;
        const newTempo = { name, bpm };
        setSelectedTempo(newTempo);
        setCustomBpmInput(bpm.toString());

        // Update the active item's tempo immediately if they haven't guessed yet
        setHistory(prev => {
            if (prev.length === 0 || feedback.type !== null) return prev;
            const updated = [...prev];
            updated[updated.length - 1] = { ...updated[updated.length - 1], tempo: newTempo };
            return updated;
        });
    };

    const applyCustomBpm = (val: string) => {
        let bpm = parseInt(val);
        if (isNaN(bpm) || bpm < 30) bpm = 30;
        if (bpm > 300) bpm = 300;

        // Check if this matches a predefined tempo name
        const predefined = TEMPO_NAMES.find(t => t.bpm === bpm);
        const name = predefined ? predefined.name : 'Aangepast';

        handleTempoChange(bpm, name);
    };

    const toggleSignature = (sig: TimeSignature) => {
        if (isHistoryView || feedback.type !== null) return;
        setActiveSignatures(prev => {
            if (prev.includes(sig)) {
                if (prev.length === 1) return prev;
                return prev.filter(s => s !== sig);
            }
            return [...prev, sig];
        });
    };

    const handleGuess = (index: number) => {
        if (isHistoryView || feedback.type !== null || !currentItem) return;

        // Record the user's choice
        setHistory(prev => {
            const updated = [...prev];
            updated[updated.length - 1] = { ...updated[updated.length - 1], userChoiceIndex: index };
            return updated;
        });

        if (index === currentItem.correctChoiceIndex) {
            setFeedback({ type: 'success', message: 'Correct!' });
            if (!hasCheatedThisExercise) updateGlobalScore(true);
            setTimeout(() => generateExercise(), 1500);
        } else {
            setFeedback({ type: 'error', message: 'Fout!' });
            if (!hasCheatedThisExercise) updateGlobalScore(false);
            setTimeout(() => generateExercise(), 1500);
        }
    };

    const handlePrev = () => {
        if (historyIndex > 0) {
            setHistoryIndex(i => i - 1);
            setFeedback({ type: null, message: 'Geschiedenisweergave (Alleen lezen)' });
            setProgress(0);
            setIsPlaying(false);
        }
    };

    const handleNext = () => {
        if (historyIndex < history.length - 1) {
            setHistoryIndex(i => i + 1);
            if (historyIndex + 1 === history.length - 1) {
                setFeedback({ type: null, message: '' });
                setProgress(0);
                setIsPlaying(false);
            }
        }
    };

    if (!currentItem) return <div className="practice-area">Laden...</div>;

    const showSolution = isHistoryView || feedback.type !== null || cheatMode;

    return (
        <div className="practice-area">

            <div className="practice-header">
                <div className="controls-group" style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                    <div className="clef-toggle toggle-group">
                        {SIGNATURES.map(sig => (
                            <button
                                key={sig}
                                className={`btn-icon-toggle signature-toggle ${activeSignatures.includes(sig) ? 'active' : ''}`}
                                onClick={() => toggleSignature(sig)}
                                disabled={isHistoryView || feedback.type !== null}
                            >
                                {sig}
                            </button>
                        ))}
                    </div>

                    <div className="rhythm-tempo-control" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', background: 'rgba(255,255,255,0.05)', padding: '0.35rem 0.75rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }}>
                        <select
                            value={currentItem.tempo.name}
                            onChange={(e) => {
                                const val = e.target.value;
                                if (val === 'Aangepast') {
                                    handleTempoChange(parseInt(customBpmInput), 'Aangepast');
                                } else {
                                    const t = TEMPO_NAMES.find(n => n.name === val);
                                    if (t) handleTempoChange(t.bpm, t.name);
                                }
                            }}
                            disabled={isHistoryView || isPlaying}
                            style={{ padding: '0.25rem', borderRadius: '4px', background: 'rgba(0,0,0,0.3)', color: 'white', border: '1px solid rgba(255,255,255,0.2)', fontSize: '0.9rem' }}
                        >
                            {TEMPO_NAMES.map(t => <option key={t.name} value={t.name}>{t.name}</option>)}
                            <option value="Aangepast">Aangepast</option>
                        </select>
                        <div style={{ display: 'flex', alignItems: 'center', marginLeft: '0.25rem' }}>
                            <span style={{ fontSize: '1rem', marginRight: '0.25rem' }}>♩ =</span>
                            <input
                                type="number"
                                min="30" max="300"
                                value={isHistoryView ? currentItem.tempo.bpm : customBpmInput}
                                onChange={(e) => setCustomBpmInput(e.target.value)}
                                onBlur={(e) => applyCustomBpm(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && applyCustomBpm(customBpmInput)}
                                disabled={isHistoryView || isPlaying}
                                style={{ width: '50px', padding: '0.25rem', borderRadius: '4px', background: 'rgba(0,0,0,0.3)', color: 'white', border: '1px solid rgba(255,255,255,0.2)', textAlign: 'center', fontSize: '0.9rem' }}
                            />
                        </div>
                    </div>
                </div>

                <div className="practice-header-right">
                    <button className="btn-icon-toggle" onClick={() => generateExercise(true)} disabled={isHistoryView} title="Nieuwe opgave">
                        <RotateCcw size={22} />
                    </button>
                    <div className="history-nav">
                        <button className="btn-icon-toggle" onClick={handlePrev} disabled={historyIndex <= 0} title="Vorige oefening">
                            <ChevronLeft size={22} />
                        </button>
                        <button className="btn-icon-toggle" onClick={handleNext} disabled={historyIndex >= history.length - 1} title="Volgende oefening">
                            <ChevronRight size={22} />
                        </button>
                    </div>
                </div>
            </div>

            <div className={`feedback-banner ${feedback.type || ''}`}>
                {feedback.message}
            </div>

            <div className="rhythm-display-area" style={{ display: 'flex', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: '2rem', margin: '-0.5rem 0 1.5rem' }}>
                <div className="rhythm-circle-wrapper" style={{ width: '180px', height: '180px', position: 'relative' }}>
                    <RhythmCircleRenderer
                        sequence={activeSequence || currentItem.sequence}
                        signature={currentItem.signature}
                        progress={progress}
                        showSolution={showSolution}
                    />

                    {!isPlaying && (
                        <button
                            className="btn-play-overlay"
                            onClick={playRhythm}
                            style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', background: '#8b5cf6', border: 'none', borderRadius: '50%', width: '60px', height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'white', opacity: 0.9 }}
                            title="Speel Ritme"
                        >
                            <Play size={30} style={{ marginLeft: '4px' }} fill="currentColor" />
                        </button>
                    )}
                </div>

                <div className="beat-visualizer-wrapper" style={{ width: '180px', height: '180px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <BeatVisualizer
                        signature={currentItem.signature}
                        progress={progress}
                        size={180}
                    />
                </div>
            </div>

            <div className={`rhythm-options-grid ${isHistoryView ? 'history-mode' : ''}`} style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: '1rem', width: '100%' }}>
                {currentItem.choices.map((choiceSeq, idx) => {
                    const isCorrectChoice = idx === currentItem.correctChoiceIndex;
                    const isUserChoice = idx === currentItem.userChoiceIndex;

                    let choiceClass = "rhythm-choice-btn glass-card";
                    if (isHistoryView || feedback.type !== null) {
                        if (isCorrectChoice) choiceClass += " cheat-active";
                        else if (isUserChoice) choiceClass += " error-active";
                    }

                    return (
                        <div
                            key={idx}
                            className={choiceClass}
                            style={{ cursor: isHistoryView || feedback.type !== null ? 'default' : 'pointer' }}
                            onClick={() => (isHistoryView || feedback.type !== null) ? null : handleGuess(idx)}
                        >
                            <RhythmRenderer
                                sequence={choiceSeq}
                                signature={currentItem.signature}
                                width={260}
                                height={90}
                            />

                            {/* Play button for the specific choice */}
                            {isHistoryView && (
                                <button
                                    className="choice-play-btn"
                                    onClick={(e) => playSpecificRhythm(choiceSeq, e)}
                                    style={{
                                        position: 'absolute',
                                        top: '8px',
                                        right: '8px',
                                        background: 'rgba(139, 92, 246, 0.4)',
                                        border: '1px solid rgba(255,255,255,0.2)',
                                        borderRadius: '50%',
                                        width: '32px',
                                        height: '32px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        cursor: 'pointer',
                                        color: 'white',
                                        zIndex: 10
                                    }}
                                    title="Beluister dit ritme"
                                >
                                    <Play size={16} fill="currentColor" style={{ marginLeft: '2px' }} />
                                </button>
                            )}
                        </div>
                    );
                })}
            </div>

        </div>
    );
};

export default RhythmPractice;
