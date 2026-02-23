import React from 'react';
import { TimeSignature } from '../utils/rhythmUtils';

interface BeatVisualizerProps {
    signature: TimeSignature;
    progress: number; // 0.0 to 1.0 (representing the full cycle of the sequence)
    size?: number;
}

// Points are defined in a 0 to 1 coordinate system (x, y)
// 0,0 is top-left. 1,1 is bottom-right.
type Point = { x: number, y: number };

// The 4 fixed anchor points for the conductor
const PT_T = { x: 0.5, y: 0.15 }; // Top center
const PT_L = { x: 0.15, y: 0.85 }; // Bottom left
const PT_C = { x: 0.5, y: 0.85 }; // Bottom center
const PT_R = { x: 0.85, y: 0.85 }; // Bottom right

const ANCHOR_POINTS = [PT_T, PT_L, PT_C, PT_R];

// The paths are defined as a sequence of points the conductor's hand visits.
// Each segment between points corresponds to one beat.
const PATTERNS: Record<string, Point[]> = {
    // 2/4 and 6/8: Down, Up between the 2 middle points
    '2/4': [PT_T, PT_C, PT_T],
    '6/8': [PT_T, PT_C, PT_T],
    // 3/4 and 9/8: Down, Right, Up (Triangle)
    '3/4': [PT_T, PT_C, PT_R, PT_T],
    '9/8': [PT_T, PT_C, PT_R, PT_T],
    // 4/4: Down, Left, Right, Up (Inverted T / Cross)
    '4/4': [PT_T, PT_C, PT_L, PT_R, PT_T]
};

// Helper to interpolate between two points
const lerpPoint = (p1: Point, p2: Point, t: number): Point => ({
    x: p1.x + (p2.x - p1.x) * t,
    y: p1.y + (p2.y - p1.y) * t
});

const BeatVisualizer: React.FC<BeatVisualizerProps> = ({ signature, progress, size = 100 }) => {
    // Determine the path based on signature
    // If we somehow get an unknown signature, fallback to 4/4
    const pathPoints = PATTERNS[signature] || PATTERNS['4/4'];

    // Number of visual beats (segments) is length of points - 1
    const numSegments = pathPoints.length - 1;

    // We calculate where the dot should be based on progress (0 to 1 mapped across all segments)
    const scaledProgress = progress * numSegments;
    const currentSegmentIndex = Math.min(Math.floor(scaledProgress), numSegments - 1);

    // the 't' value is the local progress within the current segment (0.0 to 1.0)
    const t = scaledProgress - currentSegmentIndex;

    const p1 = pathPoints[currentSegmentIndex];
    const p2 = pathPoints[currentSegmentIndex + 1];

    let dotPos = { x: 0.5, y: 0.1 };

    // Only animate the dot if progress > 0
    if (progress > 0 && progress < 1) {
        dotPos = lerpPoint(p1, p2, t);
    } else if (progress === 1) {
        // Just snap it to the end when done
        dotPos = pathPoints[pathPoints.length - 1];
    }

    // Convert relative 0-1 coordinates to actual SVG pixels
    const toPx = (val: number) => val * size;

    // Determine color
    // If progress is 0, it's idle.
    const isActive = progress > 0 && progress < 1;
    const color = isActive ? '#22c55e' : '#64748b'; // Green when active, slate when idle
    const anchorColor = 'rgba(255, 255, 255, 0.2)';

    return (
        <div style={{ width: size, height: size, position: 'relative' }} title={`Maatslag Patroon voor ${signature}`}>
            <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
                {/* 4 Fixed Anchor Points */}
                {ANCHOR_POINTS.map((pt, idx) => (
                    <circle
                        key={`anchor-${idx}`}
                        cx={toPx(pt.x)}
                        cy={toPx(pt.y)}
                        r="4"
                        fill={anchorColor}
                    />
                ))}

                {/* The animated moving dot */}
                {isActive && (
                    <circle
                        cx={toPx(dotPos.x)}
                        cy={toPx(dotPos.y)}
                        r="8"
                        fill={color}
                        style={{ filter: 'drop-shadow(0 0 8px #22c55e)' }}
                    />
                )}

                {/* Always show a small dot at the exact start (top) for reference if not active */}
                {!isActive && (
                    <circle
                        cx={toPx(PT_T.x)}
                        cy={toPx(PT_T.y)}
                        r="8"
                        fill={color}
                    />
                )}
            </svg>
        </div>
    );
};

export default BeatVisualizer;
