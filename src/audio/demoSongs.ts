import { Project } from './types';
import { SYNTH_PRESETS } from './presets';

export const DEMO_PROJECTS: Project[] = [
  {
    id: 'demo-aether-drift',
    title: 'Aether Drift (Spatial Synthwave)',
    bpm: 110,
    timeSignature: [4, 4],
    key: 'Dm',
    scale: 'minor',
    loopStart: 0,
    loopEnd: 16,
    isLooping: true,
    masterVolume: 0.85,
    masterEQ: { low: 1.5, mid: -0.5, high: 2.0 },
    tracks: [
      {
        id: 't-lead',
        name: 'Glass Arp Lead',
        type: 'lead',
        color: '#38bdf8', // sky blue
        icon: 'Sparkles',
        volume: 0.85,
        pan: -0.4,
        muted: false,
        solo: false,
        armed: false,
        synthParams: SYNTH_PRESETS.glassBell.params,
        spatial: { x: -4, y: 1.5, z: -3, roomAcoustic: 'hall' },
        clips: [
          {
            id: 'c-lead-1',
            name: 'Aether Motif A',
            trackId: 't-lead',
            startBeat: 0,
            durationBeats: 8,
            color: '#38bdf8',
            notes: [
              { id: 'n1', pitch: 74, startBeat: 0, durationBeats: 0.5, velocity: 0.9 }, // D5
              { id: 'n2', pitch: 77, startBeat: 0.5, durationBeats: 0.5, velocity: 0.8 }, // F5
              { id: 'n3', pitch: 81, startBeat: 1.0, durationBeats: 0.5, velocity: 0.85 }, // A5
              { id: 'n4', pitch: 79, startBeat: 1.5, durationBeats: 0.5, velocity: 0.75 }, // G5
              { id: 'n5', pitch: 76, startBeat: 2.0, durationBeats: 1.0, velocity: 0.9 }, // E5
              { id: 'n6', pitch: 72, startBeat: 3.0, durationBeats: 0.5, velocity: 0.7 }, // C5
              { id: 'n7', pitch: 74, startBeat: 3.5, durationBeats: 0.5, velocity: 0.8 }, // D5
              { id: 'n8', pitch: 81, startBeat: 4.0, durationBeats: 0.5, velocity: 0.95 },
              { id: 'n9', pitch: 82, startBeat: 4.5, durationBeats: 0.5, velocity: 0.85 }, // Bb5
              { id: 'n10', pitch: 81, startBeat: 5.0, durationBeats: 1.0, velocity: 0.8 },
              { id: 'n11', pitch: 77, startBeat: 6.0, durationBeats: 0.5, velocity: 0.8 },
              { id: 'n12', pitch: 76, startBeat: 6.5, durationBeats: 0.5, velocity: 0.75 },
              { id: 'n13', pitch: 74, startBeat: 7.0, durationBeats: 1.0, velocity: 0.85 }
            ]
          },
          {
            id: 'c-lead-2',
            name: 'Aether Motif B',
            trackId: 't-lead',
            startBeat: 8,
            durationBeats: 8,
            color: '#38bdf8',
            notes: [
              { id: 'n14', pitch: 74, startBeat: 0, durationBeats: 0.5, velocity: 0.9 },
              { id: 'n15', pitch: 77, startBeat: 0.5, durationBeats: 0.5, velocity: 0.8 },
              { id: 'n16', pitch: 81, startBeat: 1.0, durationBeats: 0.5, velocity: 0.85 },
              { id: 'n17', pitch: 86, startBeat: 1.5, durationBeats: 0.5, velocity: 0.95 }, // D6
              { id: 'n18', pitch: 84, startBeat: 2.0, durationBeats: 1.0, velocity: 0.9 }, // C6
              { id: 'n19', pitch: 81, startBeat: 3.0, durationBeats: 1.0, velocity: 0.85 },
              { id: 'n20', pitch: 79, startBeat: 4.0, durationBeats: 0.5, velocity: 0.85 },
              { id: 'n21', pitch: 81, startBeat: 4.5, durationBeats: 0.5, velocity: 0.8 },
              { id: 'n22', pitch: 77, startBeat: 5.0, durationBeats: 1.0, velocity: 0.8 },
              { id: 'n23', pitch: 76, startBeat: 6.0, durationBeats: 0.75, velocity: 0.75 },
              { id: 'n24', pitch: 74, startBeat: 6.75, durationBeats: 1.25, velocity: 0.9 }
            ]
          }
        ]
      },
      {
        id: 't-pad',
        name: 'Ethereal Glass Pad',
        type: 'ambient_pad',
        color: '#c084fc', // purple
        icon: 'Cloud',
        volume: 0.75,
        pan: 0.5,
        muted: false,
        solo: false,
        armed: false,
        synthParams: SYNTH_PRESETS.etherealPad.params,
        spatial: { x: 5, y: 3, z: -4, roomAcoustic: 'cathedral' },
        clips: [
          {
            id: 'c-pad-1',
            name: 'Dm9 - Bbmaj7 - Gm7 - A7',
            trackId: 't-pad',
            startBeat: 0,
            durationBeats: 16,
            color: '#c084fc',
            notes: [
              // Bar 1-2 (Dm9): D4, F4, A4, C5, E5
              { id: 'p1', pitch: 62, startBeat: 0, durationBeats: 3.8, velocity: 0.7 },
              { id: 'p2', pitch: 65, startBeat: 0, durationBeats: 3.8, velocity: 0.75 },
              { id: 'p3', pitch: 69, startBeat: 0, durationBeats: 3.8, velocity: 0.75 },
              { id: 'p4', pitch: 72, startBeat: 0, durationBeats: 3.8, velocity: 0.7 },
              { id: 'p5', pitch: 76, startBeat: 0, durationBeats: 3.8, velocity: 0.8 },

              // Bar 3-4 (Bbmaj7): Bb3, D4, F4, A4
              { id: 'p6', pitch: 58, startBeat: 4, durationBeats: 3.8, velocity: 0.7 },
              { id: 'p7', pitch: 62, startBeat: 4, durationBeats: 3.8, velocity: 0.75 },
              { id: 'p8', pitch: 65, startBeat: 4, durationBeats: 3.8, velocity: 0.75 },
              { id: 'p9', pitch: 69, startBeat: 4, durationBeats: 3.8, velocity: 0.8 },

              // Bar 5-6 (Gm7): G3, Bb3, D4, F4
              { id: 'p10', pitch: 55, startBeat: 8, durationBeats: 3.8, velocity: 0.7 },
              { id: 'p11', pitch: 58, startBeat: 8, durationBeats: 3.8, velocity: 0.75 },
              { id: 'p12', pitch: 62, startBeat: 8, durationBeats: 3.8, velocity: 0.75 },
              { id: 'p13', pitch: 65, startBeat: 8, durationBeats: 3.8, velocity: 0.8 },

              // Bar 7-8 (Asus4 -> A7): A3, D4/C#4, E4, G4
              { id: 'p14', pitch: 57, startBeat: 12, durationBeats: 3.8, velocity: 0.7 },
              { id: 'p15', pitch: 61, startBeat: 12, durationBeats: 3.8, velocity: 0.75 },
              { id: 'p16', pitch: 64, startBeat: 12, durationBeats: 3.8, velocity: 0.75 },
              { id: 'p17', pitch: 67, startBeat: 12, durationBeats: 3.8, velocity: 0.8 }
            ]
          }
        ]
      },
      {
        id: 't-bass',
        name: 'Warm Analog Bass',
        type: 'bass',
        color: '#fb7185', // rose
        icon: 'Radio',
        volume: 0.9,
        pan: 0.0,
        muted: false,
        solo: false,
        armed: false,
        synthParams: SYNTH_PRESETS.warmAnalogBass.params,
        spatial: { x: 0, y: -1, z: 1, roomAcoustic: 'intimate' },
        clips: [
          {
            id: 'c-bass-1',
            name: '808 Groove',
            trackId: 't-bass',
            startBeat: 0,
            durationBeats: 16,
            color: '#fb7185',
            notes: [
              // Bar 1 Dm
              { id: 'b1', pitch: 38, startBeat: 0, durationBeats: 1.5, velocity: 0.95 }, // D2
              { id: 'b2', pitch: 38, startBeat: 2.0, durationBeats: 0.75, velocity: 0.8 },
              { id: 'b3', pitch: 41, startBeat: 3.0, durationBeats: 0.75, velocity: 0.85 }, // F2
              // Bar 2 Bb
              { id: 'b4', pitch: 34, startBeat: 4, durationBeats: 1.5, velocity: 0.95 }, // Bb1
              { id: 'b5', pitch: 34, startBeat: 6.0, durationBeats: 0.75, velocity: 0.8 },
              { id: 'b6', pitch: 36, startBeat: 7.0, durationBeats: 0.75, velocity: 0.85 }, // C2
              // Bar 3 Gm
              { id: 'b7', pitch: 43, startBeat: 8, durationBeats: 1.5, velocity: 0.95 }, // G2
              { id: 'b8', pitch: 43, startBeat: 10.0, durationBeats: 0.75, velocity: 0.8 },
              { id: 'b9', pitch: 45, startBeat: 11.0, durationBeats: 0.75, velocity: 0.85 }, // A2
              // Bar 4 A
              { id: 'b10', pitch: 33, startBeat: 12, durationBeats: 1.5, velocity: 0.95 }, // A1
              { id: 'b11', pitch: 33, startBeat: 14.0, durationBeats: 0.75, velocity: 0.8 },
              { id: 'b12', pitch: 36, startBeat: 15.0, durationBeats: 0.75, velocity: 0.85 }
            ]
          }
        ]
      },
      {
        id: 't-drum',
        name: 'Hawa 808 Drums',
        type: 'drum',
        color: '#f59e0b', // amber
        icon: 'Disc',
        volume: 0.95,
        pan: 0.0,
        muted: false,
        solo: false,
        armed: false,
        synthParams: SYNTH_PRESETS.warmAnalogBass.params,
        spatial: { x: 0, y: 0, z: -2, roomAcoustic: 'studio' },
        clips: [
          {
            id: 'c-drum-1',
            name: 'Chillwave Groove (16 Bars)',
            trackId: 't-drum',
            startBeat: 0,
            durationBeats: 16,
            color: '#f59e0b',
            notes: [],
            drumPattern: {
              // 16 16th-note steps loop:
              kick:         [true, false, false, false, false, false, true, false, false, false, true, false, false, false, false, false],
              snare:        [false, false, false, false, true, false, false, false, false, false, false, false, true, false, false, false],
              clap:         [false, false, false, false, true, false, false, false, false, false, false, false, true, false, false, true],
              hihatClosed:  [true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true],
              hihatOpen:    [false, false, true, false, false, false, true, false, false, false, true, false, false, true, false, false],
              tom:          [false, false, false, false, false, false, false, false, false, false, false, false, false, false, true, false],
              percussion:   [false, false, false, true, false, false, false, false, false, true, false, false, false, false, false, false]
            }
          }
        ]
      }
    ]
  },
  {
    id: 'demo-tokyo-rain',
    title: 'Tokyo Rain (Neo-Soul Lo-Fi)',
    bpm: 85,
    timeSignature: [4, 4],
    key: 'C',
    scale: 'major',
    loopStart: 0,
    loopEnd: 8,
    isLooping: true,
    masterVolume: 0.82,
    masterEQ: { low: 2.0, mid: 0.0, high: -1.0 },
    tracks: [
      {
        id: 't-keys-tokyo',
        name: 'Neo-Soul Rhodes',
        type: 'piano',
        color: '#10b981', // emerald
        icon: 'Music',
        volume: 0.85,
        pan: -0.2,
        muted: false,
        solo: false,
        armed: false,
        synthParams: SYNTH_PRESETS.neoSoulKeys.params,
        spatial: { x: -3, y: 0.5, z: -2, roomAcoustic: 'studio' },
        clips: [
          {
            id: 'c-keys-1',
            name: 'Cmaj9 - Am7 - Dm9 - G13',
            trackId: 't-keys-tokyo',
            startBeat: 0,
            durationBeats: 8,
            color: '#10b981',
            notes: [
              // Cmaj9
              { id: 'k1', pitch: 48, startBeat: 0, durationBeats: 1.8, velocity: 0.75 },
              { id: 'k2', pitch: 59, startBeat: 0, durationBeats: 1.8, velocity: 0.7 },
              { id: 'k3', pitch: 62, startBeat: 0, durationBeats: 1.8, velocity: 0.75 },
              { id: 'k4', pitch: 64, startBeat: 0, durationBeats: 1.8, velocity: 0.8 },
              { id: 'k5', pitch: 67, startBeat: 0, durationBeats: 1.8, velocity: 0.7 },
              // Am7
              { id: 'k6', pitch: 45, startBeat: 2, durationBeats: 1.8, velocity: 0.75 },
              { id: 'k7', pitch: 57, startBeat: 2, durationBeats: 1.8, velocity: 0.7 },
              { id: 'k8', pitch: 60, startBeat: 2, durationBeats: 1.8, velocity: 0.75 },
              { id: 'k9', pitch: 64, startBeat: 2, durationBeats: 1.8, velocity: 0.7 },
              // Dm9
              { id: 'k10', pitch: 50, startBeat: 4, durationBeats: 1.8, velocity: 0.75 },
              { id: 'k11', pitch: 62, startBeat: 4, durationBeats: 1.8, velocity: 0.7 },
              { id: 'k12', pitch: 65, startBeat: 4, durationBeats: 1.8, velocity: 0.8 },
              { id: 'k13', pitch: 69, startBeat: 4, durationBeats: 1.8, velocity: 0.75 },
              // G13
              { id: 'k14', pitch: 43, startBeat: 6, durationBeats: 1.8, velocity: 0.75 },
              { id: 'k15', pitch: 59, startBeat: 6, durationBeats: 1.8, velocity: 0.7 },
              { id: 'k16', pitch: 64, startBeat: 6, durationBeats: 1.8, velocity: 0.8 },
              { id: 'k17', pitch: 67, startBeat: 6, durationBeats: 1.8, velocity: 0.7 }
            ]
          }
        ]
      },
      {
        id: 't-kalimba',
        name: 'Lo-Fi Kalimba Pluck',
        type: 'lead',
        color: '#06b6d4', // cyan
        icon: 'Feather',
        volume: 0.78,
        pan: 0.35,
        muted: false,
        solo: false,
        armed: false,
        synthParams: SYNTH_PRESETS.lofiPluck.params,
        spatial: { x: 3, y: 1.5, z: -3, roomAcoustic: 'ambient' },
        clips: [
          {
            id: 'c-kalimba-1',
            name: 'Raindrops Melody',
            trackId: 't-kalimba',
            startBeat: 0,
            durationBeats: 8,
            color: '#06b6d4',
            notes: [
              { id: 'm1', pitch: 72, startBeat: 0.5, durationBeats: 0.5, velocity: 0.7 },
              { id: 'm2', pitch: 76, startBeat: 1.0, durationBeats: 0.5, velocity: 0.75 },
              { id: 'm3', pitch: 79, startBeat: 1.5, durationBeats: 0.75, velocity: 0.8 },
              { id: 'm4', pitch: 76, startBeat: 2.5, durationBeats: 0.5, velocity: 0.7 },
              { id: 'm5', pitch: 74, startBeat: 3.0, durationBeats: 0.5, velocity: 0.75 },
              { id: 'm6', pitch: 72, startBeat: 3.5, durationBeats: 0.5, velocity: 0.65 },
              { id: 'm7', pitch: 69, startBeat: 4.5, durationBeats: 0.75, velocity: 0.7 },
              { id: 'm8', pitch: 72, startBeat: 5.5, durationBeats: 0.5, velocity: 0.75 },
              { id: 'm9', pitch: 74, startBeat: 6.0, durationBeats: 0.5, velocity: 0.8 },
              { id: 'm10', pitch: 71, startBeat: 7.0, durationBeats: 1.0, velocity: 0.75 }
            ]
          }
        ]
      },
      {
        id: 't-drums-tokyo',
        name: 'Vinyl Lo-Fi Beat',
        type: 'drum',
        color: '#f97316', // orange
        icon: 'Disc',
        volume: 0.88,
        pan: 0.0,
        muted: false,
        solo: false,
        armed: false,
        synthParams: SYNTH_PRESETS.warmAnalogBass.params,
        spatial: { x: 0, y: -0.5, z: -1, roomAcoustic: 'studio' },
        clips: [
          {
            id: 'c-drums-tokyo-1',
            name: 'Dusty Boom Bap',
            trackId: 't-drums-tokyo',
            startBeat: 0,
            durationBeats: 8,
            color: '#f97316',
            notes: [],
            drumPattern: {
              kick:         [true, false, false, false, false, false, true, false, false, true, false, false, false, false, false, false],
              snare:        [false, false, false, false, true, false, false, false, false, false, false, false, true, false, false, false],
              clap:         [false, false, false, false, false, false, false, false, false, false, false, false, true, false, false, false],
              hihatClosed:  [true, false, true, true, false, true, true, false, true, false, true, true, false, true, true, false],
              hihatOpen:    [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, true],
              tom:          [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false],
              percussion:   [false, false, true, false, false, false, false, true, false, false, true, false, false, false, true, false]
            }
          }
        ]
      }
    ]
  }
];
