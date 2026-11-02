import { CLICK, MUSIC, clampVolume, type SoundSettings } from "./audio-config";

type Format = "ogg" | "m4a";

const MASTER_GAIN = 0.9;
const CLICK_COOLDOWN = CLICK.cooldown;

function pickFormat(): Format {
  try {
    const probe = document.createElement("audio");
    return probe.canPlayType('audio/ogg; codecs="vorbis"') ? "ogg" : "m4a";
  } catch {
    return "m4a";
  }
}

export class AudioEngine {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private musicBus: GainNode | null = null;
  private musicFade: GainNode | null = null;

  private format: Format = "m4a";
  private settings: SoundSettings;

  private musicWanted = false;
  private musicSource: AudioBufferSourceNode | null = null;
  private musicBuffer: AudioBuffer | null = null;
  private musicLoad: Promise<AudioBuffer | null> | null = null;
  private musicStart: Promise<boolean> | null = null;
  // Bumped on every stop so in-flight starts cannot revive the music.
  private musicEpoch = 0;

  private clickBuffer: AudioBuffer | null = null;
  private clickLoad: Promise<AudioBuffer | null> | null = null;
  private lastClick = 0;
  private pendingClick = false;
  private resumeAttempt: Promise<boolean> | null = null;

  private disposed = false;

  constructor(settings: SoundSettings) {
    this.settings = settings;
  }

  async startMusic(): Promise<boolean> {
    this.musicWanted = true;
    if (this.musicStart) return this.musicStart;

    const epoch = this.musicEpoch;
    const attempt = (async () => {
      const ctx = await this.ensureContext();
      if (epoch !== this.musicEpoch || !this.musicWanted) return false;
      if (!ctx) {
        // Blocked autoplay: decode while suspended so the first genuine
        // interaction can start without waiting on the network.
        void this.ensureContext(false).then(() => this.loadMusic());
        return false;
      }
      const buffer = await this.loadMusic();
      if (!buffer || this.disposed) return false;
      if (epoch !== this.musicEpoch || !this.musicWanted) return false;
      this.fadeMusicIn(buffer);
      return true;
    })().catch(() => false);

    this.musicStart = attempt;
    void attempt.finally(() => {
      if (this.musicStart === attempt) this.musicStart = null;
    });
    return attempt;
  }

  stopMusic() {
    this.musicWanted = false;
    this.musicEpoch += 1;
    this.musicStart = null;
    const ctx = this.ctx;
    const fade = this.musicFade;
    if (ctx && fade) {
      const now = ctx.currentTime;
      fade.gain.cancelScheduledValues(now);
      fade.gain.setValueAtTime(0, now);
    }
    // Hard stop: no tail, no scheduled restart. Gain is already zero.
    this.stopMusicSource();
  }

  setMusicVolume(value: number) {
    this.settings = { ...this.settings, musicVolume: clampVolume(value) };
    const ctx = this.ctx;
    if (!ctx || !this.musicBus) return;
    this.musicBus.gain.setTargetAtTime(
      this.settings.musicVolume,
      ctx.currentTime,
      0.05,
    );
  }

  async armClick(): Promise<boolean> {
    const ctx = await this.ensureContext();
    if (!ctx) {
      void this.ensureContext(false).then(() => this.loadClick());
      return false;
    }
    return (await this.loadClick()) !== null;
  }

  /** Decode both cues without asking the browser to resume audio. */
  preload() {
    void this.ensureContext(false).then(() =>
      Promise.all([this.loadMusic(), this.loadClick()]),
    );
  }

  playClick(force = false) {
    const ctx = this.ctx;
    const master = this.master;
    if (!ctx || !master) return;
    if (ctx.state !== "running") {
      if (!this.pendingClick) {
        this.pendingClick = true;
        void this.resumeContext(ctx).then((running) => {
          this.pendingClick = false;
          if (running) this.playClick(true);
        });
      }
      return;
    }

    const now = ctx.currentTime;
    if (!force && now - this.lastClick < CLICK_COOLDOWN) return;
    const buffer = this.clickBuffer;
    if (!buffer) {
      void this.loadClick();
      return;
    }

    this.lastClick = now;
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    const gain = ctx.createGain();
    gain.gain.value = CLICK.gain;
    source.connect(gain);
    gain.connect(master);
    source.onended = () => {
      source.disconnect();
      gain.disconnect();
    };
    source.start(now);
  }

  dispose() {
    this.disposed = true;
    this.musicWanted = false;
    this.musicEpoch += 1;
    this.musicStart = null;
    this.stopMusicSource();
    const ctx = this.ctx;
    this.ctx = null;
    this.master = null;
    this.musicBus = null;
    this.musicFade = null;
    this.musicBuffer = null;
    this.clickBuffer = null;
    this.musicLoad = null;
    this.clickLoad = null;
    this.pendingClick = false;
    this.resumeAttempt = null;
    if (ctx) void ctx.close().catch(() => undefined);
  }

  private async ensureContext(
    allowResume = true,
  ): Promise<AudioContext | null> {
    if (this.disposed) return null;

    let ctx = this.ctx;
    if (!ctx) {
      const Ctor =
        window.AudioContext ??
        (window as Window & { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext;
      if (!Ctor) return null;

      ctx = new Ctor({ latencyHint: "interactive" });
      const master = ctx.createGain();
      master.gain.value = MASTER_GAIN;
      const limiter = ctx.createDynamicsCompressor();
      limiter.threshold.value = -18;
      limiter.knee.value = 14;
      limiter.ratio.value = 4;
      limiter.attack.value = 0.004;
      limiter.release.value = 0.22;
      master.connect(limiter);
      limiter.connect(ctx.destination);

      const musicBus = ctx.createGain();
      musicBus.gain.value = this.settings.musicVolume;
      const musicFade = ctx.createGain();
      musicFade.gain.value = 0;
      musicFade.connect(musicBus);
      musicBus.connect(master);

      this.ctx = ctx;
      this.master = master;
      this.musicBus = musicBus;
      this.musicFade = musicFade;
      this.format = pickFormat();
    }

    if (!allowResume) return ctx;
    if (!(await this.resumeContext(ctx))) return null;
    if (this.disposed) return null;
    return ctx;
  }

  /** Chrome can leave resume() pending forever while autoplay is blocked. */
  private resumeContext(ctx: AudioContext): Promise<boolean> {
    if (ctx.state === "running") return Promise.resolve(true);
    if (this.resumeAttempt) return this.resumeAttempt;

    const attempt = (async () => {
      try {
        await Promise.race([
          ctx.resume(),
          new Promise<void>((_, reject) => {
            window.setTimeout(() => reject(new Error("resume-timeout")), 900);
          }),
        ]);
      } catch {
        return false;
      }
      return ctx.state === "running";
    })().catch(() => false);

    this.resumeAttempt = attempt;
    void attempt.finally(() => {
      if (this.resumeAttempt === attempt) this.resumeAttempt = null;
    });
    return attempt;
  }

  private fadeMusicIn(buffer: AudioBuffer) {
    const ctx = this.ctx;
    const fade = this.musicFade;
    if (!ctx || !fade) return;

    const now = ctx.currentTime;
    fade.gain.cancelScheduledValues(now);
    if (this.musicSource) {
      // Already playing (duplicate ON): keep the current level, just ramp up.
      fade.gain.setValueAtTime(fade.gain.value, now);
    } else {
      // Fresh source after OFF: always fade in from silence.
      fade.gain.setValueAtTime(0, now);
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.loop = true;
      source.connect(fade);
      source.start(now);
      this.musicSource = source;
    }
    fade.gain.linearRampToValueAtTime(1, now + MUSIC.fadeIn);
  }

  private stopMusicSource() {
    const source = this.musicSource;
    this.musicSource = null;
    if (!source) return;
    try {
      source.stop();
    } catch {
      // already stopped
    }
    source.disconnect();
  }

  private loadMusic(): Promise<AudioBuffer | null> {
    if (this.musicBuffer) return Promise.resolve(this.musicBuffer);
    if (this.musicLoad) return this.musicLoad;

    const pending = this.decode(MUSIC.src)
      .then((buffer) => {
        if (!buffer) return null;
        const trimmed = this.trim(buffer, MUSIC.seconds);
        this.musicBuffer = trimmed;
        return trimmed;
      })
      .catch(() => null);
    this.musicLoad = pending;
    void pending.finally(() => {
      if (this.musicLoad === pending) this.musicLoad = null;
    });
    return pending;
  }

  private loadClick(): Promise<AudioBuffer | null> {
    if (this.clickBuffer) return Promise.resolve(this.clickBuffer);
    if (this.clickLoad) return this.clickLoad;

    const pending = this.decode(CLICK.src)
      .then((buffer) => {
        if (buffer) this.clickBuffer = buffer;
        return buffer;
      })
      .catch(() => null);
    this.clickLoad = pending;
    void pending.finally(() => {
      if (this.clickLoad === pending) this.clickLoad = null;
    });
    return pending;
  }

  private async decode(src: string): Promise<AudioBuffer | null> {
    const ctx = this.ctx;
    if (!ctx) return null;
    try {
      const response = await fetch(`${src}.${this.format}`, {
        cache: "force-cache",
      });
      if (!response.ok) return null;
      const data = await response.arrayBuffer();
      return await ctx.decodeAudioData(data);
    } catch {
      return null;
    }
  }

  private trim(buffer: AudioBuffer, seconds: number): AudioBuffer {
    const frames = Math.round(seconds * buffer.sampleRate);
    const ctx = this.ctx;
    if (!ctx || buffer.length <= frames) return buffer;
    // AAC fallbacks decode with trailing padding; trim so the loop stays seamless.
    const trimmed = ctx.createBuffer(
      buffer.numberOfChannels,
      frames,
      buffer.sampleRate,
    );
    const span = Math.min(Math.round(0.001 * buffer.sampleRate), frames);
    for (let channel = 0; channel < buffer.numberOfChannels; channel += 1) {
      trimmed.copyToChannel(
        buffer.getChannelData(channel).subarray(0, frames),
        channel,
      );
      // Ease the final millisecond into the loop head so the wrap has no step.
      const data = trimmed.getChannelData(channel);
      const head = data[0];
      for (let i = 0; i < span; i += 1) {
        const weight = (i + 1) / span;
        const index = frames - span + i;
        data[index] = data[index] * (1 - weight) + head * weight;
      }
    }
    return trimmed;
  }
}
