# SBK Tutor Intelligence System
## Full Build Specification Document (MVP v1)

---

# 1. ABOUT THE APPLICATION

The SBK Tutor Intelligence System is an internal operational certification and performance analytics platform for Smart Brains Kenya tutors.

This is NOT a simple quiz application.

It is a structured intelligence system that:

- Validates tutor understanding of platform operations.
- Tests curriculum delivery knowledge.
- Reinforces company culture standards.
- Measures operational maturity.
- Provides analytics for leadership decisions.
- Detects weak operational areas early.

This system must be deterministic, structured, scalable, and production-ready.

---

# 2. TECH STACK

Frontend:
- React (Vite)
- TypeScript
- TailwindCSS

Backend:
- Supabase (PostgreSQL + Auth + RLS)

Deployment:
- Vercel

Rules:
- No unnecessary libraries.
- Clean modular architecture.
- Server-side grading logic.
- Environment variables properly secured.

---

# 3. USER ROLES

## Admin
- Create/edit/delete categories
- Create/edit/delete questions
- Select question type
- Define scoring rules
- Publish/unpublish categories
- View tutor analytics
- View leaderboard
- Detect risk tutors
- Export results (CSV)

## Tutor
- Register (company email only)
- Login
- Take categorized tests
- View performance dashboard
- View ranking status

---

# 4. AUTHENTICATION RULES

Registration requires:
- Full Name
- Work Email
- Password
- Access Passcode

Validation:
- Email MUST end with @smartbrainskenya.com
- Access Passcode must match ENV variable SBK_ACCESS_CODE
- If invalid → deny registration

Post-login routing:
- Admin → /admin/dashboard
- Tutor → /dashboard

---

# 5. QUESTION TYPES

## 5.1 Multiple Choice

Fields:
- question_text
- option_a
- option_b
- option_c
- option_d
- correct_option

Scoring:
- Correct = full marks
- Incorrect = zero

---

## 5.2 Short Answer (Structured Response)

Fields:
- question_text
- expected_keywords (TEXT[])
- rubric_weights (JSONB)
- min_word_count (INT)
- max_score (INT)

Short Answer Scoring Rules:

1. Validate word count.
2. Normalize answer (lowercase, remove punctuation).
3. Match required keywords.
4. Apply rubric weights.
5. Calculate percentage.
6. Store matched/missed keywords.

No external AI required for MVP.

---

# 6. DATABASE STRUCTURE

## users
- id (uuid)
- full_name
- email
- role (admin | tutor)
- created_at

## categories
- id (uuid)
- name
- description
- published (boolean)
- created_at

## questions
- id (uuid)
- category_id (FK)
- question_type (ENUM: multiple_choice, short_answer)
- question_text
- option_a
- option_b
- option_c
- option_d
- correct_option
- expected_keywords (TEXT[])
- rubric_weights (JSONB)
- min_word_count
- max_score
- explanation
- created_at

## attempts
- id (uuid)
- user_id (FK)
- category_id (FK)
- score
- percentage
- completed_at
- retake_allowed_at

## answers
- id (uuid)
- attempt_id (FK)
- question_id (FK)
- selected_option
- text_response
- score
- is_correct

---

# 7. RETAKE LOGIC

- After completion:
  retake_allowed_at = now + 48 hours
- Tutor cannot retake before that timestamp.

---

# 8. TUTOR FLOW

Login → Dashboard

Dashboard:
- Take Tests
- My Results

Test Flow:
- One question at a time
- Progress bar
- No backward navigation
- Auto-grade on submission

Ranking Titles:

90–100% → SBK Elite
75–89% → Code Captain
60–74% → Smart Operator
40–59% → Rising Brain
Below 40% → Needs Debugging

---

# 9. TUTOR ANALYTICS

Display:
- Total Tests Taken
- Average Score
- Strongest Category
- Weakest Category
- Completion Rate
- Category performance chart
- Attempt history

---

# 10. ADMIN DASHBOARD

Display:
- Total Tutors
- Global Average Score
- Most Failed Category
- Tutors Below 60%
- Untested Tutors

Admin Sections:
1. Manage Categories
2. Manage Questions
3. Tutor Leaderboard
4. Risk Detection
5. Export CSV

---

# 11. SECURITY REQUIREMENTS

- Tutors see only their attempts.
- Admin sees all.
- All grading server-side.
- No client-side scoring logic.
- RLS enforced.
- Environment variables secured.

---

# 12. PRODUCTION REQUIREMENTS

- Loading states
- Error handling
- Toast feedback
- Prevent double submission
- Prevent simultaneous attempts
- Clean UI
- Fully responsive

---

END OF SPECIFICATION