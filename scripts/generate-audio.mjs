// Original procedural sound design for DARVINN STUDIO.
// Two cues are synthesised here from noise and sine partials; no external
// samples are used. Run `node scripts/generate-audio.mjs` (ffmpeg with
// libvorbis + aac required) to rebuild public/audio.
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import path from "node:path";

const SR = 48000;
const ROOT = process.cwd();
const OUT = path.join(ROOT, "public", "audio");
const BUILD = path.join(OUT, "_build");

const clamp = (v, min, max) => Math.min(max, Math.max(min, v));

function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function noiseStream(seed) {
  const rand = mulberry32(seed);
  return () => rand() * 2 - 1;
}

class Biquad {
  constructor() {
    this.x1 = 0;
    this.x2 = 0;
    this.y1 = 0;
    this.y2 = 0;
    this.b0 = 1;
    this.b1 = 0;
    this.b2 = 0;
    this.a1 = 0;
    this.a2 = 0;
  }

  bandpass(freq, q) {
    const w = (2 * Math.PI * clamp(freq, 20, SR / 2 - 200)) / SR;
    const alpha = Math.sin(w) / (2 * q);
    const a0 = 1 + alpha;
    this.b0 = alpha / a0;
    this.b1 = 0;
    this.b2 = -alpha / a0;
    this.a1 = (-2 * Math.cos(w)) / a0;
    this.a2 = (1 - alpha) / a0;
  }

  lowpass(freq, q = 0.707) {
    const w = (2 * Math.PI * clamp(freq, 20, SR / 2 - 200)) / SR;
    const alpha = Math.sin(w) / (2 * q);
    const cos = Math.cos(w);
    const a0 = 1 + alpha;
    this.b0 = ((1 - cos) / 2) / a0;
    this.b1 = (1 - cos) / a0;
    this.b2 = this.b0;
    this.a1 = (-2 * cos) / a0;
    this.a2 = (1 - alpha) / a0;
  }

  highpass(freq, q = 0.707) {
    const w = (2 * Math.PI * clamp(freq, 20, SR / 2 - 200)) / SR;
    const alpha = Math.sin(w) / (2 * q);
    const cos = Math.cos(w);
    const a0 = 1 + alpha;
    this.b0 = ((1 + cos) / 2) / a0;
    this.b1 = -(1 + cos) / a0;
    this.b2 = this.b0;
    this.a1 = (-2 * cos) / a0;
    this.a2 = (1 - alpha) / a0;
  }

  process(x) {
    const y =
      this.b0 * x +
      this.b1 * this.x1 +
      this.b2 * this.x2 -
      this.a1 * this.y1 -
      this.a2 * this.y2;
    this.x2 = this.x1;
    this.x1 = x;
    this.y2 = this.y1;
    this.y1 = y;
    return y;
  }
}

class OnePole {
  constructor(freq, highpass = false) {
    this.a = 1 - Math.exp((-2 * Math.PI * freq) / SR);
    this.y = 0;
    this.highpass = highpass;
  }

  process(x) {
    this.y += this.a * (x - this.y);
    return this.highpass ? x - this.y : this.y;
  }
}

const panGains = (pan) => {
  const angle = ((clamp(pan, -1, 1) + 1) * Math.PI) / 4;
  return [Math.cos(angle), Math.sin(angle)];
};

const attackDecay = (t, attack, decay) =>
  (1 - Math.exp(-t / attack)) * Math.exp(-t / decay);

const tailFade = (t, duration, fade = 0.03) => {
  const left = duration - t;
  if (left >= fade) return 1;
  if (left <= 0) return 0;
  return 0.5 - 0.5 * Math.cos((Math.PI * left) / fade);
};

function makeBuffer(duration, channels = 2) {
  const length = Math.ceil(duration * SR);
  return {
    duration,
    channels: Array.from({ length: channels }, () => new Float32Array(length)),
    length,
  };
}

function addSine(buffer, { start = 0, freq, endFreq, attack, decay, gain, pan }) {
  const [gl, gr] = panGains(pan ?? 0);
  const startSample = Math.floor(start * SR);
  const count = Math.min(buffer.length - startSample, Math.ceil((attack * 6 + decay * 6) * SR));
  let phase = 0;
  for (let i = 0; i < count; i += 1) {
    const t = i / SR;
    const f = endFreq === undefined ? freq : freq + (endFreq - freq) * clamp(t / decay, 0, 1);
    phase += (2 * Math.PI * f) / SR;
    const sample = Math.sin(phase) * attackDecay(t, attack, decay) * gain;
    const index = startSample + i;
    if (index >= buffer.length) break;
    buffer.channels[0][index] += sample * gl;
    buffer.channels[1][index] += sample * gr;
  }
}

function addNoiseVoice(
  buffer,
  {
    seed,
    start = 0,
    duration,
    filter,
    attack,
    decay,
    gain,
    pan = 0,
  },
) {
  const [gl, gr] = panGains(pan);
  const rand = noiseStream(seed);
  const bandA = new Biquad();
  if (filter.type === "band") {
    bandA.bandpass(filter.freq, filter.q ?? 1);
  } else if (filter.type === "low") {
    const lp1 = new OnePole(filter.freq);
    const lp2 = new OnePole(filter.freq);
    bandA.process = (x) => lp2.process(lp1.process(x));
  } else if (filter.type === "high") {
    const hp = new OnePole(filter.freq, true);
    bandA.process = (x) => hp.process(x);
  }

  const startSample = Math.floor(start * SR);
  const count = Math.min(Math.ceil(duration * SR), buffer.length - startSample);
  for (let i = 0; i < count; i += 1) {
    const t = i / SR;
    const env = attackDecay(t, attack, decay) * tailFade(t, duration);
    const sample = bandA.process(rand()) * env * gain;
    const index = startSample + i;
    if (index >= buffer.length) break;
    buffer.channels[0][index] += sample * gl;
    buffer.channels[1][index] += sample * gr;
  }
}

function normalize(buffer, peakDb) {
  let peak = 0;
  for (const channel of buffer.channels) {
    for (let i = 0; i < channel.length; i += 1) {
      peak = Math.max(peak, Math.abs(channel[i]));
    }
  }
  if (peak === 0) return;
  const target = Math.pow(10, peakDb / 20);
  const scale = target / peak;
  for (const channel of buffer.channels) {
    for (let i = 0; i < channel.length; i += 1) {
      channel[i] *= scale;
    }
  }
}

function fadeEdges(buffer, fade = 0.004) {
  for (const channel of buffer.channels) {
    const n = Math.min(Math.ceil(fade * SR), channel.length);
    for (let i = 0; i < n; i += 1) {
      const w = 0.5 - 0.5 * Math.cos((Math.PI * i) / n);
      channel[i] *= w;
      channel[channel.length - 1 - i] *= w;
    }
  }
}

function writeWav(buffer, file) {
  const { channels, length } = buffer;
  const channelCount = channels.length;
  const dataBytes = length * channelCount * 2;
  const bytes = Buffer.alloc(44 + dataBytes);
  bytes.write("RIFF", 0);
  bytes.writeUInt32LE(36 + dataBytes, 4);
  bytes.write("WAVE", 8);
  bytes.write("fmt ", 12);
  bytes.writeUInt32LE(16, 16);
  bytes.writeUInt16LE(1, 20);
  bytes.writeUInt16LE(channelCount, 22);
  bytes.writeUInt32LE(SR, 24);
  bytes.writeUInt32LE(SR * channelCount * 2, 28);
  bytes.writeUInt16LE(channelCount * 2, 32);
  bytes.writeUInt16LE(16, 34);
  bytes.write("data", 36);
  bytes.writeUInt32LE(dataBytes, 40);
  let offset = 44;
  for (let i = 0; i < length; i += 1) {
    for (let c = 0; c < channelCount; c += 1) {
      const value = clamp(channels[c][i], -1, 1);
      bytes.writeInt16LE(Math.round(value * 32767), offset);
      offset += 2;
    }
  }
  writeFileSync(file, bytes);
}

function encode(wavPath, targetBase, quality = 4) {
  const ogg = `${targetBase}.ogg`;
  const m4a = `${targetBase}.m4a`;
  const vorbis = spawnSync(
    "ffmpeg",
    ["-hide_banner", "-loglevel", "error", "-y", "-i", wavPath, "-c:a", "libvorbis", "-q:a", String(quality), ogg],
    { encoding: "utf8" },
  );
  if (vorbis.status !== 0) throw new Error(vorbis.stderr || "vorbis encode failed");
  const aac = spawnSync(
    "ffmpeg",
    ["-hide_banner", "-loglevel", "error", "-y", "-i", wavPath, "-c:a", "aac", "-b:a", "112k", "-movflags", "+faststart", m4a],
    { encoding: "utf8" },
  );
  if (aac.status !== 0) throw new Error(aac.stderr || "aac encode failed");
}

// ---------------------------------------------------------------- music ----

const BPM = 64;
const BEAT = 60 / BPM;
const SWING = 0.64;
const BARS = 8;
const LOOP_SECONDS = BARS * 4 * BEAT;
const TAIL_SECONDS = 4;

const midiToFreq = (midi) => 440 * Math.pow(2, (midi - 69) / 12);
const barTime = (bar, beat = 0, swung = false) =>
  (bar * 4 + beat + (swung ? SWING : 0)) * BEAT;
const human = (rand, amount) => (rand() * 2 - 1) * amount;
const eventTime = (bar, beat, swung, rand, amount) =>
  Math.max(0.0005, barTime(bar, beat, swung) + human(rand, amount));

function addPianoNote(buffer, { time, midi, velocity, rand, duration = 3.6 }) {
  const start = Math.max(0, Math.round(time * SR));
  const seconds = Math.min(duration, buffer.duration - start / SR);
  const count = Math.floor(seconds * SR);
  if (count <= 0) return;

  const f0 = midiToFreq(midi);
  const pan = clamp(0.05 + (midi - 60) * 0.011, -0.32, 0.32);
  const [gl, gr] = panGains(pan);
  const tau = clamp(4.6 * Math.pow(146.83 / f0, 0.6), 0.7, 8);
  const brightness = 0.42 + velocity * 0.58;
  const voices = [];
  for (let n = 1; n <= 6; n += 1) {
    const freq = f0 * n * Math.sqrt(1 + 0.00035 * n * n);
    const strike = Math.abs(Math.sin(Math.PI * n * 0.14));
    const amp = Math.pow(n, -1.05) * strike * Math.pow(brightness, n - 1);
    const tauN = tau / (1 + 0.4 * (n - 1));
    const strings = n <= 3 ? 2 : 1;
    for (let s = 0; s < strings; s += 1) {
      voices.push({
        inc: (2 * Math.PI * freq) / SR,
        detune: 1 + (s === 0 ? -0.00045 : 0.00045),
        amp: amp * (strings === 2 ? 0.62 : 1),
        phase: rand() * Math.PI * 2,
        decay: 1,
        decayStep: Math.exp(-1 / (SR * tauN)),
      });
    }
  }

  const gain = Math.pow(velocity, 1.5) * 0.5;
  const hammerRand = noiseStream((start + midi * 977) >>> 0);
  const hammer = new Biquad();
  hammer.bandpass(1500 + 1300 * velocity, 1.1);

  for (let i = 0; i < count; i += 1) {
    const t = i / SR;
    const attack = 1 - Math.exp(-t / 0.0035);
    let body = 0;
    for (const voice of voices) {
      voice.phase += voice.inc * voice.detune;
      body += Math.sin(voice.phase) * voice.amp * voice.decay;
      voice.decay *= voice.decayStep;
    }
    const hammerGain = t < 0.02 ? (1 - t / 0.02) * 0.14 * velocity * attack : 0;
    const sample =
      (body * attack + hammer.process(hammerRand()) * hammerGain) *
      gain *
      tailFade(t, seconds, 0.06);
    const index = start + i;
    buffer.channels[0][index] += sample * gl;
    buffer.channels[1][index] += sample * gr;
  }
}

function addBassNote(buffer, { time, midi, velocity, rand, duration = 2.4 }) {
  const start = Math.max(0, Math.round(time * SR));
  const seconds = Math.min(duration, buffer.duration - start / SR);
  const count = Math.floor(seconds * SR);
  if (count <= 0) return;

  const f0 = midiToFreq(midi);
  const [gl, gr] = panGains(-0.14);
  const tau = clamp(3.2 * Math.pow(82.41 / f0, 0.45), 1.4, 5);
  const voices = [1, 2, 3, 4].map((n) => ({
    inc: (2 * Math.PI * f0 * n) / SR,
    amp: Math.pow(n, -1.4),
    phase: rand() * Math.PI * 2,
    decay: 1,
    decayStep: Math.exp(-1 / (SR * (tau / (1 + 0.9 * (n - 1))))),
  }));
  const gain = Math.pow(velocity, 1.3) * 0.62;

  for (let i = 0; i < count; i += 1) {
    const t = i / SR;
    const attack = 1 - Math.exp(-t / 0.012);
    let body = 0;
    for (const voice of voices) {
      voice.phase += voice.inc;
      body += Math.sin(voice.phase) * voice.amp * voice.decay;
      voice.decay *= voice.decayStep;
    }
    const sample = body * attack * gain * tailFade(t, seconds, 0.05);
    const index = start + i;
    buffer.channels[0][index] += sample * gl;
    buffer.channels[1][index] += sample * gr;
  }

  addNoiseVoice(buffer, {
    seed: (start + midi * 131) >>> 0,
    start,
    duration: 0.09,
    filter: { type: "band", freq: 650, q: 0.9 },
    attack: 0.002,
    decay: 0.05,
    gain: 0.03 * velocity,
    pan: -0.14,
  });
}

function addRide(buffer, { time, velocity, rand }) {
  const pan = 0.28 + human(rand, 0.04);
  addNoiseVoice(buffer, {
    seed: (time * 48000 + 11) >>> 0,
    start: time,
    duration: 0.32,
    filter: { type: "band", freq: 4600 + rand() * 700, q: 1.4 },
    attack: 0.008 + rand() * 0.006,
    decay: 0.13 + rand() * 0.05,
    gain: 0.036 * velocity,
    pan,
  });
  addNoiseVoice(buffer, {
    seed: (time * 48000 + 29) >>> 0,
    start: time + 0.004,
    duration: 0.5,
    filter: { type: "band", freq: 3000, q: 0.8 },
    attack: 0.024,
    decay: 0.22,
    gain: 0.012 * velocity,
    pan: pan - 0.1,
  });
  [2960, 3810, 4780, 6210].forEach((freq, index) => {
    addSine(buffer, {
      start: time,
      freq: freq * (1 + human(rand, 0.006)),
      attack: 0.004,
      decay: 0.18 / (index + 1) + 0.04,
      gain: 0.009 * velocity,
      pan: pan - 0.05,
    });
  });
}

function addBrush(buffer, { time, velocity, rand }) {
  addNoiseVoice(buffer, {
    seed: (time * 48000 + 47) >>> 0,
    start: time,
    duration: 0.4,
    filter: { type: "band", freq: 1700 + rand() * 400, q: 0.8 },
    attack: 0.03,
    decay: 0.12,
    gain: 0.036 * velocity,
    pan: -0.12,
  });
  addNoiseVoice(buffer, {
    seed: (time * 48000 + 61) >>> 0,
    start: time,
    duration: 0.3,
    filter: { type: "low", freq: 480 },
    attack: 0.012,
    decay: 0.075,
    gain: 0.016 * velocity,
    pan: -0.1,
  });
}

function addFeatherKick(buffer, { time, velocity, rand }) {
  addSine(buffer, {
    start: time,
    freq: 56 + human(rand, 1.5),
    endFreq: 44,
    attack: 0.006,
    decay: 0.13,
    gain: 0.11 * velocity,
    pan: 0,
  });
}

function applyReverb(buffer, { seconds = 2.4, wet = 0.22, predelay = 0.018 } = {}) {  const length = buffer.length;
  const preSamples = Math.floor(predelay * SR);
  const wetL = new Float32Array(length);
  const wetR = new Float32Array(length);

  const processChannel = (input, combs, out) => {
    const damping = 1 - Math.exp((-2 * Math.PI * 5000) / SR);
    for (const delay of combs) {
      const line = new Float32Array(delay);
      const feedback = Math.pow(10, (-3 * delay) / (seconds * SR));
      let index = 0;
      let damped = 0;
      for (let i = 0; i < length; i += 1) {
        const delayed = line[index];
        damped += damping * (delayed - damped);
        const x = i >= preSamples ? input[i - preSamples] : 0;
        line[index] = x + damped * feedback;
        index = index + 1 === delay ? 0 : index + 1;
        out[i] += delayed * 0.25;
      }
    }
    for (const delay of [225, 556]) {
      const line = new Float32Array(delay);
      let index = 0;
      for (let i = 0; i < length; i += 1) {
        const delayed = line[index];
        const x = out[i];
        line[index] = x + 0.5 * delayed;
        index = index + 1 === delay ? 0 : index + 1;
        out[i] = delayed - 0.5 * x;
      }
    }
  };

  processChannel(buffer.channels[0], [1557, 1617, 1491, 1422], wetL);
  processChannel(buffer.channels[1], [1580, 1640, 1514, 1445], wetR);

  for (let i = 0; i < length; i += 1) {
    buffer.channels[0][i] += wetL[i] * wet;
    buffer.channels[1][i] += wetR[i] * wet;
  }
}

// Fold the rendered tail back into the head so note decays and reverb carry
// across the loop boundary instead of restarting from silence.
function foldTail(buffer, loopSeconds) {
  const loopLength = Math.floor(loopSeconds * SR);
  const tail = buffer.length - loopLength;
  const fadeSamples = Math.min(tail, Math.floor(1.8 * SR));
  for (const channel of buffer.channels) {
    for (let i = 0; i < tail; i += 1) {
      const fade =
        i < tail - fadeSamples
          ? 1
          : 0.5 +
            0.5 *
              Math.cos((Math.PI * (i - (tail - fadeSamples))) / fadeSamples);
      channel[i] += channel[loopLength + i] * fade;
    }
  }
  return {
    duration: loopSeconds,
    length: loopLength,
    channels: buffer.channels.map((channel) => channel.slice(0, loopLength)),
  };
}

function renderJazz() {
  const rand = mulberry32(0x5eed);
  const buffer = makeBuffer(LOOP_SECONDS + TAIL_SECONDS);

  const chords = [
    [53, 57, 60, 64], // Dm9        F A C E
    [55, 58, 62, 69], // Ebmaj7#11  G Bb D A
    [57, 62, 65, 70], // Bbmaj7     A D F Bb
    [55, 61, 65, 70], // A7b9       G C# F Bb
    [53, 57, 60, 64], // Dm9
    [55, 58, 62, 69], // Ebmaj7#11
    [58, 62, 65, 69], // Gm9        Bb D F A
    [55, 61, 65], //    A7b9 quiet
  ];

  const comp = [
    [{ beat: 0, notes: chords[0], vel: 0.52, duration: 3.6 }, { beat: 2, swung: true, notes: [60, 64], vel: 0.3, duration: 2.4 }],
    [{ beat: 0, notes: chords[1], vel: 0.46, duration: 3.6 }],
    [{ beat: 0, notes: chords[2], vel: 0.44, duration: 3.6 }, { beat: 2, swung: true, notes: [62, 65], vel: 0.26, duration: 2.2 }],
    [{ beat: 0, notes: chords[3], vel: 0.42, duration: 3.4 }],
    [{ beat: 0, notes: chords[4], vel: 0.5, duration: 3.6 }, { beat: 2, swung: true, notes: [60, 64], vel: 0.28, duration: 2.2 }],
    [{ beat: 0, notes: chords[5], vel: 0.42, duration: 3.6 }],
    [{ beat: 0, notes: chords[6], vel: 0.46, duration: 3.6 }, { beat: 2, swung: true, notes: [62, 65], vel: 0.24, duration: 2.2 }],
    [{ beat: 0, notes: chords[7], vel: 0.34, duration: 3.4 }],
  ];

  comp.forEach((bar, barIndex) => {
    for (const event of bar) {
      const time = eventTime(barIndex, event.beat, event.swung, rand, 0.012);
      event.notes.forEach((midi, index) => {
        const roll = index * (0.004 + rand() * 0.007);
        addPianoNote(buffer, {
          time: time + roll,
          midi,
          velocity: clamp(
            event.vel *
              (index === event.notes.length - 1 ? 1.04 : 0.92) *
              (0.95 + rand() * 0.1),
            0.05,
            1,
          ),
          rand,
          duration: event.duration,
        });
      });
    }
  });

  const melody = [
    { bar: 0, beat: 2, midi: 74, vel: 0.26 },
    { bar: 3, beat: 2, swung: true, midi: 65, vel: 0.22 },
    { bar: 4, beat: 2, midi: 76, vel: 0.27 },
    { bar: 6, beat: 2, swung: true, midi: 74, vel: 0.22 },
    { bar: 7, beat: 2, midi: 73, vel: 0.18 },
  ];
  for (const note of melody) {
    addPianoNote(buffer, {
      time: eventTime(note.bar, note.beat, note.swung, rand, 0.01),
      midi: note.midi,
      velocity: note.vel * (0.96 + rand() * 0.08),
      rand,
      duration: 3.4,
    });
  }

  const bassLine = [
    [{ beat: 0, midi: 38, vel: 0.62, duration: 2.3 }, { beat: 2, midi: 45, vel: 0.5, duration: 1.9 }],
    [{ beat: 0, midi: 39, vel: 0.58, duration: 2.3 }, { beat: 2, midi: 46, vel: 0.48, duration: 1.9 }],
    [{ beat: 0, midi: 34, vel: 0.56, duration: 2.3 }, { beat: 2, midi: 41, vel: 0.46, duration: 1.9 }],
    [{ beat: 0, midi: 33, vel: 0.54, duration: 2.3 }, { beat: 2, midi: 37, vel: 0.44, duration: 1.9 }],
    [{ beat: 0, midi: 38, vel: 0.6, duration: 2.3 }, { beat: 2, midi: 45, vel: 0.48, duration: 1.9 }],
    [{ beat: 0, midi: 39, vel: 0.54, duration: 2.3 }, { beat: 2, midi: 46, vel: 0.44, duration: 1.9 }],
    [{ beat: 0, midi: 31, vel: 0.52, duration: 2.4 }, { beat: 2, midi: 38, vel: 0.46, duration: 1.9 }],
    [{ beat: 0, midi: 33, vel: 0.46, duration: 4.4 }],
  ];
  bassLine.forEach((bar, barIndex) => {
    for (const note of bar) {
      addBassNote(buffer, {
        time: eventTime(barIndex, note.beat, false, rand, 0.008),
        midi: note.midi,
        velocity: note.vel * (0.96 + rand() * 0.08),
        rand,
        duration: note.duration,
      });
    }
  });

  const intensity = [1, 0.9, 0.92, 0.85, 0.95, 0.88, 0.86, 0.55];
  for (let bar = 0; bar < BARS; bar += 1) {
    const level = intensity[bar];
    const lastBar = bar === BARS - 1;
    const ride = lastBar
      ? [{ beat: 0, vel: 0.4 }]
      : [
          { beat: 0, vel: 0.5 },
          { beat: 1, vel: 0.36 },
          { beat: 1, swung: true, vel: 0.2 },
          { beat: 2, vel: 0.44 },
          { beat: 3, vel: 0.34 },
          { beat: 3, swung: true, vel: 0.18 },
        ];
    for (const hit of ride) {
      addRide(buffer, {
        time: eventTime(bar, hit.beat, hit.swung, rand, 0.007),
        velocity: hit.vel * level * (0.94 + rand() * 0.12),
        rand,
      });
    }
    const brushBeats = lastBar ? [1] : [1, 3];
    for (const beat of brushBeats) {
      addBrush(buffer, {
        time: eventTime(bar, beat, false, rand, 0.009),
        velocity: 0.4 * level * (0.94 + rand() * 0.12),
        rand,
      });
    }
    if (bar % 2 === 0 && !lastBar) {
      addFeatherKick(buffer, {
        time: eventTime(bar, 0, false, rand, 0.005),
        velocity: 0.4 * level,
        rand,
      });
    }
  }

  applyReverb(buffer);
  for (const channel of buffer.channels) {
    const low = new Biquad();
    const high = new Biquad();
    low.lowpass(10000, 0.707);
    high.highpass(30, 0.707);
    for (let i = 0; i < channel.length; i += 1) {
      channel[i] = low.process(high.process(channel[i]));
    }
  }
  const loop = foldTail(buffer, LOOP_SECONDS);
  normalize(loop, -5.5);
  return loop;
}

// ---------------------------------------------------------------- click ----

function renderClick() {
  const buffer = makeBuffer(0.1);
  addNoiseVoice(buffer, {
    seed: 1101,
    duration: 0.05,
    filter: { type: "band", freq: 2500, q: 0.9 },
    attack: 0.0012,
    decay: 0.017,
    gain: 0.5,
    pan: -0.04,
  });
  addNoiseVoice(buffer, {
    seed: 1102,
    duration: 0.03,
    filter: { type: "high", freq: 4600 },
    attack: 0.0008,
    decay: 0.008,
    gain: 0.18,
    pan: 0.03,
  });
  addNoiseVoice(buffer, {
    seed: 1103,
    start: 0.014,
    duration: 0.04,
    filter: { type: "band", freq: 3300, q: 2.6 },
    attack: 0.0008,
    decay: 0.011,
    gain: 0.08,
    pan: 0.14,
  });
  addSine(buffer, { freq: 190, endFreq: 148, attack: 0.002, decay: 0.028, gain: 0.2 });
  addSine(buffer, { freq: 96, attack: 0.003, decay: 0.045, gain: 0.12 });
  addSine(buffer, { freq: 3160, attack: 0.001, decay: 0.045, gain: 0.1, pan: -0.06 });
  addSine(buffer, { freq: 4720, attack: 0.001, decay: 0.03, gain: 0.055, pan: 0.08 });
  addSine(buffer, { freq: 6680, attack: 0.0008, decay: 0.018, gain: 0.03, pan: 0.1 });

  // Keep the low end controlled and soften the top for a felt, mechanical click.
  const highpass = new OnePole(85, true);
  const lowpass = new OnePole(9000);
  for (const channel of buffer.channels) {
    for (let i = 0; i < channel.length; i += 1) {
      channel[i] = lowpass.process(highpass.process(channel[i]));
    }
  }

  normalize(buffer, -7);
  fadeEdges(buffer, 0.002);
  return buffer;
}

// ----------------------------------------------------------------- build ---

const CUES = [
  { file: "music/late-night-studio", kind: "music", render: renderJazz, quality: 5 },
  { file: "interface/soft-click", kind: "click", render: renderClick, quality: 5 },
];

function measure(buffer) {
  let peak = 0;
  let sum = 0;
  let samples = 0;
  for (const channel of buffer.channels) {
    for (let i = 0; i < channel.length; i += 1) {
      const value = channel[i];
      peak = Math.max(peak, Math.abs(value));
      sum += value * value;
      samples += 1;
    }
  }
  return {
    peakDb: 20 * Math.log10(peak || 1e-9),
    rmsDb: 10 * Math.log10(sum / samples || 1e-9),
  };
}

function check(label, condition, detail) {
  if (condition) {
    console.log(`check ${label}: ok${detail ? ` (${detail})` : ""}`);
    return;
  }
  process.exitCode = 1;
  console.error(`check ${label}: FAILED${detail ? ` (${detail})` : ""}`);
}

mkdirSync(OUT, { recursive: true });
rmSync(BUILD, { recursive: true, force: true });
mkdirSync(BUILD, { recursive: true });

for (const cue of CUES) {
  const target = path.join(OUT, cue.file);
  mkdirSync(path.dirname(target), { recursive: true });
  const wav = path.join(BUILD, `${cue.file.replaceAll("/", "-")}.wav`);
  const buffer = cue.render();
  const stats = measure(buffer);
  writeWav(buffer, wav);
  encode(wav, target, cue.quality);
  console.log(
    `rendered ${cue.file} (${buffer.duration.toFixed(3)}s, peak ${stats.peakDb.toFixed(1)} dBFS, rms ${stats.rmsDb.toFixed(1)} dBFS)`,
  );

  if (cue.kind === "music") {
    const first = buffer.channels[0][0];
    const last = buffer.channels[0][buffer.length - 1];
    check("music-duration", Math.abs(buffer.duration - LOOP_SECONDS) < 0.001, `${buffer.duration.toFixed(3)}s, ${buffer.length} samples`);
    check("music-peak", stats.peakDb > -7 && stats.peakDb < -4, `${stats.peakDb.toFixed(1)} dBFS`);
    check("music-rms", stats.rmsDb < -16 && stats.rmsDb > -30, `${stats.rmsDb.toFixed(1)} dBFS`);
    check("loop-seam", Math.abs(first - last) < 0.005, `step ${(first - last).toFixed(5)} (first ${first.toFixed(4)}, last ${last.toFixed(4)})`);
  } else {
    check("click-duration", buffer.duration <= 0.12, `${buffer.duration.toFixed(3)}s`);
    check("click-peak", stats.peakDb > -9 && stats.peakDb < -5, `${stats.peakDb.toFixed(1)} dBFS`);
  }
}

rmSync(BUILD, { recursive: true, force: true });
console.log("done");
