# Original sound design — DARVINN STUDIO

The site uses exactly two sounds. Both are original, procedurally synthesised
audio created for this site on 2026-11-01. They are generated from oscillators,
noise, filters and envelopes by `scripts/generate-audio.mjs`. No third-party
samples, recordings, stock libraries or game/film effects are used, and no
external licence applies. Re-run the script to reproduce both sounds from their
source parameters.

- Sample rate: 48 kHz, stereo.
- Encoding: OGG Vorbis (primary) + AAC in M4A (fallback). The engine chooses
  Vorbis when `canPlayType('audio/ogg; codecs="vorbis"')` is supported and the
  M4A file otherwise.
- Levels below are pre-engine file measurements from `ffmpeg astats` (OGG).
  Playback gain and fades are defined in `lib/audio/audio-config.ts` and
  `lib/audio/audio-engine.ts`.
- Both sounds are on by default. The provider creates one AudioContext after
  mount and preloads the cues; if the browser blocks autoplay, music waits for
  the first interaction. Turning either switch off persists and stops or
  prevents that cue.

| Sound | File | Use | Duration | Peak / RMS | Size OGG / M4A |
| --- | --- | --- | --- | --- | --- |
| Late-night studio jazz | `music/late-night-studio` | Optional background music, looped | 30.00 s | −5.6 / −19.7 dBFS | 391,583 / 428,235 B |
| Soft click | `interface/soft-click` | Buttons, links and card selection | 0.10 s | −7.0 / −22.1 dBFS | 5,973 / 2,611 B |

Total added audio: 4 files, 828,402 bytes (≈809 KiB).

## Music

A sparse D-minor sketch at 64 BPM: eight bars of soft comping, a quiet upright
bass, brushed ride and snare, a feather kick, and a few restrained melody notes.
No vocals and no solos. The loop is 30.000 s exactly; the reverb tail is folded
back over the start so the wrap has no click (measured seam step −57 dBFS), and
the final bar is intentionally quieter. The M4A fallback decodes with trailing
AAC padding; the engine trims it to 30 s and eases the final millisecond into
the loop head to preserve the seamless wrap.

Music starts at 35% volume by default and fades in over 1.8 s. Switching music
off stops the source immediately; there is no fade-out tail. It keeps playing
across route changes because the audio provider lives in the root layout and
the loop is never restarted.

## Click

A single 100 ms tactile transient: a filtered noise contact, a short mechanical
body around 190 → 148 Hz with controlled low end, and a few damped metallic
partials. It plays only on explicit control activation (links, buttons,
switches, labels, or selecting a vortex card) while the click switch is on, with
a 120 ms cooldown so one gesture cannot double-fire it. It does not play on
hover, scroll, pointer movement or animation frames.

## Regeneration

Requires Node 20+ and ffmpeg with `libvorbis` and native AAC encoders. From the
`Portfolio` app directory:

```sh
node scripts/generate-audio.mjs
```

The script rebuilds all four encoded files and removes its temporary WAVs. It is
deterministic in its source material; re-running it regenerates the same sounds.
