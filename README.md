# SmartFlow — AI-Powered Smart To-Do Application

> **Plan smarter. Focus deeper. Achieve more.**  
> A high-performance, full-stack productivity ecosystem with natural language planning, intelligent task breakdown, focused Pomodoro workflows, and real-time analytics.

---

## 🌟 Highlights & Architecture

- **Frontend**: React 18, TypeScript, Tailwind CSS, Lucide Icons, TanStack Query, React Router.
- **Backend**: Node.js, Express, TypeScript, Zod Schema Validation, Helmet, CORS, Cookie Parser.
- **Database**: PostgreSQL with Prisma ORM, supporting both hosted databases (Supabase, Neon, AWS RDS, Render Postgres) and zero-config embedded PostgreSQL (PGlite engine) for local development and offline testing.
- **AI Intelligence**: Configurable AI engine supporting Google Gemini (`gemini-1.5-flash`) with an automated, graceful heuristic fallback system when an API key is not supplied.
- **Deployment**: Engineered for single-service full-stack deployment on **Render**, serving both API endpoints and the optimized production frontend SPA with client-side HTML5 routing fallback.

---

## 🚀 Required Application Pages (12 Core Modules)

1. **Dashboard (`/`)**: Comprehensive command center with greeting, current date, key metrics (total, pending, due today, overdue, completion rate, focus time), interactive pending/today task lists, and a dedicated Welcome/Onboarding hero with looping video background, poster fallback, and dismiss controls.
2. **My Tasks (`/tasks`)**: Complete task management with status filters (All, Pending, Completed, Overdue), priority sorting, project tagging, search, subtasks accordion, and deletion confirmation dialog.
3. **Today (`/today`)**: High-focus daily execution view featuring completion progress rings, remaining work hours calculator, critical priority highlights, and inline task creation.
4. **Upcoming (`/upcoming`)**: 7-day to long-term horizon planner with workload density indicators, grouped by Tomorrow, This Week, and Future, featuring 1-click date rescheduling (+1 Day, +1 Week).
5. **Calendar (`/calendar`)**: Multi-view interactive calendar (Monthly, Weekly, Daily schedule) with deadline visibility and overdue indicators.
6. **AI Planner (`/ai-planner`)**:
   - **Natural Language Task Creation**: e.g., *"Tomorrow at 3pm, prepare science presentation and spend 45 minutes reviewing calculus."* -> parsed into structured task suggestions and saved upon human review.
   - **Automatic Task Breakdown**: Splits high-level goals into 3-6 actionable subtasks with time estimates.
   - **Daily Schedule Planning**: Generates energy-optimized daily time blocks with rest intervals.
   - **Rescheduling Assistance**: Detects overloaded dates and redistributes deadlines.
   - **AI Coach Chat**: Multi-turn productivity conversation assistant.
7. **Focus Mode (`/focus`)**: Pomodoro timer with configurable work/break intervals (25m / 5m / 15m), task linkage, background tab accuracy, audio alerts, and session history persistence.
8. **Projects & Categories (`/projects`)**: Color-coded project organization, category grouping, completion rate tracking, and safe deletion protections.
9. **Productivity Analytics (`/analytics`)**: Visual metrics including weekly completion trends, task distribution by priority, category breakdown, and deep work focus minutes.
10. **Notifications (`/notifications`)**: Alert center for upcoming deadlines, system warnings, and browser/desktop notification permission controls.
11. **Profile & Settings (`/settings`)**: User profile customization, dark/light theme switching, working hours configuration, default task priority, and Pomodoro interval adjustments.
12. **Authentication (`/login`, `/register`)**: Secure JWT authentication with bcrypt password hashing, session restoration, and user-isolated data tenancy.

---

## 🛠️ Quick Start & Local Development

### 1. Prerequisites
- Node.js `v20+` or `v22+` (v26 verified)
- npm `v10+` or `v11+`

### 2. Installation
Clone the repository and install dependencies:
```bash
git clone https://github.com/Baluu-1-2/SmartFlow.git
cd SmartFlow
npm install
```

### 3. Environment Setup
Copy the example environment configuration:
```bash
cp .env.example .env
```
*(The embedded PGlite database will automatically initialize locally even without configuring `DATABASE_URL`!)*

### 4. Running the Development Server
Start both the backend API and frontend Vite dev server concurrently:
```bash
npm run dev
```
- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:5000`
- API Health Check: `http://localhost:5000/api/health`

### 5. Running Automated Tests
```bash
npm test
```
Runs the full suite of Vitest unit and integration tests across both frontend and backend.

### 6. Building for Production
```bash
npm run build
```
Builds both the server TypeScript bundle (`server/dist`) and optimized frontend SPA (`client/dist`).

### 7. Starting the Production Server
```bash
npm start
```

---

## 🌐 Deploying to Render

### Option A: Render Blueprint (render.yaml)
1. Push the code to GitHub: `https://github.com/Baluu-1-2/SmartFlow`.
2. In the [Render Dashboard](https://dashboard.render.com), click **New +** -> **Blueprint**.
3. Connect repository `Baluu-1-2/SmartFlow`.
4. Render will detect `render.yaml` and configure the Web Service automatically:
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Health Check Path**: `/api/health`

### Option B: Manual Web Service on Render
1. Click **New +** -> **Web Service**.
2. Connect `Baluu-1-2/SmartFlow` on branch `main`.
3. Set **Runtime** to `Node`.
4. Set **Build Command** to: `npm install && npm run build`.
5. Set **Start Command** to: `npm start`.
6. Add Environment Variables:
   - `NODE_ENV`: `production`
   - `PORT`: `10000`
   - `JWT_SECRET`: *(Generate a 32-character random string)*
   - `DATABASE_URL`: *(Your Supabase or Render Postgres connection string)*
   - `GEMINI_API_KEY`: *(Optional, your Google AI Studio API key)*

---

## 📄 License
MIT License. Built with ❤️ for peak productivity.
