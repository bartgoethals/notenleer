import React, { useEffect, useRef } from 'react';
import { Renderer, Stave, StaveNote, Voice, Formatter, Accidental, KeySignature } from 'vexflow';
import { KEY_SIGNATURE_NOTES } from '../utils/musicUtils';

export interface NoteData {
    key: string;
    status: 'idle' | 'correct' | 'incorrect';
    isCurrent?: boolean;
    guessedKey?: string;
}

interface ScoreRendererProps {
    clef: 'treble' | 'bass';
    notes?: NoteData[];
    note?: string; // Legacy support
    keySignature?: string;
    forceRed?: boolean;
    width?: number;
    height?: number;
}

const ScoreRenderer: React.FC<ScoreRendererProps> = ({
    clef,
    notes,
    note,
    keySignature = 'C',
    forceRed = false,
    width = 800,
    height = 150
}) => {
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!containerRef.current) return;

        // Clear previous rendering
        containerRef.current.innerHTML = '';

        const renderer = new Renderer(containerRef.current, Renderer.Backends.SVG);
        renderer.resize(width, height);
        const context = renderer.getContext();

        // Set styles for dark mode visibility
        context.setFillStyle('#f8fafc');
        context.setStrokeStyle('#f8fafc');

        const staveWidth = width - 40;
        const stave = new Stave(20, 20, staveWidth);
        stave.addClef(clef);

        if (keySignature && keySignature !== 'C') {
            const ks = new KeySignature(keySignature);
            if (forceRed) {
                ks.setStyle({ fillStyle: '#ef4444', strokeStyle: '#ef4444' });
            }
            stave.addModifier(ks);
        }

        stave.setContext(context).draw();

        // Prepare notes for VexFlow
        let activeNotes: NoteData[] = [];
        if (notes && notes.length > 0) {
            activeNotes = notes;
        } else if (note) {
            activeNotes = [{ key: note, status: 'idle', isCurrent: true }];
        }

        if (activeNotes.length > 0) {
            const staveNotes1: StaveNote[] = [];
            const staveNotes2: StaveNote[] = [];

            activeNotes.forEach((n) => {
                const [pitch, octaveStr] = n.key.split('/');
                const octave = parseInt(octaveStr);
                const pitchMap: Record<string, number> = { 'C': 0, 'D': 1, 'E': 2, 'F': 3, 'G': 4, 'A': 5, 'B': 6 };
                const pitchVal = pitchMap[pitch[0].toUpperCase()] ?? 0;
                const noteIndex = octave * 7 + pitchVal;

                const midIndex = clef === 'treble' ? 34 : 22;
                const stemDirection = noteIndex >= midIndex ? -1 : 1; // -1 = Stem.DOWN, 1 = Stem.UP

                const sn1 = new StaveNote({
                    clef: clef,
                    keys: [n.key],
                    duration: 'q',
                    stemDirection: stemDirection
                });

                let color1 = '#8b5cf6'; // Default purple
                if (forceRed) {
                    color1 = '#ef4444'; // Red
                } else if (n.status === 'correct' || n.guessedKey) {
                    color1 = '#22c55e'; // Green if correct or wrong guess (we show the expected one in green)
                }

                const style1 = n.isCurrent
                    ? { fillStyle: '#ffffff', strokeStyle: '#ffffff' }
                    : { fillStyle: color1, strokeStyle: color1 };

                sn1.setStyle(style1);
                sn1.setLedgerLineStyle(style1);

                const notePitch = n.key.split('/')[0];
                const baseNote = notePitch[0].toUpperCase();
                const accidental = notePitch.slice(1).toLowerCase();
                const impliedAccidental = KEY_SIGNATURE_NOTES[keySignature]?.[baseNote] || '';

                if (accidental && accidental !== impliedAccidental) {
                    sn1.addModifier(new Accidental(accidental));
                } else if (!accidental && impliedAccidental) {
                    sn1.addModifier(new Accidental('n'));
                }

                sn1.getModifiers().forEach(m => m.setStyle(style1));
                staveNotes1.push(sn1);

                if (n.guessedKey) {
                    // It's an incorrect guess, draw a stemless red note
                    const guessPitch = n.guessedKey.split('/')[0];
                    const guessOctaveStr = n.guessedKey.split('/')[1];
                    const guessOctave = parseInt(guessOctaveStr);
                    const guessVal = pitchMap[guessPitch[0].toUpperCase()] ?? 0;
                    const guessNoteIndex = guessOctave * 7 + guessVal;

                    const sn2 = new StaveNote({
                        clef: clef,
                        keys: [n.guessedKey],
                        duration: 'q',
                        stemDirection: stemDirection
                    });
                    const color2 = '#ef4444'; // Red

                    sn2.setStyle({ fillStyle: color2, strokeStyle: color2 });
                    if (sn2.setStemStyle) sn2.setStemStyle({ strokeStyle: 'transparent' });
                    sn2.setLedgerLineStyle({ fillStyle: color2, strokeStyle: color2 });

                    const guessBase = guessPitch[0].toUpperCase();
                    const guessAcc = guessPitch.slice(1).toLowerCase();
                    const guessImplied = KEY_SIGNATURE_NOTES[keySignature]?.[guessBase] || '';

                    if (guessAcc && guessAcc !== guessImplied) {
                        sn2.addModifier(new Accidental(guessAcc));
                    } else if (!guessAcc && guessImplied) {
                        sn2.addModifier(new Accidental('n'));
                    }

                    sn2.getModifiers().forEach(m => m.setStyle({ fillStyle: color2, strokeStyle: color2 }));
                    staveNotes2.push(sn2);
                } else {
                    // transparent placeholder
                    const ghost = new StaveNote({
                        clef: clef,
                        keys: [n.key],
                        duration: 'q'
                    });
                    ghost.setStyle({ fillStyle: 'transparent', strokeStyle: 'transparent' });
                    if (ghost.setStemStyle) ghost.setStemStyle({ strokeStyle: 'transparent' });
                    ghost.setLedgerLineStyle({ fillStyle: 'transparent', strokeStyle: 'transparent' });
                    staveNotes2.push(ghost);
                }
            });

            const hasGuesses = activeNotes.some(n => n.guessedKey);

            const voice1 = new Voice({ numBeats: activeNotes.length, beatValue: 4 });
            voice1.addTickables(staveNotes1);

            if (hasGuesses) {
                const voice2 = new Voice({ numBeats: activeNotes.length, beatValue: 4 });
                voice2.addTickables(staveNotes2);

                new Formatter().joinVoices([voice1, voice2]).format([voice1, voice2], staveWidth - 100);

                // Force exact horizontal alignment, overriding VexFlow's collision avoidance
                staveNotes1.forEach(sn => sn.setXShift(0));
                staveNotes2.forEach(sn => sn.setXShift(0));

                // Draw voice2 (red) first so it layers behind voice1 (green)
                voice2.draw(context, stave);
                voice1.draw(context, stave);
            } else {
                new Formatter().joinVoices([voice1]).format([voice1], staveWidth - 100);
                voice1.draw(context, stave);
            }
        }
    }, [clef, notes, note, keySignature, width, height]);

    return <div ref={containerRef} className="score-renderer" style={{ display: 'flex', justifyContent: 'center' }} />;
};

export default ScoreRenderer;
