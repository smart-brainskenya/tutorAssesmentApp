# SBK Tutor Intelligence System - Project Context

## Project Overview
The **SBK Tutor Intelligence System** is a production-ready internal assessment and performance analytics platform designed for Smart Brains Kenya (SBK). It allows administrators to create and manage assessments while tutors can take tests and track their professional growth.

### Main Technologies
- **Frontend**: React 19 (Vite + TypeScript)
- **Styling**: TailwindCSS
- **Backend/Auth**: Supabase (Postgres DB + GoTrue Auth)
- **Icons**: Lucide React
- **Analytics**: Recharts
- **Notifications**: React Hot Toast
- **Animations**: Canvas Confetti

### Architecture
- `src/components`: Reusable UI components (`Button`, `Input`, `Table`) and shared `Layout`.
- `src/pages`: Feature-specific views for Auth, Tutor, and Admin flows.
- `src/services`: Encapsulated Supabase interactions in `api.ts`.
- `src/store`: Global authentication state management via `AuthContext`.
- `src/types`: Centralized TypeScript interfaces for data consistency.
- `src/lib`: Supabase client configuration.

## Building and Running

### Development
```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

### Production Build
```bash
# Build for production
npm run build

# Preview production build
npm run preview
```

### Database Setup
The system requires a Supabase instance. Initial schema and seed data are provided in:
1. `supabase_schema_v2.sql`: Core table structures and RLS policies.
2. `final_seed_fix.sql`: Initial categories and scenario-based questions.

## Development Conventions

### Authentication & Authorization
- **Role-based Access Control (RBAC)**: Defined roles are `admin` and `tutor`.
- **Protected Routes**: Use the `ProtectedRoute` component in `App.tsx` to enforce session and role requirements.
- **Registration**: Restricted to `@smartbrainskenya.com` emails and requires a secret `VITE_SBK_ACCESS_CODE`.

### Code Style
- **Modular Components**: Separate complex views into reusable sub-components.
- **Tailwind Utility Classes**: Use Tailwind for all styling, following the primary color palette defined in `tailwind.config.js`.
- **API Layer**: All database interactions must go through `src/services/api.ts` to ensure consistent error handling and type safety.

### Assessment Logic
- **Scoring**: Calculated on the frontend and persisted via the `attempts` and `answers` tables.
- **Rankings**:
  - 90–100% → SBK Elite
  - 75–89% → Code Captain
  - 60–74% → Smart Operator
  - 40–59% → Rising Brain
  - Below 40% → Needs Debugging
- **Retake Lock**: Tutors are restricted from retaking a test within 15 minutes of their last attempt.

### Production Readiness
- **Error Handling**: Wrapped in `ErrorBoundary` for UI resilience.
- **UX Feedback**: Use `Toaster` for actionable success/error messages.
- **Rate Limiting**: Frontend-level submission guards to prevent duplicate attempts.
