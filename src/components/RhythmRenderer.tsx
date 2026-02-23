import React, { useEffect, useRef } from 'react';
import { Renderer, Stave, StaveNote, Voice, Formatter, Beam, Fraction, Dot } from 'vexflow';
import { RhythmItem, TimeSignature } from '../utils/rhythmUtils';

interface RhythmRendererProps {
    sequence: RhythmItem[];
    signature: TimeSignature;
    width?: number;
    height?: number;
    active?: boolean;
    isCorrect?: boolean;
    isError?: boolean;
}

const RhythmRenderer: React.FC<RhythmRendererProps> = ({
    sequence,
    signature,
    width = 300,
    height = 100,
    active = false,
    isCorrect = false,
    isError = false
}) => {
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!containerRef.current) return;

        containerRef.current.innerHTML = '';

        const renderer = new Renderer(containerRef.current, Renderer.Backends.SVG);
        renderer.resize(width, height);
        const context = renderer.getContext();

        let staveColor = '#94a3b8'; // default grey
        let noteColor = '#f8fafc';

        if (active) {
            staveColor = '#8b5cf6';
            noteColor = '#a78bfa';
        }
        if (isCorrect) {
            staveColor = '#22c55e';
            noteColor = '#4ade80';
        } else if (isError) {
            staveColor = '#ef4444';
            noteColor = '#f87171';
        }

        context.setFillStyle(staveColor);
        context.setStrokeStyle(staveColor);

        const stave = new Stave(10, 10, width - 20, { numLines: 5 });
        // Hide all lines except the middle one (index 2) so standard b/4 notes and rests sit perfectly
        stave.getConfigForLines().forEach((config, idx) => {
            if (idx !== 2) config.visible = false;
        });

        stave.addTimeSignature(signature);
        stave.setContext(context).draw();

        if (sequence.length > 0) {
            const staveNotes: StaveNote[] = [];

            sequence.forEach(item => {
                // Determine VexFlow duration string ('q', 'qr', '8', '8r', etc)
                const durationKey = item.isRest ? `${item.duration}r` : item.duration;
                // Use standard b/4 which perfectly sits on the middle line (index 2) we preserved
                const keys = ['b/4'];

                const sn = new StaveNote({
                    clef: 'treble',
                    keys: keys,
                    duration: durationKey,
                });
                // Force all stems up as requested
                sn.setStemDirection(1);

                const style = { fillStyle: noteColor, strokeStyle: noteColor };
                sn.setStyle(style);
                if (sn.setStemStyle && !item.isRest) {
                    sn.setStemStyle(style);
                }

                if (item.duration.includes('d')) {
                    sn.addModifier(new Dot(), 0);
                    // Also style the dot to match the note color
                    sn.getModifiers().forEach(m => m.setStyle(style));
                }

                staveNotes.push(sn);
            });

            // Calculate VexFlow Voice configuration
            const [numBeatsStr, beatValueStr] = signature.split('/');
            const numBeats = parseInt(numBeatsStr);
            const beatValue = parseInt(beatValueStr);

            const voice = new Voice({ numBeats, beatValue });
            voice.addTickables(staveNotes);

            // Auto-beam the notes (grouping eighths and sixteenths properly)
            const beams = Beam.generateBeams(staveNotes, {
                groups: [new Fraction(beatValue === 8 ? 3 : 1, beatValue === 8 ? 8 : 4)],
                stemDirection: 1 // Ensure auto-beaming also forces stems UP
            });

            beams.forEach(b => {
                b.setStyle({ fillStyle: noteColor, strokeStyle: noteColor });
            });

            new Formatter().joinVoices([voice]).format([voice], width - 60);

            voice.draw(context, stave);
            beams.forEach(b => b.setContext(context).draw());
        }
    }, [sequence, signature, width, height, active, isCorrect, isError]);

    return <div ref={containerRef} className="rhythm-renderer" style={{ display: 'flex', justifyContent: 'center', pointerEvents: 'none' }} />;
};

export default RhythmRenderer;
