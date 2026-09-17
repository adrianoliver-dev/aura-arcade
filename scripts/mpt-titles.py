"""MoneyPrinterTurbo pass: títulos mute-proof sobre gameplay real.

No genera el play. Usa MoviePy si está en el venv de MPT; si no, FFmpeg.
"""
from __future__ import annotations

import shutil
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TRAILERS = ROOT / "public" / "trailers"
OUT = TRAILERS / "mpt"


def ffmpeg(*args: str) -> None:
    cmd = ["ffmpeg", "-y", *args]
    subprocess.check_call(cmd, cwd=str(ROOT / "assets" / "fonts"))


def burn(src: Path, dst: Path, title: str, hook: str) -> None:
    font = "arialbd.ttf"
    filt = (
        f"drawtext=fontfile={font}:text='{title}':x=(w-text_w)/2:y=h-160:"
        f"fontsize=48:fontcolor=white:borderw=3:bordercolor=black,"
        f"drawtext=fontfile={font}:text='{hook}':x=(w-text_w)/2:y=h-100:"
        f"fontsize=28:fontcolor=0xF2A021:borderw=2:bordercolor=black"
    )
    ffmpeg("-i", str(src), "-vf", filt, "-c:v", "libx264", "-pix_fmt", "yuv420p", "-movflags", "+faststart", str(dst))


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    jobs = [
        (TRAILERS / "loop-fexpo-16x9.mp4", OUT / "loop-fexpo-16x9.mp4", "AURA ARCADE", "Escanea y juga"),
        (TRAILERS / "redes-a-pulso-humo.mp4", OUT / "redes-a-pulso.mp4", "PULSO", "Toca al ritmo"),
        (TRAILERS / "redes-b-radio-salida.mp4", OUT / "redes-b-qr.mp4", "JUGA GRATIS", "Escanea el QR"),
    ]
    for src, dst, title, hook in jobs:
        if not src.exists():
            raise SystemExit(f"missing {src}")
        burn(src, dst, title, hook)
    print("WROTE", OUT)
    print("ffmpeg", shutil.which("ffmpeg"))


if __name__ == "__main__":
    main()
