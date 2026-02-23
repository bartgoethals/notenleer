export type TimeSignature = '2/4' | '3/4' | '4/4' | '6/8' | '9/8';

export interface RhythmItem {
    duration: string; // VexFlow duration indicator: 'w', 'h', 'q', '8', '16', 'qd', '8d'
    isRest: boolean;
    ticks: number; // Length in quarter beats (q = 1.0, 8 = 0.5)
}

// 1 TEL for 2/4, 3/4, 4/4
const MOTIFS_1_BEAT: RhythmItem[][] = [
    [{ duration: 'q', isRest: false, ticks: 1.0 }],
    [{ duration: 'q', isRest: true, ticks: 1.0 }],
    [{ duration: '8', isRest: false, ticks: 0.5 }, { duration: '8', isRest: false, ticks: 0.5 }],
    [{ duration: '8', isRest: true, ticks: 0.5 }, { duration: '8', isRest: false, ticks: 0.5 }],
    [{ duration: '8d', isRest: false, ticks: 0.75 }, { duration: '16', isRest: false, ticks: 0.25 }],
    [{ duration: '16', isRest: false, ticks: 0.25 }, { duration: '16', isRest: false, ticks: 0.25 }, { duration: '8', isRest: false, ticks: 0.5 }],
    [{ duration: '8', isRest: false, ticks: 0.5 }, { duration: '16', isRest: false, ticks: 0.25 }, { duration: '16', isRest: false, ticks: 0.25 }],
    [{ duration: '16', isRest: false, ticks: 0.25 }, { duration: '8', isRest: false, ticks: 0.5 }, { duration: '16', isRest: false, ticks: 0.25 }],
    [{ duration: '16', isRest: false, ticks: 0.25 }, { duration: '16', isRest: false, ticks: 0.25 }, { duration: '16', isRest: false, ticks: 0.25 }, { duration: '16', isRest: false, ticks: 0.25 }]
];

// 2 TELLEN for 2/4, 3/4, 4/4
const MOTIFS_2_BEATS: RhythmItem[][] = [
    [{ duration: 'h', isRest: false, ticks: 2.0 }],
    [{ duration: 'h', isRest: true, ticks: 2.0 }],
    [{ duration: 'qd', isRest: false, ticks: 1.5 }, { duration: '8', isRest: false, ticks: 0.5 }],
    [{ duration: '8', isRest: false, ticks: 0.5 }, { duration: 'q', isRest: false, ticks: 1.0 }, { duration: '8', isRest: false, ticks: 0.5 }]
];

// 3 TELLEN for 3/4, 4/4
const MOTIFS_3_BEATS: RhythmItem[][] = [
    [{ duration: 'hd', isRest: false, ticks: 3.0 }],
    [{ duration: 'hd', isRest: true, ticks: 3.0 }]
];

// 4 TELLEN for 4/4
const MOTIFS_4_BEATS: RhythmItem[][] = [
    [{ duration: 'w', isRest: false, ticks: 4.0 }],
    [{ duration: 'w', isRest: true, ticks: 4.0 }]
];

// 1 TEL for 6/8, 9/8 (1.5 quarter beats)
const MOTIFS_1_5_BEAT: RhythmItem[][] = [
    [{ duration: 'qd', isRest: false, ticks: 1.5 }],
    [{ duration: 'qd', isRest: true, ticks: 1.5 }],
    [{ duration: 'q', isRest: false, ticks: 1.0 }, { duration: '8', isRest: false, ticks: 0.5 }],
    [{ duration: '8', isRest: false, ticks: 0.5 }, { duration: '8', isRest: false, ticks: 0.5 }, { duration: '8', isRest: false, ticks: 0.5 }],
    [{ duration: '8', isRest: true, ticks: 0.5 }, { duration: '8', isRest: false, ticks: 0.5 }, { duration: '8', isRest: false, ticks: 0.5 }],
    [{ duration: '8', isRest: false, ticks: 0.5 }, { duration: '8', isRest: true, ticks: 0.5 }, { duration: '8', isRest: false, ticks: 0.5 }],
    [{ duration: '8', isRest: false, ticks: 0.5 }, { duration: '8', isRest: false, ticks: 0.5 }, { duration: '8', isRest: true, ticks: 0.5 }],
    [{ duration: '8d', isRest: false, ticks: 0.75 }, { duration: '16', isRest: false, ticks: 0.25 }, { duration: '8', isRest: false, ticks: 0.5 }],
    [{ duration: '16', isRest: false, ticks: 0.25 }, { duration: '16', isRest: false, ticks: 0.25 }, { duration: '8', isRest: false, ticks: 0.5 }, { duration: '8', isRest: false, ticks: 0.5 }],
    [{ duration: '8', isRest: false, ticks: 0.5 }, { duration: '16', isRest: false, ticks: 0.25 }, { duration: '16', isRest: false, ticks: 0.25 }, { duration: '8', isRest: false, ticks: 0.5 }],
    [{ duration: '8', isRest: false, ticks: 0.5 }, { duration: '8', isRest: false, ticks: 0.5 }, { duration: '16', isRest: false, ticks: 0.25 }, { duration: '16', isRest: false, ticks: 0.25 }],
    [{ duration: '16', isRest: false, ticks: 0.25 }, { duration: '16', isRest: false, ticks: 0.25 }, { duration: '16', isRest: false, ticks: 0.25 }, { duration: '16', isRest: false, ticks: 0.25 }, { duration: '8', isRest: false, ticks: 0.5 }],
    [{ duration: '8', isRest: false, ticks: 0.5 }, { duration: '16', isRest: false, ticks: 0.25 }, { duration: '16', isRest: false, ticks: 0.25 }, { duration: '16', isRest: false, ticks: 0.25 }, { duration: '16', isRest: false, ticks: 0.25 }],
    [{ duration: '16', isRest: false, ticks: 0.25 }, { duration: '16', isRest: false, ticks: 0.25 }, { duration: '8', isRest: false, ticks: 0.5 }, { duration: '16', isRest: false, ticks: 0.25 }, { duration: '16', isRest: false, ticks: 0.25 }],
    [{ duration: '16', isRest: false, ticks: 0.25 }, { duration: '16', isRest: false, ticks: 0.25 }, { duration: '16', isRest: false, ticks: 0.25 }, { duration: '16', isRest: false, ticks: 0.25 }, { duration: '16', isRest: false, ticks: 0.25 }, { duration: '16', isRest: false, ticks: 0.25 }]
];

// 2 TELLEN for 6/8, 9/8 (3.0 quarter beats)
const MOTIFS_3_BEATS_COMPOUND: RhythmItem[][] = [
    [{ duration: 'hd', isRest: false, ticks: 3.0 }],
    [{ duration: 'hd', isRest: true, ticks: 3.0 }]
];

const getRandomItem = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

/**
 * Generates a valid rhythm sequence that perfectly fills the given time signature.
 */
export const generateRhythmForSignature = (signature: TimeSignature): RhythmItem[] => {
    const sequence: RhythmItem[] = [];

    // We compose the measure from these building blocks to ensure musical grouping.
    if (signature === '2/4') {
        if (Math.random() < 0.2) {
            sequence.push(...getRandomItem(MOTIFS_2_BEATS));
        } else {
            sequence.push(...getRandomItem(MOTIFS_1_BEAT));
            sequence.push(...getRandomItem(MOTIFS_1_BEAT));
        }
    } else if (signature === '3/4') {
        const layout = Math.random();
        if (layout < 0.1) {
            sequence.push(...getRandomItem(MOTIFS_3_BEATS));
        } else if (layout < 0.3) {
            sequence.push(...getRandomItem(MOTIFS_2_BEATS));
            sequence.push(...getRandomItem(MOTIFS_1_BEAT));
        } else if (layout < 0.5) {
            sequence.push(...getRandomItem(MOTIFS_1_BEAT));
            sequence.push(...getRandomItem(MOTIFS_2_BEATS));
        } else {
            sequence.push(...getRandomItem(MOTIFS_1_BEAT));
            sequence.push(...getRandomItem(MOTIFS_1_BEAT));
            sequence.push(...getRandomItem(MOTIFS_1_BEAT));
        }
    } else if (signature === '4/4') {
        const layout = Math.random();
        if (layout < 0.1) {
            sequence.push(...getRandomItem(MOTIFS_4_BEATS));
        } else if (layout < 0.3) {
            sequence.push(...getRandomItem(MOTIFS_2_BEATS));
            sequence.push(...getRandomItem(MOTIFS_2_BEATS));
        } else if (layout < 0.5) {
            sequence.push(...getRandomItem(MOTIFS_2_BEATS));
            sequence.push(...getRandomItem(MOTIFS_1_BEAT));
            sequence.push(...getRandomItem(MOTIFS_1_BEAT));
        } else if (layout < 0.7) {
            sequence.push(...getRandomItem(MOTIFS_1_BEAT));
            sequence.push(...getRandomItem(MOTIFS_1_BEAT));
            sequence.push(...getRandomItem(MOTIFS_2_BEATS));
        } else {
            sequence.push(...getRandomItem(MOTIFS_1_BEAT));
            sequence.push(...getRandomItem(MOTIFS_1_BEAT));
            sequence.push(...getRandomItem(MOTIFS_1_BEAT));
            sequence.push(...getRandomItem(MOTIFS_1_BEAT));
        }
    } else if (signature === '6/8') {
        if (Math.random() < 0.1) {
            sequence.push(...getRandomItem(MOTIFS_3_BEATS_COMPOUND));
        } else {
            sequence.push(...getRandomItem(MOTIFS_1_5_BEAT));
            sequence.push(...getRandomItem(MOTIFS_1_5_BEAT));
        }
    } else if (signature === '9/8') {
        const layout = Math.random();
        if (layout < 0.2) {
            sequence.push(...getRandomItem(MOTIFS_3_BEATS_COMPOUND));
            sequence.push(...getRandomItem(MOTIFS_1_5_BEAT));
        } else if (layout < 0.4) {
            sequence.push(...getRandomItem(MOTIFS_1_5_BEAT));
            sequence.push(...getRandomItem(MOTIFS_3_BEATS_COMPOUND));
        } else {
            sequence.push(...getRandomItem(MOTIFS_1_5_BEAT));
            sequence.push(...getRandomItem(MOTIFS_1_5_BEAT));
            sequence.push(...getRandomItem(MOTIFS_1_5_BEAT));
        }
    }

    // Edge case: don't let the entire measure be a rest
    if (sequence.every(s => s.isRest)) {
        return generateRhythmForSignature(signature); // Regenerate if it's purely silence
    }

    return sequence;
};

export const TEMPO_NAMES = [
    { name: 'Largo', bpm: 45 },
    { name: 'Adagio', bpm: 60 },
    { name: 'Andante', bpm: 90 },
    { name: 'Moderato', bpm: 108 },
    { name: 'Allegro', bpm: 132 },
    { name: 'Presto', bpm: 168 }
];

export const getRandomTempo = () => getRandomItem(TEMPO_NAMES);

export const generateWrongRhythms = (correctSequence: RhythmItem[], signature: TimeSignature): RhythmItem[][] => {
    const wrongList: RhythmItem[][] = [];
    const correctString = JSON.stringify(correctSequence);

    let attempts = 0;
    while (wrongList.length < 3 && attempts < 50) {
        attempts++;
        const candidate = generateRhythmForSignature(signature);
        const candidateString = JSON.stringify(candidate);

        if (candidateString !== correctString && !wrongList.some(w => JSON.stringify(w) === candidateString)) {
            wrongList.push(candidate);
        }
    }

    return wrongList;
};
