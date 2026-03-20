"""
ELSA Learn — Pronunciation Assessment Microservice
FastAPI + OpenAI Whisper (no external dependencies beyond Whisper itself)
Port: 5001
"""

import os
import io
import time
import logging
import tempfile
import difflib
from contextlib import asynccontextmanager
from pathlib import Path
from typing import Optional

import torch
import torchaudio
import whisper
import numpy as np
from fastapi import FastAPI, File, UploadFile, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# ── Logging ──────────────────────────────────────────────────────────────────
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
log = logging.getLogger(__name__)

# ── App ───────────────────────────────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Load Whisper once at startup."""
    global WHISPER_MODEL

    log.info(f"🚀 Loading Whisper '{WHISPER_MODEL_SIZE}' on device={DEVICE}...")
    try:
        WHISPER_MODEL = whisper.load_model(WHISPER_MODEL_SIZE, device=DEVICE)
        log.info("✅ Whisper model loaded — confidence scoring powered by Whisper logprobs")
    except Exception as e:
        log.error(f"❌ Failed to load Whisper: {e}")

    yield
    log.info("👋 Pronunciation service shutting down.")


app = FastAPI(
    title="ELSA Pronunciation Service",
    description="Real-time pronunciation scoring using Whisper ASR + SpeechBrain",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Global Model Cache ────────────────────────────────────────────────────────
WHISPER_MODEL: Optional[whisper.Whisper] = None

WHISPER_MODEL_SIZE = os.getenv("WHISPER_MODEL", "base")  # tiny | base | small | medium | large
DEVICE = "cuda" if torch.cuda.is_available() else "cpu"

MODEL_DIR = Path(__file__).parent / "models"
MODEL_DIR.mkdir(exist_ok=True)




# ── Helpers ───────────────────────────────────────────────────────────────────

def normalize(text: str) -> str:
    """Lowercase and strip punctuation."""
    import re
    return re.sub(r"[^a-z0-9' ]", "", text.lower()).strip()


def word_level_diff(expected: list[str], spoken: list[str]) -> list[dict]:
    """
    Align expected vs spoken words using SequenceMatcher.
    Returns per-word correctness with fuzzy match support.
    """
    matcher = difflib.SequenceMatcher(None, expected, spoken)
    results = []

    spoken_used = set()

    for word in expected:
        # Exact match
        if word in spoken:
            idx = spoken.index(word)
            if idx not in spoken_used:
                spoken_used.add(idx)
                results.append({"word": word, "correct": True, "similarity": 1.0})
                continue
        # Fuzzy match (handles minor mispronunciations)
        best_ratio = 0.0
        best_idx = -1
        for i, sw in enumerate(spoken):
            if i in spoken_used:
                continue
            ratio = difflib.SequenceMatcher(None, word, sw).ratio()
            if ratio > best_ratio:
                best_ratio = ratio
                best_idx = i
        if best_ratio >= 0.75:
            spoken_used.add(best_idx)
            results.append({"word": word, "correct": True, "similarity": round(best_ratio, 2)})
        else:
            results.append({"word": word, "correct": False, "similarity": round(best_ratio, 2)})

    return results


def compute_speaking_rate(transcript: str, audio_duration_s: float) -> int:
    """Estimate words-per-minute from transcript + audio duration."""
    words = len(transcript.split())
    if audio_duration_s <= 0:
        return 120
    return round((words / audio_duration_s) * 60)


def whisper_confidence(result: dict) -> float:
    """
    Derive a voice clarity / confidence score from Whisper's own output.

    Whisper returns per-segment metadata:
      • avg_logprob   — log-probability of the transcription  (0 = perfect, < -1 = uncertain)
      • no_speech_prob — probability that segment is silence   (0 = speech, 1 = silence)
      • compression_ratio — if too high the audio is repetitive / noisy

    We combine these into a 0-100 confidence score that reflects
    how clearly the speaker was heard — no external model needed.
    """
    segments = result.get("segments", [])
    if not segments:
        return 70.0  # safe neutral if Whisper returned no segments at all

    avg_logprobs    = [s.get("avg_logprob",    -0.5) for s in segments]
    no_speech_probs = [s.get("no_speech_prob",  0.1) for s in segments]

    mean_logprob    = float(np.mean(avg_logprobs))
    mean_no_speech  = float(np.mean(no_speech_probs))

    # avg_logprob  range: typically  -1.5 (bad)  →  0.0 (perfect)
    # Map to 0–100: score = (logprob + 1.5) / 1.5 * 100, clamped
    logprob_score = max(0.0, min(100.0, (mean_logprob + 1.5) / 1.5 * 100))

    # Penalise if Whisper thinks there was a lot of silence / non-speech
    silence_penalty = mean_no_speech * 30  # max -30 pts if pure noise

    confidence = max(0.0, min(100.0, logprob_score - silence_penalty))
    return round(confidence, 1)


# ── Routes ────────────────────────────────────────────────────────────────────

@app.get("/api/pronunciation/health")
def health():
    return {
        "status": "ok",
        "service": "pronunciation-microservice",
        "whisper_loaded": WHISPER_MODEL is not None,
        "confidence_engine": "whisper-logprob",
        "device": DEVICE,
        "whisper_model": WHISPER_MODEL_SIZE,
    }


@app.post("/api/pronunciation/analyze")
async def analyze_pronunciation(
    audio: UploadFile = File(..., description="Audio file (wav/mp3/ogg/webm)"),
    targetText: str = Form(..., description="The sentence the user was supposed to say"),
    language: str = Form(default="en", description="Language code (default: en)"),
):
    """
    Full pronunciation pipeline:
    1. Whisper ASR        → transcription + logprob confidence
    2. Word-level diff    → phoneme accuracy per word
    3. Composite scoring  → weighted accuracy + fluency + clarity
    """
    if WHISPER_MODEL is None:
        raise HTTPException(status_code=503, detail="Whisper model not loaded yet. Retry in a moment.")

    start_time = time.time()

    # ── Save upload to temp file ──────────────────────────────────────────────
    suffix = Path(audio.filename or "audio.wav").suffix or ".wav"
    with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp:
        tmp.write(await audio.read())
        tmp_path = tmp.name

    try:
        # ── 1. Whisper Transcription ──────────────────────────────────────────
        log.info(f"🎙️  Transcribing with Whisper ({WHISPER_MODEL_SIZE})...")
        result = WHISPER_MODEL.transcribe(
            tmp_path,
            language=language,
            task="transcribe",
            fp16=(DEVICE == "cuda"),
        )
        transcript = result["text"].strip()
        log.info(f"✅ Transcript: '{transcript}'")

        # ── 2. Whisper-native confidence ──────────────────────────────────────
        # (avg_logprob + no_speech_prob from Whisper segments — no extra model needed)
        whisper_conf = whisper_confidence(result)
        log.info(f"📊 Whisper confidence: {whisper_conf}%")

        # ── 3. Audio duration ─────────────────────────────────────────────────
        import librosa
        y, sr = librosa.load(tmp_path, sr=None)
        audio_duration_s = librosa.get_duration(y=y, sr=sr)

        # ── 4. Word-level analysis ────────────────────────────────────────────
        expected_words = normalize(targetText).split()
        spoken_words   = normalize(transcript).split()
        phoneme_diff   = word_level_diff(expected_words, spoken_words)

        correct_count  = sum(1 for w in phoneme_diff if w["correct"])
        total_expected = max(len(expected_words), 1)

        base_score   = round((correct_count / total_expected) * 100)

        # ── 5. Composite metrics ──────────────────────────────────────────────
        speaking_rate  = compute_speaking_rate(transcript, audio_duration_s)

        # Adjust for tempo (ideal: 100–160 wpm)
        rate_penalty   = max(0, (speaking_rate - 160) // 10) if speaking_rate > 160 else \
                         max(0, (80 - speaking_rate) // 10)

        accuracy_score = max(0, min(100, base_score))
        fluency_score  = max(0, min(100, round(accuracy_score * 0.6 + whisper_conf * 0.4) - rate_penalty))
        intonation     = max(0, min(100, round(fluency_score * 0.8 + accuracy_score * 0.2) + (5 if speaking_rate < 160 else -3)))
        word_stress    = max(0, min(100, round((accuracy_score + whisper_conf) / 2)))
        overall_score  = max(0, min(100, round(
            accuracy_score * 0.5 +
            fluency_score  * 0.3 +
            whisper_conf   * 0.2
        )))

        # ── 6. Feedback ───────────────────────────────────────────────────────
        missed_words = [w["word"] for w in phoneme_diff if not w["correct"]]

        if overall_score >= 90:
            feedback = "🌟 Outstanding! Your pronunciation is excellent and very natural."
        elif overall_score >= 80:
            feedback = f"✅ Great job! " + (
                f"Watch the word(s): {', '.join(missed_words[:3])}." if missed_words else "Keep it up!"
            )
        elif overall_score >= 60:
            feedback = f"🟡 Good effort. Focus on these word(s): {', '.join(missed_words[:5])}. Try speaking a bit {'slower' if speaking_rate > 150 else 'more clearly'}."
        else:
            feedback = f"🔴 Keep practicing! The following words need work: {', '.join(missed_words[:5])}. Try reading the sentence aloud slowly first."

        elapsed = round(time.time() - start_time, 2)
        log.info(f"✅ Analysis complete in {elapsed}s — overall: {overall_score}")

        return {
            "transcript": transcript,
            "targetText": targetText,
            "score": overall_score,
            "accuracy": accuracy_score,
            "fluency": fluency_score,
            "intonation": intonation,
            "wordStress": word_stress,
            "confidence": round(whisper_conf),
            "speakingRate": speaking_rate,
            "audioDuration": round(audio_duration_s, 2),
            "phonemeDiff": phoneme_diff,
            "feedback": feedback,
            "processingTime": elapsed,
            "engine": {
                "asr": f"whisper-{WHISPER_MODEL_SIZE}",
                "scoring": "whisper-logprob",   # ← now fully self-contained
            },
        }

    finally:
        os.unlink(tmp_path)


@app.post("/api/pronunciation/transcribe-only")
async def transcribe_only(
    audio: UploadFile = File(...),
    language: str = Form(default="en"),
):
    """Whisper-only transcription endpoint (fast, no scoring)."""
    if WHISPER_MODEL is None:
        raise HTTPException(status_code=503, detail="Whisper model not loaded")

    suffix = Path(audio.filename or "audio.wav").suffix or ".wav"
    with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp:
        tmp.write(await audio.read())
        tmp_path = tmp.name

    try:
        result = WHISPER_MODEL.transcribe(tmp_path, language=language, fp16=(DEVICE == "cuda"))
        return {"transcript": result["text"].strip(), "language": result.get("language", language)}
    finally:
        os.unlink(tmp_path)


# ── Entry point ───────────────────────────────────────────────────────────────
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=5001, reload=True)
