import React from 'react';
import { RhythmItem, TimeSignature } from '../utils/rhythmUtils';

interface RhythmCircleRendererProps {
    sequence: RhythmItem[];
    signature: TimeSignature;
    progress: number; // 0.0 to 1.0
    showSolution?: boolean;
}

const getTotalTicks = (sig: TimeSignature) => {
    switch (sig) {
        case '2/4': return 2.0;
        case '3/4': return 3.0;
        case '4/4': return 4.0;
        case '6/8': return 3.0;
        case '9/8': return 4.5;
        default: return 4.0;
    }
};

const getPieSlicePath = (cx: number, cy: number, radius: number, startAngle: number, endAngle: number) => {
    // If it's a full circle, SVG arcs have a hard time with start==end (360 degrees)
    if (endAngle - startAngle >= 359.99) {
        return `M ${cx} ${cy - radius} A ${radius} ${radius} 0 1 1 ${cx} ${cy + radius} A ${radius} ${radius} 0 1 1 ${cx} ${cy - radius} Z`;
    }

    const startRad = (startAngle - 90) * Math.PI / 180.0;
    const endRad = (endAngle - 90) * Math.PI / 180.0;

    const x1 = cx + radius * Math.cos(startRad);
    const y1 = cy + radius * Math.sin(startRad);
    const x2 = cx + radius * Math.cos(endRad);
    const y2 = cy + radius * Math.sin(endRad);

    const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';

    return [
        `M ${cx} ${cy}`,
        `L ${x1} ${y1}`,
        `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
        'Z'
    ].join(' ');
};

const RhythmCircleRenderer: React.FC<RhythmCircleRendererProps> = ({ sequence, signature, progress, showSolution = true }) => {
    const size = 200;
    const cx = size / 2;
    const cy = size / 2;
    const radius = size / 2 - 10;

    const totalTicks = getTotalTicks(signature);
    const currentTick = progress * totalTicks;

    let acc = 0;
    const sequenceWithStart = sequence.map(item => {
        const startTick = acc;
        acc += item.ticks;
        return { ...item, startTick };
    });

    return (
        <svg viewBox={`0 0 ${size} ${size}`} className="rhythm-circle" width="100%" height="100%">
            {/* Background Clock Face */}
            <circle cx={cx} cy={cy} r={radius} fill="rgba(255, 255, 255, 0.05)" stroke="#334155" strokeWidth="2" />

            {/* Render pie slices for each note */}
            {showSolution && sequenceWithStart.map((item, idx) => {
                const { startTick } = item;

                // Skip if it's a rest
                if (item.isRest) return null;

                let filledDuration = item.ticks;
                // Animate the fill only when actively playing
                if (progress > 0 && progress < 1) {
                    if (currentTick <= startTick) return null;
                    filledDuration = Math.min(item.ticks, currentTick - startTick);
                }

                // If it's basically 0, don't render it yet to avoid math errors
                if (filledDuration <= 0.01) return null;

                const startAngle = (startTick / totalTicks) * 360;
                const endAngle = ((startTick + filledDuration) / totalTicks) * 360;

                const path = getPieSlicePath(cx, cy, radius, startAngle, endAngle);

                return (
                    <path
                        key={`slice-${idx}`}
                        d={path}
                        fill="#8b5cf6" // Primary purple color from the app theme
                        opacity="0.8"
                    />
                );
            })}

            {/* Radial spokes defining every note/rest boundary */}
            {showSolution && sequenceWithStart.map((item, idx) => {
                // Determine the angle for the start of this rhythm item
                const angle = (item.startTick / totalTicks) * 360;
                const rad = (angle - 90) * Math.PI / 180;

                // Draw line from center to edge of the inner circle
                const x1 = cx;
                const y1 = cy;
                const x2 = cx + radius * Math.cos(rad);
                const y2 = cy + radius * Math.sin(rad);

                // Animate the spoke visibility only when actively playing
                if (progress > 0 && progress < 1) {
                    if (currentTick < item.startTick) return null;
                }

                return (
                    <line
                        key={`spoke-${idx}`}
                        x1={x1} y1={y1} x2={x2} y2={y2}
                        stroke="rgba(255, 255, 255, 0.6)"
                        strokeWidth="1.5"
                    />
                );
            })}

            {/* Render the structural beat markers (e.g. 6 ticks for 6/8) */}
            {Array.from({ length: parseInt(signature.split('/')[0], 10) }).map((_, i) => {
                const numMarkers = parseInt(signature.split('/')[0], 10);
                const angle = (i / numMarkers) * 360;
                const rad = (angle - 90) * Math.PI / 180;
                const x1 = cx + (radius - 10) * Math.cos(rad);
                const y1 = cy + (radius - 10) * Math.sin(rad);
                const x2 = cx + radius * Math.cos(rad);
                const y2 = cy + radius * Math.sin(rad);
                return (
                    <line key={`marker-${i}`} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#94a3b8" strokeWidth="2" />
                );
            })}

            {/* The Rotating Hand (Wijzer) */}
            {progress > 0 && progress < 1 && (
                <line
                    x1={cx}
                    y1={cy}
                    x2={cx + radius * Math.cos((progress * 360 - 90) * Math.PI / 180)}
                    y2={cy + radius * Math.sin((progress * 360 - 90) * Math.PI / 180)}
                    stroke="#22c55e" // Green hand
                    strokeWidth="3"
                    strokeLinecap="round"
                />
            )}

            {/* Center dot */}
            <circle cx={cx} cy={cy} r="4" fill="#22c55e" />
        </svg>
    );
};

export default RhythmCircleRenderer;
