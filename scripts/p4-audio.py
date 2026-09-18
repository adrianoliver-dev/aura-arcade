#!/usr/bin/env python3
"""Cama 6/8 original Aura Arcade + SFX alineados al manifiesto de captura."""
from __future__ import annotations

import json
import math
import random
import struct
import wave
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
RAW = ROOT / ".tmp-p4" / "raw"
OUT = ROOT / ".tmp-p4" / "audio"
SR = 48_000
RNG = random.Random(20260918)


def clamp(x: float, lo: float = -0.89, hi: float = 0.89) -> float:
    return lo if x < lo else hi if x > hi else x


def write_wav(path: Path, samples: list[float]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    peak = max((abs(s) for s in samples), default=1.0) or 1.0
    gain = min(1.0, 0.89 / peak)
    with wave.open(str(path), "w") as wav:
        wav.setnchannels(2)
        wav.setsampwidth(2)
        wav.setframerate(SR)
        frames = bytearray()
        for i, s in enumerate(samples):
            v = clamp(s * gain)
            # ligera apertura estéreo
            pan = 0.12 * math.sin(i / SR * 0.7)
            left = clamp(v * (1 - pan))
            right = clamp(v * (1 + pan))
            frames += struct.pack("<hh", int(left * 32767), int(right * 32767))
        wav.writeframes(frames)


def env(t: float, attack: float, dur: float) -> float:
    if t < 0 or t > dur:
        return 0.0
    if t < attack:
        return t / attack
    rel = (dur - t) / max(1e-4, dur - attack)
    return max(0.0, rel)


def tone(samples: list[float], at: float, freq: float, dur: float, amp: float, kind: str = "sine") -> None:
    n = len(samples)
    start = int(at * SR)
    length = int(dur * SR)
    for i in range(length):
        idx = start + i
        if idx >= n:
            break
        t = i / SR
        phase = 2 * math.pi * freq * t
        if kind == "tri":
            wave_v = 2 * abs(2 * ((t * freq) % 1) - 1) - 1
        elif kind == "saw":
            wave_v = 2 * ((t * freq) % 1) - 1
        else:
            wave_v = math.sin(phase)
        samples[idx] += wave_v * amp * env(t, 0.008, dur)


def noise(samples: list[float], at: float, dur: float, amp: float, hp: float = 400) -> None:
    start = int(at * SR)
    length = int(dur * SR)
    prev = 0.0
    for i in range(length):
        idx = start + i
        if idx >= n_safe(samples):
            break
        white = RNG.uniform(-1, 1)
        # highpass crude
        hp_v = white - prev
        prev = white
        t = i / SR
        samples[idx] += hp_v * amp * env(t, 0.004, dur) * min(1.0, hp / 800)


def n_safe(samples: list[float]) -> int:
    return len(samples)


def bed(seconds: float, bpm: float = 96.0) -> list[float]:
    n = int(seconds * SR) + SR
    samples = [0.0] * n
    eighth = 60.0 / (bpm * 1.5)  # 6/8: dotted-quarter = bpm
    bars = [
        (146.83, [293.66, 349.23, 440, 349.23, 293.66, 440]),
        (174.61, [349.23, 440, 523.25, 440, 349.23, 523.25]),
        (130.81, [261.63, 329.63, 392, 329.63, 261.63, 392]),
        (196.0, [392, 493.88, 587.33, 493.88, 392, 587.33]),
    ]
    t = 0.04
    bar_i = 0
    while t < seconds + 0.4:
        bass, notes = bars[bar_i % 4]
        for step in range(6):
            at = t + step * eighth
            shaker_amp = 0.018 if step in (0, 3) else 0.011
            noise(samples, at, 0.055, shaker_amp, 2800)
            if step in (0, 3):
                tone(samples, at, 92 if step == 0 else 72, 0.16, 0.05 if step == 0 else 0.034)
            tone(samples, at + 0.01, notes[step], 0.18 if step in (0, 3) else 0.12, 0.055 if step in (0, 3) else 0.036, "tri")
        tone(samples, t, bass, 0.42, 0.04)
        tone(samples, t + eighth * 3, bass * 1.5, 0.28, 0.026, "tri")
        t += eighth * 6
        bar_i += 1
    # aire nocturno
    for i in range(n):
        samples[i] += 0.008 * math.sin(2 * math.pi * 55 * i / SR) * (0.6 + 0.4 * math.sin(i / SR * 0.25))
    return samples[: int(seconds * SR)]


def mix_cue(samples: list[float], at: float, cue: str) -> None:
    if cue in ("humo-grab", "humo-start"):
        tone(samples, at, 196, 0.07, 0.09, "tri")
        tone(samples, at + 0.02, 392, 0.09, 0.07)
    elif cue == "humo-save":
        noise(samples, at, 0.12, 0.05, 800)
        tone(samples, at, 392, 0.08, 0.1, "tri")
        tone(samples, at + 0.05, 523, 0.12, 0.11, "tri")
        tone(samples, at + 0.1, 784, 0.16, 0.09)
    elif cue in ("pulso-hit", "pulso-now"):
        if cue == "pulso-now":
            tone(samples, at, 220, 0.05, 0.04)
            return
        tone(samples, at, 880, 0.18, 0.13, "tri")
        tone(samples, at + 0.04, 1320, 0.1, 0.06)
    elif cue == "radio-ok":
        noise(samples, at, 0.1, 0.04, 700)
        tone(samples, at, 392, 0.08, 0.1, "tri")
        tone(samples, at + 0.05, 523, 0.12, 0.11, "tri")
        tone(samples, at + 0.1, 784, 0.18, 0.1)
    elif cue == "radio-clue":
        tone(samples, at, 180, 0.12, 0.05, "saw")
    elif cue == "qr":
        tone(samples, at, 196, 0.4, 0.03)
        tone(samples, at + 0.12, 392, 0.5, 0.025, "tri")


def render(name: str, seconds: float, cues: list[tuple[float, str]]) -> Path:
    samples = bed(seconds, 96)
    for at, cue in cues:
        if 0 <= at < seconds - 0.05:
            mix_cue(samples, at, cue)
    # respiración antes del final
    fade = int(0.35 * SR)
    for i in range(fade):
        samples[-1 - i] *= i / fade
    out = OUT / f"{name}.wav"
    write_wav(out, samples)
    return out


def cues_from_timeline(timeline: list[dict]) -> list[tuple[float, str]]:
    return [(float(row["t"]), str(row["cue"])) for row in timeline]


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    manifest = ROOT / ".tmp-p4" / "edit-timeline.json"
    if manifest.exists():
        data = json.loads(manifest.read_text(encoding="utf-8"))
        for item in data.get("mixes", []):
            path = render(item["name"], float(item["seconds"]), cues_from_timeline(item.get("cues", [])))
            print(path)
        return
    print(render("bed-18", 18, [(1.6, "humo-grab"), (4.6, "humo-save"), (8.4, "pulso-now"), (8.7, "pulso-hit"), (11.4, "radio-clue"), (12.2, "radio-ok"), (14.2, "qr")]))
    print(render("bed-12", 12, [(1.9, "humo-grab"), (5.4, "humo-save")]))
    print(render("bed-15", 15, [(1.4, "humo-grab"), (3.8, "humo-save"), (6.4, "pulso-now"), (6.7, "pulso-hit"), (10.0, "radio-clue"), (10.6, "radio-ok"), (12.2, "qr")]))


if __name__ == "__main__":
    main()
