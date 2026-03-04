import * as Tone from 'tone';

let synth: Tone.PolySynth | null = null;
let piano: Tone.Sampler | null = null;
let isPianoLoaded = false;
let rhythmSynth: Tone.Synth | null = null;

export const getSynth = () => {
    if (!synth) {
        synth = new Tone.PolySynth(Tone.Synth).toDestination();
    }
    return synth;
};

export const initPiano = () => {
    if (!piano) {
        // Use the public Salamander grand piano samples hosted by Tone.js
        piano = new Tone.Sampler({
            urls: {
                A0: "A0.mp3",
                C1: "C1.mp3",
                "D#1": "Ds1.mp3",
                "F#1": "Fs1.mp3",
                A1: "A1.mp3",
                C2: "C2.mp3",
                "D#2": "Ds2.mp3",
                "F#2": "Fs2.mp3",
                A2: "A2.mp3",
                C3: "C3.mp3",
                "D#3": "Ds3.mp3",
                "F#3": "Fs3.mp3",
                A3: "A3.mp3",
                C4: "C4.mp3",
                "D#4": "Ds4.mp3",
                "F#4": "Fs4.mp3",
                A4: "A4.mp3",
                C5: "C5.mp3",
                "D#5": "Ds5.mp3",
                "F#5": "Fs5.mp3",
                A5: "A5.mp3",
                C6: "C6.mp3",
                "D#6": "Ds6.mp3",
                "F#6": "Fs6.mp3",
                A6: "A6.mp3",
                C7: "C7.mp3",
                "D#7": "Ds7.mp3",
                "F#7": "Fs7.mp3",
                A7: "A7.mp3",
                C8: "C8.mp3"
            },
            release: 1,
            baseUrl: "https://tonejs.github.io/audio/salamander/",
            onload: () => {
                isPianoLoaded = true;
            }
        }).toDestination();
    }
    return piano;
};

export const getRhythmSynth = () => {
    if (!rhythmSynth) {
        rhythmSynth = new Tone.Synth({
            oscillator: { type: 'triangle' },
            envelope: { attack: 0.01, decay: 0.1, sustain: 0.2, release: 0.5 }
        }).toDestination();
    }
    return rhythmSynth;
};

export const playAudio = async (
    noteOrNotes: string | string[],
    duration: string | number = '4n',
    usePiano: boolean = false,
    time?: number
) => {
    if (Tone.context.state !== 'running') {
        await Tone.start();
    }

    // Ensure piano starts loading in background if selected
    if (usePiano) {
        const sampler = initPiano();
        if (isPianoLoaded && sampler.loaded) {
            sampler.triggerAttackRelease(noteOrNotes, duration, time);
            return;
        }
    }

    const polySynth = getSynth();
    polySynth.triggerAttackRelease(noteOrNotes, duration, time);
};

export const playRhythmAudio = async (
    pitch: string,
    duration: number,
    usePiano: boolean,
    time: number,
    velocity: number
) => {
    if (Tone.context.state !== 'running') {
        await Tone.start();
    }

    if (usePiano) {
        const sampler = initPiano();
        if (isPianoLoaded && sampler.loaded) {
            sampler.triggerAttackRelease(pitch, duration, time, velocity);
            return;
        }
    }

    const synth = getRhythmSynth();
    synth.triggerAttackRelease(pitch, duration, time, velocity);
};
