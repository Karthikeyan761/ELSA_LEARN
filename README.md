# ELSA Learn: Advanced AI Speaking Platform 🚀

This is a modern full-stack web application designed to help users master English pronunciation and fluency through real-time phoneme matching, AI conversation scenarios, adaptive learning, and gamification.

## 🚀 Advanced Features Included

We have significantly scaled out the original platform to support a real microservice-oriented learning engine.

### Data & Gamification
*   **XP & Streaks**: Earn XP by practicing! Calculates base scores, applies difficulty multipliers, and records daily interaction streaks. 
*   **Leaderboards & Badges**: Unlock semantic badges (`First Step`, `XP Master`, `Dedication`) stored efficiently in a dedicated `StudentBadge` MySQL table.

### Next-Gen Personalization (Adaptive Learning)
*   **Phoneme Mistake Tracking**: The backend intelligently dissects your speech transcription (`phonemeDiff`) and automatically tracks which foundational sounds you are mispronouncing over time (e.g. tracking `th` vs `v`).
*   **Recommendation Microservice**: Queries the student's weakest phoneme errors and generates dynamic learning paths.
*   **AI Lesson Generator Flagging**: Teachers can now mark dynamically created content via `isAIGenerated` fields.

### Voice Confidence Analysis
*   **Speech Velocity**: Calculates words spoken per minute.
*   **Pause Detection**: Scans transcripts and tracks unnatural verbal pauses.
*   **Precision Tooltips**: Real-time Interactive Pronunciation Heatmap UI mapping exact sounds in green / red, equipped with on-hover feedback loops for correction!

### AI Chat Tutor
*   **Intelligent Chat Assistant**: Connected directly to Google Gemini Flash.
*   **Instant UI Application**: Accessible via `http://localhost:3000/tutor` right from the dashboard.
*   **Dedicated Microservice**: Running cleanly on Port `4004` to prevent bottlenecking the main Express monolithic database connector.

## 🏗️ Architecture Stack Setup

We have preserved the core monolithic repository but splintered it successfully into a microservices architecture:

1.  **Frontend (`:3000`)**: Next.js 15, Tailwind, React Speech Recognition.
2.  **Core Backend API (`:4000`)**: Node.js/Express, Prisma MySQL connection.
3.  **Pronunciation AI (`:4001`)**: Core Audio/Phoneme analysis.
4.  **Gamification Engine (`:4002`)**: Separate process for non-blocking XP and badge rewarding.
5.  **Recommendation System (`:4003`)**: Isolated logic processor for analyzing weak student points.
6.  **AI Tutor Service (`:4004`)**: Headless LLM wrapper enabling grammar/tips assistance. 

## 🔌 Running Locally

### Step 1: Install Workspaces
Because we added robust scaling and new microservices, we need to update our workspace package map:
```bash
npm install
```

### Step 2: Database Migration
A massive DB modification has taken place! You must push the new schema up to your local MySQL:
```bash
cd apps/backend
npx prisma generate
npx prisma db push --accept-data-loss
```

### Step 3: API Key Setup
Inside `apps/backend/.env`:
```text
GEMINI_API_KEY="AIzaSy...your-key"
DATABASE_URL="mysql://root:placeholder@localhost:3306/elsaclone"
```

### Step 4: Fire The Engines 
Because we wrote a dynamic new root script inside `package.json`, running `npm run dev` at the root will now start all **6 processes concurrently**!
```bash
npm run dev
```

*Note: If you run into `EADDRINUSE: address already in use` error when launching, make sure to completely terminate your current running `npm run dev` process in your terminal and start it again so that it can boot the new background services securely.*
