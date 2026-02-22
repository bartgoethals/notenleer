export const SOLFEGE_NAMES: Record<string, string> = {
    'C': 'Do', 'D': 'Re', 'E': 'Mi', 'F': 'Fa', 'G': 'Sol', 'A': 'La', 'B': 'Si',
    'C#': 'Do#', 'D#': 'Re#', 'F#': 'Fa#', 'G#': 'Sol#', 'A#': 'La#',
    'Db': 'Re♭', 'Eb': 'Mi♭', 'Gb': 'Sol♭', 'Ab': 'La♭', 'Bb': 'Si♭'
};

// Map each key signature to the notes that should be sharp or flat by default
export const KEY_SIGNATURE_NOTES: Record<string, Record<string, string>> = {
    'C': {},
    'G': { 'F': '#' },
    'D': { 'F': '#', 'C': '#' },
    'A': { 'F': '#', 'C': '#', 'G': '#' },
    'E': { 'F': '#', 'C': '#', 'G': '#', 'D': '#' },
    'B': { 'F': '#', 'C': '#', 'G': '#', 'D': '#', 'A': '#' },
    'F#': { 'F': '#', 'C': '#', 'G': '#', 'D': '#', 'A': '#', 'E': '#' },
    'C#': { 'F': '#', 'C': '#', 'G': '#', 'D': '#', 'A': '#', 'E': '#', 'B': '#' },
    'F': { 'B': 'b' },
    'Bb': { 'B': 'b', 'E': 'b' },
    'Eb': { 'B': 'b', 'E': 'b', 'A': 'b' },
    'Ab': { 'B': 'b', 'E': 'b', 'A': 'b', 'D': 'b' },
    'Db': { 'B': 'b', 'E': 'b', 'A': 'b', 'D': 'b', 'G': 'b' },
    'Gb': { 'B': 'b', 'E': 'b', 'A': 'b', 'D': 'b', 'G': 'b', 'C': 'b' },
    'Cb': { 'B': 'b', 'E': 'b', 'A': 'b', 'D': 'b', 'G': 'b', 'C': 'b', 'F': 'b' },
};

export type NamingSystem = 'letters' | 'solfege';
export type MinorModeType = 'natural' | 'harmonic' | 'melodic';

export const raiseNote = (noteWithOctave: string): string => {
    const [note, octave] = noteWithOctave.split('/');
    if (note.endsWith('b')) {
        return note.slice(0, -1) + '/' + octave; // Eb -> E
    }
    // Handle double sharps if necessary, but for basic theory C# -> C## or just C# -> D
    // VexFlow handles ##
    return note + '#' + '/' + octave; // C -> C#, C# -> C##
};

export const getMinorScaleVariant = (naturalScale: string[], type: MinorModeType): string[] => {
    if (type === 'natural') return [...naturalScale];

    const variant = [...naturalScale];
    if (type === 'harmonic') {
        // Raise 7th (index 6)
        variant[6] = raiseNote(variant[6]);
    } else if (type === 'melodic') {
        // Raise 6th and 7th (indices 5 and 6)
        variant[5] = raiseNote(variant[5]);
        variant[6] = raiseNote(variant[6]);
    }
    return variant;
};

export const getNoteDisplay = (note: string, system: NamingSystem): string => {
    if (system === 'letters') return note;
    return SOLFEGE_NAMES[note] || note;
};

export interface KeyData {
    name: string;
    signature: string;
    mode: 'major' | 'minor';
    scale: string[];
    triad: string[];
}

export const MAJOR_KEYS: KeyData[] = [
    { name: 'C', signature: 'C', mode: 'major', scale: ['C/4', 'D/4', 'E/4', 'F/4', 'G/4', 'A/4', 'B/4', 'C/5'], triad: ['C/4', 'E/4', 'G/4'] },
    { name: 'G', signature: 'G', mode: 'major', scale: ['G/3', 'A/3', 'B/3', 'C/4', 'D/4', 'E/4', 'F#/4', 'G/4'], triad: ['G/3', 'B/3', 'D/4'] },
    { name: 'D', signature: 'D', mode: 'major', scale: ['D/4', 'E/4', 'F#/4', 'G/4', 'A/4', 'B/4', 'C#/5', 'D/5'], triad: ['D/4', 'F#/4', 'A/4'] },
    { name: 'A', signature: 'A', mode: 'major', scale: ['A/3', 'B/3', 'C#/4', 'D/4', 'E/4', 'F#/4', 'G#/4', 'A/4'], triad: ['A/3', 'C#/4', 'E/4'] },
    { name: 'E', signature: 'E', mode: 'major', scale: ['E/4', 'F#/4', 'G#/4', 'A/4', 'B/4', 'C#/5', 'D#/5', 'E/5'], triad: ['E/4', 'G#/4', 'B/4'] },
    { name: 'F', signature: 'F', mode: 'major', scale: ['F/4', 'G/4', 'A/4', 'Bb/4', 'C/5', 'D/5', 'E/5', 'F/5'], triad: ['F/4', 'A/4', 'C/5'] },
    { name: 'Bb', signature: 'Bb', mode: 'major', scale: ['Bb/3', 'C/4', 'D/4', 'Eb/4', 'F/4', 'G/4', 'A/4', 'Bb/4'], triad: ['Bb/3', 'D/4', 'F/4'] },
    { name: 'Eb', signature: 'Eb', mode: 'major', scale: ['Eb/4', 'F/4', 'G/4', 'Ab/4', 'Bb/4', 'C/5', 'D/5', 'Eb/5'], triad: ['Eb/4', 'G/4', 'Bb/4'] },
    { name: 'Ab', signature: 'Ab', mode: 'major', scale: ['Ab/3', 'Bb/3', 'C/4', 'Db/4', 'Eb/4', 'F/4', 'G/4', 'Ab/4'], triad: ['Ab/3', 'C/4', 'Eb/4'] },
];

export const MINOR_KEYS: KeyData[] = [
    { name: 'Am', signature: 'C', mode: 'minor', scale: ['A/3', 'B/3', 'C/4', 'D/4', 'E/4', 'F/4', 'G/4', 'A/4'], triad: ['A/3', 'C/4', 'E/4'] },
    { name: 'Em', signature: 'G', mode: 'minor', scale: ['E/4', 'F#/4', 'G/4', 'A/4', 'B/4', 'C/5', 'D/5', 'E/5'], triad: ['E/4', 'G/4', 'B/4'] },
    { name: 'Bm', signature: 'D', mode: 'minor', scale: ['B/3', 'C#/4', 'D/4', 'E/4', 'F#/4', 'G/4', 'A/4', 'B/4'], triad: ['B/3', 'D/4', 'F#/4'] },
    { name: 'F#m', signature: 'A', mode: 'minor', scale: ['F#/3', 'G#/3', 'A/3', 'B/3', 'C#/4', 'D/4', 'E/4', 'F#/4'], triad: ['F#/3', 'A/3', 'C#/4'] },
    { name: 'Dm', signature: 'F', mode: 'minor', scale: ['D/4', 'E/4', 'F/4', 'G/4', 'A/4', 'Bb/4', 'C/5', 'D/5'], triad: ['D/4', 'F/4', 'A/4'] },
    { name: 'Gm', signature: 'Bb', mode: 'minor', scale: ['G/3', 'A/3', 'Bb/3', 'C/4', 'D/4', 'Eb/4', 'F/4', 'G/4'], triad: ['G/3', 'Bb/3', 'D/4'] },
    { name: 'Cm', signature: 'Eb', mode: 'minor', scale: ['C/4', 'D/4', 'Eb/4', 'F/4', 'G/4', 'Ab/4', 'Bb/4', 'C/5'], triad: ['C/4', 'Eb/4', 'G/4'] },
    { name: 'Fm', signature: 'Ab', mode: 'minor', scale: ['F/3', 'G/3', 'Ab/3', 'Bb/3', 'C/4', 'Db/4', 'Eb/4', 'F/4'], triad: ['F/3', 'Ab/3', 'C/4'] },
];

export const getKeyDisplayName = (keyName: string, mode: 'major' | 'minor', system: NamingSystem): string => {
    let base = keyName.replace('m', '');
    let displayBase = getNoteDisplay(base, system);

    if (mode === 'major') {
        return system === 'letters' ? displayBase : `${displayBase} G`;
    } else {
        return system === 'letters' ? `${displayBase.toLowerCase()}m` : `${displayBase} k`;
    }
};
