# ── ELSA Pronunciation Microservice — Dockerfile ─────────────────────────────
# Python 3.11 slim image

FROM python:3.11-slim

WORKDIR /app

# System dependencies for librosa/soundfile/torchaudio
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    libsndfile1 \
    git \
    && rm -rf /var/lib/apt/lists/*

# Install Python deps (cached layer)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy service code
COPY main.py .

# Models directory (mounted as volume in docker-compose)
RUN mkdir -p /app/models

EXPOSE 5001

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "5001"]
