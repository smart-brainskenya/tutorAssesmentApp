# SBK Tutor Intelligence System

A production-ready internal assessment and performance analytics platform designed for Smart Brains Kenya. This system enables the administration to create, manage, and grade technical assessments while providing tutors with real-time feedback and performance tracking.

## 🚀 Features

-   **Role-Based Access Control**: Strict separation between Admin and Tutor portals.
-   **Assessment Engine**:
    -   Hybrid Model: Multiple Choice (Auto-graded) & Short Answer (Manual Review).
    -   Operational Maturity Index (OMI) calculation.
-   **Admin Intelligence**:
    -   Global performance metrics & trend analysis.
    -   Manual Review Queue for short answer submissions.
    -   Real-time tutor leaderboard & risk detection.
    -   CSV Export for analytics data.
-   **Security**:
    -   Row Level Security (RLS) enforcement.
    -   Domain-locked registration (`@smartbrainskenya.com`).
    -   15-minute retake lock prevention.

## 🛠️ Tech Stack

-   **Frontend**: React 19, TypeScript, Vite
-   **Styling**: TailwindCSS (SBK Brand Palette), Lucide React
-   **Backend**: Supabase (PostgreSQL + Auth + RPCs)
-   **State Management**: React Context API
-   **Visualization**: Recharts

## 📂 Architecture

```
src/
├── components/       # Reusable UI (Buttons, Tables, Guards)
├── pages/            # Route Views (Auth, Admin, Tutor)
├── services/         # API Layer (Supabase interactions)
├── store/            # AuthContext & Global State
├── types/            # TypeScript Interfaces
└── utils/            # Helpers (Grading, OMI, Analytics)
```

## ⚡️ Quick Start

### 1. Prerequisites
-   Node.js 22+ (Bun recommended)
-   A Supabase project

### 2. Installation
```bash
git clone <repo-url>
cd tutorTestApp
bun install
```

### 3. Environment Setup
Create a `.env` file in the root:
```env
VITE_SUPABASE_URL=your_project_url
VITE_SUPABASE_ANON_KEY=your_anon_key
VITE_SBK_ACCESS_CODE=secret_code
```

### 4. Database Setup
Run the SQL scripts located in the root directory in your Supabase SQL Editor in this order:
1.  `final_seed_fix.sql`
2.  `supabase_account_mgmt.sql`
3.  `production_optimization.sql`

### 5. Run Locally
```bash
npm run dev
```

## 🚢 Production Deployment

This project is optimized for deployment on **Vercel**.

1.  Connect your repository to Vercel.
2.  Add the Environment Variables from your `.env` file.
3.  Deploy.
4.  Follow the [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md) for post-deploy verification.

## 🔐 Security

-   **Authentication**: Managed via Supabase Auth (GoTrue).
-   **Authorization**: Protected Routes (`AdminRoute`, `TutorRoute`) + RLS Policies.
-   **Data Integrity**:
    -   Assessments submitted via atomic RPC `create_and_submit_hybrid_attempt`.
    -   Reviews finalized via RPC `finalize_attempt_review`.

## 📈 Roadmap

-   [ ] Export analytics to PDF (CSV currently supported).
-   [ ] Real-time notification system.
-   [ ] Integration with HR management systems.
