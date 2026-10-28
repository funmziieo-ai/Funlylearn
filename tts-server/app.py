"""
Mama Titi TTS server: free, unlimited voice for FunlyLearn.

Uses YarnGPT2 (https://huggingface.co/saheedniyi/YarnGPT2), an open
Apache-2.0 model with Nigerian-accented voices: the same "idera" voice
Mama Titi uses today, plus Yoruba, Igbo and Hausa voices. No credits,
no YarnGPT API key.

POST /tts   {"text": "...", "language": "en" | "yo", "voice": "idera"}
            -> audio/mpeg (MP3). The same text is generated only once,
               then served from the cache for free.
GET  /health -> {"ok": true, "model_loaded": ..., "cached_files": ...}

Settings (environment variables):
  TTS_SHARED_SECRET  If set, requests must send it in the header
                     "X-TTS-Secret" (stops strangers using your server).
  CACHE_DIR          Where MP3s are kept (default /workspace/cache, which
                     survives restarts on a RunPod network volume).
  ENGLISH_SPEAKER    Default English voice (default idera).
  YORUBA_SPEAKER     Default Yoruba voice (default yoruba_female2).
  TTS_FAKE=1         Test mode: makes a short beep instead of loading the
                     model (for checking the server without a GPU).
"""

import hashlib
import os
import re
import subprocess
import tempfile
import threading
from pathlib import Path

from fastapi import FastAPI, Header, HTTPException
from fastapi.responses import FileResponse, HTMLResponse
from pydantic import BaseModel

CACHE_DIR = Path(os.environ.get("CACHE_DIR", "/workspace/cache"))
CACHE_DIR.mkdir(parents=True, exist_ok=True)
SHARED_SECRET = os.environ.get("TTS_SHARED_SECRET", "")
FAKE = os.environ.get("TTS_FAKE") == "1"
ENGLISH_SPEAKER = os.environ.get("ENGLISH_SPEAKER", "idera")
YORUBA_SPEAKER = os.environ.get("YORUBA_SPEAKER", "yoruba_female2")
MAX_TEXT_LENGTH = 2000
SAMPLE_RATE = 24000

# Voices YarnGPT2 knows (from its model card).
KNOWN_SPEAKERS = {
    "idera", "chinenye", "jude", "emma", "umar", "joke", "zainab", "osagie", "remi", "tayo",
    "yoruba_male2", "yoruba_female2", "yoruba_feamle1",
    "igbo_female2", "igbo_male2", "igbo_female1",
    "hausa_feamle1", "hausa_female2", "hausa_male2", "hausa_male1",
}
LANGUAGE_NAMES = {"en": "english", "yo": "yoruba", "ig": "igbo", "ha": "hausa"}

WEIGHTS_DIR = Path(os.environ.get("WEIGHTS_DIR", "/opt/weights"))
WAV_CONFIG = WEIGHTS_DIR / "wavtokenizer_mediumdata_frame75_3s_nq1_code4096_dim512_kmeans200_attn.yaml"
WAV_MODEL = WEIGHTS_DIR / "wavtokenizer_large_speech_320_24k.ckpt"
MODEL_ID = "saheedniyi/YarnGPT2"

app = FastAPI(title="Mama Titi TTS")
generate_lock = threading.Lock()  # the model makes one recording at a time
engine = None


class TTSRequest(BaseModel):
    text: str
    language: str = "en"
    voice: str | None = None


# ---------- Model ----------
class YarnGPT2Engine:
    def __init__(self):
        import torch
        from transformers import AutoModelForCausalLM
        from yarngpt.audiotokenizer import AudioTokenizerV2

        self.torch = torch
        self.audio_tokenizer = AudioTokenizerV2(MODEL_ID, str(WAV_MODEL), str(WAV_CONFIG))
        self.model = AutoModelForCausalLM.from_pretrained(MODEL_ID, torch_dtype="auto").to(self.audio_tokenizer.device)
        self.model.eval()

    def synthesize(self, text: str, lang_name: str, speaker: str):
        """Returns a 1-D float tensor at 24 kHz."""
        torch = self.torch
        pieces = []
        for chunk in split_into_chunks(text):
            prompt = self.audio_tokenizer.create_prompt(chunk, lang=lang_name, speaker_name=speaker)
            input_ids = self.audio_tokenizer.tokenize_prompt(prompt)
            with torch.inference_mode():
                output = self.model.generate(
                    input_ids=input_ids,
                    temperature=0.1,
                    repetition_penalty=1.1,
                    max_length=4000,
                )
            codes = self.audio_tokenizer.get_codes(output)
            audio = self.audio_tokenizer.get_audio(codes)
            pieces.append(audio.reshape(-1).float().cpu())
            pieces.append(torch.zeros(int(SAMPLE_RATE * 0.25)))  # short pause between sentences
        return torch.cat(pieces) if pieces else torch.zeros(1)


class FakeEngine:
    """Test mode: a short beep per sentence, no model needed."""

    def synthesize(self, text: str, lang_name: str, speaker: str):
        import math
        import array

        samples = array.array("f")
        for _ in split_into_chunks(text):
            for i in range(int(SAMPLE_RATE * 0.3)):
                samples.append(0.2 * math.sin(2 * math.pi * 440 * i / SAMPLE_RATE))
        return samples


def get_engine():
    global engine
    if engine is None:
        engine = FakeEngine() if FAKE else YarnGPT2Engine()
    return engine


# ---------- Helpers ----------
def split_into_chunks(text: str, target: int = 220):
    """YarnGPT2 sounds best on short passages: split into ~1-2 sentences."""
    sentences = re.findall(r"[^.!?…]+[.!?…]*\s*", text) or [text]
    chunks, current = [], ""
    for sentence in sentences:
        if len(current) + len(sentence) > target and current.strip():
            chunks.append(current.strip())
            current = ""
        current += sentence
    if current.strip():
        chunks.append(current.strip())
    return chunks


def clean_text(text: str) -> str:
    text = re.sub(r"[*_#`>\[\]]", " ", text)
    text = re.sub(r"[\U0001F300-\U0001FAFF\u2600-\u27BF]", " ", text)  # emoji
    return re.sub(r"\s+", " ", text).strip()


def write_mp3(audio, mp3_path: Path):
    """Saves float audio as MP3 (needs ffmpeg)."""
    import array
    import wave

    if hasattr(audio, "numpy"):
        values = audio.numpy().tolist()
    else:
        values = list(audio)
    pcm = array.array("h", (max(-32768, min(32767, int(v * 32767))) for v in values))
    with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as tmp:
        wav_path = tmp.name
    try:
        with wave.open(wav_path, "wb") as w:
            w.setnchannels(1)
            w.setsampwidth(2)
            w.setframerate(SAMPLE_RATE)
            w.writeframes(pcm.tobytes())
        tmp_mp3 = mp3_path.with_suffix(".part.mp3")
        subprocess.run(
            ["ffmpeg", "-y", "-loglevel", "error", "-i", wav_path, "-codec:a", "libmp3lame", "-b:a", "64k", str(tmp_mp3)],
            check=True,
        )
        tmp_mp3.replace(mp3_path)  # only a complete file ever appears in the cache
    finally:
        os.unlink(wav_path)


# ---------- Routes ----------
@app.on_event("startup")
def load_model_on_start():
    get_engine()


TEST_PAGE = """<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Mama Titi voice test</title>
<style>
  body { font-family: system-ui, sans-serif; background: #FFF8EC; color: #0F172A; max-width: 560px; margin: 0 auto; padding: 20px; }
  h1 { color: #15803D; } label { font-weight: 700; display: block; margin-top: 14px; }
  textarea, input, select { width: 100%; box-sizing: border-box; font-size: 16px; padding: 10px; border: 2px solid #CBD5E1; border-radius: 12px; margin-top: 6px; }
  button { margin-top: 16px; width: 100%; padding: 14px; font-size: 18px; font-weight: 700; color: #fff; background: #15803D; border: 0; border-radius: 14px; }
  #status { margin-top: 12px; font-weight: 600; } audio { width: 100%; margin-top: 12px; }
</style></head><body>
<h1>Mama Titi voice test</h1>
<label>Text</label>
<textarea id="text" rows="4">Omo mi, welcome to FunlyLearn. Let's learn mathematics today.</textarea>
<label>Language</label>
<select id="lang"><option value="en">English</option><option value="yo">Yoruba</option></select>
<label>Voice</label>
<select id="voice"><option value="">Default (Idera for English, yoruba_female2 for Yoruba)</option><option value="idera">idera (English only)</option><option value="yoruba_female2">yoruba_female2 (Yoruba)</option></select>
<label>Secret (your TTS_SHARED_SECRET)</label>
<input id="secret" type="password" autocomplete="off">
<button onclick="speak()">Speak</button>
<p id="status"></p>
<audio id="player" controls></audio>
<script>
async function speak() {
  const status = document.getElementById('status');
  status.textContent = 'Making the voice...';
  const started = Date.now();
  try {
    const res = await fetch('tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-TTS-Secret': document.getElementById('secret').value },
      body: JSON.stringify({ text: document.getElementById('text').value, language: document.getElementById('lang').value, voice: document.getElementById('voice').value || null })
    });
    if (!res.ok) { status.textContent = 'Error ' + res.status + ': ' + (await res.text()); return; }
    const blob = await res.blob();
    const player = document.getElementById('player');
    player.src = URL.createObjectURL(blob);
    player.play();
    status.textContent = (res.headers.get('X-Cache') === 'HIT' ? 'From the cache (free, instant)' : 'New recording') + ' in ' + ((Date.now() - started) / 1000).toFixed(1) + ' s';
  } catch (e) { status.textContent = 'Could not reach the server: ' + e; }
}
</script></body></html>"""


@app.get("/test", response_class=HTMLResponse)
def test_page():
    """A simple page to hear Mama Titi from any browser (needs the secret to speak)."""
    return TEST_PAGE


@app.get("/health")
def health():
    return {
        "ok": True,
        "model_loaded": engine is not None,
        "fake_mode": FAKE,
        "cached_files": len(list(CACHE_DIR.glob("*.mp3"))),
    }


@app.post("/tts")
def tts(req: TTSRequest, x_tts_secret: str | None = Header(default=None)):
    if SHARED_SECRET and x_tts_secret != SHARED_SECRET:
        raise HTTPException(status_code=401, detail="Not allowed")

    text = clean_text(req.text or "")
    if len(text) < 2:
        raise HTTPException(status_code=400, detail="text is required")
    if len(text) > MAX_TEXT_LENGTH:
        raise HTTPException(status_code=400, detail=f"text is too long (max {MAX_TEXT_LENGTH})")

    language = (req.language or "en").lower()[:2]
    lang_name = LANGUAGE_NAMES.get(language, "english")
    default_speaker = YORUBA_SPEAKER if language == "yo" else ENGLISH_SPEAKER
    speaker = req.voice if req.voice in KNOWN_SPEAKERS else default_speaker
    # In YarnGPT2, each language has its own voices: Idera (and the other
    # English voices) can't speak Yoruba, Igbo or Hausa. Use that
    # language's default voice instead of failing.
    if lang_name != "english" and not speaker.startswith(lang_name):
        speaker = default_speaker if language == "yo" else {
            "igbo": "igbo_female2", "hausa": "hausa_female2"}.get(lang_name, default_speaker)

    # Cache: the same text + language + voice is only ever generated once.
    key = hashlib.sha256(f"{lang_name}::{speaker}::{text}".encode("utf-8")).hexdigest()
    mp3_path = CACHE_DIR / f"{key}.mp3"
    if mp3_path.exists():
        return FileResponse(mp3_path, media_type="audio/mpeg", headers={"X-Cache": "HIT"})

    with generate_lock:
        if not mp3_path.exists():  # another request may have just made it
            audio = get_engine().synthesize(text, lang_name, speaker)
            write_mp3(audio, mp3_path)
    return FileResponse(mp3_path, media_type="audio/mpeg", headers={"X-Cache": "MISS"})
