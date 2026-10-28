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
from fastapi.responses import FileResponse, HTMLResponse, StreamingResponse
from pydantic import BaseModel

CACHE_DIR = Path(os.environ.get("CACHE_DIR", "/workspace/cache"))
CACHE_DIR.mkdir(parents=True, exist_ok=True)
SHARED_SECRET = os.environ.get("TTS_SHARED_SECRET", "")
FAKE = os.environ.get("TTS_FAKE") == "1"
ENGLISH_SPEAKER = os.environ.get("ENGLISH_SPEAKER", "idera")
YORUBA_SPEAKER = os.environ.get("YORUBA_SPEAKER", "yoruba_female2")
MAX_TEXT_LENGTH = 2000
# How Mama Titi sounds (defaults; the /test page can try other values):
#   SPEECH_SPEED     0.9 = 10% slower than the model's natural pace
#   GEN_TEMPERATURE  expressiveness: 0.1 = very flat, 0.3 = livelier,
#                    above ~0.6 may start to sound unsteady
SPEECH_SPEED = float(os.environ.get("SPEECH_SPEED", "0.9"))
GEN_TEMPERATURE = float(os.environ.get("GEN_TEMPERATURE", "0.3"))
# Volume: every recording is made loud and even (like other apps).
LOUDNESS_FILTER = "loudnorm=I=-14:TP=-1.5:LRA=11"
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
    speed: float | None = None        # 0.7 to 1.2 (default SPEECH_SPEED)
    temperature: float | None = None  # 0.05 to 0.8 (default GEN_TEMPERATURE)


# ---------- Recordings in progress (so a second request can join one) ----------
class RecordingJob:
    def __init__(self):
        self.pieces = []
        self.done = False
        self.error = None
        self.cond = threading.Condition()

    def add(self, piece: bytes):
        with self.cond:
            self.pieces.append(piece)
            self.cond.notify_all()

    def finish(self, error=None):
        with self.cond:
            self.done = True
            self.error = error
            self.cond.notify_all()

    def follow(self):
        """Yields the pieces as they're made, from the first one."""
        sent = 0
        while True:
            with self.cond:
                while sent >= len(self.pieces) and not self.done:
                    self.cond.wait(timeout=120)
                new = self.pieces[sent:]
                finished = self.done
            for piece in new:
                yield piece
            sent += len(new)
            if finished and sent >= len(self.pieces):
                return


jobs = {}
jobs_lock = threading.Lock()


# ---------- Model ----------
class YarnGPT2Engine:
    def __init__(self):
        import torch
        from transformers import AutoModelForCausalLM
        from yarngpt.audiotokenizer import AudioTokenizerV2

        self.torch = torch
        self.audio_tokenizer = AudioTokenizerV2(MODEL_ID, str(WAV_MODEL), str(WAV_CONFIG))
        # Half precision on a GPU: roughly twice as fast, same voice.
        dtype = torch.float16 if torch.cuda.is_available() else "auto"
        self.model = AutoModelForCausalLM.from_pretrained(MODEL_ID, torch_dtype=dtype).to(self.audio_tokenizer.device)
        self.model.eval()

    def synthesize_chunk(self, chunk: str, lang_name: str, speaker: str, temperature: float = 0.3):
        """One sentence or two -> 1-D float audio at 24 kHz (with a short pause after)."""
        torch = self.torch
        prompt = self.audio_tokenizer.create_prompt(chunk, lang=lang_name, speaker_name=speaker)
        input_ids = self.audio_tokenizer.tokenize_prompt(prompt)
        with torch.inference_mode():
            output = self.model.generate(
                input_ids=input_ids,
                do_sample=temperature > 0.11,
                temperature=temperature,
                repetition_penalty=1.1,
                max_length=4000,
            )
        codes = self.audio_tokenizer.get_codes(output)
        audio = self.audio_tokenizer.get_audio(codes).reshape(-1).float().cpu()
        return torch.cat([audio, torch.zeros(int(SAMPLE_RATE * 0.25))])


class FakeEngine:
    """Test mode: a short beep per sentence, no model needed."""

    def synthesize_chunk(self, chunk: str, lang_name: str, speaker: str, temperature: float = 0.3):
        import math
        import array

        samples = array.array("f")
        for i in range(int(SAMPLE_RATE * 0.3)):
            samples.append(0.2 * math.sin(2 * math.pi * 440 * i / SAMPLE_RATE))
        return samples


def get_engine():
    global engine
    if engine is None:
        engine = FakeEngine() if FAKE else YarnGPT2Engine()
    return engine


# ---------- Helpers ----------
def _group_sentences(sentences, target: int):
    chunks, current = [], ""
    for sentence in sentences:
        if len(current) + len(sentence) > target and current.strip():
            chunks.append(current.strip())
            current = ""
        current += sentence
    if current.strip():
        chunks.append(current.strip())
    return chunks


def split_into_chunks(text: str, target: int = 150):
    """YarnGPT2 sounds best on short passages: split into ~1-2 sentences.
    The FIRST sentence is always its own piece, so Mama Titi starts
    speaking as soon as it's ready while the rest is still being made."""
    sentences = re.findall(r"[^.!?…]+[.!?…]*\s*", text) or [text]
    if len(sentences) == 1:
        return _group_sentences(sentences, target)
    return [sentences[0].strip()] + _group_sentences(sentences[1:], target)


def clean_text(text: str) -> str:
    text = re.sub(r"[*_#`>\[\]]", " ", text)
    text = re.sub(r"[\U0001F300-\U0001FAFF\u2600-\u27BF]", " ", text)  # emoji
    return re.sub(r"\s+", " ", text).strip()


def mp3_bytes(audio, speed: float = 1.0) -> bytes:
    """Float audio -> MP3 bytes (needs ffmpeg). Each sentence is encoded
    on its own; MP3 pieces joined together play as one recording."""
    import array

    values = audio.numpy().tolist() if hasattr(audio, "numpy") else list(audio)
    pcm = array.array("h", (max(-32768, min(32767, int(v * 32767))) for v in values))
    result = subprocess.run(
        ["ffmpeg", "-loglevel", "error", "-f", "s16le", "-ar", str(SAMPLE_RATE), "-ac", "1", "-i", "pipe:0",
         # atempo slows the speech without making it deeper; loudnorm makes it loud and even.
         "-af", f"atempo={speed:.2f},{LOUDNESS_FILTER}", "-ar", str(SAMPLE_RATE),
         "-codec:a", "libmp3lame", "-b:a", "64k", "-f", "mp3", "pipe:1"],
        input=pcm.tobytes(), stdout=subprocess.PIPE, check=True,
    )
    return result.stdout


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
<select id="voice">
  <option value="">Default (Idera for English, yoruba_female2 for Yoruba)</option>
  <optgroup label="English voices (try each one)">
    <option value="idera">idera</option><option value="chinenye">chinenye</option><option value="joke">joke</option>
    <option value="zainab">zainab</option><option value="remi">remi</option><option value="emma">emma</option>
    <option value="tayo">tayo</option><option value="jude">jude</option><option value="umar">umar</option><option value="osagie">osagie</option>
  </optgroup>
  <optgroup label="Yoruba voices"><option value="yoruba_female2">yoruba_female2</option><option value="yoruba_male2">yoruba_male2</option></optgroup>
</select>
<label>Speed: <span id="speedValue">0.90</span> <small>(1.00 = normal, lower = slower)</small></label>
<input id="speed" type="range" min="0.7" max="1.2" step="0.05" value="0.9" oninput="speedValue.textContent=Number(this.value).toFixed(2)">
<label>Liveliness: <span id="liveValue">0.30</span> <small>(0.10 = flat, 0.30 = lively, above 0.60 may wobble)</small></label>
<input id="live" type="range" min="0.05" max="0.8" step="0.05" value="0.3" oninput="liveValue.textContent=Number(this.value).toFixed(2)">
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
      body: JSON.stringify({
        text: document.getElementById('text').value,
        language: document.getElementById('lang').value,
        voice: document.getElementById('voice').value || null,
        speed: Number(document.getElementById('speed').value),
        temperature: Number(document.getElementById('live').value)
      })
    });
    if (!res.ok) { status.textContent = 'Error ' + res.status + ': ' + (await res.text()); return; }
    const blob = await res.blob();
    const player = document.getElementById('player');
    player.src = URL.createObjectURL(blob);
    player.play();
    const how = { HIT: 'From the cache (free, instant)', JOINED: 'Joined a recording in progress', MISS: 'New recording' }[res.headers.get('X-Cache')] || 'Done';
    status.textContent = how + ' in ' + ((Date.now() - started) / 1000).toFixed(1) + ' s';
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

    speed = min(1.2, max(0.7, req.speed if req.speed else SPEECH_SPEED))
    temperature = min(0.8, max(0.05, req.temperature if req.temperature else GEN_TEMPERATURE))

    # Cache: the same text + language + voice + settings is only made once.
    key = hashlib.sha256(f"{lang_name}::{speaker}::{speed:.2f}::{temperature:.2f}::{text}".encode("utf-8")).hexdigest()
    mp3_path = CACHE_DIR / f"{key}.mp3"
    if mp3_path.exists():
        return FileResponse(mp3_path, media_type="audio/mpeg", headers={"X-Cache": "HIT"})

    # Already being recorded (e.g. in the background, or by another tap)?
    # Join it and play from the first sentence instead of waiting.
    with jobs_lock:
        job = jobs.get(key)
        is_new = job is None
        if is_new:
            job = RecordingJob()
            jobs[key] = job
    if not is_new:
        return StreamingResponse(job.follow(), media_type="audio/mpeg", headers={"X-Cache": "JOINED"})

    # New text: send the voice sentence by sentence as it's made, so Mama
    # Titi starts speaking after the first sentence, and keep the whole
    # recording in the cache for next time.
    # The recording runs in its own thread, so it finishes (and is saved)
    # even if the listener stops early; listeners follow it piece by piece.
    def record():
        try:
            with generate_lock:
                for chunk in split_into_chunks(text):
                    audio = get_engine().synthesize_chunk(chunk, lang_name, speaker, temperature)
                    job.add(mp3_bytes(audio, speed))
            tmp = mp3_path.with_suffix(".part.mp3")
            tmp.write_bytes(b"".join(job.pieces))
            tmp.replace(mp3_path)  # only a complete recording ever appears in the cache
            job.finish()
        except Exception as err:  # noqa: BLE001
            job.finish(error=err)
        finally:
            with jobs_lock:
                jobs.pop(key, None)

    threading.Thread(target=record, daemon=True).start()
    return StreamingResponse(job.follow(), media_type="audio/mpeg", headers={"X-Cache": "MISS"})
