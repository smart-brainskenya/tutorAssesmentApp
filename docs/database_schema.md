# SBK Tutor Intelligence - Database Schema (V3)

## Core Tables

### 1. `users`
Profiles for all SBK staff. Linked to `auth.users`.
- `id` (UUID, PK): References `auth.users.id`.
- `full_name` (TEXT): Full name.
- `email` (TEXT): Work email.
- `role` (ENUM): `admin` | `tutor`.
- `is_active` (BOOLEAN): Account status.
- `last_login` (TIMESTAMP): Last activity.
- `retake_allowed_at` (TIMESTAMP): Cool-down override.

### 2. `categories`
Assessment topics (e.g., "React Advanced", "Pedagogy").
- `id` (UUID, PK)
- `name` (TEXT)
- `description` (TEXT)
- `is_published` (BOOLEAN)
- `published_at` (TIMESTAMP)

### 3. `sections`
Hybrid structure within a category.
- `id` (UUID, PK)
- `category_id` (UUID): References `categories`.
- `section_type` (ENUM): `A` (MCQ/Auto) | `B` (Text/Manual).
- `title` (TEXT)

### 4. `questions`
Individual assessment items.
- `id` (UUID, PK)
- `section_id` (UUID): References `sections`.
- `question_type` (ENUM): `multiple_choice` | `short_answer`.
- `question_text` (TEXT)
- `options` (JSONB): MC options.
- `correct_option` (TEXT): MC correct key.
- `rubric_criteria` (JSONB): Criteria for manual review.
- `points` (INTEGER): Value of the question.

### 5. `attempts`
Header for a completed assessment session.
- `id` (UUID, PK)
- `user_id` (UUID): References `users`.
- `category_id` (UUID): References `categories`.
- `status` (ENUM): `in_progress` | `submitted` | `graded`.
- `score` (INTEGER): Combined final score.
- `percentage` (FLOAT): Final grade.

## Result Tables

### 6. `section_a_scores`
Instant results for MCQ sections.
- `attempt_id` (UUID): References `attempts`.
- `raw_score` (INTEGER)
- `answers_snapshot` (JSONB): Audit trail of chosen options.

### 7. `section_b_submissions`
Raw text responses for Section B.
- `id` (UUID, PK)
- `attempt_id` (UUID): References `attempts`.
- `question_id` (UUID): References `questions`.
- `answer_text` (TEXT)

### 8. `reviews`
Manual grading for Section B submissions.
- `id` (UUID, PK)
- `submission_id` (UUID): References `section_b_submissions`.
- `score` (INTEGER)
- `criteria_scores` (JSONB): Breakdown per rubric.
- `feedback` (TEXT)

## Views

### `review_queue`
FIFO list of attempts awaiting manual review.
- Columns: `attempt_id`, `tutor_name`, `category_name`, `submitted_at`.
